import type {Access} from './permissions';
import {canAccessProject} from './project-access';

/** Unassigned invoices belong to the company inbox and are administrator-only. */
export function canAccessInvoice(access:Access, projectId:string) {
  return projectId ? canAccessProject(access,projectId) : !access.blocked&&access.role!=='member';
}
/** Apply assignment restrictions before pagination, including the company inbox. */
export function invoiceScope(access:Access) {
  const ids=access.projectIds??[];
  return access.blocked?{sql:'0=1',args:[] as string[]}:
    access.role!=='member'?{sql:'1=1',args:[] as string[]}:
    {sql:ids.length?'i.project_id IN (SELECT value FROM json_each(?))':'0=1',args:ids.length?[JSON.stringify(ids)]:[]};
}
