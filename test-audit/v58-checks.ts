import {NextRequest} from 'next/server';
import * as invoice from '../app/api/supplier-invoices/route';
import * as gmail from '../app/api/gmail/route';
import * as gmailCallback from '../app/api/gmail/callback/route';
import * as register from '../app/api/workspace-register/route';
import * as data from '../app/api/data/route';
import * as file from '../app/api/file/[id]/route';
export async function v58Checks({sql,objects,check,req,json}:any){
 const now=new Date().toISOString(),saved=(globalThis as any).__testHeaders;
 const who=(id:string|null)=>(globalThis as any).__testHeaders=new Headers(id?{'oai-authenticated-user-id':id,'oai-authenticated-user-email':id+'@example.test'}:{});
 const perms=JSON.stringify(Object.fromEntries(['Costs','Project Setup','Purchase Orders'].map(k=>[k,{view:true,edit:true}])));
 for(const [id,owner] of [['va1','va'],['va2','va'],['vb1','vb']])sql.prepare('INSERT INTO projects(id,owner,name,created) VALUES(?,?,?,?)').run(id,owner,id,now);
 sql.prepare("INSERT INTO company_members(id,owner,email,name,user_id,role,seat_type,permissions,status,created) VALUES('vm','va','vm@example.test','Fixture','vm','member','office',?,'active',?)").run(perms,now);
 sql.prepare("INSERT INTO project_members(owner,project_id,member_id) VALUES('va','va1','vm')").run();
 for(const [id,owner,project] of [['vi1','va','va1'],['vi2','va','va2'],['vi0','va',''],['vib','vb','vb1']]){
  sql.prepare("INSERT INTO files(id,owner,project_id,category,name,mime,size,created) VALUES(?,?,?,'invoice','synthetic.pdf','application/pdf',4,?)").run('f-'+id,owner,project,now);objects.set(owner+'/f-'+id,new TextEncoder().encode('%PDF'));
  sql.prepare("INSERT INTO supplier_invoices(id,owner,project_id,source_key,mailbox,message_id,data,file_id,created) VALUES(?,?,?,?,?,?,?,?,?)").run(id,owner,project,id,'synthetic@example.test','synthetic-message',JSON.stringify({amount:100,supplier:'Synthetic',references:[]}), 'f-'+id,now);
 }
 const invGet=(q='')=>invoice.GET(req('/api/supplier-invoices'+q));
 const invPost=(body:any)=>invoice.POST(req('/api/supplier-invoices',body));
 const download=(id:string)=>file.GET(req('/api/file/f-'+id),{params:Promise.resolve({id:'f-'+id})});
 who(null);check('v58 anonymous invoice and Gmail denied',(await invGet()).status===403&&(await gmail.GET()).status===403,{});
 who('vm');const list=await json(await invGet());check('v58 member list filters projects and invoices before pagination',list.status===200&&list.body.items.length===1&&list.body.items[0].id==='vi1'&&list.body.projects.length===1&&list.body.projects[0].id==='va1',{});
 for(const id of ['vi2','vi0','vib']){check('v58 member cannot inspect '+id,(await invGet('?id='+id)).status===404,{});check('v58 member cannot download '+id,(await download(id)).status===404,{});check('v58 member cannot ignore '+id,(await invPost({id,version:1,action:'ignore'})).status===404,{})}
 check('v58 member can inspect and download assigned invoice',(await invGet('?id=vi1')).status===200&&(await download('vi1')).status===200,{});
 check('v58 forbidden project query denied',(await invGet('?project=va2')).status===404,{});
 check('v58 member cannot move invoice to unassigned project',(await invPost({id:'vi1',version:1,action:'assign',projectId:'va2'})).status===400,{});
 for(const action of ['connect','sync','enable','disconnect'])check('v58 member cannot '+action+' company mailbox',(await gmail.POST(req('/api/gmail',{action,enabled:true}))).status===403,{});
 check('v58 member OAuth callback denied',(await gmailCallback.GET(req('/api/gmail/callback?code=synthetic&state=synthetic'))).status===403,{});
 sql.prepare("UPDATE company_members SET permissions='{}' WHERE id='vm'").run();check('v58 Costs permission required',(await invGet()).status===403,{});sql.prepare('UPDATE company_members SET permissions=? WHERE id=?').run(perms,'vm');
 sql.prepare("UPDATE company_members SET status='disabled' WHERE id='vm'").run();check('v58 disabled member invoice access denied',(await invGet()).status===403,{});sql.prepare("UPDATE company_members SET status='active' WHERE id='vm'").run();
 who('va');check('v58 administrator can inspect unassigned inbox attachment',(await invGet('?id=vi0')).status===200&&(await download('vi0')).status===200,{});
 check('v58 owner cannot inspect other company invoice',(await invGet('?id=vib')).status===404,{});
 for(const route of [invoice,gmail])for(const origin of [null,'https://evil.example','http://sibling.localhost:5199']){const h:any={'content-type':'application/json'};if(origin)h.origin=origin;check('v58 '+(route===invoice?'invoice':'gmail')+' rejects mutation origin '+origin,(await route.POST(new NextRequest('http://localhost:5199/api/test',{method:'POST',headers:h,body:JSON.stringify({id:'vi0',version:1,action:'ignore'})}))).status===403,{})}
 check('v58 Gmail inactive without credentials',(await json(await gmail.GET())).body.ready===false,{});
 check('v58 missing Gmail credentials fail without outbound request',(await gmail.POST(req('/api/gmail',{action:'connect'}))).status===400,{});
 check('v58 invoice assignment succeeds',(await invPost({id:'vi0',version:1,action:'assign',projectId:'va1'})).status===200,{});
 check('v58 assignment moves invoice attachment atomically',sql.prepare("SELECT project_id FROM files WHERE id='f-vi0'").get().project_id==='va1',{});
 who('vm');check('v58 assignment grants attachment only with assigned project',(await download('vi0')).status===200,{});
 const approval={id:'vi0',version:2,action:'approve',projectId:'va1',supplier:'Synthetic',invoiceNumber:'TEST-001',date:'2026-10-03',amount:100,confirmed:true};
 check('v58 explicit review confirmation required',(await invPost({...approval,confirmed:false})).status===400,{});
 check('v58 invoice approval creates expense',(await invPost(approval)).status===200,{});
 check('v58 repeated invoice approval cannot duplicate expense',(await invPost(approval)).status===409&&sql.prepare("SELECT COUNT(*) AS n FROM records WHERE id='invoice-vi0'").get().n===1,{});
 who('va');check('v58 moving invoice removes old project file access',(await invPost({id:'vi1',version:1,action:'assign',projectId:'va2'})).status===200,{});who('vm');check('v58 former project reader loses moved invoice and file',(await invGet('?id=vi1')).status===404&&(await download('vi1')).status===404,{});
 who('va');const po={kind:'purchase-order',projectId:'va1',status:'Draft',data:{number:'PO-TEST-001',date:'2026-10-03',supplier:'Synthetic',items:[{description:'Cable',quantity:1,rate:10}]}};
 check('v58 purchase order blocked without saved project number',(await register.POST(req('/api/workspace-register',po))).status===400,{});
 check('v58 save Project Setup PO reference',(await data.POST(req('/api/data',{action:'projectSetup',projectId:'va1',data:{name:'va1',purchaseOrderNumber:'PO-TEST-001'}}))).status===200,{});
 check('v58 stale PO number rejected',(await register.POST(req('/api/workspace-register',{...po,data:{...po.data,number:'PO-STALE'}}))).status===409,{});
 const created=await json(await register.POST(req('/api/workspace-register',po)));check('v58 new order uses saved project number',created.status===200&&JSON.parse(sql.prepare('SELECT data FROM records WHERE id=?').get(created.body.id).data).number==='PO-TEST-001',{});
 await data.POST(req('/api/data',{action:'projectSetup',projectId:'va1',data:{name:'va1',purchaseOrderNumber:'PO-TEST-002'}}));
 check('v58 existing order retains original number',(await register.POST(req('/api/workspace-register',{...po,id:created.body.id,version:1}))).status===200&&JSON.parse(sql.prepare('SELECT data FROM records WHERE id=?').get(created.body.id).data).number==='PO-TEST-001',{});
 check('v58 duplicate company PO references blocked',(await data.POST(req('/api/data',{action:'projectSetup',projectId:'va2',data:{name:'va2',purchaseOrderNumber:'PO-TEST-002'}}))).status===409,{});
 who('vm');check('v58 PO API still rejects unassigned project',(await register.POST(req('/api/workspace-register',{...po,projectId:'va2'}))).status===404,{});
 let blocked=false;try{sql.prepare("UPDATE supplier_invoices SET project_id='vb1' WHERE id='vi2'").run()}catch{blocked=true}check('v58 database blocks cross-company invoice project',blocked,{});
 blocked=false;try{sql.prepare("UPDATE supplier_invoices SET file_id='f-vib' WHERE id='vi2'").run()}catch{blocked=true}check('v58 database blocks cross-company invoice attachment',blocked,{});
 (globalThis as any).__testHeaders=saved;
}
