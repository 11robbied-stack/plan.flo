import {companyDb,getCompanyAccess} from '@/app/company-access';
import {canAccess,fileTab} from '@/app/permissions';
import {env} from 'cloudflare:workers';
import {NextRequest,NextResponse} from 'next/server';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {getDb} from '@/db';
import {files} from '@/db/schema';
import {and,eq} from 'drizzle-orm';
export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){const u=await getChatGPTUser();if(!u)return new Response('Unauthorized',{status:401});const access=await getCompanyAccess(u);if(access.blocked)return new Response('Forbidden',{status:403});const {id}=await params;const f=await getDb().select().from(files).where(and(eq(files.id,id),eq(files.owner,access.owner))).get();if(!f)return new Response('Not found',{status:404});if(f.category!=='logo'&&!canAccess(access,fileTab(f.category)))return new Response('Forbidden',{status:403});let objectId=f.currentRevisionId||id;let meta={mime:f.mime,name:f.name};const revision=_req.nextUrl.searchParams.get('revision');if(revision){const r:any=await companyDb().prepare('SELECT * FROM plan_revisions WHERE id=? AND file_id=?').bind(revision,id).first();if(r){objectId=r.id;meta=r;}else if(revision===id&&!f.currentRevisionId){objectId=id;}else return new Response('Revision not found',{status:404});}const obj=await (env as any).FILES.get(`${access.owner}/${objectId}`);if(!obj)return new Response('Not found',{status:404});return new Response(obj.body,{headers:{'Content-Type':meta.mime,'Content-Disposition':`${meta.mime==='application/pdf'||meta.mime.startsWith('image/')?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(meta.name)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':'sandbox'}})}
