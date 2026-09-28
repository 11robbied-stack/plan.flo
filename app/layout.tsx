import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Stima',description:'Drawings, tasks and project costs for electrical contractors.',icons:{icon:'/stima-icon.svg',shortcut:'/stima-icon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-AU"><body>{children}</body></html>}
