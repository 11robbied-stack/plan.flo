import {NextRequest} from 'next/server';
import {demoAccessDenial,demoHeaders,demoMutationDenied} from '@/app/demo/demo-access';
import {buildDemoData} from '@/app/demo/demo-data';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){const denial=await demoAccessDenial();if(denial)return denial;if(req.nextUrl.search)return Response.json({error:'This demo has no selectable tenant or project.'},{status:400,headers:demoHeaders});return Response.json(buildDemoData(),{headers:demoHeaders});}
export const POST=demoMutationDenied,PUT=demoMutationDenied,PATCH=demoMutationDenied,DELETE=demoMutationDenied;
