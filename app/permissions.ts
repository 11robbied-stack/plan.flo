export const permissionTabs=['Overview','Project Setup','Plans','Tasks','Time','Costs','RFIs','Variations','Photos','Specifications','Files','Site Diary','Site Docs'] as const;
export type Permissions=Record<string,{view:boolean;edit:boolean}>;
export type Access={owner:string;role:'owner'|'admin'|'member';permissions:Permissions;blocked?:boolean};
export function normalisePermissions(value:unknown):Permissions{const v=(value&&typeof value==='object'?value:{}) as Record<string,any>;return Object.fromEntries(permissionTabs.map(tab=>[tab,{view:v[tab]?.view===true,edit:v[tab]?.view===true&&v[tab]?.edit===true}]))}
export function canAccess(access:Access,tab:string,edit=false){return !access.blocked&&(access.role==='owner'||access.role==='admin'||!!access.permissions[tab]?.[edit?'edit':'view'])}
export const recordTab=(kind:string)=>({task:'Tasks',time:'Time',cost:'Costs',rfi:'RFIs',variation:'Variations',markup:'Plans',diary:'Site Diary'}[kind]||'');
export const fileTab=(category:string)=>category.startsWith('site-')?'Site Docs':({plans:'Plans',photos:'Photos',specifications:'Specifications',files:'Files',logo:'Settings'}[category]||'');
