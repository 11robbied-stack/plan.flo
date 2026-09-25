import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'PlanWire Projects',description:'Plans, tasks and project costs for electrical contractors.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-AU"><body>{children}</body></html>}
