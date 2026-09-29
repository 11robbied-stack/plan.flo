// Run against a local preview with an isolated test account. Never targets production.
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const statuses=moduleUrl(readFileSync('app/variation-status.ts','utf8'));
const {calculateBudget}=await import(moduleUrl(readFileSync('app/budget-math.ts','utf8').replace("'./variation-status'",JSON.stringify(statuses))));
const row=(status,amount)=>({id:status,kind:'variation',title:status,status,data:JSON.stringify({amount}),created:''});
let b=calculateBudget({contract:1000,budgetHours:0},[row('Submitted',20),row('Under review',30),row('Invoiced',100),row('Draft',300),row('Rejected',400)]);
assert.equal(b.approvedVariations,100);assert.equal(b.pendingVariations,50);assert.equal(b.revisedContract,1100);
const owner='variation-test-'+Date.now();
async function api(path,body,user=owner){const r=await fetch('http://127.0.0.1:8787/api/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}
const p=(await api('data',{action:'project',name:'Variation regression',contract:10000})).data.id;assert(p);
async function create(status,amount){const r=await api('data',{action:'record',projectId:p,kind:'variation',title:'Additional work',status,data:{items:[{item:'Extra outlets',quantity:'3',rate:String(amount/3)}]}});assert.equal(r.status,200);return r.data.id}
const id=await create('Draft',300);await create('Pending',600);await create('Rejected',900);
await api('data',{action:'record',projectId:p,kind:'time',title:'Labour',data:{hours:2,rate:50}});
await api('data',{action:'record',projectId:p,kind:'cost',title:'Material',data:{amount:250}});
const budget=async()=>{const r=await api('budget?project='+p);assert.equal(r.status,200);return r.data};
b=await budget();assert.equal(b.revisedContract,10000);assert.equal(b.pendingVariations,600);assert.equal(b.totalCost,350);
async function current(){const r=(await api('data?project='+p)).data.records.find(x=>x.id===id);return {...r,data:JSON.parse(r.data)}}
async function update(status,data,user=owner){return api('data',{action:'recordUpdate',id,projectId:p,title:'Additional work',status,data},user)}
let r=await current();const original=r.data;
assert.equal((await update('Approved',{...r.data,amount:999999,approvedBy:'spoof'})).status,200);
r=await current();assert.equal(r.data.amount,300);assert.equal(r.data.approvedBy,owner+'@example.test');assert(r.data.approvedAt);
b=await budget();assert.equal(b.contract,10000);assert.equal(b.approvedVariations,300);assert.equal(b.revisedContract,10300);assert.equal(b.totalCost,350);
assert.equal((await update('Approved',original)).status,409); // stale approval cannot overwrite newer data
assert.equal((await update('Approved',r.data)).status,200);b=await budget();assert.equal(b.approvedVariations,300); // no double counting
for(const status of ['Draft','Pending','Rejected','Approved']){r=await current();assert.equal((await update(status,r.data)).status,200);b=await budget();assert.equal(b.revisedContract,status==='Approved'?10300:10000)}
r=await current();const concurrent=await Promise.all([update('Pending',r.data),update('Rejected',r.data)]);assert.deepEqual(concurrent.map(x=>x.status).sort(),[200,409]);
r=await current();assert.equal((await update('Banana',r.data)).status,400);assert.equal((await update('Approved',{...r.data,items:[{quantity:-1,rate:10}]})).status,400);assert.equal((await update('Approved',r.data,owner+'other')).status,403);
assert.equal((await api('data',{action:'recordStatus',projectId:p,id,status:'Approved'})).status,400);
const member=owner+'member';const invite=(await api('company',{action:'add',name:'Viewer',email:member+'@example.test',permissions:{Variations:{view:true,edit:false}}})).data.token;assert(invite);await api('company',{action:'accept',token:invite},member);assert.equal((await update('Approved',r.data,member)).status,403);
console.log('PASS: legacy statuses, approval/reversal, GST-exclusive totals, unchanged actual costs, no double counting, derived amounts, actor audit, stale/concurrent write protection, status validation, company isolation and read-only access.');
