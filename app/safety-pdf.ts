import { PdfReport, downloadPdf, pdfDate, type PdfContext, projectParty } from './pdf-report';
export async function buildSafetyPdf(doc: any, context: PdfContext = {}) {
    const project = { ...context.project, name: doc.data.site || context.project?.name, address: doc.data.address || context.project?.address, builder: doc.data.builder || context.project?.builder };
    const r = await PdfReport.create('Site safety document', doc.category || 'Site Docs', { ...context, project });
    r.intro(doc.status, [['Form date', pdfDate(doc.data.date)]]);
    const party = project.builder && project.builder !== context.project?.builder ? { name: project.builder } : projectParty(project);
    r.parties(party);
    r.heading(doc.title);
    for (const field of doc.data.fields) {
        r.heading(field.label);
        r.paragraph(field.value || 'Not completed');
        r.y -= 10;
    }
    if (doc.data.completedBy)
        r.metadata([['Reviewed and completed by', doc.data.completedBy], ['Completed at', doc.data.completedAt]]);
    r.paragraph('This record does not include worker signatures.', 9);
    return r.save();
}
export async function safetyPdf(doc: any, context: PdfContext = {}) { downloadPdf(await buildSafetyPdf(doc, context), doc.title || 'Site safety document'); }
