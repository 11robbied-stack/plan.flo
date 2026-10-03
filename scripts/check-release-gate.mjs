import {execFileSync} from 'node:child_process';

// Approval lives in the builder configuration, outside the candidate's source tree.
// This performs no network requests and needs no database or additional provider grant.
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const expected=process.env.WORKERS_CI_COMMIT_SHA;
const approved=process.env.PLANFLO_STAGING_SCHEMA_TREE;
if(!/^[0-9a-f]{40}$/.test(expected||''))throw new Error('Missing or invalid WORKERS_CI_COMMIT_SHA.');
if(process.env.WORKERS_CI_BRANCH!=='review/customer-auth-isolation')throw new Error('Only the approved staging review branch may deploy.');
if(git('rev-parse','HEAD')!==expected)throw new Error('Build checkout does not match the triggering commit.');
if(git('status','--porcelain','--untracked-files=normal'))throw new Error('Release checkout must be clean.');
if(!/^[0-9a-f]{40}$/.test(approved||''))throw new Error('Missing or invalid staging schema approval.');
const actual=git('rev-parse','HEAD:drizzle');
if(actual!==approved)throw new Error('Migration review required: apply and verify the reviewed staging migration separately before approving its schema tree.');
console.log('Staging gate passed: commit '+expected+'; approved schema tree '+actual+'. No remote database access performed.');
