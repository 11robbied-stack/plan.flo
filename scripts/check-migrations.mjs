import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const baseline=JSON.parse(readFileSync('staging/migration-baseline.json','utf8'));
for(const [name,expected] of Object.entries(baseline.files)) {
  if(hash(readFileSync('drizzle/'+name))!==expected)throw new Error('Applied migration changed: '+name);
}
const files=readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort();
const journal=JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8')).entries;
if(files.length!==journal.length)throw new Error('Migration journal/file count mismatch');
for(const [i,entry] of journal.entries()) {
  if(entry.idx!==i||files[i]!==entry.tag+'.sql'||!files[i].startsWith(String(i).padStart(4,'0')+'_'))throw new Error('Migration sequence mismatch at '+i);
}
// This release is additive. Future intentional destructive migrations require a new reviewed policy.
for(const name of files.filter(f=>!(f in baseline.files))) {
  const sql=readFileSync('drizzle/'+name,'utf8');
  if(/\b(DROP|DELETE|REPLACE|TRUNCATE)\b|ALTER\s+TABLE[^;]*\b(RENAME|DROP)\b/i.test(sql))throw new Error('Non-additive migration: '+name);
}
console.log('Migration integrity passed: '+Object.keys(baseline.files).length+' applied migrations unchanged; '+files.length+' ordered migrations.');
