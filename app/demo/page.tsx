import {notFound} from 'next/navigation';
import {demoAccessDenial} from './demo-access';
import {buildDemoData} from './demo-data';
import DemoWorkspace from './demo-workspace';
import './demo.css';
export const dynamic='force-dynamic';
export const revalidate=0;
export const metadata={title:'Private demo · PLAN.FLO',robots:{index:false,follow:false}};
export default async function Page(){if(await demoAccessDenial())notFound();return <DemoWorkspace data={buildDemoData()}/>;}
