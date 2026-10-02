import { PdfReport, downloadPdf, pdfDate, projectParty, type PdfProject } from './pdf-report';
export type RfiData = {
    number: string;
    title: string;
    reference: string;
    status: string;
    priority: string;
    responsibility: string;
    submitted: string;
    due: string;
    costImpact: string;
    programImpact: string;
    responseReference: string;
    requests: string[];
    solutions: string[];
    notes: string;
    recipientCompany: string;
    recipientName: string;
    recipientAddress: string;
    recipientEmail: string;
    location: string;
};
export type CompanyData = {
    company: string;
    abn: string;
    address: string;
    email: string;
    phone: string;
    logoFileId: string;
    colour: string;
};
export async function buildRfiPdf(d: RfiData, p: PdfProject, c: CompanyData) {
    const r = await PdfReport.create('Request for information', d.number || 'RFI', { company: c, project: p });
    r.intro(d.status, [['Submitted', pdfDate(d.submitted)], ['Response required', pdfDate(d.due)]]);
    const projectBuilder = projectParty(p);
    const builder = d.recipientCompany && d.recipientCompany !== projectBuilder.name ? {} : projectBuilder;
    r.parties({ ...builder, name: d.recipientCompany || builder.name, contact: d.recipientName || builder.contact, address: d.recipientAddress || builder.address, email: d.recipientEmail || builder.email });
    r.heading(d.title || 'Untitled RFI');
    r.metadata([['Reference document', d.reference], ['Priority', d.priority || 'Normal'], ['Location', d.location], ['Responsibility', d.responsibility], ['Cost impact', d.costImpact], ['Program impact', d.programImpact], ['Response reference', d.responseReference]]);
    r.heading('Request for information');
    (d.requests.length ? d.requests : ['Not entered']).forEach((s, i) => { r.paragraph(`${i + 1}. ${s}`); r.y -= 8; });
    if (d.solutions.some(s => s.trim())) {
        r.heading('Proposed solution');
        d.solutions.filter(s => s.trim()).forEach((s, i) => { r.paragraph(`${i + 1}. ${s}`); r.y -= 8; });
    }
    r.response();
    return r.save();
}
export async function downloadRfiPdf(d: RfiData, p: PdfProject, c: CompanyData) { downloadPdf(await buildRfiPdf(d, p, c), `${d.number || 'RFI'}_${p.name || 'Project'}`); }
