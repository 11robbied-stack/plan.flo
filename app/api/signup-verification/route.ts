import {authEnvironment} from '../../auth-runtime';
export function GET(){const e=authEnvironment() as ReturnType<typeof authEnvironment>&{TURNSTILE_SITE_KEY?:string;TURNSTILE_SECRET_KEY?:string};return Response.json({siteKey:e.TURNSTILE_SECRET_KEY?e.TURNSTILE_SITE_KEY||'':''},{headers:{'Cache-Control':'no-store'}});}
