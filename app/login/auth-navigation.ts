export function safeReturn(value:string){try{const url=new URL(value,'https://local.invalid');return value.startsWith('/')&&!value.startsWith('//')&&url.origin==='https://local.invalid'&&!/^\/(login|logout|check-email|api\/auth)/.test(url.pathname)?url.pathname+url.search:'/';}catch{return '/';}}
export function loginPath(returnTo:string,mode='login'){return '/login?'+new URLSearchParams({return_to:safeReturn(returnTo),...(mode==='login'?{}:{mode})});}
export function verificationCallback(returnTo:string){return loginPath(returnTo)+'&flow=verification&notice=verification';}
export type PendingPurpose='verification'|'recovery';
const key='planflo-pending-email';
export function savePendingEmail(email:string,purpose:PendingPurpose){try{sessionStorage.setItem(key,JSON.stringify({email,purpose,created:Date.now()}));}catch{/* Storage is optional; the user can enter the address again. */}}
export function clearPendingEmail(){try{sessionStorage.removeItem(key);}catch{}}
export function readPendingEmail(purpose:PendingPurpose):{email:string;created:number}|null{try{const value=JSON.parse(sessionStorage.getItem(key)||'null');if(value?.purpose===purpose&&typeof value.email==='string'&&value.email.length<=254&&typeof value.created==='number'&&Date.now()-value.created>=0&&Date.now()-value.created<15*60*1000)return value;clearPendingEmail();}catch{}return null;}
