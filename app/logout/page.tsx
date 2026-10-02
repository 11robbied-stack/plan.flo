'use client';
import {useState} from 'react';
export default function Logout(){const [error,setError]=useState('');return <main className="welcome-screen"><section className="welcome-card"><h1>Sign out</h1><button onClick={async()=>{const r=await fetch('/api/auth/sign-out',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});if(r.ok)window.location.assign(new URL('/login',window.location.origin).href);else setError('Unable to sign out. Please retry.')}}>Confirm sign out</button>{error&&<p role="alert">{error}</p>}</section></main>}
