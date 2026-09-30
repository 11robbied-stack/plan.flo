// Local integration tests: run against the built worker with local migrations applied.
import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787',owner='billing-test-'+Date.now();
async function api(path,body,user=owner,origin=base){const r=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(origin?{origin}:{}),...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}
assert.equal((await api('billing',null,'')).status,401);
let r=await api('billing');assert.equal(r.status,200);assert.equal(r.data.configured,false);assert.deepEqual(r.data.usage,{office:1,field:0});
const selection={plan:'pro',cycle:'annual',office:2,field:3};
r=await api('billing',{action:'save-selection',selection});assert.equal(r.status,200);assert.equal(r.data.totals.total,3280);assert.equal((await api('billing')).data.selection.office,2);
assert.equal((await api('billing',null,owner+'other')).data.selection,null);
assert.equal((await api('billing',{action:'save-selection',selection:{...selection,office:-1}})).status,400);
assert.equal((await api('billing',{action:'save-selection',selection},owner,'https://other.example')).status,403);
assert.equal((await api('billing',{action:'checkout',selection})).status,503);
const field=owner+'field';r=await api('company',{action:'add',name:'Field worker',email:field+'@example.test',seatType:'field',role:'admin',permissions:{Costs:{view:true,edit:true},Drawings:{view:true,edit:true}}});assert.equal(r.status,200);const token=r.data.token;assert(token);
r=await api('company');const member=r.data.members.find(m=>m.email===field+'@example.test');assert.equal(member.seatType,'field');assert.equal(member.role,'member');assert.equal(JSON.parse(member.permissions).Costs.view,false);
assert.deepEqual((await api('billing')).data.usage,{office:1,field:1});
assert.equal((await api('company',{action:'accept',token},field)).status,200);
assert.equal((await api('billing',null,field)).status,403);assert.equal((await api('billing',{action:'save-selection',selection},field)).status,403);
r=await api('company',null,field);assert.equal(r.data.access.role,'member');assert.equal(r.data.access.permissions.Drawings.view,true);assert.equal(r.data.access.permissions.Costs.view,false);
assert.equal((await api('company',{action:'update',id:member.id,name:'Office worker',seatType:'office',role:'member',permissions:{Costs:{view:true,edit:true}}})).status,200);
assert.deepEqual((await api('billing')).data.usage,{office:2,field:0});
assert.equal((await api('company',{action:'disable',id:member.id})).status,200);assert.deepEqual((await api('billing')).data.usage,{office:1,field:0});
console.log('PASS: selections persist and isolate companies; invalid inputs/origins rejected; checkout remains gated; office/field types persist, constrain access and update usage.');
