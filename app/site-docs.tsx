'use client';
import {useState} from 'react';
import {FileText,Upload,ExternalLink,ShieldCheck} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {siteDocCategories} from './site-doc-categories';
type DocumentFile={id:string;category:string;name:string;size:number;created:string};
export function SiteDocsLibrary({files,busy,onUpload,editable=true}:{files:DocumentFile[];busy:boolean;editable?:boolean;onUpload:(category:string)=>void}){
 const [category,setCategory]=useState<string>(siteDocCategories[0].id);
 return <section className="site-docs"><div className="section-title"><div><h2>Site Docs</h2><span>Safety documents for this project.</span></div></div>
 <Tabs value={category} onValueChange={setCategory}><div className="site-docs-tab-scroll"><TabsList aria-label="Site document categories" className="site-docs-tabs">{siteDocCategories.map(c=><TabsTrigger key={c.id} value={c.id}>{c.label}<span className="site-docs-count">{files.filter(f=>f.category===c.id).length}</span></TabsTrigger>)}</TabsList></div>
 {siteDocCategories.map(c=>{const documents=files.filter(f=>f.category===c.id);return <TabsContent key={c.id} value={c.id}><div className="site-docs-heading"><div><h3>{c.title}</h3><p>{c.description}</p></div><Button className="primary" disabled={busy||!editable} onClick={()=>onUpload(c.id)}><Upload size={17}/>{busy?'Uploading…':'Upload document'}</Button></div>
 {documents.length?<div className="file-list">{documents.map(f=><a className="file-row site-docs-file" key={f.id} href={`/api/file/${encodeURIComponent(f.id)}`} target="_blank" rel="noreferrer"><FileText size={22}/><span><strong>{f.name}</strong><small>Uploaded {new Date(f.created).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})} · {f.size<1024*1024?`${Math.ceil(f.size/1024)} KB`:`${(f.size/1024/1024).toFixed(1)} MB`}</small></span><ExternalLink size={17} aria-label="Open document"/></a>)}</div>:<div className="empty-hero compact"><span className="empty-icon"><ShieldCheck size={27}/></span><h3>No documents uploaded</h3><p>Add the first document to {c.label} for this project.</p><Button variant="outline" disabled={busy||!editable} onClick={()=>onUpload(c.id)}><Upload size={17}/>Upload document</Button></div>}
 <p className="site-docs-note">PDF, Word, Excel and image files · Maximum 20 MB per file</p></TabsContent>})}
 </Tabs></section>
}
