import {AUTH_LINK_TTL_SECONDS} from '../shared/auth-policy.mjs';
import {registrationFields} from './registration-profile';
import {env} from 'cloudflare:workers';
import {betterAuth} from 'better-auth';
import {drizzleAdapter} from '@better-auth/drizzle-adapter';
import {getDb} from '@/db';
import * as schema from '@/db/auth-schema';

type AuthEnv={PLANFLO_AUTH_MODE?:string;PLANFLO_DEPLOYMENT?:string;PLANFLO_AUTH_ORIGIN?:string;BETTER_AUTH_SECRET?:string;AUTH_EMAIL?:Fetcher};
export function authEnvironment(){return env as typeof env & AuthEnv;}
// Only a Sites deployment with an authenticated ingress may opt into this adapter.
// Never set these values on a directly reachable Worker.
export function managedSitesAuth(){const e=authEnvironment();return e.PLANFLO_AUTH_MODE==='managed-sites'&&e.PLANFLO_DEPLOYMENT==='managed-sites';}
export type AuthMail={to:string;purpose:'verification'|'recovery';url:string};
export function createCustomerAuth(db:ReturnType<typeof getDb>,origin:string,secret:string,send:(mail:AuthMail)=>Promise<void>){
 const url=new URL(origin);
 if(url.origin!==origin||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname))))throw new Error('Invalid authentication origin');
 if(secret.length<32)throw new Error('Authentication secret must be configured');
 return betterAuth({appName:'PLAN.FLO',baseURL:origin,basePath:'/api/auth',secret,
  database:drizzleAdapter(db,{provider:'sqlite',schema,transaction:false}),trustedOrigins:[origin],
  user:{additionalFields:Object.fromEntries(registrationFields.map(name=>[name,{type:'string' as const,required:false,defaultValue:'',returned:false}]))},
  emailAndPassword:{resetPasswordTokenExpiresIn:AUTH_LINK_TTL_SECONDS,enabled:true,requireEmailVerification:true,autoSignIn:false,minPasswordLength:12,maxPasswordLength:128,revokeSessionsOnPasswordReset:true,sendResetPassword:async({user,url})=>send({to:user.email,purpose:'recovery',url})},
  emailVerification:{sendOnSignUp:true,autoSignInAfterVerification:false,expiresIn:AUTH_LINK_TTL_SECONDS,sendVerificationEmail:async({user,url})=>send({to:user.email,purpose:'verification',url})},
  session:{expiresIn:7*86400,updateAge:86400,cookieCache:{enabled:false}},
  account:{accountLinking:{enabled:false}},
  rateLimit:{enabled:true,storage:'database',window:60,max:50,customRules:{'/sign-in/email':{window:60,max:5},'/sign-up/email':{window:60,max:5},'/request-password-reset':{window:60,max:3},'/send-verification-email':{window:60,max:3}}},
  advanced:{useSecureCookies:url.protocol==='https:',cookiePrefix:'planflo',ipAddress:{ipAddressHeaders:['cf-connecting-ip']},defaultCookieAttributes:{httpOnly:true,sameSite:'lax',path:'/'}}
 });
}
export function customerAuth(){
 const e=authEnvironment();
 if(managedSitesAuth()||!e.PLANFLO_AUTH_ORIGIN||!e.BETTER_AUTH_SECRET||!e.AUTH_EMAIL)throw new Error('Customer authentication is not configured');
 return createCustomerAuth(getDb(),e.PLANFLO_AUTH_ORIGIN,e.BETTER_AUTH_SECRET,async mail=>{
  // Internal service binding: no public mail endpoint, API key, or test outbox in production.
  const response=await e.AUTH_EMAIL!.fetch(new Request('https://mail.internal/send',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(mail)}));
  if(!response.ok)throw new Error('Authentication email delivery unavailable');
 });
}
