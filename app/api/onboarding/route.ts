import {companyProfile,RegistrationError} from '@/app/registration-profile';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {companyDb} from '@/app/company-access';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid request origin'},{status:403});
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in required'},{status:401});
 const db=companyDb();
 let profile:ReturnType<typeof companyProfile>;
 try{const body=await request.json() as Record<string,unknown>;if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();
 const draft=user.userId.startsWith('auth:')?await db.prepare('SELECT business_name AS businessName,abn,address,phone,rec FROM auth_user WHERE id=?').bind(user.userId.slice(5)).first<Record<string,unknown>>():null;
 profile=companyProfile({...draft,...body,...(body.company!==undefined?{businessName:body.company}:{})});
 }catch(error){return Response.json({error:error instanceof RegistrationError?error.message:'Invalid registration details.'},{status:400});}
 const disabled=await db.prepare("SELECT 1 FROM platform_users WHERE id=? AND status!='Active' UNION SELECT 1 FROM platform_accounts WHERE owner=? AND status!='Active'").bind(user.userId,user.userId).first();
 if(disabled)return Response.json({error:'Account access is disabled.'},{status:403});
 try{
  // Atomic insert and migration trigger serialize company creation against invitation acceptance.
  const result=await db.prepare('INSERT INTO settings(owner,company,email,abn,address,phone,rec) SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM company_members WHERE user_id=?) ON CONFLICT(owner) DO NOTHING').bind(user.userId,profile.businessName,user.email,profile.abn,profile.address,profile.phone,profile.rec,user.userId).run();
  if(!result.meta.changes)return Response.json({error:'You already own or belong to a company.'},{status:409});
  return Response.json({ok:true},{status:201});
 }catch{return Response.json({error:'Company creation could not complete. Please retry.'},{status:409});}
}
