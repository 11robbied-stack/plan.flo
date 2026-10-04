export const dashboardWidgetIds=['portfolio','activity','status','recent','reminders'] as const;
export type DashboardWidgetId=typeof dashboardWidgetIds[number];
export type DashboardLayout={order:DashboardWidgetId[];hidden:DashboardWidgetId[]};
export function defaultDashboardLayout():DashboardLayout{return {order:[...dashboardWidgetIds],hidden:[]};}
export function normaliseDashboardLayout(value:unknown):DashboardLayout{
 const v=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const ids=(list:unknown)=>Array.isArray(list)?[...new Set(list.filter((id):id is DashboardWidgetId=>typeof id==='string'&&(dashboardWidgetIds as readonly string[]).includes(id)))]:[];
 const order=ids(v.order);return {order:[...order,...dashboardWidgetIds.filter(id=>!order.includes(id))],hidden:ids(v.hidden)};
}
export function validateDashboardLayout(value:unknown):DashboardLayout{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid dashboard layout.');
 const v=value as Record<string,unknown>;
 if(!Array.isArray(v.order)||!Array.isArray(v.hidden)||v.order.length>30||v.hidden.length>30||[...v.order,...v.hidden].some(id=>typeof id!=='string'||id.length>64))throw Error('Invalid dashboard layout.');
 return normaliseDashboardLayout(value);
}
export function moveDashboardWidget(layout:DashboardLayout,id:DashboardWidgetId,target:DashboardWidgetId):DashboardLayout{
 if(id===target)return layout;const order=[...layout.order];const from=order.indexOf(id),to=order.indexOf(target);if(from<0||to<0)return layout;order.splice(from,1);order.splice(to,0,id);return {...layout,order};
}
