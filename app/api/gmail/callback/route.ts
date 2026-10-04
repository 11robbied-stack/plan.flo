import {integrationSetup} from '@/app/integration-config';
import {NextRequest,NextResponse} from 'next/server';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {getCompanyAccess} from '@/app/company-access';
import {completeGmail} from '@/app/gmail-service';
export async function GET(req:NextRequest){const user=await getChatGPTUser();if(!user)return new Response('Sign in to PLAN.FLO and reconnect Gmail from Settings > Integrations.',{status:401});const access=await getCompanyAccess(user);if(access.blocked||access.role==='member')return new Response('Administrator access required.',{status:403});try{if(!integrationSetup('gmail',req.nextUrl.origin).ready)throw new Error('Gmail setup does not match this site.');if(req.nextUrl.searchParams.has('error'))throw new Error('Google connection cancelled.');const code=req.nextUrl.searchParams.get('code'),state=req.nextUrl.searchParams.get('state');if(!code||!state)throw new Error('Connection response was incomplete.');await completeGmail(access.owner,user.userId,state,code);return NextResponse.redirect(new URL('/?gmail=connected',req.url));}catch{return NextResponse.redirect(new URL('/?gmail=failed',req.url));}}
