export const subscriptionPlans=[
 {id:'basic',name:'Basic',price:29,users:2,projects:3,storage:2,level:0},
 {id:'standard',name:'Standard',price:49,users:5,projects:10,storage:5,level:1},
 {id:'pro',name:'Pro',price:99,users:15,projects:25,storage:10,level:2},
 {id:'business-pro',name:'Business Pro',price:149,users:30,projects:30,storage:25,level:2},
] as const;
export const subscriptionFeatures=[
 {label:'Drawings, SLDs & specifications',level:0},
 {label:'Tasks, photos & site diary',level:0},
 {label:'Site Docs & COES',level:1},
 {label:'Test & Tag, equipment checks & sign-off',level:1},
 {label:'Drawing revisions & overlays',level:1},
 {label:'Staff time tracking & calendars',level:1},
 {label:'Builder directory & colours',level:1},
 {label:'RFIs & variations',level:1},
 {label:'Costs, budgets & profit dashboard',level:2},
 {label:'O&M manual builder & export',level:2},
] as const;
