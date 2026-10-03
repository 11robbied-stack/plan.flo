import type { CompanyData } from './rfi-pdf';
import { PdfReport, downloadPdf, pdfDate, pdfMoney, type PdfProject } from './pdf-report';
export type VariationItem = {
    item: string;
    type: string;
    quantity: string;
    uom: string;
    rate: string;
};
export type VariationData = {
    version?: number;
    approvedBy?: string;
    approvedAt?: string;
    number: string;
    title: string;
    submitted: string;
    reference: string;
    status: string;
    approvalReference: string;
    items: VariationItem[];
    inclusions: string[];
    exclusions: string[];
    clarifications: string[];
    eot: string;
    notes: string;
};
export function variationTotals(items: VariationItem[]) { const subtotalCents = items.reduce((total, row) => total + Math.round((Number(row.quantity) || 0) * (Number(row.rate) || 0) * 100), 0); const gstCents = Math.round(subtotalCents * .1); return { subtotal: subtotalCents / 100, gst: gstCents / 100, total: (subtotalCents + gstCents) / 100 }; }
export async function buildVariationPdf(d: VariationData, p: PdfProject, c: CompanyData) {
    const r = await PdfReport.create('Variation proposal', d.number || 'Variation', { company: c, project: p });
    r.intro(d.status, [['Submitted', pdfDate(d.submitted)], ['Reference document', d.reference]]);
    r.parties();
    r.heading('Variation works');
    r.paragraph(d.title || 'Untitled variation');
    r.y -= 12;
    r.table([{ label: 'DESCRIPTION', width: 185 }, { label: 'TYPE', width: 70 }, { label: 'QTY', width: 45, right: true }, { label: 'UNIT', width: 49 }, { label: 'RATE', width: 80, right: true }, { label: 'AMOUNT', width: 90.28, right: true }], d.items.map(i => [i.item || 'Not entered', i.type || '-', String(Number(i.quantity) || 0), i.uom || '-', pdfMoney(Number(i.rate) || 0), pdfMoney(Math.round((Number(i.quantity) || 0) * (Number(i.rate) || 0) * 100) / 100)]));
    const t = variationTotals(d.items);
    r.totals([['Subtotal ex GST', pdfMoney(t.subtotal)], ['GST (10%)', pdfMoney(t.gst)], ['Total inc GST', pdfMoney(t.total)]]);
    if (d.eot)
        r.field('Extension of time', d.eot + ' working days');
    for (const [heading, items] of [['Inclusions', d.inclusions], ['Exclusions', d.exclusions], ['Clarifications', d.clarifications]] as const) {
        if (items.some(x => x.trim())) {
            r.heading(heading);
            items.filter(x => x.trim()).forEach((item, i) => { r.paragraph(`${i + 1}. ${item}`); r.y -= 7; });
        }
    }
    if (d.approvalReference)
        r.field('Approval reference', d.approvalReference);
    if (d.approvedBy)
        r.metadata([['Approved by', d.approvedBy], ['Approved at', d.approvedAt]]);
    r.approval();
    return r.save();
}
export async function downloadVariationPdf(d: VariationData, p: PdfProject, c: CompanyData) { downloadPdf(await buildVariationPdf(d, p, c), `${d.number || 'Variation'}_${p.name || 'Project'}`); }
