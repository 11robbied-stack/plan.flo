import {execFileSync} from 'node:child_process';
export function releaseInfo() {
  const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const dirty=!!execFileSync('git',['status','--porcelain','--untracked-files=normal'],{encoding:'utf8'}).trim();
  return {commit,dirty,buildId:commit.slice(0,12)+(dirty?'-dirty':''),migration:27};
}
