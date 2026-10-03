import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
const require=createRequire(import.meta.url);const {Miniflare}=createRequire(require.resolve('wrangler/package.json'))('miniflare');
const dir='staging/bootstrap/';const steps=JSON.parse(readFileSync(dir+'steps.json'));const expected=JSON.parse(readFileSync(dir+'expected-schema.json'));
const mf=new Miniflare({host:'127.0.0.1',port:0,modules:true,script:'export default {fetch(){return new Response("local bootstrap verification")}}',compatibilityDate:'2026-05-15',d1Databases:{DB:'isolated-bootstrap-verification'},outboundService:()=>new Response('External network disabled',{status:503})});
try {await mf.ready;const db=await mf.getD1Database('DB');for(const step of steps)await db.prepare(step.sql).run();
const query="SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 ELSE 2 END,name";
const actual=(await db.prepare(query).all()).results;
if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Schema differs from complete migration replay');
const seed=await db.prepare('SELECT * FROM review_config').all();for(const step of steps)await db.prepare(step.sql).run();
if(JSON.stringify(seed.results)!==JSON.stringify((await db.prepare('SELECT * FROM review_config').all()).results))throw Error('Seed changed on retry');
const ledger=readFileSync(dir+'02-record-migrations-AFTER-verification.sql','utf8').trim().split('\n');for(let i=0;i<2;i++)for(const sql of ledger)await db.prepare(sql).run();
const names=(await db.prepare('SELECT name FROM d1_migrations ORDER BY name').all()).results.map(r=>r.name);if(JSON.stringify(names)!==JSON.stringify(readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort()))throw Error('Ledger mismatch');
const fk=await db.prepare('PRAGMA foreign_key_check').all();if(fk.results.length)throw Error('Foreign key failure');
const result={engine:'local Miniflare/workerd D1',exactSchemaEquivalence:true,repeatAll140Statements:true,seedPreserved:true,ledgerExactly27AfterRepeat:true,foreignKeyCheck:true,remoteExecuted:false};writeFileSync(dir+'LOCAL-D1-RESULTS.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await mf.dispose()}
