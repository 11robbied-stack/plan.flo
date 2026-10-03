import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

test('staging gate fails closed for unapproved migrations, wrong commit/branch, missing approval and dirty source',()=>{
  const cwd=mkdtempSync(join(tmpdir(),'planflo-release-gate-'));
  const script=fileURLToPath(new URL('../../scripts/check-release-gate.mjs',import.meta.url));
  const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
  const commit=()=>git('-c','user.name=Release fixture','-c','user.email=release@example.test','commit','-qm','Synthetic fixture');
  try{
    git('init','-q');mkdirSync(join(cwd,'drizzle'));writeFileSync(join(cwd,'drizzle/0000_fixture.sql'),'CREATE TABLE fixture(id TEXT);\n');git('add','.');commit();
    const head=git('rev-parse','HEAD'),schema=git('rev-parse','HEAD:drizzle');
    const env={...process.env,WORKERS_CI_COMMIT_SHA:head,WORKERS_CI_BRANCH:'review/customer-auth-isolation',PLANFLO_STAGING_SCHEMA_TREE:schema};
    const run=(overrides={})=>spawnSync(process.execPath,[script],{cwd,env:{...env,...overrides},encoding:'utf8'});
    assert.equal(run().status,0);
    for(const overrides of [{WORKERS_CI_COMMIT_SHA:''},{WORKERS_CI_COMMIT_SHA:'0'.repeat(40)},{WORKERS_CI_BRANCH:'main'},{PLANFLO_STAGING_SCHEMA_TREE:''},{PLANFLO_STAGING_SCHEMA_TREE:'0'.repeat(40)}])assert.notEqual(run(overrides).status,0);
    writeFileSync(join(cwd,'untracked.txt'),'synthetic');assert.notEqual(run().status,0);rmSync(join(cwd,'untracked.txt'));
    writeFileSync(join(cwd,'drizzle/0000_fixture.sql'),'ALTERED');assert.notEqual(run().status,0);git('restore','drizzle/0000_fixture.sql');
    writeFileSync(join(cwd,'drizzle/0001_fixture.sql'),'CREATE TABLE added(id TEXT);\n');git('add','.');commit();
    const next=git('rev-parse','HEAD');assert.notEqual(run({WORKERS_CI_COMMIT_SHA:next}).status,0);
    assert.equal(run({WORKERS_CI_COMMIT_SHA:next,PLANFLO_STAGING_SCHEMA_TREE:git('rev-parse','HEAD:drizzle')}).status,0);
  }finally{rmSync(cwd,{recursive:true,force:true});}
});
