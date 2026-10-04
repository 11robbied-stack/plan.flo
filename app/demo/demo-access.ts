import {getChatGPTUser} from '../chatgpt-auth';
import {isDemoOwner,activeDemoOwner} from '../demo-owner';
export const demoHeaders={'Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow'};
/** Exact configured subject + verified email; tenant admin roles and client IDs confer no demo access. */
export async function demoAccessDenial():Promise<Response|null>{
 const user=await getChatGPTUser();
 if(!user)return Response.json({error:'Sign in required.'},{status:401,headers:demoHeaders});
 if(!isDemoOwner(user))return Response.json({error:'Private demo access required.'},{status:403,headers:demoHeaders});
 try{if(!await activeDemoOwner(user))return Response.json({error:'Private demo access unavailable.'},{status:403,headers:demoHeaders});
 }catch{return Response.json({error:'Private demo access unavailable.'},{status:503,headers:demoHeaders});}
 return null;
}
export async function demoMutationDenied(){return await demoAccessDenial()||Response.json({error:'This sample demo is view-only.'},{status:405,headers:{...demoHeaders,Allow:'GET'}});}
