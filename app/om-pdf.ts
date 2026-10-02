import { PDFDocument } from 'pdf-lib';
import type { OmManual } from './om-model';
import { PdfReport, embedPdfImage, pdfColours, type PdfAssetLoader, type PdfContext, projectParty, pdfDate } from './pdf-report';
export async function buildOmPdf(manual: OmManual, load: PdfAssetLoader, context: PdfContext = {}) {
    const d = manual.data;
    let totalBytes = 0;
    const cached = new Map<string, Awaited<ReturnType<PdfAssetLoader>>>();
    async function get(id: string) { if (cached.has(id))
        return cached.get(id)!; const asset = await load(id); totalBytes += asset.bytes.byteLength; if (totalBytes > 100 * 1024 * 1024)
        throw new Error('The combined attachments exceed 100 MB. Reduce PDF sizes and export again.'); cached.set(id, asset); return asset; }
    const project = { ...context.project, name: d.projectName, address: d.address, builder: d.builder };
    const r = await PdfReport.create('Operation & maintenance', d.reference || 'O&M MANUAL', { ...context, project }, get);
    r.intro(manual.status, [['Revision', d.revision], ['Practical completion', pdfDate(d.completionDate)]]);
    r.parties(project.builder && project.builder !== context.project?.builder ? { name: project.builder } : projectParty(project));
    r.heading(d.service || 'Project handover');
    r.paragraph('Operation & maintenance manual');
    r.y -= 20;
    if (d.builderLogo || d.architectLogo) {
        r.need(117);
        for (const [id, x, label] of [[d.builderLogo, r.left, 'Builder'], [d.architectLogo, 315, 'Architect']] as const) {
            if (!id)
                continue;
            try {
                const image = await embedPdfImage(r.pdf, await get(id));
                const scale = Math.min(180 / image.width, 75 / image.height);
                r.text(label, x, r.y, 9, false, pdfColours.muted);
                r.page.drawImage(image, { x, y: r.y - 18 - image.height * scale, width: image.width * scale, height: image.height * scale });
            }
            catch {
                throw new Error(`${label} logo could not be included. Replace it with a valid PNG or JPEG.`);
            }
        }
    }
    const toc = Array.from({ length: Math.ceil((d.sections.length + 3) / 22) }, () => { r.newPage(); r.heading('Contents'); return { page: r.page, y: r.y }; });
    const entries: {
        title: string;
        page: number;
    }[] = [];
    function section(title: string) { r.newPage(); entries.push({ title, page: r.pdf.getPageCount() }); r.heading(title); }
    section('1. General information');
    r.field('Project', d.projectName);
    r.field('Service / work type', d.service);
    r.field('Site address', d.address);
    r.field('Description', d.description);
    r.field('Architect', d.architectName);
    r.field('Architect phone', d.architectPhone);
    r.field('Architect email', d.architectEmail);
    r.field('Architect address', d.architectAddress);
    section('2. Contacts');
    if (!d.contacts.length)
        r.paragraph('No contacts entered.');
    for (const c of d.contacts) {
        r.heading(c.role || 'Contact');
        r.field('Name / company', [c.name, c.company].filter(Boolean).join(' / '));
        r.field('Phone / email', [c.phone, c.email].filter(Boolean).join(' / '));
        r.field('Address', c.address);
    }
    section('3. Maintenance schedule');
    if (!d.maintenance.length)
        r.paragraph('No maintenance tasks entered.');
    for (const [i, m] of d.maintenance.entries()) {
        r.heading(`${i + 1}. ${m.equipment || 'Equipment / system'}`);
        r.field('Task', m.task);
        r.field('Frequency / interval', m.frequency);
        r.field('Responsible', m.responsible);
    }
    for (const [i, s] of d.sections.entries()) {
        section(`${i + 4}. ${s.title}`);
        r.paragraph(s.body || (!s.fileIds.length ? 'No content entered.' : 'Supporting documents follow.'));
        for (const id of s.fileIds) {
            try {
                const file = await get(id), source = await PDFDocument.load(file.bytes);
                if (r.pdf.getPageCount() + source.getPageCount() > 1500)
                    throw new Error('Manual exceeds 1,500 pages');
                const copied = await r.pdf.copyPages(source, source.getPageIndices());
                copied.forEach(p => r.pdf.addPage(p));
            }
            catch (e: any) {
                throw new Error(`Could not include a PDF in "${s.title}". Check that it opens correctly and is not password-protected. ${e.message?.includes('exceed') ? e.message : ''}`);
            }
        }
    }
    for (const [i, t] of toc.entries()) {
        r.page = t.page;
        entries.slice(i * 22, (i + 1) * 22).forEach((entry, j) => { r.text(r.fit(entry.title, 455, 10), r.left, t.y - j * 26, 10); r.text(String(entry.page), r.right, t.y - j * 26, 10, false, pdfColours.ink, true); r.rule(t.y - j * 26 - 10); });
    }
    if (r.pdf.getPageCount() > 1500)
        throw new Error('Manual exceeds 1,500 pages');
    return r.save();
}
