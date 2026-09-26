import {NextRequest,NextResponse} from 'next/server';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {companyDb,getCompanyAccess} from '@/app/company-access';
import {canAccess,fileTab} from '@/app/permissions';
export async function POST(req:NextRequest){try{
 const user=await getChatGPTUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 const access=await getCompanyAccess(user),b:any=await req.json(),projectId=String(b.projectId||''),category=String(b.category||'');
 if(!['plans','photos'].includes(category)||!['move','rename','archive','restore'].includes(b.action))return NextResponse.json({error:'Invalid file action.'},{status:400});
 if(!canAccess(access,fileTab(category),true))return NextResponse.json({error:'Edit access is required.'},{status:403});
 if(!Array.isArray(b.ids)||!b.ids.length||b.ids.length>50||b.ids.some((id:unknown)=>typeof id!=='string'))return NextResponse.json({error:'Select between 1 and 50 files.'},{status:400});
 const ids=[...new Set<string>(b.ids)],db=companyDb(),placeholders=ids.map(()=>'?').join(',');
 const project=await db.prepare('SELECT id FROM projects WHERE id=? AND owner=?').bind(projectId,access.owner).first();if(!project)return NextResponse.json({error:'Project unavailable.'},{status:404});
 const found=await db.prepare(`SELECT id,name,archived FROM files WHERE project_id=? AND owner=? AND category=? AND id IN (${placeholders})`).bind(projectId,access.owner,category,...ids).all<{id:string;name:string;archived:number}>();
 if(found.results.length!==ids.length)return NextResponse.json({error:'One or more files are unavailable. No files were changed.'},{status:404});
 let field='',value:string|number='';
 if(b.action==='rename'){if(ids.length!==1)return NextResponse.json({error:'Rename one file at a time.'},{status:400});const original=found.results[0].name,extension=original.match(/\.[^.]+$/)?.[0]||'',base=String(b.name||'').trim();if(!base||base.length+extension.length>250||/[\\/\u0000-\u001f]/.test(base))return NextResponse.json({error:'Enter a valid file name, up to 250 characters including its extension.'},{status:400});field='name';value=base+extension;}
 else if(b.action==='move'){const folderId=String(b.folderId||'');if(folderId){const f=await db.prepare('SELECT id FROM file_folders WHERE id=? AND owner=? AND project_id=? AND category=?').bind(folderId,access.owner,projectId,category).first();if(!f)return NextResponse.json({error:'Choose a folder in this project and section.'},{status:400});}field='folder_id';value=folderId;}
 else{field='archived';value=b.action==='archive'?1:0;}
 await db.prepare(`UPDATE files SET ${field}=? WHERE owner=? AND project_id=? AND category=? AND id IN (${placeholders})`).bind(value,access.owner,projectId,category,...ids).run();
 return NextResponse.json({ok:true,count:ids.length});
 }catch(e){console.error('Manage files',e);return NextResponse.json({error:'Could not update the files. Please try again.'},{status:500})}}
