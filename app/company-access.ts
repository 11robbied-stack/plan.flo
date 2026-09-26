import {env} from 'cloudflare:workers';
import type {ChatGPTUser} from './chatgpt-auth';
import {type Access,normalisePermissions} from './permissions';
export function companyDb(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export async function getCompanyAccess(user:ChatGPTUser):Promise<Access>{
 const membership=await companyDb().prepare('SELECT owner, role, permissions, status FROM company_members WHERE user_id = ?').bind(user.userId).first<{owner:string;role:string;permissions:string;status:string}>();
 if(!membership)return {owner:user.userId,role:'owner',permissions:{}};
 return {owner:membership.owner,role:membership.role==='admin'?'admin':'member',permissions:normalisePermissions(JSON.parse(membership.permissions)),blocked:membership.status!=='active'};
}
export async function hashInvite(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
