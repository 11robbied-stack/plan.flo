import {buildId} from '@/app/build-version';
export function GET(){return Response.json({buildId},{headers:{'cache-control':'no-store'}});}
