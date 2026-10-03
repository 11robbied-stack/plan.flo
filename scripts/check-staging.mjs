import {readFileSync} from 'node:fs';
const c=JSON.parse(readFileSync(new URL('../staging/wrangler.staging.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(message)};
if(c.name!=='planflo-staging'||c.workers_dev!==false||c.preview_urls!==false||(c.routes||[]).length)fail('Staging must stay separate and private.');
if(c.vars?.PLANFLO_AUTH_MODE!=='standalone'||c.vars?.PLANFLO_DEPLOYMENT!=='staging')fail('Staging must use standalone authentication.');
const origin=new URL(c.vars.PLANFLO_AUTH_ORIGIN);
if(origin.protocol!=='https:'||origin.origin!==c.vars.PLANFLO_AUTH_ORIGIN||/REPLACE|chatgpt\.site/i.test(origin.host))fail('An approved staging origin is required.');
const db=c.d1_databases?.find(x=>x.binding==='DB');
if(!db||db.database_name!=='planflo-staging-db'||!/^[0-9a-f-]{36}$/i.test(db.database_id)||db.database_id==='00000000-0000-4000-8000-000000000000')fail('Approved isolated staging D1 binding required.');
if(c.r2_buckets?.find(x=>x.binding==='FILES')?.bucket_name!=='planflo-staging-files'||c.services?.find(x=>x.binding==='AUTH_EMAIL')?.service!=='planflo-staging-mail')fail('Isolated staging files and mail bindings required.');

const mail=JSON.parse(readFileSync(new URL('../workers/auth-email/wrangler.staging.jsonc',import.meta.url),'utf8').replace(/^\s*\/\/.*$/gm,''));
if(mail.name!=='planflo-staging-mail'||mail.workers_dev!==false||mail.preview_urls!==false||(mail.routes||[]).length)fail('Email Worker must have no public ingress.');
if(mail.vars?.PLANFLO_AUTH_ORIGIN!==c.vars.PLANFLO_AUTH_ORIGIN||mail.vars?.AUTH_EMAIL_PROVIDER!=='resend'||!/^no-reply@notifications\.planflo\.app$/.test(mail.vars?.AUTH_EMAIL_FROM||''))fail('Verified sender and matching email/application origin must be configured.');
if(mail.vars?.RESEND_API_KEY||c.vars?.BETTER_AUTH_SECRET)fail('Credentials must use Worker secrets, not configuration variables.');
console.log('Private staging/mail configuration shape checked; resource ownership, sender verification and secret provisioning still require verification. No deployment performed.');
