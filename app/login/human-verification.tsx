'use client';
import {useEffect,useRef,useState} from 'react';
type Turnstile={render:(element:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void};
export function HumanVerification({onToken,attempt}:{onToken:(token:string)=>void;attempt:number}){
 const host=useRef<HTMLDivElement>(null);const [error,setError]=useState('');
 useEffect(()=>{let disposed=false,id:string|undefined;const controller=new AbortController();onToken('');setError('');
 const api=()=> (window as typeof window&{turnstile?:Turnstile}).turnstile;
 async function start(){try{const response=await fetch('/api/signup-verification',{signal:controller.signal});const {siteKey}=await response.json() as {siteKey?:string};if(!siteKey)throw new Error('Human verification is not available yet. Please try again later.');
 if(!api())await new Promise<void>((resolve,reject)=>{let script=document.querySelector<HTMLScriptElement>('script[data-planflo-turnstile]');if(!script){script=document.createElement('script');script.dataset.planfloTurnstile='true';script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;document.head.appendChild(script);}const timer=setTimeout(()=>reject(new Error('Human verification could not load. Please reload and try again.')),12000);script.addEventListener('load',()=>{clearTimeout(timer);resolve();},{once:true});script.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('Human verification could not load. Please reload and try again.'));},{once:true});});
 if(disposed||!host.current)return;id=api()!.render(host.current,{sitekey:siteKey,action:'signup',size:'flexible',theme:'light',callback:(token:string)=>{if(!disposed){onToken(token);setError('');}},'expired-callback':()=>{if(!disposed){onToken('');setError('Verification expired. Please verify again.');}},'error-callback':()=>{if(!disposed){onToken('');setError('Verification failed. Please retry.');}}});
 }catch(e){if(!disposed)setError(e instanceof Error?e.message:'Human verification could not load.');}}
 void start();return()=>{disposed=true;controller.abort();if(id)api()?.remove(id);};
 },[attempt,onToken]);
 return <div className="signup-verification"><div ref={host}/>{error&&<p role="alert" className="auth-hint">{error}</p>}</div>;
}
