import {getChatGPTUser} from '../chatgpt-auth';
import {managedSitesAuth} from '../auth-runtime';
export const dynamic='force-dynamic';
const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"};
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function GET(request:Request){
 if(new URL(request.url).search)return new Response('Account selectors are not supported.',{status:400,headers});
 if(managedSitesAuth())return new Response('Account details require customer sign-in.',{status:403,headers});
 const user=await getChatGPTUser();
 if(!user)return new Response('<p>Sign in with your verified PLAN.FLO account to view your account details.</p><a href="/login?return_to=%2Faccount-details">Sign in</a>',{status:401,headers});
 return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your account details · PLAN.FLO</title><style>body{font:16px system-ui,sans-serif;color:#151515;margin:0;background:#fafafa}main{max-width:540px;margin:8vh auto;padding:28px;background:white;border-radius:24px}h1{font-size:30px}dl{padding:22px;background:#f5f5f6;border-radius:18px}dt{color:#666;margin-top:18px}dt:first-child{margin-top:0}dd{margin:5px 0 0;overflow-wrap:anywhere;font-weight:600}a{color:#245bff}p{line-height:1.6}</style></head><body><main><strong>PLAN.FLO</strong><h1>Your account details</h1><p>These details identify your signed-in account for private demo setup. Share them only with the person helping you set it up.</p><dl><dt>Account ID</dt><dd>${escape(user.userId)}</dd><dt>Email</dt><dd>${escape(user.email)}</dd><dt>Email verification</dt><dd>Verified</dd></dl><p>This page does not change your account or grant access.</p><a href="/welcome">Back to your account</a></main></body></html>`,{headers});
}
