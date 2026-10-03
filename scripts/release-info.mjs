import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
export function releaseInfo() {
  const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const dirty=!!execFileSync('git',['status','--porcelain','--untracked-files=normal'],{encoding:'utf8'}).trim();
  const schemaTree=execFileSync('git',['rev-parse','HEAD:drizzle'],{encoding:'utf8'}).trim();
  const migration=JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8')).entries.at(-1).idx;
  return {commit,dirty,buildId:commit.slice(0,12)+(dirty?'-dirty':''),migration,schemaTree};
}
