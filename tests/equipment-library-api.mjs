import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787',owner='equipment-'+Date.now(),other=owner+'-other';
async function call(path,body,user=owner){const r=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{origin:base,'content-type':'application/json','oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}
async function ok(path,body,user){const r=await call(path,body,user);assert.equal(r.status,200,JSON.stringify(r));return r.data}
await ok('data');await ok('data',null,other);
const p=(await ok('data',{action:'project',name:'Equipment library test'})).id;
const p2=(await ok('data',{action:'project',name:'Second equipment job'})).id;
const foreign=(await ok('data',{action:'project',name:'Other company'},other)).id;
const machine=(await ok('equipment',{kind:'ewp-template',title:'Scissor SL01',data:{equipmentType:'scissor-lift',assetId:'SL01',make:'Genie',model:'GS1932',serial:'serial',checks:[{label:'Check controls',result:'Satisfactory'}]}})).id;
const list=async(projectId=p,user=owner)=>(await ok('equipment?kind=ewp&projectId='+projectId,null,user)).items;
assert.equal((await list()).find(x=>x.id===machine).data.checks[0].result,'Not checked');
await ok('equipment',{action:'assign',projectId:p,templateId:machine});await ok('equipment',{action:'assign',projectId:p,templateId:machine});
assert.equal((await list()).filter(x=>x.kind==='ewp-assignment').length,1);
await ok('equipment',{action:'assign',projectId:p2,templateId:machine});assert.equal((await list(p2)).filter(x=>x.kind==='ewp-assignment').length,1);
assert.equal((await call('equipment',{action:'assign',projectId:foreign,templateId:machine},other)).status,404);
assert.equal((await call('equipment',{action:'assign',projectId:foreign,templateId:machine})).status,404);
const check=(await ok('equipment',{kind:'ewp',projectId:p,title:'Scissor SL01',data:{templateId:machine,equipmentType:'scissor-lift',assetId:'SL01',operator:'Test operator',date:'2026-09-30',checks:[{label:'Check controls',result:'Satisfactory'}]},signOff:true,confirmed:true,signature:'Test operator'})).id;
await ok('equipment',{action:'unassign',projectId:p,templateId:machine});const after=await list();assert.equal(after.filter(x=>x.kind==='ewp-assignment').length,0);assert(after.find(x=>x.id===check).data.signedAt);assert(after.find(x=>x.id===machine));
assert.equal((await call('equipment',{kind:'ewp',id:check,projectId:p,title:'Altered',data:{}})).status,409);
assert.equal((await list(foreign,other)).length,0);
console.log('PASS: saved equipment reuse across projects; idempotent assignment; company isolation; retained signed history; locked sign-offs.');
