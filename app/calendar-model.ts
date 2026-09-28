export function localDateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
export function entryDay(record:{created:string;data:string}){let d:any={};try{d=JSON.parse(record.data)}catch{}return /^\d{4}-\d{2}-\d{2}$/.test(d.date)?d.date:record.created.slice(0,10)}
export function staffKey(name:string){return name.trim().replace(/\s+/g,' ').toLowerCase()}
const palette=['#6250e8','#087f8c','#b34820','#2670b8','#a13d88','#478128','#b27700','#6849a4'];
export function staffColour(name:string,colours:Record<string,string>={}){const key=staffKey(name);if(/^#[0-9a-f]{6}$/i.test(colours[key]||''))return colours[key];let hash=0;for(const c of key)hash=(hash*31+c.charCodeAt(0))>>>0;return palette[hash%palette.length]}
export function monthDays(year:number,month:number){const start=new Date(year,month,1),offset=(start.getDay()+6)%7;return Array.from({length:Math.ceil((offset+new Date(year,month+1,0).getDate())/7)*7},(_,i)=>new Date(year,month,i-offset+1))}
