import {env} from 'cloudflare:workers';
import type {ChatGPTUser} from './chatgpt-auth';
import {platformOwnerIdentity,isPlatformOwner} from './platform-owner';
export function platformDb(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export function operatorEmails(){const owner=platformOwnerIdentity();return owner?[owner.email]:[];}
export function isPlatformAdmin(user:Pick<ChatGPTUser,'userId'|'email'>){return isPlatformOwner(user);}
export async function observeIdentity(user:ChatGPTUser,owner:string){const now=new Date().toISOString();await platformDb().batch([
 platformDb().prepare("INSERT INTO platform_accounts(owner,status,reason,notes,created,updated) VALUES(?,'Active','','',?,?) ON CONFLICT(owner) DO NOTHING").bind(owner,now,now),
 platformDb().prepare("INSERT INTO platform_users(id,owner,name,email,status,first_seen,last_seen) VALUES(?,?,?,?,'Active',?,?) ON CONFLICT(id) DO UPDATE SET owner=excluded.owner,name=excluded.name,email=excluded.email,last_seen=excluded.last_seen WHERE platform_users.last_seen<? OR platform_users.owner<>excluded.owner OR platform_users.email<>excluded.email OR platform_users.name<>excluded.name").bind(user.userId,owner,user.fullName||user.email,user.email.toLowerCase(),now,now,new Date(Date.now()-60000).toISOString())
]);const row=await platformDb().prepare('SELECT a.status AS account_status,u.status AS user_status FROM platform_accounts a JOIN platform_users u ON u.owner=a.owner WHERE u.id=?').bind(user.userId).first<any>();return {blocked:row?.account_status!=='Active'||row?.user_status!=='Active',accountStatus:row?.account_status||'Active'};}
