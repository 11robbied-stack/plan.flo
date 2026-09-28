export const projectStages=[
 {id:'establishment',name:'Site Establishment',colour:'#6386ff'},
 {id:'temporaries',name:'Construction Temporaries',colour:'#9273f5'},
 {id:'underground',name:'Underground Pathways',colour:'#d070d8'},
 {id:'rough-in',name:'Electrical Rough In',colour:'#38b9de'},
 {id:'cut-out',name:'Cut Out',colour:'#f1c453'},
 {id:'electrical-fit-off',name:'Electrical Fit Off',colour:'#3bce96'},
 {id:'switchboard-fit-off',name:'Switchboard Fit Off',colour:'#65d7c6'},
 {id:'testing',name:'Testing and Commissioning',colour:'#ff9277'},
 {id:'handover',name:'Handover',colour:'#a5cf60'},
] as const;
export type ProjectStage={id:string;name:string;colour:string};
export const optionalStages:ProjectStage[]=[
 {id:'communications-rough-in',name:'Communications Rough In',colour:'#38b9de'},
 {id:'communications-fit-off',name:'Communications Fit Off',colour:'#65d7c6'},
 {id:'solar-rough-in',name:'Solar Rough In',colour:'#f1c453'},
 {id:'solar-fit-off',name:'Solar Fit Off',colour:'#a5cf60'},
 {id:'dry-fire-rough-in',name:'Dry Fire Rough In',colour:'#ff9277'},
 {id:'dry-fire-fit-off',name:'Dry Fire Fit Off',colour:'#d070d8'},
];
export function stagesForProject(setup:any):ProjectStage[]{return Array.isArray(setup?.stageDefinitions)?setup.stageDefinitions:projectStages.map(s=>({...s}));}
export function validateStages(value:unknown):value is ProjectStage[]{return Array.isArray(value)&&value.length<=40&&value.every(s=>s&&typeof s.id==='string'&&/^[a-z0-9-]{1,80}$/.test(s.id)&&typeof s.name==='string'&&s.name.trim().length>0&&s.name.length<=100&&typeof s.colour==='string'&&/^#[0-9a-f]{6}$/i.test(s.colour))&&new Set(value.map(s=>s.id)).size===value.length&&new Set(value.map(s=>s.name.trim().toLowerCase())).size===value.length;}
