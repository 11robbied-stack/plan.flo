import {NextRequest,NextResponse} from 'next/server';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {companyDb,getCompanyAccess,hashInvite} from '@/app/company-access';
import {subscriptionPlans,additionalUserPrices,normaliseSelection,selectionTotals,type SubscriptionSelection} from '@/app/subscription-plans';
const config=()=>env as unknown as Record<string,string>;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
async function access(){const u=await getChatGPTUser();if(!u)return null;const a=await getCompanyAccess(u);return {...a,email:u.email};}
// Live charging remains locked until webhook delivery and entitlement enforcement are commissioned.
function ready(){const c=config();return !!(c.STRIPE_SECRET_KEY?.startsWith('sk_test_')&&c.STRIPE_PORTAL_CONFIGURATION&&subscriptionPlans.every(p=>c['STRIPE_PRICE_'+p.id.replaceAll('-','_').toUpperCase()]));}
async function stripe(path:string,body?:Record<string,string>,key?:string){const r=await fetch('https://api.stripe.com/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${config().STRIPE_SECRET_KEY}`,'Stripe-Version':'2025-02-24.acacia',...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(key?{'Idempotency-Key':key}:{})},body:body?new URLSearchParams(body):undefined});const d:any=await r.json();if(!r.ok)throw new Error('Stripe could not complete this request. Please try again or contact your administrator.');return d;}
const priceId=(id:string,cycle='monthly')=>config()['STRIPE_PRICE_'+id.replaceAll('-','_').toUpperCase()+(cycle==='annual'?'_ANNUAL':'')];
const extraPriceId=(type:'office'|'field',cycle:string)=>config()['STRIPE_PRICE_EXTRA_'+type.toUpperCase()+(cycle==='annual'?'_ANNUAL':'')];
async function account(owner:string){return companyDb().prepare('SELECT customer_id FROM billing_accounts WHERE owner=?').bind(owner).first<{customer_id:string}>();}
async function subscriptions(customer:string){return (await stripe('subscriptions?customer='+encodeURIComponent(customer)+'&status=all&limit=100')).data.filter((s:any)=>!['canceled','incomplete_expired'].includes(s.status));}
async function savedSelection(owner:string){const row=await companyDb().prepare('SELECT requested_configuration FROM subscriptions WHERE owner=?').bind(owner).first<{requested_configuration:string}>();try{return normaliseSelection(JSON.parse(row?.requested_configuration||'{}'))}catch{return null}}
async function saveSelection(owner:string,selection:SubscriptionSelection){await companyDb().prepare('INSERT INTO subscriptions(owner,requested_plan,requested_at,requested_configuration) VALUES(?,?,?,?) ON CONFLICT(owner) DO UPDATE SET requested_plan=excluded.requested_plan,requested_at=excluded.requested_at,requested_configuration=excluded.requested_configuration').bind(owner,selection.plan,new Date().toISOString(),JSON.stringify(selection)).run();}
export async function GET(req:NextRequest){const a=await access();if(!a)return reply({error:'Sign in required'},401);if(a.blocked||a.role==='member')return reply({error:'Administrator access required'},403);try{
 const [selection,counts]=await Promise.all([savedSelection(a.owner),companyDb().prepare("SELECT seat_type,COUNT(*) AS count FROM company_members WHERE owner=? AND status!='disabled' GROUP BY seat_type").bind(a.owner).all<{seat_type:string;count:number}>()]);
 const common={selection,usage:{office:1+(counts.results.find(r=>r.seat_type==='office')?.count||0),field:counts.results.find(r=>r.seat_type==='field')?.count||0}};
 if(!ready())return reply({...common,configured:false,mode:'not_connected',invoices:[],subscription:null});
 const row=await account(a.owner);if(!row)return reply({...common,configured:true,mode:'test',invoices:[],subscription:null});
 const cursor=req.nextUrl.searchParams.get('after');if(cursor&&!/^in_[a-zA-Z0-9]+$/.test(cursor))return reply({error:'Invalid invoice page'},400);
 const [subs,inv]=await Promise.all([subscriptions(row.customer_id),stripe('invoices?customer='+encodeURIComponent(row.customer_id)+'&limit=20'+(cursor?'&starting_after='+encodeURIComponent(cursor):''))]);const s=subs[0];
 const p=s&&subscriptionPlans.find(p=>s.items.data.some((item:any)=>['monthly','annual'].some(c=>priceId(p.id,c)===item.price.id)));
 return reply({...common,configured:true,mode:'test',customer:true,subscription:s?{status:s.status,plan:p?.name||'Subscription',cancelAtPeriodEnd:s.cancel_at_period_end}:null,invoices:inv.data.filter((i:any)=>i.status!=='draft').map((i:any)=>({id:i.id,number:i.number,date:i.created,status:i.status,total:i.total,currency:i.currency,pdf:i.invoice_pdf,url:i.hosted_invoice_url,description:i.lines?.data?.[0]?.description||'PLAN.FLO subscription'})),hasMore:inv.has_more,next:inv.data.at(-1)?.id});
 }catch{return reply({error:'Billing could not be loaded. Please try again.'},502);}}
export async function POST(req:NextRequest){const a=await access();if(!a)return reply({error:'Sign in required'},401);if(a.blocked||a.role==='member')return reply({error:'Administrator access required'},403);if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Invalid request origin'},403);
 try{const b:any=await req.json();if(!['save-selection','checkout','portal'].includes(b.action))return reply({error:'Unknown billing action'},400);
 let selection:SubscriptionSelection|null=null;
 if(b.action!=='portal'){try{selection=normaliseSelection(b.selection)}catch(e){return reply({error:(e as Error).message},400)}}
 if(b.action==='save-selection'){await saveSelection(a.owner,selection!);return reply({ok:true,selection,totals:selectionTotals(selection!)});}
 if(!ready())return reply({error:'Stripe setup is not complete. Your package selection can be saved, but payments are not available yet.'},503);
 if(b.action==='checkout'){
 const counts=await companyDb().prepare("SELECT seat_type,COUNT(*) AS count FROM company_members WHERE owner=? AND status!='disabled' GROUP BY seat_type").bind(a.owner).all<{seat_type:string;count:number}>();
 const totals=selectionTotals(selection!);if(1+(counts.results.find(r=>r.seat_type==='office')?.count||0)>totals.office||(counts.results.find(r=>r.seat_type==='field')?.count||0)>totals.field)return reply({error:'Your listed team exceeds this package selection. Add seats or choose a larger package.'},400);
 }
 let row=await account(a.owner);const ownerHash=await hashInvite(a.owner);
 if(!row){const c=await stripe('customers',{email:a.email,'metadata[stima_owner]':a.owner},'stima-test-customer-'+ownerHash);await companyDb().prepare('INSERT INTO billing_accounts(owner,customer_id) VALUES(?,?) ON CONFLICT(owner) DO NOTHING').bind(a.owner,c.id).run();row=await account(a.owner);}if(!row)throw new Error('Account unavailable');
 const returnUrl=req.nextUrl.origin+'/?billing=return';const subs=await subscriptions(row.customer_id);
 if(b.action==='portal'||subs.length){const portal=await stripe('billing_portal/sessions',{customer:row.customer_id,configuration:config().STRIPE_PORTAL_CONFIGURATION,return_url:returnUrl});return reply({url:portal.url});}
 const p=subscriptionPlans.find(p=>p.id===selection!.plan)!;const cycle=selection!.cycle;
 const factor=cycle==='annual'?10:1;
 const items=[{id:priceId(p.id,cycle),amount:p.price*factor,quantity:1},...(selection!.office?[{id:extraPriceId('office',cycle),amount:additionalUserPrices.office*factor,quantity:selection!.office}]:[]),...(selection!.field?[{id:extraPriceId('field',cycle),amount:additionalUserPrices.field*factor,quantity:selection!.field}]:[])];
 for(const item of items){if(!item.id)return reply({error:'This billing frequency or additional user option is awaiting Stripe setup. Save your selection for now.'},503);const price=await stripe('prices/'+encodeURIComponent(item.id));if(price.currency!=='aud'||price.unit_amount!==item.amount*100||price.recurring?.interval!==(cycle==='annual'?'year':'month')||price.recurring?.interval_count!==1||price.tax_behavior!=='exclusive'||!price.active)return reply({error:'A package or additional user price needs updating in Stripe. No payment has been taken.'},503);}
 const lock=await companyDb().prepare('UPDATE billing_accounts SET checkout_lock=? WHERE owner=? AND (checkout_lock IS NULL OR checkout_lock < ?) RETURNING customer_id').bind(Date.now()+60000,a.owner,Date.now()).first();if(!lock)return reply({error:'Checkout is already opening. Please retry shortly.'},409);
 try{const fingerprint=JSON.stringify(selection);const open=await stripe('checkout/sessions?customer='+encodeURIComponent(row.customer_id)+'&status=open&limit=100');for(const s of open.data){if(s.metadata?.planflo_selection===fingerprint)return reply({url:s.url});await stripe('checkout/sessions/'+s.id+'/expire',{});}
 const body:Record<string,string>={customer:row.customer_id,mode:'subscription','payment_method_types[0]':'card','automatic_tax[enabled]':'true','customer_update[address]':'auto',billing_address_collection:'required',success_url:returnUrl,cancel_url:req.nextUrl.origin+'/?billing=cancelled','metadata[stima_plan]':p.id,'metadata[planflo_selection]':fingerprint,'subscription_data[metadata][stima_owner]':a.owner,'subscription_data[metadata][planflo_selection]':fingerprint};
 items.forEach((item,i)=>{body[`line_items[${i}][price]`]=item.id;body[`line_items[${i}][quantity]`]=String(item.quantity)});
 const session=await stripe('checkout/sessions',body);await saveSelection(a.owner,selection!);return reply({url:session.url});
 }finally{await companyDb().prepare('UPDATE billing_accounts SET checkout_lock=NULL WHERE owner=?').bind(a.owner).run();}
 }catch{return reply({error:'Billing could not complete this request. Please try again.'},502);}}
