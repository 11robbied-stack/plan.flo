// Run with node scripts/check-pdf-exports.mjs. Generated fixtures stay ignored.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {PDFDocument,StandardFonts} from 'pdf-lib';
const output=path.resolve('.sites-runtime/pdf-qa');await fs.mkdir(output,{recursive:true});
for(const name of ['pdf-report','variation-pdf','rfi-pdf','test-tag-pdf','test-tag-model','safety-pdf','om-pdf']){const source=await fs.readFile(`app/${name}.ts`,'utf8');const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/from '(\.\/[^']+)'/g,"from '$1.mjs'");await fs.writeFile(`${output}/${name}.mjs`,result);}
const {buildVariationPdf,variationTotals}=await import(`${output}/variation-pdf.mjs`),{buildRfiPdf}=await import(`${output}/rfi-pdf.mjs`),{buildTestTagPdf}=await import(`${output}/test-tag-pdf.mjs`),{buildSafetyPdf}=await import(`${output}/safety-pdf.mjs`),{buildOmPdf}=await import(`${output}/om-pdf.mjs`);
const logo=await fs.readFile('public/planflo-brand.png');
const asset={bytes:logo.buffer.slice(logo.byteOffset,logo.byteOffset+logo.byteLength),mime:'image/png'};
globalThis.fetch=async url=>{assert.equal(url,'/api/file/test-logo');return new Response(logo,{headers:{'content-type':'image/png'}});};
const company={company:'Example Electrical Pty Ltd',abn:'Sample ABN',address:'10 Example Street, Melbourne VIC 3000',email:'office@example.com',phone:'03 9000 0000',logoFileId:'test-logo',colour:'#2563ff'};
const project={name:'DCOH HQ',number:'P-003',address:'34 Eastern Road, South Melbourne',builder:'DCOH',builderDetails:{address:'Builder office address',abn:'Builder ABN'},builderContact:{name:'Sample contact',email:'builder@example.com',phone:'03 9000 0001'},setup:'{}'};
const variation={number:'VO-003',title:'Additional power outlets',submitted:'2026-10-01',reference:'E-102 Rev C',status:'Draft',approvalReference:'',items:[{item:'Supply and install additional power outlet',type:'Material',quantity:'4',uom:'No',rate:'125.50'}],inclusions:[],exclusions:[],clarifications:[],eot:'',notes:'INTERNAL ONLY'};
const totals=variationTotals(variation.items);assert.deepEqual(totals,{subtotal:502,gst:50.2,total:552.2});
const rfi={number:'RFI-002',title:'Confirm switchboard location',reference:'E-100 Rev B',status:'Pending',priority:'Normal',responsibility:'Builder',submitted:'2026-10-01',due:'2026-10-08',costImpact:'To be confirmed',programImpact:'',responseReference:'',requests:['Please confirm the final switchboard location before installation.'],solutions:['Retain the location shown on E-100 Rev B.'],notes:'INTERNAL ONLY',recipientCompany:'DCOH',recipientName:'',recipientAddress:'',recipientEmail:'',location:'Ground floor'};
async function save(name,bytes,min=1){const pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount()>=min);await fs.writeFile(`${output}/${name}.pdf`,bytes);return pdf;}
await save('variation',await buildVariationPdf(variation,project,company));
await save('rfi',await buildRfiPdf(rfi,project,company));
await save('test-tag',await buildTestTagPdf([{id:'1',title:'Extension lead - 20m',data:{assetId:'EL-001',serial:'SN-12345',location:'Site shed',date:'2026-10-01',nextDue:'2027-01-01',result:'Pass',tester:'Sample tester',notes:'Visual inspection and recorded tests completed.'}}],{project:project.name,company:company.company,companyDetails:company,projectDetails:project,today:'2026-10-03',filter:'Latest test per asset / All'}));
await save('safety',await buildSafetyPdf({title:'Daily pre-start meeting',category:'Pre-start',status:'Draft',data:{site:project.name,builder:'DCOH',address:project.address,date:'2026-10-03',fields:[{label:'Activities for today',value:'Electrical rough in, ground floor.'},{label:'Controls and precautions',value:'Confirm work area access with the site supervisor.'}]}},{company,project}));
const attachment=await PDFDocument.create();const pg=attachment.addPage([400,300]);pg.drawText('ORIGINAL SUPPLIER DOCUMENT',{x:30,y:250,font:await attachment.embedFont(StandardFonts.Helvetica),size:12});const attachmentBytes=await attachment.save();
const manual={projectId:'p1',status:'Draft',data:{projectName:project.name,reference:'OM-003',revision:'A',builder:'DCOH',builderLogo:'',architectLogo:'',service:'Electrical',completionDate:'2026-10-03',address:project.address,description:'Project operation and maintenance information.',contacts:[{role:'Contractor',name:'Sample contact',company:company.company,email:company.email,phone:company.phone,address:company.address}],maintenance:[{equipment:'Switchboard',task:'Follow the manufacturer maintenance instructions.',frequency:'As specified',responsible:'Qualified contractor'}],sections:[{title:'Product data',body:'Original supplier document follows.',fileIds:['supplier']}]}};
const om=await save('om',await buildOmPdf(manual,async id=>id==='supplier'?{bytes:attachmentBytes.buffer,mime:'application/pdf'}:asset,{company,project}),7);assert.deepEqual(om.getPages().at(-1).getSize(),{width:400,height:300});
const long='Long description with accented café and punctuation – "quoted". '.repeat(28)+'X'.repeat(180);
await save('variation-long',await buildVariationPdf({...variation,items:[{...variation.items[0],item:long},...Array.from({length:12},(_,i)=>({...variation.items[0],item:`Item ${i+2}`}))],clarifications:['Final paragraph marker']},project,company),2);
await save('rfi-long',await buildRfiPdf({...rfi,requests:[long,long,'Final request marker']},project,{...company,logoFileId:'',company:'A long company name '.repeat(4)}),2);
globalThis.fetch=async()=>new Response('Missing',{status:404});await assert.rejects(()=>buildRfiPdf(rfi,project,company),/company logo could not be included/);
console.log('PDF export checks passed: five export types, long text, table pagination, totals, missing logo, original attachment size.');
