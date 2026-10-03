export type Reference={reference:string;projectId:string;projectName:string};
export function matchInvoice(text:string,references:Reference[]){
 const normal=text.toUpperCase().replace(/[–—]/g,'-').replace(/\s*-\s*/g,'-');
 const matches=references.filter(r=>{const value=r.reference.toUpperCase().trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return value.length>=4&&new RegExp(`(^|[^A-Z0-9-])${value}(?=$|[^A-Z0-9-])`).test(normal);});
 const projects=[...new Set(matches.map(m=>m.projectId))];return {projectId:projects.length===1?projects[0]:'',references:[...new Set(matches.map(m=>m.reference))],reason:projects.length===1?'Purchase order reference matched':projects.length>1?'References for multiple projects found':'No project purchase order reference found'};
}
export function invoiceFields(text:string){
 const number=text.match(/\binvoice\s*(?:number|no\.?|#|:)\s*[:#]?\s*([a-z0-9][a-z0-9/-]{1,59})/i)?.[1]||'';
 const money='(?:AUD\\s*)?\\$?\\s*([0-9][0-9,]*\\.[0-9]{2})';
 const match=text.match(new RegExp('(?:subtotal|total\\s*(?:ex(?:cluding)?\\.?\\s*(?:GST|tax)|before\\s*(?:GST|tax)))\\s*[:$]?\\s*'+money,'i'));
 const foreign=/\b(?:USD|NZD|EUR|GBP|CAD)\b|[€£]/.test(text);
 const value=match?Number(match[1].replace(/,/g,'')):null;
 return {invoiceNumber:number,amount:!foreign&&value!==null&&Number.isFinite(value)&&value>=0?value:null,currency:foreign?'Check currency':'AUD',invoiceDate:'',warning:foreign?'Confirm the AUD project cost before approval.':!match?'Enter the amount excluding GST from the invoice.':''};
}
export function decodeGmail(value:string){const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
export function messageParts(payload:any){const result:any[]=[];function visit(p:any){if(p)result.push(p);for(const part of p?.parts||[])visit(part);}visit(payload);return result;}
export function messageText(parts:any[]){return parts.filter(p=>p.mimeType==='text/plain'&&p.body?.data).map(p=>new TextDecoder().decode(decodeGmail(p.body.data))).join('\n').slice(0,60000);}
