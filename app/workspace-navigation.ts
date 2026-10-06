'use client';
import {useEffect,useRef,useState} from 'react';
export type WorkspaceNavigation={selected:string;section:string;workspaceView:string};
const initial:WorkspaceNavigation={selected:'',section:'Overview',workspaceView:'Dashboard'};
const views=['Dashboard','Projects','My Tasks','Schedule','Time Sheets'];
export function readWorkspaceNavigation(search:string):WorkspaceNavigation{
 const q=new URLSearchParams(search),selected=(q.get('project')||'').slice(0,200),section=(q.get('tab')||'Overview').slice(0,80),view=q.get('view')||'Dashboard';
 const callback=!q.has('view')&&!q.has('tab')&&!selected&&['billing','gmail','xero'].some(k=>q.has(k));
 return {selected,section:view==='Settings'||callback?'Settings':selected?section:'Overview',workspaceView:views.includes(view)?view:'Dashboard'};
}
function navigationUrl(state:WorkspaceNavigation){const url=new URL(window.location.href);for(const key of ['project','tab','view'])url.searchParams.delete(key);if(state.selected){url.searchParams.set('project',state.selected);url.searchParams.set('tab',state.section)}else url.searchParams.set('view',state.section==='Settings'?'Settings':state.workspaceView);return url.pathname+url.search+url.hash;}
export function useWorkspaceNavigation(){
 const [navigation,setNavigation]=useState(initial),last=useRef(JSON.stringify(initial)),firstWrite=useRef(true);
 useEffect(()=>{const restore=()=>{const next=readWorkspaceNavigation(window.location.search);last.current=JSON.stringify(next);setNavigation(next)};restore();window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore)},[]);
 useEffect(()=>{if(firstWrite.current){firstWrite.current=false;return}const signature=JSON.stringify(navigation);if(signature===last.current)return;window.history.pushState(null,'',navigationUrl(navigation));last.current=signature},[navigation]);
 const setSelected=(selected:string)=>setNavigation(n=>({...n,selected}));
 const setSection=(section:string)=>setNavigation(n=>({...n,section}));
 const setWorkspaceView=(workspaceView:string)=>setNavigation(n=>({...n,workspaceView}));
 const replaceNavigation=(next:WorkspaceNavigation)=>{last.current=JSON.stringify(next);window.history.replaceState(null,'',navigationUrl(next));setNavigation(next)};
 return {...navigation,navigation,setSelected,setSection,setWorkspaceView,replaceNavigation};
}
