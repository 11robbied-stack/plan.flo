import AuthForm from './login/auth-form';
import {redirect} from 'next/navigation';
import {managedSitesAuth} from './auth-runtime';
import {companyDb} from './company-access';
import Home from './workspace-client';
import {getChatGPTUser,chatGPTSignOutPath} from './chatgpt-auth';
import {getCompanyAccess} from './company-access';
import {WelcomeScreen} from './welcome-screen';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const params=await searchParams;if(params.invite)redirect("/join?token="+encodeURIComponent(params.invite));const user=await getChatGPTUser();if(!user)return managedSitesAuth()?<WelcomeScreen/>:<AuthForm/>;if(!managedSitesAuth()&&!await companyDb().prepare('SELECT 1 FROM company_members WHERE user_id=? UNION SELECT 1 FROM settings WHERE owner=?').bind(user.userId,user.userId).first())redirect('/onboarding');const access=await getCompanyAccess(user);if(access.blocked)return <main className="welcome-screen"><section className="welcome-card"><h1>Workspace access unavailable</h1><p>Your account or company access is currently disabled. Contact your company administrator or PLAN.FLO support.</p>{access.platformAdmin&&<p><a href="/admin">Open platform administration</a></p>}<a href={chatGPTSignOutPath('/welcome')}>Sign out or switch account</a></section></main>;return <Home/>}
