from pathlib import Path
import sqlite3,json,re,hashlib,subprocess
root=Path.cwd(); out=root/'staging/bootstrap'
c=sqlite3.connect(':memory:');c.execute('PRAGMA foreign_keys=ON')
files=sorted((root/'drizzle').glob('*.sql'));assert len(files)==27
for p in files:c.executescript(p.read_text())
schema=[dict(zip(['type','name','tbl_name','sql'],r)) for r in c.execute("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 ELSE 2 END,name")]
tables=[r['name'] for r in schema if r['type']=='table']
counts={t:c.execute('SELECT count(*) FROM "'+t+'"').fetchone()[0] for t in tables}
assert {t:n for t,n in counts.items() if n}=={'review_config':1}
assert c.execute('SELECT key FROM review_config').fetchall()==[('tracking_started',)]
steps=[]
for row in schema:
 sql=re.sub(r'^CREATE (UNIQUE )?(TABLE|INDEX|TRIGGER) ',lambda m:'CREATE '+(m[1] or '')+m[2]+' IF NOT EXISTS ',row['sql'],count=1)+';'
 steps.append({'object':row['name'],'sql':sql})
steps.append({'object':'review_config seed','sql':"INSERT INTO review_config(key,value) VALUES ('tracking_started',strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(key) DO NOTHING;"})
ledger="CREATE TABLE IF NOT EXISTS d1_migrations(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE,applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);"
ledger+='\n'+ '\n'.join("INSERT INTO d1_migrations(name) VALUES ('"+p.name+"') ON CONFLICT(name) DO NOTHING;" for p in files)
(out/'01-bootstrap.sql').write_text('\n\n'.join(s['sql'] for s in steps)+'\n')
(out/'02-record-migrations-AFTER-verification.sql').write_text(ledger+'\n')
(out/'steps.json').write_text(json.dumps(steps,indent=2)+'\n')
(out/'expected-schema.json').write_text(json.dumps(schema,indent=2)+'\n')
pre="SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name<>'d1_migrations' ORDER BY type,name;"
(out/'00-read-only-preflight.sql').write_text(pre+'\n')
verify=pre+'\nPRAGMA foreign_key_check;\nPRAGMA quick_check;\n'+ '\n'.join('SELECT '+repr(t)+' AS table_name,count(*) AS rows FROM "'+t+'";' for t in tables)
(out/'03-read-only-verification.sql').write_text(verify+'\n')
(out/'04-read-only-ledger.sql').write_text('SELECT name FROM d1_migrations ORDER BY name;\n')
# Independently replay bootstrap and repeat every step: schema, seed and ledger must stay unchanged.
b=sqlite3.connect(':memory:');b.execute('PRAGMA foreign_keys=ON')
for step in steps:b.execute(step['sql'])
first=list(b.execute("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type,name"))
original=list(c.execute("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type,name"))
assert first==original, 'bootstrap schema drift'
seed=b.execute('SELECT * FROM review_config').fetchall()
for step in steps:b.execute(step['sql'])
assert b.execute('SELECT * FROM review_config').fetchall()==seed
b.executescript(ledger);b.executescript(ledger)
assert b.execute('SELECT count(*) FROM d1_migrations').fetchone()[0]==27
assert not b.execute('PRAGMA foreign_key_check').fetchall()
manifest={'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'database_name':'planflo-staging-db','database_id':'047774fa-ac31-45a1-b9a8-0144cc6c8e79','migrations':[{'name':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files],'objects':{typ:sum(r['type']==typ for r in schema) for typ in ['table','index','trigger']},'bootstrap_statements':len(steps),'sqlite_tests':{'exact_schema_equivalence':True,'repeat_all_statements':True,'seed_preserved':True,'ledger_repeat_27_rows':True,'foreign_key_check':True},'remote_executed':False}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({k:v for k,v in manifest.items() if k!='migrations'},indent=2))
