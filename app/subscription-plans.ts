export const subscriptionPlans = [
 {id:'basic',name:'Basic',price:49,officeUsers:1,fieldUsers:2,projects:5,storage:10,level:0,purpose:'Organise the job'},
 {id:'standard',name:'Standard',price:129,officeUsers:2,fieldUsers:5,projects:15,storage:25,level:1,purpose:'Coordinate the site'},
 {id:'pro',name:'Pro',price:249,officeUsers:3,fieldUsers:15,projects:40,storage:100,level:2,purpose:'Control the money'},
 {id:'business-pro',name:'Business Pro',price:449,officeUsers:5,fieldUsers:30,projects:100,storage:250,level:3,purpose:'Manage a larger team'},
] as const;
export const additionalUserPrices = {office:29,field:7} as const;
export type SubscriptionSelection = {plan:string;cycle:'monthly'|'annual';office:number;field:number};
export const defaultSelection:SubscriptionSelection = {plan:'pro',cycle:'monthly',office:0,field:0};
export function normaliseSelection(value:unknown):SubscriptionSelection {
 const v = value as Partial<SubscriptionSelection> | null;
 if(!v || !subscriptionPlans.some(p=>p.id===v.plan) || !['monthly','annual'].includes(String(v.cycle))) throw new Error('Choose a valid package and billing frequency.');
 for(const n of [v.office,v.field]) if(typeof n!=='number' || !Number.isSafeInteger(n) || n<0 || n>500) throw new Error('Additional users must be a whole number between 0 and 500.');
 return {plan:v.plan!,cycle:v.cycle!,office:v.office!,field:v.field!};
}
export function selectionTotals(selection:SubscriptionSelection) {
 const plan=subscriptionPlans.find(p=>p.id===selection.plan)!;
 const monthly=plan.price+selection.office*additionalUserPrices.office+selection.field*additionalUserPrices.field;
 const total=monthly*(selection.cycle==='annual'?10:1);
 return {monthly,total,equivalent:selection.cycle==='annual'?total/12:monthly,office:plan.officeUsers+selection.office,field:plan.fieldUsers+selection.field,saving:selection.cycle==='annual'?monthly*2:0};
}
export const subscriptionFeatures:ReadonlyArray<{label:string;level:number;planned?:boolean}> = [
 {label:'Drawings, SLDs, specifications & folders',level:0},
 {label:'Tasks, photos & site diary',level:0},
 {label:'Basic time logging',level:0},
 {label:'Builder directory & colours',level:0},
 {label:'Safety document & COES uploads',level:0},
 {label:'Drawing revisions & overlays',level:1},
 {label:'RFIs & variation approvals',level:1},
 {label:'Weekly timesheets & calendars',level:1},
 {label:'Reusable Site Docs forms & sign-offs',level:1},
 {label:'Test & Tag register & equipment checks',level:1},
 {label:'Purchase orders',level:2},
 {label:'Costs, budgets & profit dashboard',level:2},
 {label:'Approved variations added to the budget',level:2},
 {label:'O&M manual builder & export',level:2},
 {label:'Daily activity review',level:2},
 {label:'Electrical estimating & quote tools',level:2,planned:true},
 {label:'Live Xero accounting & payroll sync',level:2,planned:true},
 {label:'Business-wide reports & approval workflows',level:3,planned:true},
 {label:'Included onboarding & priority support',level:3,planned:true},
];
export const fieldUserTabs=['Overview','Drawings','SLD','Specifications','Tasks','Time','Photos','Files','Site Diary','Site Docs','Test & Tag Register','EWP','COES'];
