import {staffKey} from './calendar-model';
export function shiftDay(day:string,offset:number){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)}
export function weekDays(day:string){const weekday=new Date(day+'T12:00:00Z').getUTCDay();const monday=shiftDay(day,-((weekday+6)%7));return Array.from({length:7},(_,i)=>shiftDay(monday,i))}
export function workerRows(rows:any[],names:string[]){const workers=new Map<string,string>();for(const name of [...names,...rows.map(r=>r.data.employee||'Unassigned')]){const key=staffKey(name);if(key&&!workers.has(key))workers.set(key,name.trim())}return [...workers].map(([key,name])=>({key,name})).sort((a,b)=>a.name.localeCompare(b.name))}
export const timeEntryDay=(row:any)=>row.data.date||row.created.slice(0,10);
export function workerDayEntries(rows:any[],worker:string,day:string){return rows.filter(r=>staffKey(r.data.employee||'Unassigned')===worker&&timeEntryDay(r)===day)}
export const sumHours=(rows:any[])=>Math.round(rows.reduce((s,r)=>s+Math.round(Number(r.data.hours||0)*100),0))/100;
