import {getChatGPTUser,chatGPTSignInPath} from '../chatgpt-auth';
import {isPlatformAdmin} from '../platform-store';
import AdminConsole from './admin-console';
export const dynamic='force-dynamic';
export const metadata={title:'PLAN.FLO Admin',robots:{index:false,follow:false}};
export default async function Page(){const user=await getChatGPTUser();if(!user||!isPlatformAdmin(user))return <main className="welcome-screen"><section className="welcome-card"><h1>PLAN.FLO Admin</h1><p>{user?'This area is reserved for PLAN.FLO platform administrators.':'Sign in with your platform administrator account.'}</p><a href={user?'/':chatGPTSignInPath('/admin')}>{user?'Back to workspace':'Sign in'}</a></section></main>;return <AdminConsole/>;}
