import {NextRequest,NextResponse} from 'next/server';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {companyDb,getCompanyAccess} from '@/app/company-access';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function context() {
  const user=await getChatGPTUser();
  if(!user)return null;
  const access=await getCompanyAccess(user);
  return access.blocked||access.role==='member'?null:{access,db:companyDb()};
}
export async function GET(req:NextRequest) {
  const c=await context();if(!c)return reply({error:'Company administrator access required.'},403);
  const member=await c.db.prepare('SELECT id,project_access_version AS version FROM company_members WHERE id=? AND owner=?').bind(req.nextUrl.searchParams.get('memberId')||'',c.access.owner).first<{id:string;version:number}>();
  if(!member)return reply({error:'Member unavailable.'},404);
  const projects=(await c.db.prepare('SELECT id,name,status FROM projects WHERE owner=? ORDER BY name').bind(c.access.owner).all()).results;
  const assigned=(await c.db.prepare('SELECT project_id FROM project_members WHERE owner=? AND member_id=?').bind(c.access.owner,member.id).all<{project_id:string}>()).results;
  return reply({projects,projectIds:assigned.map(p=>p.project_id),version:member.version});
}
export async function POST(req:NextRequest) {
  const c=await context();if(!c)return reply({error:'Company administrator access required.'},403);
  if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Invalid request origin.'},403);
  let b:{memberId?:unknown;projectIds?:unknown;version?:unknown};
  try{b=await req.json()}catch{return reply({error:'Invalid request.'},400)}
  if(!b||typeof b!=='object'||typeof b.memberId!=='string'||!Array.isArray(b.projectIds)||b.projectIds.length>1000||b.projectIds.some(id=>typeof id!=='string'||!id)||!Number.isSafeInteger(b.version)||Number(b.version)<0)return reply({error:'Choose valid projects and reload the member before saving.'},400);
  const member=await c.db.prepare('SELECT id FROM company_members WHERE id=? AND owner=?').bind(b.memberId,c.access.owner).first<{id:string}>();
  if(!member)return reply({error:'Member unavailable.'},404);
  const ids=[...new Set(b.projectIds as string[])];
  const allowed=(await c.db.prepare('SELECT id FROM projects WHERE owner=?').bind(c.access.owner).all<{id:string}>()).results;
  if(ids.some(id=>!allowed.some(p=>p.id===id)))return reply({error:'A selected project is unavailable.'},404);
  // D1 batch is transactional. Every statement uses the same pre-update version.
  const guard='EXISTS(SELECT 1 FROM company_members WHERE id=? AND owner=? AND project_access_version=?)';
  const statements=[c.db.prepare(`DELETE FROM project_members WHERE member_id=? AND owner=? AND ${guard}`).bind(member.id,c.access.owner,member.id,c.access.owner,b.version),
    c.db.prepare(`INSERT INTO project_members(owner,project_id,member_id) SELECT ?,value,? FROM json_each(?) WHERE ${guard}`).bind(c.access.owner,member.id,JSON.stringify(ids),member.id,c.access.owner,b.version),
    c.db.prepare('UPDATE company_members SET project_access_version=project_access_version+1 WHERE id=? AND owner=? AND project_access_version=?').bind(member.id,c.access.owner,b.version)];
  const results=await c.db.batch(statements);
  return results[results.length-1].meta.changes?reply({ok:true}):reply({error:'Project assignments changed. Reload before saving.'},409);
}
