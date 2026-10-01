import type {OperatorRole} from './operator-access';
export const taskStates=['Review','Open','In progress','Waiting','Done','Dismissed'];
export const leadStages=['New','Contacted','Demo requested','Demo planned','Won','Lost'];
export const priorities=['Normal','High','Urgent'];
export function categories(role:OperatorRole){return role==='owner'?['Support','Leads','Reconciliation','General']:role==='support'?['Support','Leads','General']:['Reconciliation']}
export const canSales=(role:OperatorRole)=>role==='owner'||role==='support';
export function melbourneTime(value:string){if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('Choose a valid date and time.');const target=Date.parse(value+':00Z');if(!Number.isFinite(target))throw Error('Choose a valid date and time.');let guess=target;for(let i=0;i<4;i++){const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Australia/Melbourne',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(guess)).map(x=>[x.type,x.value]));const actual=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);if(actual===target)return new Date(guess).toISOString();guess+=target-actual}throw Error('That local time does not exist due to daylight saving. Choose another time.')}
