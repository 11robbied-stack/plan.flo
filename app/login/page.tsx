import AuthForm from './auth-form';
export default async function Login({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const p=await searchParams;return <AuthForm returnTo={p.return_to} token={p.token}/>}
