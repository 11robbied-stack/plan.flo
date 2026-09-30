export const accountStatuses=['Active','Suspended','Closed'] as const;
export const userStatuses=['Active','Suspended'] as const;
export const ticketStatuses=['New','Reviewing','Planned','Resolved','Closed'] as const;
export const ticketPriorities=['Low','Normal','High','Urgent'] as const;
export const ticketCategories=['Bug','Feature request','Question','Praise','Other'] as const;
export function ticketDefaults(type:string,impact:string){return {category:type==='Problem'?'Bug':type==='Improvement'?'Feature request':type==='Question'?'Question':type==='Positive feedback'?'Praise':'Other',priority:impact==='Blocking work'?'Urgent':impact==='Slowing work'?'High':'Normal'};}
export function cleanText(value:unknown,max=500){return String(value??'').trim().slice(0,max);}
export function adminEmails(value:string|undefined){return (value||'').split(',').map(x=>x.trim().toLowerCase()).filter(x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));}
export function validEmail(value:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=254;}
