import {verifySignup} from '@/app/signup-verification';
import {registrationProfile,RegistrationError} from '@/app/registration-profile';
import {customerAuth,managedSitesAuth,authEnvironment} from '@/app/auth-runtime';
const allowed=new Set(['sign-up/email','sign-in/email','sign-out','get-session','verify-email','send-verification-email','request-password-reset','reset-password','reset-password/']);
async function handle(request:Request){
 if(managedSitesAuth())return Response.json({error:'Customer authentication unavailable'},{status:404});
 const path=new URL(request.url).pathname.slice('/api/auth/'.length);
 if(!allowed.has(path)&&!path.startsWith('reset-password/'))return Response.json({error:'Not found'},{status:404});
 if(request.method==='POST'&&request.headers.get('origin')!==authEnvironment().PLANFLO_AUTH_ORIGIN)return Response.json({error:'Invalid request origin'},{status:403});
 // Bound request/password size before hashing, including versions with late password checks.
 if(request.method==='POST'){
  const text=await request.clone().text();if(text.length>8192)return Response.json({error:'Request too large'},{status:413});
  try{const b=JSON.parse(text);if(!b||typeof b!=='object'||Array.isArray(b))return Response.json({error:'Invalid request'},{status:400});for(const key of ['password','newPassword'])if(typeof b[key]==='string'&&b[key].length>128)return Response.json({error:'Password is too long'},{status:400});if(path==='sign-up/email'){const profile=registrationProfile(b,b.signupIntent!=='join');if(!await verifySignup(b['cf-turnstile-response'],request))return Response.json({code:'HUMAN_VERIFICATION_REQUIRED',error:'Please complete human verification and try again.'},{status:400});const normalized={...b,...profile,name:[profile.firstName,profile.surname].filter(Boolean).join(' ')};delete normalized['cf-turnstile-response'];request=new Request(request.url,{method:'POST',headers:request.headers,body:JSON.stringify(normalized)});}}catch(error){return Response.json({error:error instanceof RegistrationError?error.message:'Invalid request',...(error instanceof RegistrationError?{code:'INVALID_REGISTRATION'}:{})},{status:400});}
 }
 try{return await customerAuth().handler(request);}catch{return Response.json({error:'Sign-in service is unavailable. Please try again later.'},{status:503});}
}
export const GET=handle;export const POST=handle;
