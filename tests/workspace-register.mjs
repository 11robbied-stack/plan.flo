import assert from 'node:assert/strict';
const owner='register-'+Date.now();
async function api(path,body,user=owner){const r=await fetch('http://127.0.0.1:8787/api/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}
const p=(await api('data',{action:'project',name:'Register test',contract:10000})).data.id;
const time={kind:'time',projectId:p,data:{date:'2026-09-30',employee:'Sam',hours:8,rate:50,package:'Lighting'}};
let r=await api('workspace-register',time);assert.equal(r.status,200);const id=r.data.id;
assert.equal((await api('budget?project='+p)).data.labour,400);
let rows=(await api('workspace-register?kind=time')).data.rows;assert.equal(rows.length,1);assert.equal(rows[0].id,id);
assert.equal((await api('workspace-register',{...time,id,version:1,data:{...time.data,hours:6}})).status,200);
assert.equal((await api('budget?project='+p)).data.labour,300);
assert.equal((await api('data?project='+p)).data.records.filter(x=>x.kind==='time').length,1);
assert.equal((await api('workspace-register',{...time,id,version:1})).status,409);
assert.equal((await api('workspace-register',{...time,data:{...time.data,hours:25}})).status,400);
assert.equal((await api('workspace-register',{...time,data:{...time.data,date:'2026-02-30'}})).status,400);
const order={kind:'purchase-order',projectId:p,status:'Draft',data:{date:'2026-09-30',supplier:'Test supplier',items:[{description:'Cable',quantity:3,rate:12.345}],amount:900}};
r=await api('workspace-register',order);assert.equal(r.status,200);const po=r.data.id;
rows=(await api('workspace-register?kind=purchase-order')).data.rows;assert.equal(rows.length,1);assert.equal(rows[0].data.amount,37.04);assert(rows[0].data.number.startsWith('PO-'));
for(const status of ['Issued','Received','Cancelled']){const current=(await api('workspace-register?kind=purchase-order')).data.rows[0];assert.equal((await api('workspace-register',{...order,id:po,status,version:current.data.version})).status,200)}
assert.equal((await api('budget?project='+p)).data.totalCost,300);
assert.equal((await api('workspace-register',{...order,status:'Invalid'})).status,400);
assert.equal((await api('workspace-register',order,owner+'other')).status,404);
assert.equal((await api('workspace-register?kind=purchase-order',undefined,owner+'other')).data.rows.length,0);
const member=owner+'member',token=(await api('company',{action:'add',name:'Read only',email:member+'@example.test',permissions:{Time:{view:true,edit:false},'Purchase Orders':{view:true,edit:false},Builders:{view:true,edit:false}}})).data.token;
await api('company',{action:'accept',token},member);
assert.equal((await api('workspace-register?kind=time',undefined,member)).data.rows.length,1);assert.equal((await api('workspace-register',time,member)).status,403);assert.equal((await api('workspace-register',order,member)).status,403);
console.log('PASS: shared time entries, labour totals, saved purchase orders, rounded item totals, status changes, no automatic expense duplication, stale update protection, validation, company isolation and read-only permissions.');
