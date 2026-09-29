import Home from './workspace-client';
import {getChatGPTUser} from './chatgpt-auth';
import {WelcomeScreen} from './welcome-screen';
export const dynamic='force-dynamic';
export default async function Page(){return await getChatGPTUser()?<Home/>:<WelcomeScreen/>}
