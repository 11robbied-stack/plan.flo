import {getChatGPTUser} from '../chatgpt-auth';
import {isPlatformOwner} from '../platform-owner';
import {companyDb} from '../company-access';
export const demoHeaders={'Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow'};
/** Exact configured subject + verified email; tenant admin roles and client IDs confer no demo access. */
export async function demoAccessDenial():Promise<Response|null>{
 const user=await getChatGPTUser();
 if(!user)return Response.json({error:'Sign in required.'},{status:401,headers:demoHeaders});
 if(!isPlatformOwner(user))return Response.json({error:'Private demo access required.'},{status:403,headers:demoHeaders});
 try{const state=await companyDb().prepare('SELECT u.status AS user_status,a.status AS account_status FROM platform_users u JOIN platform_accounts a ON a.owner=u.owner WHERE u.id=?').bind(user.userId).first<{user_status:string;account_status:string}>();
 if(state?.user_status!=='Active'||state?.account_status!=='Active')return Response.json({error:'Private demo access unavailable.'},{status:403,headers:demoHeaders});
 }catch{return Response.json({error:'Private demo access unavailable.'},{status:503,headers:demoHeaders});}
 return null;
}
export async function demoMutationDenied(){return await demoAccessDenial()||Response.json({error:'This sample demo is view-only.'},{status:405,headers:{...demoHeaders,Allow:'GET'}});}
