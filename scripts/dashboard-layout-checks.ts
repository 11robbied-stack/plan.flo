import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {DashboardHome} from '../app/dashboard-home';
import {NextRequest} from 'next/server';
import * as api from '../app/api/dashboard-layout/route';
import {defaultDashboardLayout,normaliseDashboardLayout,moveDashboardWidget} from '../app/dashboard-layout-model';
export async function dashboardLayoutChecks({sql,check,identity,req}:any){
 const test=(name:string,ok:boolean)=>check('dashboard layout '+name,ok,{}),get=async()=>{const r=await api.GET();return {status:r.status,...(await r.json() as any)};},post=(body:any)=>api.POST(req('/api/dashboard-layout',body));
 const markup=renderToStaticMarkup(createElement(DashboardHome,{userName:'Fixture',projects:[{id:'safe',name:'Assigned project',status:'Active',created:'2026-10-04',contract:987654,budgetHours:1234}],search:'',admin:false,showCosts:false,showHours:false,onOpen:()=>{},onNew:()=>{},onProjects:()=>{}}));test('permission restricted render excludes financial and hours metrics',!markup.includes('987,654')&&!markup.includes('1234')&&!markup.includes('data-dashboard-widget="portfolio"')&&!markup.includes('New project'));
 identity(null);test('anonymous read denied',(await api.GET()).status===401);test('anonymous write denied',(await post({})).status===401);
 identity('a');const initial=await get();test('default layout without saved row',initial.status===200&&initial.version===0&&initial.layout.order.length===5);
 const layout={order:['recent','status','activity','portfolio','reminders'],hidden:['portfolio']};
 test('save own layout',(await post({layout,version:0})).status===200);test('reload saved layout',JSON.stringify((await get()).layout)===JSON.stringify(layout));
 test('stale update rejected',(await post({layout,version:0})).status===409);
 for(const who of ['aa','ae','b']){identity(who);test(who+' starts with isolated preferences',(await get()).version===0);test(who+' can save own layout',(await post({layout:defaultDashboardLayout(),version:0})).status===200);}
 identity('a');test('other users never overwrite owner layout',JSON.stringify((await get()).layout)===JSON.stringify(layout));
 sql.prepare('INSERT INTO dashboard_layouts(owner,user_id,data,version,updated) VALUES(?,?,?,?,?)').run('b','a',JSON.stringify(defaultDashboardLayout()),12,new Date().toISOString());test('same user id scoped to company',(await get()).version===1);
 test('client cannot forge owner',(await post({layout,version:1,owner:'b'})).status===400);test('client cannot forge user',(await post({layout,version:1,user_id:'aa'})).status===400);
 test('cross origin denied',(await api.POST(new NextRequest('http://localhost:5199/api/dashboard-layout',{method:'POST',headers:{origin:'https://evil.example'},body:JSON.stringify({layout,version:1})}))).status===403);
 for(const invalid of [null,{}, {order:[42],hidden:[]},{order:[],hidden:Array(31).fill('status')}])test('malformed layout rejected',(await post({layout:invalid,version:1})).status===400);
 test('invalid version rejected',(await post({layout,version:-1})).status===400);
 test('oversize rejected',(await api.POST(new NextRequest('http://localhost:5199/api/dashboard-layout',{method:'POST',headers:{origin:'http://localhost:5199'},body:'x'.repeat(8193)}))).status===413);
 const normal=normaliseDashboardLayout({order:['recent','removed','recent'],hidden:['removed','status','status']});test('unknown ids removed and new ids appended',normal.order.join(',')==='recent,portfolio,activity,status,reminders'&&normal.hidden.join(',')==='status');
 let moved=defaultDashboardLayout();for(let i=0;i<20;i++)moved=moveDashboardWidget(moved,'portfolio',i%2?'activity':'reminders');test('repeated reorder retains unique ids',new Set(moved.order).size===5&&moved.order.length===5);
 test('all widgets can be hidden',(await post({layout:{...layout,hidden:defaultDashboardLayout().order},version:1})).status===200&&(await get()).layout.hidden.length===5);
 test('reset saves defaults',(await post({layout:defaultDashboardLayout(),version:2})).status===200&&(await get()).layout.hidden.length===0);
 sql.prepare("UPDATE dashboard_layouts SET data='invalid' WHERE owner='a' AND user_id='a'").run();test('corrupt stored layout safely defaults',(await get()).layout.order.length===5);
 sql.prepare("UPDATE company_members SET status='disabled' WHERE id='ae'").run();identity('ae');test('disabled member denied',(await api.GET()).status===403);sql.prepare("UPDATE company_members SET status='active' WHERE id='ae'").run();identity('a');
}
