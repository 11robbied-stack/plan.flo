import assert from 'node:assert/strict';
import {subscriptionPlans,normaliseSelection,selectionTotals,fieldUserTabs} from '../app/subscription-plans.ts';
assert.deepEqual(subscriptionPlans.map(p=>p.price),[49,129,249,449]);
for(const p of subscriptionPlans){
 const monthly=normaliseSelection({plan:p.id,cycle:'monthly',office:2,field:3});
 const m=selectionTotals(monthly);assert.equal(m.total,p.price+58+21);assert.equal(m.office,p.officeUsers+2);assert.equal(m.field,p.fieldUsers+3);
 const annual=selectionTotals({...monthly,cycle:'annual'});assert.equal(annual.total,m.total*10);assert.equal(annual.saving,m.total*2);assert.equal(annual.total+annual.saving,m.total*12);
}
for(const invalid of [null,{}, {...{plan:'basic',cycle:'monthly',office:0,field:0},plan:'fake'}, {plan:'basic',cycle:'monthly',office:-1,field:0},{plan:'basic',cycle:'monthly',office:0.5,field:0},{plan:'basic',cycle:'monthly',office:'2',field:0},{plan:'basic',cycle:'weekly',office:0,field:0},{plan:'basic',cycle:'annual',office:501,field:0}])assert.throws(()=>normaliseSelection(invalid));
assert(!fieldUserTabs.includes('Costs'));assert(!fieldUserTabs.includes('Budget Overview'));assert(!fieldUserTabs.includes('Purchase Orders'));
console.log('PASS: package prices, included and extra seats, monthly/annual totals and savings, invalid quantities/cycles and field-user commercial restrictions.');
