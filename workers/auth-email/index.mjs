import {AUTH_LINK_TTL_SECONDS} from '../../shared/auth-policy.mjs';
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
const escapeHtml = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Called only after link and configured-origin validation in the transport handler.
export function buildAuthEmail(mail, from) {
  const verification = mail.purpose === 'verification';
  const heading = verification ? 'Verify your email' : 'Reset your password';
  const intro = verification ? 'Verify your email address before signing in to PLAN.FLO.' : 'Choose a new password to get back to your PLAN.FLO workspace.';
  const button = verification ? 'Verify email' : 'Reset password';
  const expiry = `This link expires in ${AUTH_LINK_TTL_SECONDS / 60} minutes. If it expires, request a new link in PLAN.FLO.`;
  const url = escapeHtml(mail.url);
  const logo = escapeHtml(new URL('/planflo-email-icon.png', mail.url).href);
  return {
    from: `PLAN.FLO <${from}>`, to: [mail.to],
    subject: verification ? 'Verify your PLAN.FLO email address' : 'Reset your PLAN.FLO password',
    text: `PLAN.FLO — Plan. Manage. Deliver.\n\n${heading}\n\n${intro}\n\n${button}:\n${mail.url}\n\n${expiry}\n\nIf you did not request this email, you can ignore it.`,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading} — PLAN.FLO</title></head><body style="margin:0;padding:0;background:#eef5fc;color:#172b4d;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef5fc"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #dce6f1;border-radius:20px"><tr><td style="padding:32px 24px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="padding-right:12px"><img src="${logo}" width="44" height="47" alt="" style="display:block;border:0"></td><td><div style="font-size:27px;line-height:32px;font-weight:800;letter-spacing:-1px">PLAN.<span style="color:#2871df">FLO</span></div><div style="font-size:12px;line-height:20px;color:#62748b">Plan. Manage. Deliver.</div></td></tr></table><h1 style="margin:32px 0 12px;font-size:28px;line-height:35px;letter-spacing:-0.6px">${heading}</h1><p style="margin:0 0 24px;font-size:16px;line-height:25px;color:#52657d">${intro}</p><table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#2871df" style="border-radius:10px"><a href="${url}" style="display:inline-block;padding:15px 26px;border:1px solid #2871df;border-radius:10px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold">${button}</a></td></tr></table><p style="margin:24px 0 16px;font-size:14px;line-height:22px;color:#52657d">${expiry}</p><p style="margin:0;font-size:13px;line-height:21px;color:#62748b">Button not working? <a href="${url}" style="color:#2871df;text-decoration:underline">Open the secure link</a>.</p><p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e4ebf3;font-size:13px;line-height:21px;color:#62748b">If you did not request this email, you can ignore it.</p></td></tr></table><p style="margin:20px 0 0;font-size:12px;color:#62748b">PLAN.FLO · Your project workspace</p></td></tr></table></body></html>`,
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
      const accepted = await sendResend(buildAuthEmail(mail, env.AUTH_EMAIL_FROM), env.RESEND_API_KEY, {fetch: transport, sleep, timeoutMs});
      return reply(accepted ? 204 : 503);
    } catch { return reply(503); }
  }};
}
export default createMailWorker();
