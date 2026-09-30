import Home from './workspace-client';
import {getChatGPTUser,chatGPTSignOutPath} from './chatgpt-auth';
import {getCompanyAccess} from './company-access';
import {WelcomeScreen} from './welcome-screen';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();if(!user)return <WelcomeScreen/>;const access=await getCompanyAccess(user);if(access.blocked)return <main className="welcome-screen"><section className="welcome-card"><h1>Workspace access unavailable</h1><p>Your account or company access is currently disabled. Contact your company administrator or PLAN.FLO support.</p>{access.platformAdmin&&<p><a href="/admin">Open platform administration</a></p>}<a href={chatGPTSignOutPath('/welcome')}>Sign out or switch account</a></section></main>;return <Home/>}
