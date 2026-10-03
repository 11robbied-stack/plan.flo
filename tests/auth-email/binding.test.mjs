import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build} from '../../node_modules/.pnpm/esbuild@0.28.0/node_modules/esbuild/lib/main.js';
const require=createRequire(import.meta.url);
const {Miniflare}=createRequire(require.resolve('wrangler/package.json'))('miniflare');
test('local Worker service binding delivers synthetic verification/recovery and propagates provider rejection',async()=>{
 const bundled=await build({entryPoints:[new URL('../../workers/auth-email/index.mjs',import.meta.url).pathname],bundle:true,write:false,format:'esm'});
 let fail=false,transient=true;const calls=[];
 const mf=new Miniflare({host:'127.0.0.1',port:0,workers:[
  {name:'app',modules:true,script:'export default {async fetch(request,env){return env.AUTH_EMAIL.fetch(new Request("https://mail.internal/send",{method:"POST",headers:{"content-type":"application/json"},body:request.body}))}}',serviceBindings:{AUTH_EMAIL:'mail'},compatibilityDate:'2026-05-15'},
  {name:'mail',modules:true,script:bundled.outputFiles[0].text,compatibilityDate:'2026-05-15',bindings:{AUTH_EMAIL_PROVIDER:'resend',AUTH_EMAIL_FROM:'auth@example.test',RESEND_API_KEY:'re_synthetic_test_only',PLANFLO_AUTH_ORIGIN:'https://staging.example.test'},outboundService:async request=>{
   assert.equal(request.url,'https://api.resend.com/emails');assert.equal(request.headers.get('authorization'),'Bearer re_synthetic_test_only');calls.push({body:await request.json(),key:request.headers.get('idempotency-key')});
   if(fail)return Response.json({name:'validation_error',message:'synthetic permanent failure'},{status:422});
   if(transient){transient=false;return Response.json({name:'internal_server_error'},{status:500});}
   return Response.json({id:'synthetic-provider-id'});
  }},
 ]});
 try {await mf.ready;
  const send=(purpose,url)=>mf.dispatchFetch('https://local-caller.test/',{method:'POST',body:JSON.stringify({to:'person@example.test',purpose,url})});
  const url='https://staging.example.test/api/auth/verify-email?token=synthetic-token-123456&callbackURL=%2Flogin';
  assert.equal((await send('verification',url)).status,204);assert.equal(calls.length,2);assert.equal(calls[0].key,calls[1].key);
  assert.equal((await send('recovery','https://staging.example.test/api/auth/reset-password/synthetic-token-123456?callbackURL=%2Flogin')).status,204);
  assert.match(calls[2].body.subject,/Reset/);
  fail=true;const response=await send('verification',url);assert.equal(response.status,503);assert.equal(await response.text(),'');assert.equal(calls.length,4);
  assert.equal((await send('verification',url.replace('staging.example.test','evil.test'))).status,400);assert.equal(calls.length,4);
 } finally {await mf.dispose();}
});
