import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import ts from 'typescript';import {DatabaseSync} from 'node:sqlite';
const root=path.resolve('.sites-runtime/po-qa');await fs.mkdir(root,{recursive:true});const db=new DatabaseSync(':memory:');for(const f of (await fs.readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(await fs.readFile('drizzle/'+f,'utf8'));
for(const [id,po] of [['p1','PO-JOB-001'],['p2','']])db.prepare('INSERT INTO projects(id,owner,name,purchase_order_number,created) VALUES(?,?,?,?,?)').run(id,'owner','Test project',po,new Date().toISOString());
globalThis.__poDb = {
 prepare(sql) {
  return { bind(...args) {
   return {
    async first() { return db.prepare(sql).get(...args); },
    async all() { return { results: db.prepare(sql).all(...args) }; },
    async run() { return { meta: { changes: Number(db.prepare(sql).run(...args).changes) } }; }
   };
  } };
 }
};
await fs.writeFile(root+'/stubs.mjs',`export const readPayrollConfig=async()=>null,timePayrollFields=async()=>({});export const NextResponse={json:(data,o)=>new Response(JSON.stringify(data),{status:o?.status||200})};export const getChatGPTUser=async()=>({email:'tester@example.com'});export const getCompanyAccess=async()=>({owner:'owner'});export const companyDb=()=>globalThis.__poDb;export const canAccess=()=>true;`);
let src=await fs.readFile('app/api/workspace-register/route.ts','utf8');src=src.replace(/from '(?:@\/app\/[^']+|next\/server)'/g,"from './stubs.mjs'");await fs.writeFile(root+'/route.mjs',ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText);const {POST,GET}=await import(root+'/route.mjs');
const input={kind:'purchase-order',projectId:'p1',status:'Draft',data:{number:'PO-JOB-001',date:'2026-10-03',supplier:'Supplier',items:[{description:'Cable',quantity:2,rate:10}]}};const post=b=>POST({json:async()=>b});assert.equal((await post({...input,projectId:'p2'})).status,400);assert.equal((await post({...input,data:{...input.data,number:'PO-WRONG'}})).status,409);const saved=await post(input);assert.equal(saved.status,200);const {id}=await saved.json();assert.equal(JSON.parse(db.prepare('SELECT data FROM records WHERE id=?').get(id).data).number,'PO-JOB-001');db.prepare("UPDATE projects SET purchase_order_number='PO-UPDATED' WHERE id='p1'").run();assert.equal((await post({...input,id,version:1})).status,200);assert.equal(JSON.parse(db.prepare('SELECT data FROM records WHERE id=?').get(id).data).number,'PO-JOB-001');const listed=await GET({nextUrl:new URL('https://example.com/api/workspace-register?kind=purchase-order')});assert.equal((await listed.json()).projects.find(p=>p.id==='p1').purchaseOrderNumber,'PO-UPDATED');console.log('PASS: new orders use project PO, missing/stale references are blocked, and existing order numbers remain unchanged.');
