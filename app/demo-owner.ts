import {env} from 'cloudflare:workers';
/** Demo-only identity pins confer no platform administration rights. */
export function isDemoOwner(user:{userId?:string;email:string}){
 const config=env as unknown as Record<string,string|undefined>,id=config.PLANFLO_DEMO_OWNER_ID?.trim(),email=config.PLANFLO_DEMO_OWNER_EMAIL?.trim().toLowerCase();
 return !!id&&!!email&&!/[\s,]/.test(id)&&/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email)&&user.userId===id&&user.email.trim().toLowerCase()===email;
}
export async function activeDemoOwner(user:{userId?:string;email:string}){
 if(!isDemoOwner(user))return false;
 if(!env.DB)throw new Error('Database unavailable');
 const state=await env.DB.prepare('SELECT u.status AS user_status,a.status AS account_status FROM platform_users u JOIN platform_accounts a ON a.owner=u.owner WHERE u.id=?').bind(user.userId).first<{user_status:string;account_status:string}>();
 return state?.user_status==='Active'&&state?.account_status==='Active';
}
