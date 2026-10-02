import type {Access} from './permissions';

/** The project set is resolved server-side on every request, never from client input. */
export function canAccessProject(access: Access, projectId: string): boolean {
  return !access.blocked && !!projectId &&
    (access.role !== 'member' || access.projectIds?.includes(projectId) === true);
}

/** Company resources (logos/templates) deliberately have no project assignment. */
export function canAccessFileProject(access: Access, file: {projectId: string; category: string}): boolean {
  return ['logo', 'builder-logo'].includes(file.category)
    ? !access.blocked && file.projectId === ''
    : canAccessProject(access, file.projectId);
}

/** For paginated queries: filter before LIMIT/OFFSET, with bound project IDs. */
export function projectScope(access: Access, column: 'a.project_id') {
  const ids = access.projectIds ?? [];
  return access.blocked ? {sql:'0=1',args:[] as string[]}
    : access.role !== 'member' ? {sql:'1=1',args:[] as string[]}
    : {sql:ids.length ? `${column} IN (SELECT value FROM json_each(?))` : '0=1', args:ids.length?[JSON.stringify(ids)]:[]};
}
