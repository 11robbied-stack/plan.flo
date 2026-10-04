import {readFileSync} from 'node:fs';
const c=JSON.parse(readFileSync(new URL('../staging/wrangler.staging.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(message)};
if(c.name!=='planflo-staging'||c.workers_dev!==false||c.preview_urls!==false)fail('Staging must stay separate with workers.dev and previews disabled.');
if(c.routes?.length!==1||c.routes[0].pattern!=='staging.planflo.app'||c.routes[0].custom_domain!==true)fail('Only the approved staging custom domain is allowed.');
if(c.routes[0].zone_name!=='planflo.app'||c.routes[0].enabled!==true||c.routes[0].previews_enabled!==false)fail('Preserve the approved zone, enabled custom domain and disabled domain previews.');
if(c.services?.find(x=>x.binding==='AUTH_EMAIL')?.environment!=='production')fail('Preserve the existing mail Worker service environment.');
if(c.vars?.PLANFLO_AUTH_MODE!=='standalone'||c.vars?.PLANFLO_DEPLOYMENT!=='staging')fail('Staging must use standalone authentication.');
const origin=new URL(c.vars.PLANFLO_AUTH_ORIGIN);
if(origin.origin!=='https://staging.planflo.app'||origin.origin!==c.vars.PLANFLO_AUTH_ORIGIN)fail('An approved staging origin is required.');
const db=c.d1_databases?.find(x=>x.binding==='DB');
if(!db||db.database_name!=='planflo-staging-db'||db.database_id!=='047774fa-ac31-45a1-b9a8-0144cc6c8e79')fail('Approved isolated staging D1 binding required.');
if(c.r2_buckets?.find(x=>x.binding==='FILES')?.bucket_name!=='planflo-staging-files'||c.services?.find(x=>x.binding==='AUTH_EMAIL')?.service!=='planflo-staging-mail')fail('Isolated staging files and mail bindings required.');

const mail=JSON.parse(readFileSync(new URL('../workers/auth-email/wrangler.staging.jsonc',import.meta.url),'utf8').replace(/^\s*\/\/.*$/gm,''));
if(mail.name!=='planflo-staging-mail'||mail.workers_dev!==false||mail.preview_urls!==false||(mail.routes||[]).length)fail('Email Worker must have no public ingress.');
if(mail.vars?.PLANFLO_AUTH_ORIGIN!==c.vars.PLANFLO_AUTH_ORIGIN||mail.vars?.AUTH_EMAIL_PROVIDER!=='resend'||!/^no-reply@notifications\.planflo\.app$/.test(mail.vars?.AUTH_EMAIL_FROM||''))fail('Verified sender and matching email/application origin must be configured.');
for(const config of [c,mail])for(const key of ['RESEND_API_KEY','BETTER_AUTH_SECRET','PLANFLO_PLATFORM_OWNER_ID','PLANFLO_PLATFORM_OWNER_EMAIL','PLANFLO_DEMO_OWNER_ID','PLANFLO_DEMO_OWNER_EMAIL']){
 if(Object.hasOwn(config.vars||{},key))fail('Secrets and privileged identity pins must not be supplied as configuration variables, including empty values.');
}

console.log('Approved staging domain and private mail configuration checked; resource ownership, sender verification and secret provisioning still require verification. No deployment performed.');
