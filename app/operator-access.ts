import {isPlatformOwner,platformOwnerIdentity} from './platform-owner';
import {platformDb,operatorEmails} from './platform-store';
export type OperatorRole='owner'|'support'|'billing';
export async function operatorRole(user:{userId?:string;email:string}):Promise<OperatorRole|null>{return isPlatformOwner(user)?'owner':null;}
export async function allOperatorEmails(){return operatorEmails();}
export function canRead(role:OperatorRole,view:string){return role==='owner'||role==='support'&&['tickets','ticket'].includes(view)||role==='billing'&&['billing','billing-account'].includes(view)}
export async function protectedCompany(owner:string){const identity=platformOwnerIdentity();return !!identity&&!!await platformDb().prepare('SELECT id FROM platform_users WHERE owner=? AND id=? AND lower(email)=?').bind(owner,identity.userId,identity.email).first();}
export async function logAdmin(actor:string,action:string,owner:string,detail:unknown){await platformDb().prepare('INSERT INTO platform_audit(id,actor,action,target,owner,detail,created) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),actor,action,owner,owner,JSON.stringify(detail),new Date().toISOString()).run()}
