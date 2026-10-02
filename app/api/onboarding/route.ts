import {getChatGPTUser} from '@/app/chatgpt-auth';
import {companyDb} from '@/app/company-access';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid request origin'},{status:403});
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in required'},{status:401});
 let company:string;try{const b=await request.json() as {company?:unknown};company=typeof b.company==='string'?b.company.trim():'';}catch{return Response.json({error:'Invalid request'},{status:400});}
 if(!company||company.length>120)return Response.json({error:'Enter a company name, up to 120 characters.'},{status:400});
 const db=companyDb();
 const disabled=await db.prepare("SELECT 1 FROM platform_users WHERE id=? AND status!='Active' UNION SELECT 1 FROM platform_accounts WHERE owner=? AND status!='Active'").bind(user.userId,user.userId).first();
 if(disabled)return Response.json({error:'Account access is disabled.'},{status:403});
 try{
  // Atomic insert and migration trigger serialize company creation against invitation acceptance.
  const result=await db.prepare('INSERT INTO settings(owner,company,email) SELECT ?,?,? WHERE NOT EXISTS(SELECT 1 FROM company_members WHERE user_id=?) ON CONFLICT(owner) DO NOTHING').bind(user.userId,company,user.email,user.userId).run();
  if(!result.meta.changes)return Response.json({error:'You already own or belong to a company.'},{status:409});
  return Response.json({ok:true},{status:201});
 }catch{return Response.json({error:'Company creation could not complete. Please retry.'},{status:409});}
}
