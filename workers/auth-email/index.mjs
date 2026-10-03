// This Worker is reachable ONLY through the AUTH_EMAIL service binding.
// Its deployment must have no routes, workers.dev URL, or preview URLs.
const MAX_BODY = 8192;
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/;
const TOKEN = /^[A-Za-z0-9._~-]{16,2048}$/;
const reply = status => new Response(null, {status, headers: {'cache-control': 'no-store'}});

async function boundedJson(body, limit = MAX_BODY) {
  if (!body) throw new Error('Invalid input');
  const reader = body.getReader();
  const chunks = []; let size = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error('Input too large');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
}

function email(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL.test(value);
}
function configuration(env) {
  const origin = new URL(env.PLANFLO_AUTH_ORIGIN);
  if (origin.protocol !== 'https:' || origin.origin !== env.PLANFLO_AUTH_ORIGIN || /REPLACE/i.test(origin.host)) throw new Error('Configuration unavailable');
  if (env.AUTH_EMAIL_PROVIDER !== 'resend' || !email(env.AUTH_EMAIL_FROM) || /REPLACE/i.test(env.AUTH_EMAIL_FROM)) throw new Error('Configuration unavailable');
  if (typeof env.RESEND_API_KEY !== 'string' || !/^re_[A-Za-z0-9_-]{8,200}$/.test(env.RESEND_API_KEY)) throw new Error('Configuration unavailable');
  return origin.origin;
}
function validateMail(value, origin) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== 'purpose,to,url') throw new Error('Invalid mail');
  if (!email(value.to) || !['verification', 'recovery'].includes(value.purpose) || typeof value.url !== 'string' || value.url.length > 4096 || /[\x00-\x20\x7f]|%0[ad]/i.test(value.url)) throw new Error('Invalid mail');
  const url = new URL(value.url);
  if (url.origin !== origin || url.username || url.password || url.hash) throw new Error('Invalid link');
  const allowed = value.purpose === 'verification' ? ['token', 'callbackURL'] : ['callbackURL'];
  for (const key of url.searchParams.keys()) if (!allowed.includes(key) || url.searchParams.getAll(key).length !== 1) throw new Error('Invalid link');
  if (value.purpose === 'verification') {
    if (url.pathname !== '/api/auth/verify-email' || !TOKEN.test(url.searchParams.get('token') || '')) throw new Error('Invalid link');
  } else if (!/^\/api\/auth\/reset-password\/[A-Za-z0-9._~-]{16,2048}$/.test(url.pathname)) throw new Error('Invalid link');
  const callback = url.searchParams.get('callbackURL');
  if (callback) {
    const target = new URL(callback, origin);
    if (target.origin !== origin || target.username || target.password || /[\x00-\x20\x7f]|%0[ad]/i.test(callback)) throw new Error('Invalid callback');
  }
  return value;
}
function message(mail, from) {
  const verification = mail.purpose === 'verification';
  return {
    from: `PLAN.FLO <${from}>`, to: [mail.to],
    subject: verification ? 'Verify your PLAN.FLO email address' : 'Reset your PLAN.FLO password',
    text: `${verification ? 'Confirm your email address to continue setting up PLAN.FLO.' : 'Use this link to choose a new PLAN.FLO password.'}\n\n${mail.url}\n\nIf you did not request this email, you can ignore it.\nThis link is time-limited. Request another link in PLAN.FLO if it expires.`,
  };
}

// Provider-specific transport is separated from contract validation and templates.
// Adding a provider requires an explicit adapter, never a caller-supplied endpoint.
export async function sendResend(payload, apiKey, {fetch: transport, sleep, timeoutMs}) {
  const body = JSON.stringify(payload);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  const key = 'planflo-auth-v1-' + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let retry = false; let delay = 250 * 2 ** attempt;
    try {
      const response = await transport('https://api.resend.com/emails', {
        method: 'POST', redirect: 'manual', signal: controller.signal,
        headers: {'content-type': 'application/json', authorization: `Bearer ${apiKey}`, 'idempotency-key': key}, body,
      });
      const data = await boundedJson(response.body, 4096).catch(() => null);
      if (response.ok && typeof data?.id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(data.id)) return true;
      retry = response.status === 429 || response.status >= 500 || (response.status === 409 && data?.name === 'concurrent_idempotent_requests');
      const after = response.headers.get('retry-after');
      if (after) {
        const ms = /^\d+(\.\d+)?$/.test(after) ? Number(after) * 1000 : Date.parse(after) - Date.now();
        // Do not retry earlier than a long provider delay or hold the auth request open indefinitely.
        if (!Number.isFinite(ms) || ms > 2000) retry = false;
        else delay = Math.max(delay, ms);
      }
    } catch { retry = true; }
    finally { clearTimeout(timer); }
    if (!retry || attempt === 2) return false;
    await sleep(delay);
  }
  return false;
}

export function createMailWorker({fetch: transport = (...args) => globalThis.fetch(...args), sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), timeoutMs = 5000} = {}) {
  return {async fetch(request, env) {
    const endpoint = new URL(request.url);
    if (request.method !== 'POST' || endpoint.href !== 'https://mail.internal/send') return reply(404);
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return reply(415);
    const length = request.headers.get('content-length');
    if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY)) return reply(413);
    let origin;
    try { origin = configuration(env); } catch { return reply(503); }
    let mail;
    try { mail = validateMail(await boundedJson(request.body), origin); } catch { return reply(400); }
    try {
      const accepted = await sendResend(message(mail, env.AUTH_EMAIL_FROM), env.RESEND_API_KEY, {fetch: transport, sleep, timeoutMs});
      return reply(accepted ? 204 : 503);
    } catch { return reply(503); }
  }};
}
export default createMailWorker();
