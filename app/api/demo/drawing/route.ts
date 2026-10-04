import {NextRequest} from 'next/server';
import {demoAccessDenial,demoHeaders,demoMutationDenied} from '@/app/demo/demo-access';
import {demoDrawingSvg} from '@/app/demo/demo-data';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){const denial=await demoAccessDenial();if(denial)return denial;if(req.nextUrl.search)return Response.json({error:'This demo has no selectable attachment.'},{status:400,headers:demoHeaders});return new Response(demoDrawingSvg(),{headers:{...demoHeaders,'Content-Type':'image/svg+xml; charset=utf-8','Content-Security-Policy':"default-src 'none'; sandbox",'X-Content-Type-Options':'nosniff'}});}
export const POST=demoMutationDenied,PUT=demoMutationDenied,PATCH=demoMutationDenied,DELETE=demoMutationDenied;
