import {requireChatGPTUser} from '@/app/chatgpt-auth';
import JoinForm from './join-form';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const p=await searchParams;const token=p.token||'';await requireChatGPTUser('/join?token='+encodeURIComponent(token));return <JoinForm token={token}/>}
