import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787',suffix=Date.now(),owner='customer-'+suffix,worker=owner+'-worker',operator='operator',other='other-'+suffix;
async function api(path,body,user=operator,origin=base){const r=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',origin,...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'}:{})},body:body?JSON.stringify(body):undefined});const text=await r.text();return {status:r.status,data:text?JSON.parse(text):null}}
const admin=(body)=>api('admin',body);
assert.equal((await api('admin?view=overview',null,'')).status,403);
assert.equal((await api('data',null,owner)).status,200);
assert.equal((await api('admin?view=accounts',null,owner)).status,403);
assert.equal((await api('admin',{action:'account-status',owner,status:'Closed',version:1,reason:'Not allowed'},owner)).status,403);
const project=(await api('data',{action:'project',name:'Admin integration project'},owner)).data.id;assert(project);
const token=(await api('company',{action:'add',name:'Company admin',email:worker+'@example.test',role:'admin',seatType:'office',permissions:{}},owner)).data.token;assert(token);
assert.equal((await api('company',{action:'accept',token},worker)).status,200);
assert.equal((await api('data',null,worker)).status,200);
assert.equal((await api('admin?view=users',null,worker)).status,403);
assert.equal((await api('admin',{action:'user-status',id:owner,status:'Suspended',reason:'Wrong origin',version:1},operator,'https://wrong.example')).status,403);
let account=(await api('admin?view=account&owner='+owner)).data;assert.equal(account.account.status,'Active');assert.equal(account.users.length,2);assert.equal(account.members.length,1);assert(!JSON.stringify(account).includes('token_hash'));
assert.equal((await admin({action:'account-profile',owner,version:account.account.version,company:'Customer Test',email:'contact@example.test',phone:'123',address:'Test address',abn:'123'})).status,200);
account=(await api('admin?view=account&owner='+owner)).data;assert.equal(account.company.company,'Customer Test');
assert.equal((await api('usage',{section:'Dashboard'},owner)).status,204);assert.equal((await api('usage',{section:'Not a section'},owner)).status,400);
const ticketId=crypto.randomUUID();assert.equal((await api('feedback',{action:'submit',id:ticketId,type:'Problem',impact:'Blocking work',subject:'Test upload issue',message:'Unable to upload a drawing',section:'Time Sheets'},owner)).status,200);
let ticket=(await api('admin?view=ticket&id='+ticketId)).data;assert.equal(ticket.ticket.priority,'Urgent');assert.equal(ticket.ticket.category,'Bug');
assert.equal((await admin({action:'ticket',id:ticketId,version:ticket.ticket.version,status:'Reviewing',priority:'High',category:'Bug',assignee:'operator@example.test',note:'Internal diagnostic detail'})).status,200);
assert.equal((await admin({action:'ticket',id:ticketId,version:ticket.ticket.version,status:'Closed',priority:'Low',category:'Bug',assignee:'',note:'Must not be saved'})).status,409);
ticket=(await api('admin?view=ticket&id='+ticketId)).data;assert.equal(ticket.notes.length,1);assert.equal(ticket.ticket.status,'Reviewing');assert.equal(ticket.ticket.assignee,'operator@example.test');
const customerInbox=(await api('feedback',null,owner)).data;assert(!JSON.stringify(customerInbox).includes('Internal diagnostic detail'));assert(customerInbox.items.some(t=>t.id===ticketId));assert(!(await api('feedback',null,other)).data.items.some(t=>t.id===ticketId));
const member=account.members[0];const previous=JSON.stringify({status:member.status,role:member.role,seatType:member.seat_type,permissions:member.permissions});
assert.equal((await admin({action:'member',owner,id:member.id,previous,role:'member',seatType:'field',status:'active',permissions:{Time:{view:true,edit:true},Costs:{view:true,edit:true}}})).status,200);
assert.equal((await admin({action:'member',owner,id:member.id,previous,role:'admin',seatType:'office',status:'active',permissions:{}})).status,409);
const workerAccess=(await api('data',null,worker)).data.access;assert.equal(workerAccess.role,'member');assert.equal(workerAccess.permissions.Time.view,true);assert.equal(workerAccess.permissions.Costs.view,false);
let user=(await api('admin?view=account&owner='+owner)).data.users.find(u=>u.id===worker);
assert.equal((await admin({action:'user-status',id:worker,version:user.version,status:'Suspended',reason:'Support investigation'})).status,200);
assert.equal((await api('data',null,worker)).status,403);assert.equal((await api('data',null,owner)).status,200);
assert.equal((await admin({action:'user-status',id:worker,version:user.version,status:'Active',reason:'Stale write attempt'})).status,409);
user=(await api('admin?view=account&owner='+owner)).data.users.find(u=>u.id===worker);assert.equal((await admin({action:'user-status',id:worker,version:user.version,status:'Active',reason:'Investigation completed'})).status,200);
for(const status of ['Suspended','Closed']){account=(await api('admin?view=account&owner='+owner)).data;assert.equal((await admin({action:'account-status',owner,version:account.account.version,status,reason:'Account control test'})).status,200);for(const person of [owner,worker])for(const path of ['data','company','feedback','app-settings','schedule?week=2026-09-30'])assert.equal((await api(path,null,person)).status,403,`${person} ${path} should be blocked`);assert.equal((await api('usage',{section:'Dashboard'},owner)).status,403);assert.equal((await api('data',{action:'project',name:'Blocked'},owner)).status,403)}
account=(await api('admin?view=account&owner='+owner)).data;assert.equal((await admin({action:'account-status',owner,version:account.account.version,status:'Active',reason:'Restore customer access'})).status,200);assert.equal((await api('data',null,owner)).status,200);assert.equal((await api('data',null,worker)).status,200);
const own=(await api('admin?view=account&owner='+operator)).data;assert(own.protected);assert.equal((await admin({action:'account-status',owner:operator,version:own.account.version,status:'Closed',reason:'Cannot lock out operator'})).status,400);assert.equal((await admin({action:'user-status',id:operator,version:1,status:'Suspended',reason:'Cannot lock out operator'})).status,400);
for(const view of ['overview','accounts','users','tickets','audit'])assert.equal((await api('admin?view='+view)).status,200,view);
const overview=(await api('admin?view=overview')).data;assert(overview.activity.some(d=>d.views>0));assert(overview.counts.users>=3);
const history=(await api('admin?view=account&owner='+owner)).data.history;assert.equal(history.filter(h=>h.action==='ticket-update').length,1);assert.equal(history.filter(h=>h.action==='user-status').length,2);assert.equal(history.filter(h=>h.action==='member-access').length,1);
// Concurrent writes must produce one winner and one internal note only.
const raceId=crypto.randomUUID();await api('feedback',{action:'submit',id:raceId,type:'Problem',impact:'Blocking work',subject:'Concurrent ticket',message:'Race check',section:'Dashboard'},owner);
const race=(await api('admin?view=ticket&id='+raceId)).data.ticket;
const edits=await Promise.all(['First note','Second note'].map(note=>admin({action:'ticket',id:raceId,version:race.version,status:'Reviewing',priority:'High',category:'Bug',assignee:'',note})));
assert.deepEqual(edits.map(r=>r.status).sort(),[200,409]);assert.equal((await api('admin?view=ticket&id='+raceId)).data.notes.length,1);
for(const user of [operator,owner]){const response=await fetch(base+'/admin',{headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'}});const html=await response.text();assert.equal(response.status,200);assert(html.includes(user===operator?'Support tickets':'reserved for PLAN.FLO'));}
console.log('PASS: platform-only access; origin protection; company and user lifecycle; data/API blocking; restoration; operator lockout protection; member permissions; stale writes; ticket routing; private notes; audit integrity; usage analytics.');
