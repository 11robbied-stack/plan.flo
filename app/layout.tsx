import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'PLAN.FLO',description:'Plan. Manage. Deliver. Project management for electrical contractors.',icons:{icon:'/planflo-icon.svg',shortcut:'/planflo-icon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-AU"><body>{children}</body></html>}
