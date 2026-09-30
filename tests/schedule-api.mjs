// Local-only scheduling integration checks.
import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787',owner='schedule-test-'+Date.now();
async function api(path,body,user=owner,origin=base){const r=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',origin,...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}
assert.equal((await api('schedule?week=2026-09-30',null,'')).status,401);
const project=(await api('data',{action:'project',name:'Schedule project',contract:10000})).data.id;assert(project);
const field=owner+'field';const invite=(await api('company',{action:'add',name:'Electrician',email:field+'@example.test',seatType:'field',permissions:{Time:{view:true,edit:true}}})).data.token;assert(invite);assert.equal((await api('company',{action:'accept',token:invite},field)).status,200);
let d=(await api('schedule?week=2026-09-30')).data;const worker=d.workers.find(w=>w.name==='Electrician');assert(worker);assert.deepEqual(d.days,['2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03','2026-10-04']);
const shift={workerKey:worker.key,projectId:project,kind:'work',date:'2026-09-30',start:'07:00',end:'15:06',breakMinutes:30,notes:'Bring test meter',role:'Electrical rough-in',leaveType:'Annual leave'};
assert.equal((await api('schedule',{action:'save',entry:shift})).status,200);
assert.equal((await api('schedule',{action:'save',entry:{...shift,workerKey:'',date:'2026-10-01'}})).status,200);
assert.equal((await api('schedule',{action:'save',entry:{...shift,workerKey:'owner:'+owner,date:'2026-10-02'}})).status,200);
d=(await api('schedule?week=2026-09-30')).data;assert.equal(d.entries.length,3);let original=d.entries.find(e=>e.workerKey===worker.key);assert(original);assert.equal(original.workerName,'Electrician');assert.equal(original.projectName,'Schedule project');assert.equal(original.breakMinutes,30);
const own=(await api('schedule?week=2026-09-30',null,field)).data;assert.equal(own.editable,false);assert.equal(own.entries.length,1);assert.equal(own.workers.length,1);assert.equal(own.projects[0].name,'Schedule project');
assert.equal((await api('schedule',{action:'save',entry:shift},field)).status,403);
assert.equal((await api('schedule?week=2026-09-30',null,owner+'other')).data.entries.length,0);
assert.equal((await api('schedule',{action:'save',entry:{...shift,projectId:'other'}})).status,400);
assert.equal((await api('schedule',{action:'save',entry:shift},owner,'https://wrong.example')).status,403);
assert.equal((await api('schedule?week=2026-02-30')).status,400);
assert.equal((await api('schedule',{action:'copy',id:original.id,version:1,dates:['2026-10-05','2026-10-06']})).status,200);
assert.equal((await api('schedule?week=2026-10-05')).data.entries.length,2);
assert.equal((await api('schedule',{action:'copy',id:original.id,version:1,dates:['2026-10-05','2026-10-05']})).status,400);
assert.equal((await api('schedule',{action:'save',id:original.id,version:1,entry:{...shift,notes:'Updated instructions'}})).status,200);
assert.equal((await api('schedule',{action:'save',id:original.id,version:1,entry:shift})).status,409);
assert.equal((await api('schedule',{action:'delete',id:original.id,version:1})).status,409);
assert.equal((await api('schedule',{action:'save',entry:{...shift,kind:'leave',projectId:'',leaveType:'Annual leave'}})).status,200);
assert.equal((await api('workspace-register?kind=time')).data.rows.length,0); // plans never become timesheets
assert.equal((await api('schedule',{action:'delete',id:original.id,version:2})).status,200);
assert.equal((await api('schedule?week=2026-09-30',null,field)).data.entries[0].kind,'leave');
console.log('PASS: weekly CRUD, copying into future weeks, leave, unassigned work, persistence, stale-write protection, origin validation, company isolation, own-only staff access and separation from payroll timesheets.');
