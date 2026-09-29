// Local-only integration tests. Run after applying migrations and starting the local preview on 8787.
import assert from 'node:assert/strict';
const owner='payroll-'+Date.now();
async function api(path,body,user=owner){const r=await fetch('http://127.0.0.1:8787/api/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}
const employee={id:crypto.randomUUID(),name:'Robert',aliases:['Rob','Robert']};const config={frequency:'fortnightly',anchor:'2026-09-28',employees:[employee]};
assert.equal((await api('payroll')).data.connection.status,'Not connected');
assert.equal((await api('payroll',{action:'configure',config,version:0})).status,200);
assert.equal((await api('payroll',{action:'configure',config,version:0})).status,409);
const p=(await api('data',{action:'project',name:'Payroll regression',contract:10000})).data.id;
const createTime=async(data)=>api('data',{action:'record',kind:'time',projectId:p,title:'Time',data});
const a=(await createTime({employee:'Rob',date:'2026-09-28',hours:7.6,rate:90})).data.id;
let view=(await api('payroll?date=2026-10-01')).data;assert.equal(view.period.start,'2026-09-28');assert.equal(view.period.end,'2026-10-11');assert.equal(view.canApprove,false);assert.equal(view.lines[0].employeeId,employee.id);assert(view.issues.some(x=>x.includes('category')));
async function action(action,view,date='2026-10-01'){return api('payroll',{action,date,fingerprint:view.fingerprint,version:view.reviewVersion})}
assert.equal((await action('approve',view)).status,400);
let line=view.lines[0];assert.equal((await api('workspace-register',{kind:'time',id:a,projectId:p,version:0,data:{...line.data,staffId:employee.id,payCategory:'ordinary'}})).status,200);
const b=(await createTime({employee:'Robert',staffId:employee.id,payCategory:'overtime-1.5',date:'2026-10-08',hours:2,rate:90})).data.id;
view=(await api('payroll?date=2026-10-01')).data;assert.equal(view.totalHours,9.6);assert.equal(view.canApprove,true);
assert.equal((await action('approve',view)).status,200);
let approved=(await api('payroll?date=2026-10-01')).data;assert.equal(approved.status,'Approved');assert.equal(approved.syncStatus,'Not sent');assert.equal(approved.approval.actor,owner+'@example.test');assert.equal(approved.approval.lines.length,2);assert(!('rate' in approved.approval.lines[0]));
assert.equal((await action('approve',approved)).status,200);assert.equal((await api('payroll')).data.history.length,1); // idempotent approval
assert.equal((await api('payroll',{action:'send'})).status,409);assert.equal((await api('payroll',{action:'connect'})).status,409);
line=approved.lines.find(l=>l.id===a);assert.equal((await api('workspace-register',{kind:'time',id:a,projectId:p,version:line.data.version,data:{...line.data,hours:6}})).status,200);
assert.equal((await action('approve',approved)).status,409);view=(await api('payroll?date=2026-10-01')).data;assert.equal(view.status,'Changed since approval');assert.equal(view.totalHours,8);
const concurrent=await Promise.all([action('approve',view),action('approve',view)]);assert(concurrent.some(r=>r.status===200));assert(concurrent.every(r=>[200,409].includes(r.status)));assert.equal((await api('payroll')).data.history.length,1);
approved=(await api('payroll?date=2026-10-01')).data;assert.equal((await action('reopen',approved)).status,200);assert.equal((await api('payroll?date=2026-10-01')).data.status,'Needs review');
const before=(await api('budget?project='+p)).data;assert.equal(before.labour,720); // project rates remain intact
assert.equal((await api('payroll?date=2026-09-27')).data.period.start,'2026-09-14');assert.equal((await api('payroll?date=2026-02-30')).status,400);
assert.equal((await api('payroll?date=2026-10-01',undefined,owner+'other')).data.lines.length,0);
assert.equal((await api('payroll',{action:'configure',version:1,config:{...config,employees:[employee,{id:crypto.randomUUID(),name:'Rob',aliases:[]}]}})).status,400);
assert.equal((await api('payroll',{action:'configure',version:1,config:{...config,employees:[]}})).status,400);
const member=owner+'member';const token=(await api('company',{action:'add',name:'Worker',email:member+'@example.test',permissions:{Time:{view:true,edit:true}}})).data.token;await api('company',{action:'accept',token},member);
assert.equal((await api('payroll',undefined,member)).status,403);assert.equal((await api('payroll',{action:'configure',config,version:1},member)).status,403);assert.equal((await api('workspace-register?kind=time',undefined,member)).data.payrollEmployees[0].id,employee.id);
assert.equal((await createTime({employee:'Rob',date:'2026-10-01',hours:3,rate:90,staffId:'other-company',payCategory:'ordinary'})).status,400);
assert.equal((await createTime({employee:'Rob',date:'2026-10-01',hours:3,rate:90,payCategory:'bogus'})).status,400);
console.log('PASS: persisted setup, fortnight boundaries, legacy-name mapping, classification, approvals and audit, changed-hour invalidation, idempotent/concurrent approvals, no live send, stable employee validation, unchanged costing and administrator/company isolation.');
