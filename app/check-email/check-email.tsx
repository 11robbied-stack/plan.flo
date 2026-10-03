'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Mail,ShieldCheck} from 'lucide-react';
import {AuthBrand} from '../auth-brand';
import {clearPendingEmail,loginPath,readPendingEmail,safeReturn,savePendingEmail,verificationCallback,type PendingPurpose} from '../login/auth-navigation';
const currentTime=()=>Date.now();
export default function CheckEmail({purpose,returnTo='/'}:{purpose:PendingPurpose;returnTo?:string}){
 const [email,setEmail]=useState(''),[busy,setBusy]=useState(false),[remaining,setRemaining]=useState(0),[feedback,setFeedback]=useState(''),[error,setError]=useState(false);
 const until=useRef(0),request=useRef<AbortController|null>(null);const recovery=purpose==='recovery',target=safeReturn(returnTo);
 // Session storage is browser-only; initialize its external state after hydration.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{const pending=readPendingEmail(purpose);if(pending){setEmail(pending.email);until.current=pending.created+30000;setRemaining(Math.max(0,Math.ceil((until.current-currentTime())/1000)));}const timer=setInterval(()=>setRemaining(Math.max(0,Math.ceil((until.current-currentTime())/1000))),1000);return()=>{clearInterval(timer);request.current?.abort();}},[purpose]);
 async function resend(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(request.current||currentTime()<until.current)return;const controller=new AbortController();request.current=controller;setBusy(true);setFeedback('');setError(false);
  try{const response=await fetch('/api/auth/'+(recovery?'request-password-reset':'send-verification-email'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(recovery?{email,redirectTo:'/login?flow=recovery'}:{email,callbackURL:verificationCallback(target)}),signal:controller.signal});if(controller.signal.aborted)return;
   if(!response.ok){setError(true);if(response.status===429){until.current=currentTime()+60000;setRemaining(60);setFeedback('Too many requests. Wait a minute before trying again.');}else setFeedback('We could not complete this request. Please try again later.');return;}
   savePendingEmail(email,purpose);until.current=currentTime()+30000;setRemaining(30);setFeedback('If this address is eligible, a new email will arrive shortly. Check your inbox and spam folder.');
  }catch{if(!controller.signal.aborted){setError(true);setFeedback('Connection failed. Please try again.');}}finally{if(!controller.signal.aborted){request.current=null;setBusy(false);}}
 }
 return <main className="welcome-screen auth-screen"><section className="welcome-card auth-card auth-check"><AuthBrand/><div className="auth-mail-icon"><Mail size={28} aria-hidden="true"/></div><div className="welcome-intro"><span className="welcome-kicker">{recovery?'PASSWORD RECOVERY':'VERIFY YOUR EMAIL'}</span><h1>Check your email</h1><p>{recovery?'Open the PLAN.FLO email and select Reset password.':'Verify your email before signing in.'}</p></div>
 <ol className="auth-next-steps"><li><span>1</span><div><strong>Open your inbox</strong><p>For an eligible address, an email will arrive shortly. Check junk or spam too.</p></div></li><li><span>2</span><div><strong>{recovery?'Choose a new password':'Select Verify email'}</strong><p>{recovery?'Follow the secure link, then return to sign in.':'Use the button in the email, then sign in to continue.'}</p></div></li></ol>
 <a className="auth-primary" href={loginPath(target)} onClick={clearPendingEmail}>Back to sign in <ArrowRight size={18} aria-hidden="true"/></a>
 <details className="auth-resend" open><summary>Didn’t receive an email?</summary><p className="auth-hint">Confirm the address below to request another link.</p><form onSubmit={resend}><label>Email address<input name="email" type="email" value={email} onChange={event=>setEmail(event.target.value)} required maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false} disabled={busy}/></label><button className="auth-secondary" type="submit" disabled={busy||remaining>0}>{busy?'Requesting…':remaining>0?`Resend available in ${remaining}s`:'Resend email'}</button></form></details>
 {feedback&&<p className={'auth-feedback '+(error?'auth-error':'auth-success')} role={error?'alert':'status'}>{feedback}</p>}
 <a className="auth-change-email" href={loginPath(target,recovery?'recovery':'signup')} onClick={clearPendingEmail}>Use a different email</a>
 <footer><ShieldCheck size={18} aria-hidden="true"/><span>Secure customer sign-in</span></footer></section></main>;
}
