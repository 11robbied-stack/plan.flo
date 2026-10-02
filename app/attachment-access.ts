import {companyDb} from './company-access';
import {canAccess,fileTab,type Access} from './permissions';
import {canAccessProject} from './project-access';

export class AttachmentError extends Error {}

/** Validate every supported attachment reference, including nested generic record JSON. */
export async function validateRecordAttachments(access:Access, projectId:string, data:unknown) {
  if (!canAccessProject(access, projectId)) throw new AttachmentError('Project unavailable.');
  const ids = new Set<string>();
  const plans = new Set<string>();
  const revisions = new Set<string>();
  function collect(value:unknown, depth=0) {
    if(depth>20) throw new AttachmentError('Record nesting is too deep.');
    if(!value || typeof value!=='object') return;
    for(const [key,item] of Object.entries(value)) {
      if(/^(fileId|photoId|planId|logoFileId|attachmentId)$/.test(key)) {
        if(typeof item!=='string' || !item || item.length>100) throw new AttachmentError('Invalid attachment reference.');
        ids.add(item); if(key==='planId') plans.add(item);
      } else if(/^(fileIds|photoIds|attachmentIds)$/.test(key)) {
        if(!Array.isArray(item)||item.length>100||item.some(id=>typeof id!=='string'||!id||id.length>100)) throw new AttachmentError('Invalid attachment references.');
        item.forEach(id=>ids.add(id));
      } else if(key==='revisionId') {
        if(typeof item!=='string'||!item||item.length>100) throw new AttachmentError('Invalid drawing revision.');
        revisions.add(item);
      } else collect(item,depth+1);
    }
  }
  collect(data);
  if(ids.size>100) throw new AttachmentError('Too many attachment references.');
  const db=companyDb();
  for(const id of ids) {
    const file=await db.prepare('SELECT category FROM files WHERE id=? AND owner=? AND project_id=? AND archived=0').bind(id,access.owner,projectId).first<{category:string}>();
    if(!file || !canAccess(access,fileTab(file.category)) || plans.has(id)&&file.category!=='plans') throw new AttachmentError('An attachment is unavailable for this project.');
  }
  for(const id of revisions) {
    if(plans.size!==1) throw new AttachmentError('A revision must reference its drawing.');
    const plan=[...plans][0];
    if(id!==plan&&!await db.prepare('SELECT id FROM plan_revisions WHERE id=? AND file_id=?').bind(id,plan).first()) throw new AttachmentError('The revision does not belong to this drawing.');
  }
}
