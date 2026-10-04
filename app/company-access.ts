import {managedSitesAuth} from './auth-runtime';
import {activeDemoOwner} from './demo-owner';
import {operatorRole} from './operator-access';
import {observeIdentity} from './platform-store';
import {normaliseAppSettings,disabledTabs} from './app-settings-model';
import {env} from 'cloudflare:workers';
import {fieldUserTabs} from './subscription-plans';
import type {ChatGPTUser} from './chatgpt-auth';
import {type Access,normalisePermissions} from './permissions';
export function companyDb(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export async function getCompanyAccess(user:ChatGPTUser,observe=true):Promise<Access>{
 const membership=await companyDb().prepare('SELECT owner, role, permissions, status, seat_type FROM company_members WHERE user_id = ?').bind(user.userId).first<{owner:string;role:string;permissions:string;status:string;seat_type:string}>();
 const owner=membership?.owner||user.userId;
 const needsOnboarding=!managedSitesAuth()&&!membership&&!await companyDb().prepare('SELECT owner FROM settings WHERE owner=?').bind(user.userId).first();
 const state=observe?null:await companyDb().prepare('SELECT a.status AS a,u.status AS u FROM platform_accounts a JOIN platform_users u ON u.owner=a.owner WHERE u.id=?').bind(user.userId).first<any>();
 const platform=observe?await observeIdentity(user,owner):{blocked:state?.a!=='Active'||state?.u!=='Active'};
 const [config,legacy]=await Promise.all([companyDb().prepare('SELECT data FROM app_settings WHERE owner=?').bind(owner).first<any>(),companyDb().prepare('SELECT colour,theme FROM settings WHERE owner=?').bind(owner).first<any>()]);
 const projectIds=membership?(await companyDb().prepare("SELECT pm.project_id FROM project_members pm JOIN company_members m ON m.id=pm.member_id AND m.owner=pm.owner JOIN projects p ON p.id=pm.project_id AND p.owner=pm.owner WHERE m.user_id=? AND m.status='active' AND pm.owner=?").bind(user.userId,owner).all<{project_id:string}>()).results.map(p=>p.project_id):[];
 const appSettings=normaliseAppSettings(config?.data,legacy||{}),features={projectIds,appSettings,disabledTabs:disabledTabs(appSettings),platformAdmin:!!await operatorRole(user),demoAccess:await activeDemoOwner(user).catch(()=>false)};
 if(!membership)return {owner:user.userId,role:'owner',permissions:{},blocked:platform.blocked||needsOnboarding,...features};
 const permissions=normalisePermissions(JSON.parse(membership.permissions));
 if(membership.seat_type==='field')for(const tab of Object.keys(permissions))if(!fieldUserTabs.includes(tab))permissions[tab]={view:false,edit:false};
 return {owner:membership.owner,role:membership.role==='admin'&&membership.seat_type!=='field'?'admin':'member',permissions,blocked:platform.blocked||membership.status!=='active',...features};
}
export async function hashInvite(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
