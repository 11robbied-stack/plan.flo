export type EquipmentEntry={id:string;kind:string;title:string;created:string;data:any};
export const equipmentTab=(kind:string)=>kind==='test-tag'?'Test & Tag Register':['ewp','ewp-template'].includes(kind)?'EWP':'';
export const checkResults=['Not checked','Satisfactory','Defect noted','Not applicable'];
