import {env} from 'cloudflare:workers';
import {fieldUserTabs} from './subscription-plans';
import type {ChatGPTUser} from './chatgpt-auth';
import {type Access,normalisePermissions} from './permissions';
export function companyDb(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export async function getCompanyAccess(user:ChatGPTUser):Promise<Access>{
 const membership=await companyDb().prepare('SELECT owner, role, permissions, status, seat_type FROM company_members WHERE user_id = ?').bind(user.userId).first<{owner:string;role:string;permissions:string;status:string;seat_type:string}>();
 if(!membership)return {owner:user.userId,role:'owner',permissions:{}};
 const permissions=normalisePermissions(JSON.parse(membership.permissions));
 if(membership.seat_type==='field')for(const tab of Object.keys(permissions))if(!fieldUserTabs.includes(tab))permissions[tab]={view:false,edit:false};
 return {owner:membership.owner,role:membership.role==='admin'&&membership.seat_type!=='field'?'admin':'member',permissions,blocked:membership.status!=='active'};
}
export async function hashInvite(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
