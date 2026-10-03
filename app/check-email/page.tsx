import CheckEmail from './check-email';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const p=await searchParams;return <CheckEmail purpose={p.purpose==='recovery'?'recovery':'verification'} returnTo={p.return_to}/>}
