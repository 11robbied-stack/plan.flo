export const taskStatuses=['To Do','In Progress','Blocked','Complete'];
export const taskPriorities=['Low','Normal','High','Urgent'];
export function localDay(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function taskBucket(task:any,today=localDay()){if(task.status==='Complete')return 'Completed';const due=task.data.due;return !due||due>today?'Upcoming':due<today?'Overdue':'Due today'}
