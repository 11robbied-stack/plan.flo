export type BudgetRecord={id:string;kind:string;title:string;status:string;data:string;created:string};
const number=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;
const cents=(v:unknown)=>Math.round(number(v)*100);
const read=(r:BudgetRecord)=>{try{return JSON.parse(r.data)||{}}catch{return {}}};
export function calculateBudget(project:{contract:number;budgetHours:number},rows:BudgetRecord[]){
 let labourCents=0,expenseCents=0,approvedCents=0,pendingCents=0,hours=0,unpricedHours=0;
 const categories:Record<string,number>={};
 const expenses:{id:string;title:string;supplier:string;date:string;amount:number}[]=[];
 for(const row of rows){const d=read(row);if(row.kind==='time'){const h=number(d.hours);hours+=h;if(!number(d.rate)&&h>0)unpricedHours+=h;labourCents+=Math.round(h*number(d.rate)*100)}
 if(row.kind==='cost'){const value=cents(d.amount);expenseCents+=value;const category=String(d.category||'Other');categories[category]=(categories[category]||0)+value;expenses.push({id:row.id,title:row.title,supplier:String(d.supplier||''),date:String(d.date||row.created),amount:value/100})}
 if(row.kind==='variation'){const value=Array.isArray(d.items)&&d.items.length?d.items.reduce((sum:number,item:any)=>sum+Math.round(number(item.quantity)*number(item.rate)*100),0):cents(d.amount);if(['Approved','Invoiced'].includes(row.status))approvedCents+=value;if(['Submitted','Under review'].includes(row.status))pendingCents+=value;}}
 const saved=rows.find(r=>r.kind==='budget'),budgetData=saved?read(saved):{};
 const costBudget=saved&&Number.isFinite(Number(budgetData.costBudget))?cents(budgetData.costBudget)/100:null;
 const contractCents=cents(project.contract),revisedCents=contractCents+approvedCents,totalCents=labourCents+expenseCents;
 return {contract:contractCents/100,approvedVariations:approvedCents/100,pendingVariations:pendingCents/100,revisedContract:revisedCents/100,labour:labourCents/100,expenses:expenseCents/100,totalCost:totalCents/100,contractRemaining:(revisedCents-totalCents)/100,costBudget,budgetRemaining:costBudget===null?null:Math.round(costBudget*100-totalCents)/100,budgetUsed:costBudget===null||costBudget<=0?null:totalCents/(costBudget*100)*100,plannedMargin:costBudget===null||revisedCents<=0?null:(revisedCents-costBudget*100)/revisedCents*100,hours:Math.round(hours*100)/100,budgetHours:number(project.budgetHours),unpricedHours:Math.round(unpricedHours*100)/100,largestCosts:expenses.sort((a,b)=>b.amount-a.amount).slice(0,5),expenseCount:expenses.length,categories:[{name:'Labour',value:labourCents/100},...Object.entries(categories).map(([name,value])=>({name,value:value/100}))]};
}
export type BudgetSummary=ReturnType<typeof calculateBudget>;
