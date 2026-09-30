import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const base='http://127.0.0.1:8787',owner='purge-test-'+Date.now(),other=owner+'-other';
async function api(path,body,user='operator'){const r=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{origin:base,'content-type':'application/json','oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}
async function ok(path,b,u){const r=await api(path,b,u);assert.equal(r.status,200,JSON.stringify(r));return r.data}
const sql=(command)=>execFileSync(process.execPath,['--import','./scripts/sites-env.mjs','node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',command],{stdio:'pipe'});
for(const u of [owner,other])await ok('data',null,u);
const project=(await ok('data',{action:'project',name:'Delete fixture'},owner)).id;
const f=new FormData();f.set('file',new Blob(['fixture']),'fixture.txt');f.set('category','files');f.set('projectId',project);
const up=await fetch(base+'/api/upload',{method:'POST',headers:{'oai-authenticated-user-id':owner,'oai-authenticated-user-email':owner+'@example.test'},body:f});assert.equal(up.status,200);const file=(await up.json()).id;
const ticket=crypto.randomUUID();await ok('feedback',{action:'submit',id:ticket,type:'Question',subject:'Delete fixture',message:'Test deletion',section:'Dashboard'},owner);
await ok('admin-controls',{action:'notice',owner,id:crypto.randomUUID(),subject:'Test notice',body:'Test deletion record'});
await ok('admin-controls',{action:'delete-request',owner,reason:'Local purge test',confirmation:'DELETE '+owner});
sql(`UPDATE deletion_requests SET eligible='2000-01-01T00:00:00.000Z' WHERE owner='${owner}'`);
await ok('admin-controls',{action:'delete-purge',owner,confirmation:'DELETE '+owner});
const d=await ok('admin-controls?view=detail&owner='+owner);assert.equal(d.deletion.status,'Purged');assert.equal(d.usage.projects,0);assert.equal(d.usage.bytes,0);assert.equal(d.members.length,0);assert.equal(d.messages.length,0);assert.equal(d.tickets.length,0);
assert.equal((await api('data',null,owner)).status,403);await ok('data',null,other);
const a=await ok('admin?view=account&owner='+owner);assert.equal((await api('admin',{action:'account-status',owner,version:a.account.version,status:'Active',reason:'Prevent restoring purged data'})).status,409);
assert.equal((await api('admin-controls?view=file&owner='+owner+'&id='+file)).status,404);
console.log('PASS: eligible local purge removes records, files, messages and feedback; tombstone blocks reactivation; other company remains accessible.');
