import {authEnvironment} from './auth-runtime';
export async function verifySignup(token:unknown,request:Request){
 const e=authEnvironment() as ReturnType<typeof authEnvironment>&{TURNSTILE_SITE_KEY?:string;TURNSTILE_SECRET_KEY?:string};
 if(!e.TURNSTILE_SITE_KEY||!e.TURNSTILE_SECRET_KEY||!e.PLANFLO_AUTH_ORIGIN)return false;
 if(typeof token!=='string'||!token||token.length>2048)return false;
 try{const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({secret:e.TURNSTILE_SECRET_KEY,response:token,remoteip:request.headers.get('cf-connecting-ip')||undefined}),signal:AbortSignal.timeout(8000)});if(!r.ok)return false;const result=await r.json() as {success?:boolean;hostname?:string;action?:string};return result.success===true&&result.hostname===new URL(e.PLANFLO_AUTH_ORIGIN).hostname&&result.action==='signup';}catch{return false;}
}
