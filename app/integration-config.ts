import {env} from 'cloudflare:workers';
export type IntegrationProvider='gmail'|'xero';
export function integrationConfig(provider:IntegrationProvider){const e=env as any,p=provider.toUpperCase();return {clientId:String(e[p+'_CLIENT_ID']||''),clientSecret:String(e[p+'_CLIENT_SECRET']||''),redirectUri:String(e[p+'_REDIRECT_URI']||''),encryptionKey:String(e[p+'_TOKEN_ENCRYPTION_KEY']||'')};}
export function integrationSetup(provider:IntegrationProvider,origin?:string){
 const c=integrationConfig(provider);let callback=false,key=false;
 try{const u=new URL(c.redirectUri);callback=u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname===`/api/${provider}/callback`&&(!origin||u.origin===origin);}catch{}
 try{key=atob(c.encryptionKey).length===32;}catch{}
 const checks=[{label:'Provider app registered',ready:!!c.clientId},{label:'Secure app credentials configured',ready:!!c.clientSecret},{label:'Return address configured for this site',ready:callback},{label:'Secure connection storage key configured',ready:key}];
 return {ready:checks.every(c=>c.ready),checks,callbackUrl:origin?`${origin}/api/${provider}/callback`:'',provider};
}
