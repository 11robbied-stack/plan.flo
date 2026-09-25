import {env} from 'cloudflare:workers';
import {NextRequest,NextResponse} from 'next/server';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {getDb} from '@/db';
import {files} from '@/db/schema';
import {and,eq} from 'drizzle-orm';
export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){const u=await getChatGPTUser();if(!u)return new Response('Unauthorized',{status:401});const {id}=await params;const f=await getDb().select().from(files).where(and(eq(files.id,id),eq(files.owner,u.userId))).get();if(!f)return new Response('Not found',{status:404});const obj=await (env as any).FILES.get(`${u.userId}/${id}`);if(!obj)return new Response('Not found',{status:404});return new Response(obj.body,{headers:{'Content-Type':f.mime,'Content-Disposition':`${f.mime==='application/pdf'||f.mime.startsWith('image/')?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name)}`,'Cache-Control':'private, max-age=60','X-Content-Type-Options':'nosniff','Content-Security-Policy':'sandbox'}})}
