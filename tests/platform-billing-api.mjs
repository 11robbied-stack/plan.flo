import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787',owner='platform-billing-'+Date.now();
async function api(path,body,user='operator'){const r=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',origin:base,...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}
assert.equal((await api('admin?view=billing',null,'')).status,403);assert.equal((await api('admin?view=billing',null,owner)).status,403);
await api('data',{action:'settings',company:owner,email:'billing@example.test'},owner);
const selection={plan:'pro',cycle:'annual',office:2,field:3};assert.equal((await api('billing',{action:'save-selection',selection},owner)).status,200);
let r=await api('admin?view=billing&q='+owner);assert.equal(r.status,200);assert.equal(r.data.mode,'not_connected');assert.equal(r.data.items.length,1);assert.equal(r.data.items[0].request.totals.total,3280);assert.equal(r.data.items[0].request.selection.office,2);assert.equal(r.data.items[0].customer_id,null);
r=await api('admin?view=billing-account&owner='+owner);assert.equal(r.status,200);assert.equal(r.data.company,owner);assert.deepEqual(r.data.invoices,[]);assert.deepEqual(r.data.subscriptions,[]);assert.equal(r.data.mode,'not_connected');assert(!JSON.stringify(r.data).includes('STRIPE_SECRET_KEY'));
assert.equal((await api('admin?view=billing-account&owner='+owner,null,owner)).status,403);
assert.equal((await api('admin?view=billing-account&owner=not-existing')).status,404);
assert.equal((await api('admin?view=billing-account&owner='+owner+'&status=failed')).status,400);
assert.equal((await api('admin?view=billing-account&owner='+owner+'&after=https://example.com')).status,400);
assert.equal((await api('admin?view=overview')).status,200);assert.equal((await api('admin?view=analytics')).status,200);
console.log('PASS: operator-only billing views, package/additional-seat totals, customer isolation, disconnected invoice state, filter validation, Overview and Analytics preserved.');
