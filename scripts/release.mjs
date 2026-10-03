import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {releaseInfo} from './release-info.mjs';
const run=(file,args=[])=>execFileSync(process.execPath,[file,...args],{stdio:'inherit'});
const digest=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const inventory=()=>Object.fromEntries(['dist/server','dist/client','drizzle','staging'].flatMap(dir=>readdirSync(dir,{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>e.parentPath+'/'+e.name)).filter(f=>!f.startsWith('staging/')||f==='staging/wrangler.staging.json'||f==='staging/migration-baseline.json').sort().map(file=>[file,digest(file)]));
const mode=process.argv[2];
if(mode==='check') {
  run('scripts/check-migrations.mjs');run('scripts/check-migration-upgrade.mjs');run('scripts/check-staging.mjs');
  run('node_modules/typescript/bin/tsc',['-p','test-audit/tsconfig.app.json']);
  run('test-audit/build-harness.mjs');run('test-audit/run.mjs');
  for(const file of ['check-invoice-workflow','check-purchase-order-number','check-pdf-exports'])run('scripts/'+file+'.mjs');
  execFileSync(process.execPath,['--test',...readdirSync('tests/auth-email').filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/auth-email/'+f)],{stdio:'inherit'});
} else if(mode==='prepare') {
  if(releaseInfo().dirty)throw new Error('Commit reviewed changes before preparing a release.');
  run('scripts/release.mjs',['check']);run('scripts/run-framework.mjs',['build']);run('test-audit/browser-acceptance.mjs');
  const info=releaseInfo();if(info.dirty)throw new Error('Checks changed tracked source; review and commit before retrying.');
  writeFileSync('dist/release-manifest.json',JSON.stringify({...info,files:inventory()},null,2)+'\n');
  console.log('Prepared '+info.buildId+'. No deployment or remote migration performed.');
} else if(mode==='verify') {
  const saved=JSON.parse(readFileSync('dist/release-manifest.json','utf8')),current=releaseInfo();
  if(current.dirty||saved.dirty||saved.commit!==current.commit||JSON.stringify(saved.files)!==JSON.stringify(inventory()))throw new Error('Release source, configuration or artifacts changed. Prepare again.');
  run('scripts/check-migrations.mjs');console.log('Verified '+current.buildId+'. Deployment still requires approval and confirmed remote migration state.');
} else throw new Error('Expected check, prepare or verify.');
