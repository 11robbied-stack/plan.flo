import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMailWorker} from '../../workers/auth-email/index.mjs';
const env = {AUTH_EMAIL_PROVIDER:'resend',AUTH_EMAIL_FROM:'auth@example.test',RESEND_API_KEY:'re_synthetic_test_only',PLANFLO_AUTH_ORIGIN:'https://staging.example.test'};
const mail = {to:'person@example.test',purpose:'verification',url:env.PLANFLO_AUTH_ORIGIN+'/api/auth/verify-email?token=synthetic-token-123456&callbackURL=%2Flogin'};
const request = (value=mail, options={}) => new Request('https://mail.internal/send',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value),...options});
const success = () => Response.json({id:'synthetic-email-id'});
function fixture(responses=[success]) { const calls=[],delays=[];const worker=createMailWorker({fetch:async(url,options)=>{calls.push({url,...options});const next=responses[Math.min(calls.length-1,responses.length-1)];return next(options);},sleep:async ms=>{delays.push(ms);},timeoutMs:10});return {worker,calls,delays}; }

test('verification, recovery and repeated requests use validated plaintext and stable opaque keys',async()=>{
 const f=fixture();assert.equal((await f.worker.fetch(request(),env)).status,204);assert.equal((await f.worker.fetch(request(),env)).status,204);
 assert.equal(f.calls[0].headers['idempotency-key'],f.calls[1].headers['idempotency-key']);assert.match(f.calls[0].headers['idempotency-key'],/^planflo-auth-v1-[a-f0-9]{64}$/);
 const p=JSON.parse(f.calls[0].body);assert.equal(p.from,'PLAN.FLO <auth@example.test>');assert.deepEqual(p.to,[mail.to]);assert.ok(p.text.includes(mail.url));assert.equal(p.html,undefined);assert.equal(f.calls[0].url,'https://api.resend.com/emails');assert.equal(f.calls[0].redirect,'manual');
 const recovery={...mail,purpose:'recovery',url:env.PLANFLO_AUTH_ORIGIN+'/api/auth/reset-password/synthetic-token-123456?callbackURL=%2Flogin'};
 assert.equal((await f.worker.fetch(request(recovery),env)).status,204);assert.match(JSON.parse(f.calls[2].body).subject,/Reset/);assert.notEqual(f.calls[2].headers['idempotency-key'],f.calls[0].headers['idempotency-key']);
});
for(const [label,change] of Object.entries({
 'foreign origin':{url:'https://evil.test/api/auth/verify-email?token=synthetic-token-123456'},
 'wrong path':{url:env.PLANFLO_AUTH_ORIGIN+'/api/file/a'},
 'callback escape':{url:mail.url.replace('%2Flogin','https%3A%2F%2Fevil.test')},
 'duplicate token':{url:mail.url+'&token=synthetic-token-123456'},
 'unknown query':{url:mail.url+'&redirect=https://evil.test'},
 'fragment':{url:mail.url+'#extra'},
 'credentials':{url:mail.url.replace('https://','https://user:pass@')},
 'short token':{url:mail.url.replace('synthetic-token-123456','x')},
 'header injection':{to:'a@example.test\r\nBcc: b@example.test'},
 'multiple recipients':{to:['a@example.test','b@example.test']},
 'arbitrary content':{html:'malicious'},'unsupported purpose':{purpose:'marketing'},
 'long URL':{url:mail.url+'a'.repeat(5000)},'control in URL':{url:mail.url+'%0aevil'},
}))test('rejects '+label+' before provider call',async()=>{const f=fixture();assert.equal((await f.worker.fetch(request({...mail,...change}),env)).status,400);assert.equal(f.calls.length,0);});
test('malformed, oversized, wrong endpoint and content type fail before transport',async()=>{
 const f=fixture();for(const r of [request(null),request([]),request(mail,{body:'{'}),request(mail,{body:'x'.repeat(9000)})])assert.equal((await f.worker.fetch(r,env)).status,400);
 assert.equal((await f.worker.fetch(request(mail,{headers:{'content-type':'application/json','content-length':'9000'}}),env)).status,413);
 assert.equal((await f.worker.fetch(request(mail,{headers:{'content-type':'text/plain'}}),env)).status,415);
 assert.equal((await f.worker.fetch(new Request('https://public.example.test/send'),env)).status,404);assert.equal(f.calls.length,0);
});
for(const field of Object.keys(env))test('fails closed without '+field,async()=>{const f=fixture();const e={...env};delete e[field];assert.equal((await f.worker.fetch(request(),e)).status,503);assert.equal(f.calls.length,0);});
test('unapproved provider and HTTP origin fail closed',async()=>{const f=fixture();for(const e of [{...env,AUTH_EMAIL_PROVIDER:'other'},{...env,PLANFLO_AUTH_ORIGIN:'http://staging.example.test'},{...env,AUTH_EMAIL_FROM:'x\r\n@example.test'}])assert.equal((await f.worker.fetch(request(),e)).status,503);assert.equal(f.calls.length,0);});
for(const status of [429,500,502,503])test('retries transient '+status+' with same key',async()=>{const f=fixture([()=>Response.json({name:'transient'},{status}),success]);assert.equal((await f.worker.fetch(request(),env)).status,204);assert.equal(f.calls.length,2);assert.equal(f.calls[0].headers['idempotency-key'],f.calls[1].headers['idempotency-key']);assert.deepEqual(f.delays,[250]);});
test('network failures stop after three attempts and expose no error/token',async()=>{const f=fixture([()=>{throw Error(mail.url+env.RESEND_API_KEY);}]);const r=await f.worker.fetch(request(),env);assert.equal(r.status,503);assert.equal(await r.text(),'');assert.equal(f.calls.length,3);assert.deepEqual(f.delays,[250,500]);});
test('abort bounds provider timeout and retries',async()=>{const f=fixture([options=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout'))))]);assert.equal((await f.worker.fetch(request(),env)).status,503);assert.equal(f.calls.length,3);});
for(const status of [301,302,307,400,401,403,422])test('does not retry permanent '+status,async()=>{const f=fixture([()=>Response.json({message:mail.url},{status})]);const r=await f.worker.fetch(request(),env);assert.equal(r.status,503);assert.equal(await r.text(),'');assert.equal(f.calls.length,1);});
test('retry-after is respected; long waits fail safely',async()=>{const f=fixture([()=>Response.json({},{status:429,headers:{'retry-after':'1'}}),success]);assert.equal((await f.worker.fetch(request(),env)).status,204);assert.deepEqual(f.delays,[1000]);const g=fixture([()=>Response.json({},{status:429,headers:{'retry-after':'60'}})]);assert.equal((await g.worker.fetch(request(),env)).status,503);assert.equal(g.calls.length,1);});
test('only concurrent idempotency conflict is retryable',async()=>{for(const name of ['concurrent_idempotent_requests','invalid_idempotent_request']){const f=fixture([()=>Response.json({name},{status:409}),success]);assert.equal((await f.worker.fetch(request(),env)).status,name.startsWith('concurrent')?204:503);assert.equal(f.calls.length,name.startsWith('concurrent')?2:1);}});
test('malformed/oversized success never acknowledges mail',async()=>{for(const make of [()=>Response.json({}),()=>new Response('bad'),()=>Response.json({id:'x'.repeat(5000)})]){const f=fixture([make]);assert.equal((await f.worker.fetch(request(),env)).status,503);}});
test('checked-in mail deployment has no public ingress or logs',()=>{const c=JSON.parse(readFileSync(new URL('../../workers/auth-email/wrangler.staging.jsonc',import.meta.url),'utf8').replace(/^\s*\/\/.*$/gm,''));assert.equal(c.workers_dev,false);assert.equal(c.preview_urls,false);assert.deepEqual(c.routes,[]);assert.equal(c.observability.enabled,false);assert.equal(c.vars.RESEND_API_KEY,undefined);});
