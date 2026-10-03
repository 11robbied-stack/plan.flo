import type { EquipmentEntry } from './equipment-model';
import { testTagState } from './test-tag-model';
import { PdfReport, downloadPdf, pdfDate, type PdfCompany, type PdfProject } from './pdf-report';
type Context = {
    project: string;
    company: string;
    today: string;
    filter: string;
    companyDetails?: PdfCompany;
    projectDetails?: PdfProject;
};
export async function buildTestTagPdf(rows: EquipmentEntry[], context: Context) {
    const r = await PdfReport.create('Test & tag register', 'TEST & TAG', { company: context.companyDetails || { company: context.company }, project: context.projectDetails || { name: context.project } });
    r.intro('', [['Exported', pdfDate(context.today)], ['Records shown', String(rows.length)], ['Register view', context.filter]]);
    r.parties();
    r.paragraph('Recorded test results only. This register is not a certificate of electrical safety.', 9);
    r.y -= 10;
    for (const row of rows) {
        r.need(155);
        r.heading(row.title || 'Unnamed equipment');
        r.metadata([['Asset / tag ID', row.data.assetId || '-'], ['Serial number', row.data.serial || '-'], ['Location', row.data.location || '-'], ['Tested by', row.data.tester || '-'], ['Test date', pdfDate(row.data.date) || '-'], ['Next test', pdfDate(row.data.nextDue) || 'Not recorded'], ['Result', row.data.result || '-'], ['Status', testTagState(row.data, context.today)]]);
        if (row.data.notes)
            r.field('Notes', row.data.notes);
        r.rule();
        r.y -= 14;
    }
    if (!rows.length)
        r.paragraph('No test records in this view.');
    return r.save();
}
export async function downloadTestTagPdf(rows: EquipmentEntry[], context: Context) { downloadPdf(await buildTestTagPdf(rows, context), `${context.project || 'Project'} - Test and Tag`); }
