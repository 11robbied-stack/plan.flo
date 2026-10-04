import {NextRequest,NextResponse} from 'next/server';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {companyDb,getCompanyAccess} from '@/app/company-access';
import {normaliseDashboardLayout,validateDashboardLayout} from '@/app/dashboard-layout-model';
const json=(v:unknown,status=200)=>NextResponse.json(v,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in required.'},401);
 const access=await getCompanyAccess(user);if(access.blocked)return json({error:'Company access unavailable.'},403);
 try{const row=await companyDb().prepare('SELECT data,version FROM dashboard_layouts WHERE owner=? AND user_id=?').bind(access.owner,user.userId).first<{data:string;version:number}>();let stored;try{stored=JSON.parse(row?.data||'null')}catch{stored=null}return json({layout:normaliseDashboardLayout(stored),version:row?.version||0});}catch{return json({error:'Could not load your dashboard layout. Please retry.'},503);}
}
export async function POST(req:NextRequest){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in required.'},401);
 const access=await getCompanyAccess(user);if(access.blocked)return json({error:'Company access unavailable.'},403);
 if(req.headers.get('origin')!==req.nextUrl.origin)return json({error:'Invalid request origin.'},403);
 let layout,version;
 try{const text=await req.text();if(text.length>8192)return json({error:'Layout is too large.'},413);const body=JSON.parse(text);if(Object.keys(body).some(k=>!['layout','version'].includes(k)))throw Error('Invalid layout request.');layout=validateDashboardLayout(body.layout);version=body.version;if(!Number.isSafeInteger(version)||version<0)throw Error('Reload your layout before saving.');}catch{return json({error:'Invalid dashboard layout.'},400);}
 try{const db=companyDb(),data=JSON.stringify(layout),now=new Date().toISOString();const result=version===0?await db.prepare('INSERT INTO dashboard_layouts(owner,user_id,data,version,updated) VALUES(?,?,?,1,?) ON CONFLICT(owner,user_id) DO NOTHING').bind(access.owner,user.userId,data,now).run():await db.prepare('UPDATE dashboard_layouts SET data=?,version=version+1,updated=? WHERE owner=? AND user_id=? AND version=?').bind(data,now,access.owner,user.userId,version).run();if(!result.meta.changes)return json({error:'Your layout changed in another tab. Cancel and reload before saving again.'},409);return json({layout,version:version+1});}catch{return json({error:'Could not save your layout. Your draft is still here.'},503);}
}
