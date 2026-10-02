import {invalidMutationOrigin} from '@/app/request-origin';
import {canAccessProject} from '@/app/project-access';
import {NextRequest,NextResponse} from 'next/server';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {companyDb,getCompanyAccess} from '@/app/company-access';
import {canAccess,fileTab} from '@/app/permissions';
export async function POST(req:NextRequest){if(invalidMutationOrigin(req))return new Response(JSON.stringify({error:'Invalid request origin'}),{status:403,headers:{'content-type':'application/json'}});try{
 const user=await getChatGPTUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 const access=await getCompanyAccess(user),b:any=await req.json(),projectId=String(b.projectId||''),category=String(b.category||'');
 if(!['plans','photos','sld','specifications'].includes(category))return NextResponse.json({error:'Folders are available for drawings, photos, SLD and specifications.'},{status:400});
 if(!canAccess(access,fileTab(category),true))return NextResponse.json({error:'You need edit access to organise these files.'},{status:403});
 const db=companyDb(),project=await db.prepare('SELECT id FROM projects WHERE id=? AND owner=?').bind(projectId,access.owner).first();if(!project||!canAccessProject(access,projectId))return NextResponse.json({error:'Project unavailable.'},{status:404});
 const folderId=String(b.folderId||'');
 if(b.action==='move'){
 const file=await db.prepare('SELECT id FROM files WHERE id=? AND project_id=? AND owner=? AND category=?').bind(String(b.fileId||''),projectId,access.owner,category).first();if(!file)return NextResponse.json({error:'File unavailable.'},{status:404});
 if(folderId){const folder=await db.prepare('SELECT id FROM file_folders WHERE id=? AND project_id=? AND owner=? AND category=?').bind(folderId,projectId,access.owner,category).first();if(!folder)return NextResponse.json({error:'Choose a folder in this section of the project.'},{status:400});}
 await db.prepare('UPDATE files SET folder_id=? WHERE id=? AND project_id=? AND owner=? AND category=?').bind(folderId,String(b.fileId),projectId,access.owner,category).run();return NextResponse.json({ok:true});}
 if(!['create','rename'].includes(b.action))return NextResponse.json({error:'Unknown folder action.'},{status:400});
 const name=String(b.name||'').trim().replace(/\s+/g,' ');if(!name||name.length>80)return NextResponse.json({error:'Use a folder name between 1 and 80 characters.'},{status:400});
 const nameKey=name.toLocaleLowerCase('en-AU');
 if(b.action==='rename'){const folder=await db.prepare('SELECT id FROM file_folders WHERE id=? AND project_id=? AND owner=? AND category=?').bind(folderId,projectId,access.owner,category).first();if(!folder)return NextResponse.json({error:'Folder unavailable.'},{status:404});}
 const duplicate=await db.prepare('SELECT id FROM file_folders WHERE project_id=? AND category=? AND name_key=? AND id<>?').bind(projectId,category,nameKey,b.action==='rename'?folderId:'').first();if(duplicate)return NextResponse.json({error:'A folder with that name already exists here.'},{status:409});
 if(b.action==='create'){const id=crypto.randomUUID();await db.prepare('INSERT INTO file_folders (id,owner,project_id,category,name,name_key,created) VALUES (?,?,?,?,?,?,?)').bind(id,access.owner,projectId,category,name,nameKey,new Date().toISOString()).run();return NextResponse.json({id});}
 await db.prepare('UPDATE file_folders SET name=?,name_key=? WHERE id=? AND project_id=? AND owner=? AND category=?').bind(name,nameKey,folderId,projectId,access.owner,category).run();return NextResponse.json({id:folderId});
 }catch(e){console.error('File folders',e);return NextResponse.json({error:'Could not save this folder change. Please try again.'},{status:500})}}
