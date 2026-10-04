'use client';
import {HumanVerification} from './human-verification';
import {AuthBrand} from '../auth-brand';
import {ArrowRight,ShieldCheck} from 'lucide-react';
import {useCallback,useEffect,useRef,useState} from 'react';
import {clearPendingEmail,safeReturn,savePendingEmail,verificationCallback} from './auth-navigation';
export {safeReturn} from './auth-navigation';
type Mode='login'|'signup'|'recovery'|'reset'|'verify';
export default function AuthForm({returnTo='/',token='',initialMode='login',linkError=false,verificationNotice=false}:{returnTo?:string;token?:string;initialMode?:string;linkError?:boolean;verificationNotice?:boolean}){
 const invitation=new URL(safeReturn(returnTo),'https://local.invalid').pathname==='/join';
 const validMode=['login','signup','recovery','verify'].includes(initialMode)?initialMode as Mode:'login';
 const [mode,setMode]=useState<Mode>(token?'reset':validMode),[message,setMessage]=useState(linkError?'This link is invalid or has expired. Request another email below.':verificationNotice?'Verification link opened. Sign in to continue.':''),[isError,setIsError]=useState(linkError),[busy,setBusy]=useState(false);
 const [humanToken,setHumanToken]=useState(''),[humanAttempt,setHumanAttempt]=useState(0);const acceptToken=useCallback((token:string)=>setHumanToken(token),[]);
 const request=useRef<AbortController|null>(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(request.current)return;if(mode==='signup'&&!humanToken){setIsError(true);setMessage('Please complete human verification.');return;}const controller=new AbortController();request.current=controller;setBusy(true);setMessage('');setIsError(false);
  const fields=Object.fromEntries(new FormData(event.currentTarget));const target=safeReturn(returnTo);
  const endpoint={login:'sign-in/email',signup:'sign-up/email',recovery:'request-password-reset',reset:'reset-password',verify:'send-verification-email'}[mode];
  try{
   const body=mode==='reset'?{token,newPassword:fields.password}:mode==='recovery'?{email:fields.email,redirectTo:'/login?flow=recovery'}:mode==='verify'?{email:fields.email,callbackURL:verificationCallback(target)}:{...fields,...(mode==='signup'?{signupIntent:invitation?'join':'business','cf-turnstile-response':humanToken}:{}),callbackURL:verificationCallback(target)};
   const response=await fetch('/api/auth/'+endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
   if(!response.ok){const failure=await response.json().catch(()=>null) as {code?:string;error?:string}|null;setIsError(true);setMessage(['INVALID_REGISTRATION','HUMAN_VERIFICATION_REQUIRED'].includes(failure?.code||'')?failure?.error||'Check your registration details.':response.status===429?'Too many attempts. Please wait a minute.':mode==='reset'?'This reset link could not be used. Request a new password-reset email.':'Unable to complete this request. Check your details or try again later.');return;}
   if(controller.signal.aborted)return;
   if(mode==='login'){clearPendingEmail();window.location.assign(target);return;}
   if(mode==='reset'){setMessage('Password updated. You can now sign in.');setMode('login');return;}
   const purpose=mode==='recovery'?'recovery':'verification';savePendingEmail(String(fields.email||''),purpose);
   window.location.assign('/check-email?'+new URLSearchParams({purpose,return_to:target}));
  }catch{if(!controller.signal.aborted){setIsError(true);setMessage('Connection failed. Please try again.');}}
  finally{if(!controller.signal.aborted){request.current=null;setBusy(false);if(mode==='signup'){setHumanToken('');setHumanAttempt(n=>n+1);}}}
 }
 const title={login:'Welcome back.',signup:'Create your account',recovery:'Reset your password',reset:'Choose a new password',verify:'Resend verification'}[mode];
 const action={login:'Sign in',signup:'Create your account',recovery:'Reset your password',reset:'Choose a new password',verify:'Resend verification'}[mode];
 const intro={login:'Sign in to your project workspace.',signup:'Set up your details, then verify your email before signing in.',recovery:'Enter your email to request a secure reset link.',reset:'Choose a strong password for your account.',verify:'Enter your email to request another verification link.'}[mode];
 return <main className="welcome-screen auth-screen"><section className="welcome-card auth-card"><AuthBrand/><div className="welcome-intro"><span className="welcome-kicker">YOUR PROJECT WORKSPACE</span><h1>{title}</h1><p>{intro}</p></div>
 {message&&<p className={'auth-feedback '+(isError?'auth-error':'auth-success')} role={isError?'alert':'status'}>{message}</p>}
 <form onSubmit={submit} className="auth-form" key={mode}><fieldset disabled={busy}>
 {mode==='signup'&&<><label>Name<input name="fullName" required maxLength={160} autoComplete="name"/></label><label>Organisation / Company<input name="businessName" required={!invitation} maxLength={160} autoComplete="organization"/></label>{invitation&&<p className="auth-hint">You are joining an existing company. Business details will not change that company.</p>}</>}
 {mode!=='reset'&&<label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false}/></label>}
 {['login','signup','reset'].includes(mode)&&<label>Password<input name="password" type="password" required minLength={mode==='login'?1:12} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'}/>{mode!=='login'&&<small>Use at least 12 characters.</small>}</label>}
 {mode==='signup'&&<><label>Phone<input name="phone" type="tel" required maxLength={40} autoComplete="tel"/></label><label>REC number<input name="rec" required={!invitation} maxLength={60}/><small>Recorded as supplied; registration is not verified.</small></label><HumanVerification onToken={acceptToken} attempt={humanAttempt}/></>}
 <button className="auth-primary" disabled={busy||(mode==='signup'&&!humanToken)} type="submit">{busy?'Please wait…':action}{!busy&&<ArrowRight size={18} aria-hidden="true"/>}</button></fieldset></form>
 <nav className="auth-navigation" aria-label="Account options">{(['login','signup','recovery','verify'] as Mode[]).filter(x=>x!==mode).map(x=><button key={x} type="button" disabled={busy} onClick={()=>{setMode(x);setMessage('');setIsError(false)}}>{({login:'Sign in',signup:'Create account',recovery:'Forgot password?',verify:'Resend verification',reset:''})[x]}</button>)}</nav>
 <footer><ShieldCheck size={18} aria-hidden="true"/><span>Secure customer sign-in</span></footer></section></main>;
}
