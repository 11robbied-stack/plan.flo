import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787',owner='app-settings-test-'+Date.now();
async function api(path,body,user=owner,origin=base){const r=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',origin,...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}
assert.equal((await api('app-settings',null,'')).status,401);
let d=(await api('app-settings')).data;assert.equal(d.version,0);const initial=structuredClone(d.config);
const project=(await api('data',{action:'project',name:'Settings test project',contract:12345})).data.id;assert(project);
const task=(await api('data',{action:'record',projectId:project,kind:'task',title:'Saved task',status:'To Do',data:{due:'2026-01-01'}})).data.id;assert(task);
const field=owner+'field';const invite=(await api('company',{action:'add',name:'Worker',email:field+'@example.test',seatType:'field',permissions:{Time:{view:true,edit:true},Tasks:{view:true,edit:true}}})).data.token;assert(invite);assert.equal((await api('company',{action:'accept',token:invite},field)).status,200);
assert.equal((await api('app-settings',{config:initial,version:0},field)).status,403);
assert.equal((await api('app-settings',{config:initial,version:0},owner,'https://wrong.example')).status,403);
const config=structuredClone(initial);config.modules.budgeting=false;config.modules.schedule=false;config.modules.tasks=false;config.modules.myTasks=false;config.modules.dailyReview=false;config.colour='#123456';config.theme='Dark';config.dailyHours=8;config.defaultView='Photos';config.stages=[{id:'custom',name:'Custom project stage',colour:'#123456'}];
assert.equal((await api('app-settings',{config:{...config,dailyHours:0},version:0})).status,400);
assert.equal((await api('app-settings',{config,version:0})).status,200);
assert.equal((await api('app-settings',{config:initial,version:0})).status,409);
d=(await api('app-settings')).data;assert.equal(d.version,1);assert.equal(d.config.theme,'Dark');assert.equal(d.config.dailyHours,8);
const state=(await api('data?project='+project)).data;assert.equal(state.projects[0].contract,0);assert.equal(state.records.length,0);assert.equal(state.settings.colour,'#123456');assert(state.access.disabledTabs.includes('Schedule'));assert.equal(state.projects[0].stageDefinitions.length,9); // existing stages unchanged
assert.equal((await api('schedule?week=2026-09-30')).status,403);assert.equal((await api('schedule?week=2026-09-30',null,field)).status,403);assert.equal((await api('budget?project='+project)).status,403);assert.equal((await api('daily-review')).status,403);assert.equal((await api('tasks?projectId='+project)).status,403);
assert.equal((await api('data',{action:'record',projectId:project,kind:'cost',title:'Blocked cost',data:{amount:999}})).status,403);
const other=(await api('app-settings',null,owner+'other')).data;assert.equal(other.version,0);assert.equal(other.config.modules.budgeting,true);
const fresh=(await api('data',{action:'project',name:'New default stage project'})).data.id;const freshData=(await api('data?project='+fresh)).data;assert.deepEqual(freshData.projects.find(p=>p.id===fresh).stageDefinitions,config.stages);
assert.equal((await api('data',{action:'settings',company:'Changed company details'})).status,200);assert.equal((await api('data')).data.settings.theme,'Dark');
assert.equal((await api('app-settings',{config:initial,version:1})).status,200);
const restored=(await api('data?project='+project)).data;assert.equal(restored.projects.find(p=>p.id===project).contract,12345);assert.equal(restored.records[0].id,task);assert.equal((await api('schedule?week=2026-09-30')).status,200);
assert((await api('app-reminders')).data.items.some(r=>r.id===task));
const noReminders=structuredClone(initial);noReminders.reminders.overdueTasks=false;assert.equal((await api('app-settings',{config:noReminders,version:2})).status,200);assert(!(await api('app-reminders')).data.items.some(r=>r.id===task));
console.log('PASS: admin-only writes, origin checks, persistence, company isolation, stale-write protection, disabled server access, restoring records and contract, new-project defaults, unchanged existing stages, appearance preservation and reminder preferences.');
