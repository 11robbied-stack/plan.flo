import {NextRequest,NextResponse} from 'next/server';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {companyDb,getCompanyAccess} from '@/app/company-access';
import {canAccess} from '@/app/permissions';
import {readPayrollConfig} from '@/app/payroll-store';
import {staffKey} from '@/app/calendar-model';
import {weekDays} from '@/app/timesheet-week';
import {validScheduleDate,validateShift,type ScheduleEntry} from '@/app/schedule-model';
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
const clean=(v:unknown,max=4000)=>String(v??'').trim().slice(0,max);
async function context(){const user=await getChatGPTUser();if(!user)return null;const access=await getCompanyAccess(user);return {user,access,db:companyDb(),editable:canAccess(access,'Schedule',true)};}
async function roster(c:NonNullable<Awaited<ReturnType<typeof context>>>){
const members=(await c.db.prepare("SELECT id,name,email,user_id,role FROM company_members WHERE owner=? AND status IN ('active','pending') ORDER BY name").bind(c.access.owner).all<any>()).results;
const payroll=await readPayrollConfig(c.access.owner);
const names=(await c.db.prepare("SELECT DISTINCT json_extract(data,'$.employee') AS name FROM records WHERE owner=? AND kind='time'").bind(c.access.owner).all<{name:string}>()).results;
const workers=[{key:'owner:'+c.access.owner,name:c.user.userId===c.access.owner?(c.user.fullName||c.user.email):'Company owner',role:'Company owner'},...members.map(m=>({key:'member:'+m.id,name:m.name,role:m.role==='admin'?'Administrator':'Team member'}))];
for(const e of payroll.config.employees)if(!workers.some(w=>staffKey(w.name)===staffKey(e.name)))workers.push({key:'payroll:'+e.id,name:e.name,role:'Payroll employee'});
for(const r of names)if(r.name&&!workers.some(w=>staffKey(w.name)===staffKey(r.name)))workers.push({key:'staff:'+staffKey(r.name),name:r.name,role:'Staff'});
return {workers,selfKey:c.user.userId===c.access.owner?'owner:'+c.access.owner:'member:'+members.find(m=>m.user_id===c.user.userId)?.id};}
const entry=(r:any):ScheduleEntry=>({id:r.id,workerKey:r.worker_key,workerName:r.worker_name,projectId:r.project_id,projectName:r.current_project_name||r.project_name,kind:r.kind,date:r.date,start:r.start,end:r.end,breakMinutes:r.break_minutes,notes:r.notes,leaveType:r.leave_type,role:r.role,version:r.version,colour:r.colour});
export async function GET(req:NextRequest){const c=await context();if(!c)return reply({error:'Sign in required.'},401);if(c.access.blocked||!canAccess(c.access,'Schedule')&&!canAccess(c.access,'Time'))return reply({error:'Schedule access is not available.'},403);
try{const date=req.nextUrl.searchParams.get('week')||new Date().toISOString().slice(0,10);if(!validScheduleDate(date))return reply({error:'Choose a valid week.'},400);const days=weekDays(date);const {workers,selfKey}=await roster(c);
const entries=(await c.db.prepare('SELECT s.*,p.name AS current_project_name,b.colour FROM schedule_entries s LEFT JOIN projects p ON p.id=s.project_id AND p.owner=s.owner LEFT JOIN builders b ON b.id=p.builder_id AND b.owner=p.owner WHERE s.owner=? AND s.date>=? AND s.date<=? ORDER BY s.date,s.start').bind(c.access.owner,days[0],days[6]).all<any>()).results.map(entry).filter(e=>c.editable||e.workerKey===selfKey);
const visibleWorkers=c.editable?[...workers]:workers.filter(w=>w.key===selfKey);
if(c.editable)for(const e of entries)if(e.workerKey&&!visibleWorkers.some(w=>w.key===e.workerKey))visibleWorkers.push({key:e.workerKey,name:e.workerName,role:'Previous staff member'});
const projects=c.editable?(await c.db.prepare('SELECT p.id,p.name,p.status,b.colour FROM projects p LEFT JOIN builders b ON b.id=p.builder_id AND b.owner=p.owner WHERE p.owner=? ORDER BY p.name').bind(c.access.owner).all()).results:Array.from(new Map(entries.filter(e=>e.projectId).map(e=>[e.projectId,{id:e.projectId,name:e.projectName,status:'Scheduled',colour:e.colour}])).values());
return reply({entries,workers:visibleWorkers,projects,selfKey,editable:c.editable,days});
}catch(e){console.error('Schedule read',e);return reply({error:'Could not load the schedule. Please try again.'},500);}}
export async function POST(req:NextRequest){const c=await context();if(!c)return reply({error:'Sign in required.'},401);if(c.access.blocked||!c.editable)return reply({error:'Schedule management permission is required.'},403);if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Invalid request origin.'},403);
try{const b:any=await req.json();if(!['save','delete','copy'].includes(b.action))return reply({error:'Unknown schedule action.'},400);
const old=b.id?await c.db.prepare('SELECT * FROM schedule_entries WHERE id=? AND owner=?').bind(clean(b.id,100),c.access.owner).first<any>():null;if(b.id&&!old)return reply({error:'Shift unavailable.'},404);if(old&&b.version!==old.version)return reply({error:'This shift changed elsewhere. Refresh and reopen it.'},409);
if(b.action==='delete'){if(!old)return reply({error:'Choose a shift.'},400);const r=await c.db.prepare('DELETE FROM schedule_entries WHERE id=? AND owner=? AND version=?').bind(old.id,c.access.owner,b.version).run();return r.meta.changes?reply({ok:true}):reply({error:'This shift changed elsewhere. Refresh it.'},409);}
let value:any=b.action==='copy'&&old?entry(old):b.entry;if(!value||b.action==='copy'&&!old)return reply({error:'Choose a shift.'},400);
const {workers}=await roster(c);const worker=workers.find(w=>w.key===value.workerKey);if(value.workerKey&&!worker&&value.workerKey!==old?.worker_key)return reply({error:'Choose a current worker.'},400);
const p=value.kind==='work'?await c.db.prepare('SELECT id,name,status FROM projects WHERE id=? AND owner=?').bind(clean(value.projectId,100),c.access.owner).first<any>():null;
if(value.kind==='work'&&(!p||!['Active','On hold'].includes(p.status)&&p.id!==old?.project_id))return reply({error:'Choose an active or on-hold project.'},400);
const v={...value,workerKey:clean(value.workerKey,300),workerName:worker?.name||old?.worker_name||'',projectId:p?.id||'',projectName:p?.name||'',breakMinutes:Number(value.breakMinutes),notes:clean(value.notes),role:clean(value.role,100),leaveType:clean(value.leaveType,100)};
try{validateShift(v)}catch(e){return reply({error:(e as Error).message},400);}
if(v.kind==='leave'){v.start='';v.end='';v.breakMinutes=0;v.projectId='';v.projectName='';}
const now=new Date().toISOString();
if(b.action==='save'&&old){const r=await c.db.prepare('UPDATE schedule_entries SET worker_key=?,worker_name=?,project_id=?,project_name=?,kind=?,date=?,start=?,end=?,break_minutes=?,notes=?,leave_type=?,role=?,version=version+1,updated=? WHERE id=? AND owner=? AND version=?').bind(v.workerKey,v.workerName,v.projectId,v.projectName,v.kind,v.date,v.start,v.end,v.breakMinutes,v.notes,v.leaveType,v.role,now,old.id,c.access.owner,b.version).run();return r.meta.changes?reply({ok:true}):reply({error:'This shift changed elsewhere. Refresh it.'},409);}
const dates=b.action==='copy'?b.dates:[v.date];if(!Array.isArray(dates)||!dates.length||dates.length>14||new Set(dates).size!==dates.length||dates.some(d=>typeof d!=='string'||!validScheduleDate(d)||b.action==='copy'&&d===old.date))return reply({error:'Choose up to 14 different dates, excluding the original shift date.'},400);
const statements=dates.map(date=>c.db.prepare('INSERT INTO schedule_entries(id,owner,worker_key,worker_name,project_id,project_name,kind,date,start,end,break_minutes,notes,leave_type,role,version,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)').bind(crypto.randomUUID(),c.access.owner,v.workerKey,v.workerName,v.projectId,v.projectName,v.kind,date,v.start,v.end,v.breakMinutes,v.notes,v.leaveType,v.role,now,now));await c.db.batch(statements);return reply({ok:true,count:dates.length});
}catch(e){console.error('Schedule write',e);return reply({error:'Could not save the schedule. Please try again.'},500);}}
