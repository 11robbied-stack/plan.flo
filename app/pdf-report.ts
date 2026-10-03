import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from 'pdf-lib';
export type PdfCompany = {
    company?: string;
    abn?: string;
    address?: string;
    email?: string;
    phone?: string;
    logoFileId?: string;
};
export type PdfParty = {
    name?: string;
    contact?: string;
    abn?: string;
    address?: string;
    email?: string;
    phone?: string;
};
export type PdfProject = {
    name?: string;
    number?: string;
    address?: string;
    builder?: string;
    client?: string;
    setup?: string;
    builderContact?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    builderDetails?: {
        abn?: string;
        address?: string;
    };
};
export type PdfContext = {
    company?: PdfCompany;
    project?: PdfProject;
};
export type PdfAssetLoader = (id: string) => Promise<{
    bytes: ArrayBuffer;
    mime: string;
}>;
export const pdfClean = (value: unknown) => String(value ?? '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\r\n?/g, '\n').replace(/[^\x20-\x7e\u00a0-\u00ff\n]/g, ' ');
// Standard PDF text rendering uses glyph advances; summing avoids kerning measurement drift.
const measure = (font: PDFFont, text: string, size: number) => Array.from(text).reduce((width, char) => width + font.widthOfTextAtSize(char, size), 0);
export const pdfDate = (v: string = '') => /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}` : v;
export const pdfMoney = (n: number) => '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pdfColours = { ink: rgb(.078, .149, .247), blue: rgb(.145, .388, .922), muted: rgb(.384, .439, .518), rule: rgb(.875, .898, .925), pale: rgb(.953, .965, .980), total: rgb(.929, .953, 1) };
export function projectParty(p: PdfProject = {}): PdfParty { let s: any = {}; try {
    s = JSON.parse(p.setup || '{}');
}
catch { } return { name: p.builder || s.clientCompany || p.client, contact: p.builderContact?.name || s.clientRepresentative, address: p.builderDetails?.address || s.clientAddress, abn: p.builderDetails?.abn, email: p.builderContact?.email, phone: p.builderContact?.phone }; }
async function loadAsset(id: string) { const r = await fetch('/api/file/' + encodeURIComponent(id)); if (!r.ok)
    throw new Error('File unavailable'); return { bytes: await r.arrayBuffer(), mime: r.headers.get('content-type') || '' }; }
export async function embedPdfImage(pdf: PDFDocument, asset: {
    bytes: ArrayBuffer;
    mime: string;
}): Promise<PDFImage> {
    const b = new Uint8Array(asset.bytes);
    if (b[0] === 137 && b[1] === 80)
        return pdf.embedPng(b);
    if (b[0] === 255 && b[1] === 216)
        return pdf.embedJpg(b);
    if (typeof document === 'undefined')
        throw new Error('Use a PNG or JPEG logo.');
    const url = URL.createObjectURL(new Blob([b], { type: asset.mime }));
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Image conversion failed');
        ctx.drawImage(image, 0, 0);
        return pdf.embedPng(canvas.toDataURL('image/png'));
    }
    finally {
        URL.revokeObjectURL(url);
    }
}
export class PdfReport {
    readonly width = 595.28;
    readonly height = 841.89;
    readonly left = 38;
    readonly right = 557.28;
    readonly bottom = 66;
    page!: PDFPage;
    y = 0;
    readonly generated: PDFPage[] = [];
    logo?: PDFImage;
    private constructor(readonly pdf: PDFDocument, readonly font: PDFFont, readonly bold: PDFFont, readonly title: string, readonly reference: string, readonly context: PdfContext) { }
    static async create(title: string, reference: string, context: PdfContext = {}, load: PdfAssetLoader = loadAsset) { const pdf = await PDFDocument.create(); const r = new PdfReport(pdf, await pdf.embedFont(StandardFonts.Helvetica), await pdf.embedFont(StandardFonts.HelveticaBold), title, reference, context); if (context.company?.logoFileId) {
        try {
            r.logo = await embedPdfImage(pdf, await load(context.company.logoFileId));
        }
        catch {
            throw new Error('The company logo could not be included. Check the logo in Settings > Company and try again.');
        }
    } pdf.setTitle(pdfClean(`${reference || title} - ${context.project?.name || title}`)); pdf.setAuthor(pdfClean(context.company?.company || 'PLAN.FLO')); r.newPage(true); return r; }
    text(v: unknown, x: number, y: number, size = 10, bold = false, colour = pdfColours.ink, right = false) { const t = pdfClean(v).replace(/\n/g, ' '), face = bold ? this.bold : this.font; this.page.drawText(t, { x: right ? x - measure(face, t, size) : x, y, size, font: face, color: colour }); }
    wrap(v: unknown, width: number, size = 10, bold = false) { const face = bold ? this.bold : this.font, result: string[] = []; for (const p of pdfClean(v).split('\n')) {
        let line = '';
        for (const word of p.split(/\s+/).filter(Boolean)) {
            if (measure(face, line + (line ? ' ' : '') + word, size) <= width) {
                line += (line ? ' ' : '') + word;
                continue;
            }
            if (line) {
                result.push(line);
                line = '';
            }
            for (const char of word) {
                if (measure(face, line + char, size) > width) {
                    result.push(line);
                    line = '';
                }
                line += char;
            }
        }
        result.push(line);
    } return result; }
    fit(v: unknown, width: number, size = 8, bold = false) { let t = pdfClean(v).replace(/\n/g, ' '); const face = bold ? this.bold : this.font; if (measure(face, t, size) <= width)
        return t; while (t && measure(face, t + '...', size) > width)
        t = t.slice(0, -1); return t + '...'; }
    rect(x: number, top: number, w: number, h: number, colour = pdfColours.pale) { const radius = Math.min(7, h / 2, w / 2); this.page.drawRectangle({ x: x + radius, y: top - h, width: w - 2 * radius, height: h, color: colour }); this.page.drawRectangle({ x, y: top - h + radius, width: w, height: h - 2 * radius, color: colour }); for (const cx of [x + radius, x + w - radius])
        for (const cy of [top - radius, top - h + radius])
            this.page.drawEllipse({ x: cx, y: cy, xScale: radius, yScale: radius, color: colour }); }
    rule(y = this.y, x = this.left, right = this.right) { this.page.drawLine({ start: { x, y }, end: { x: right, y }, thickness: .6, color: pdfColours.rule }); }
    newPage(first = false) {
        this.page = this.pdf.addPage([this.width, this.height]);
        this.generated.push(this.page);
        const top = this.height - 38;
        if (this.logo) {
            const scale = Math.min((first ? 145 : 95) / this.logo.width, (first ? 58 : 32) / this.logo.height);
            this.page.drawImage(this.logo, { x: this.left, y: top - this.logo.height * scale, width: this.logo.width * scale, height: this.logo.height * scale });
        }
        else {
            this.text(this.fit(this.context.company?.company || 'Company', 230, first ? 16 : 11, true), this.left, top - 18, first ? 16 : 11, true);
        }
        this.text(this.fit(this.title.toUpperCase(), 255, 8, true), this.right, top - 8, 8, true, pdfColours.blue, true);
        this.text(this.fit(this.reference || '', 250, first ? 24 : 12, true), this.right, top - (first ? 36 : 27), first ? 24 : 12, true, pdfColours.ink, true);
        this.y = top - (first ? 79 : 48);
        this.rule();
        this.y -= 25;
        return this.page;
    }
    need(h: number) { if (this.y - h < this.bottom)
        this.newPage(); }
    paragraph(v: unknown, size = 10, bold = false, colour = pdfColours.ink, indent = 0) { for (const line of this.wrap(v, this.right - this.left - indent, size, bold)) {
        this.need(size + 5);
        this.text(line, this.left + indent, this.y, size, bold, colour);
        this.y -= size + 5;
    } }
    heading(v: unknown) { this.need(48); this.y -= 8; this.paragraph(v, 13, true); this.y -= 6; }
    field(label: string, value: unknown) { if (!String(value ?? '').trim())
        return; this.need(39); this.paragraph(label.toUpperCase(), 8, true, pdfColours.muted); this.paragraph(value); this.y -= 7; }
    intro(status = '', meta: [
        string,
        unknown
    ][] = []) { const p = this.context.project || {}; this.paragraph(p.name || 'Project', 22, true); if (p.address)
        this.paragraph(p.address, 10, false, pdfColours.muted); this.y -= 10; this.metadata([...(status ? [['Status', status] as [
                string,
                string
            ]] : []), ...(p.number ? [['Project no.', p.number] as [
                string,
                string
            ]] : []), ...meta]); this.y -= 5; }
    metadata(pairs: [
        string,
        unknown
    ][]) { const entries = pairs.filter(([, v]) => String(v ?? '').trim()); for (let i = 0; i < entries.length; i += 2) {
        const cols = entries.slice(i, i + 2).map(([k, v]) => ({ k, lines: this.wrap(v, 239, 9) }));
        let offset = 0;
        const total = Math.max(...cols.map(c => c.lines.length));
        while (offset < total) {
            this.need(45);
            const take = Math.min(total - offset, Math.max(1, Math.floor((this.y - this.bottom - 20) / 13)));
            cols.forEach((col, j) => { const x = this.left + j * 268; this.text(this.fit(col.k.toUpperCase(), 239, 7.5, true), x, this.y, 7.5, true, pdfColours.muted); col.lines.slice(offset, offset + take).forEach((s, n) => this.text(s, x, this.y - 17 - n * 13, 9)); });
            this.y -= take * 13 + 20;
            offset += take;
            if (offset < total)
                this.newPage();
        }
    } }
    parties(to: PdfParty = projectParty(this.context.project)) { const c = this.context.company || {}; const parties: PdfParty[] = [{ name: c.company || 'Company not supplied', abn: c.abn, address: c.address, email: c.email, phone: c.phone }, to]; const lines = parties.map(p => [p.name || 'Builder not supplied', p.abn ? `ABN ${p.abn}` : '', p.contact ? `Attention: ${p.contact}` : '', p.address, p.phone, p.email].filter(Boolean).flatMap((s, i) => this.wrap(s, 225, i ? 9 : 11, i === 0).map(t => ({ t, strong: i === 0 })))); let offset = 0; const total = Math.max(...lines.map(l => l.length)); while (offset < total) {
        this.need(90);
        const take = Math.max(1, Math.min(total - offset, Math.floor((this.y - this.bottom - 43) / 14)));
        const h = take * 14 + 43;
        lines.forEach((col, j) => { const x = this.left + j * 267; this.rect(x, this.y, 252, h); this.text(j ? 'TO / BUILDER' : 'FROM / CONTRACTOR', x + 14, this.y - 19, 8, true, pdfColours.muted); col.slice(offset, offset + take).forEach((l, n) => this.text(l.t, x + 14, this.y - 40 - n * 14, l.strong ? 11 : 9, l.strong, l.strong ? pdfColours.ink : pdfColours.muted)); });
        this.y -= h + 17;
        offset += take;
        if (offset < total)
            this.newPage();
    } }
    table(columns: {
        label: string;
        width: number;
        right?: boolean;
    }[], rows: unknown[][]) { const size = 8.5, leading = 12; const header = () => { this.need(52); this.rect(this.left, this.y + 7, this.right - this.left, 27, pdfColours.ink); let x = this.left; for (const col of columns) {
        this.text(col.label, x + (col.right ? col.width - 10 : 10), this.y - 10, 7, true, rgb(1, 1, 1), col.right);
        x += col.width;
    } this.y -= 34; }; header(); for (const row of rows) {
        const cells = columns.map((col, i) => this.wrap(row[i] ?? '-', col.width - 20, size));
        let at = 0;
        const count = Math.max(...cells.map(c => c.length));
        while (at < count) {
            if (this.y - 24 < this.bottom) {
                this.newPage();
                header();
            }
            const take = Math.min(count - at, Math.max(1, Math.floor((this.y - this.bottom - 12) / leading)));
            let x = this.left;
            columns.forEach((col, i) => { cells[i].slice(at, at + take).forEach((s, n) => this.text(s, x + (col.right ? col.width - 10 : 10), this.y - n * leading, size, false, pdfColours.ink, col.right)); x += col.width; });
            this.y -= take * leading + 12;
            this.rule(this.y + 5);
            at += take;
            if (at < count) {
                this.newPage();
                header();
            }
        }
    } this.y -= 9; }
    totals(entries: [
        string,
        string
    ][]) { const labels = entries.map(([k]) => this.wrap(k, 137, 9)); const heights = labels.map(l => Math.max(29, l.length * 13 + 16)); this.need(heights.reduce((a, b) => a + b, 0) + 10); entries.forEach(([k, v], i) => { const last = i === entries.length - 1, h = heights[i]; if (last)
        this.rect(310, this.y + 10, this.right - 310, h, pdfColours.total); labels[i].forEach((s, n) => this.text(s, 323, this.y - 5 - n * 13, 9, last)); this.text(v, this.right - 12, this.y - 5, 10, last, pdfColours.ink, true); this.y -= h; }); this.y -= 10; }
    approval() { this.need(136); this.heading('Approval'); this.text('Authorised representative', this.left, this.y, 9, false, pdfColours.muted); this.text('Date', 365, this.y, 9, false, pdfColours.muted); this.y -= 32; this.rule(this.y, this.left, 335); this.rule(this.y, 365, this.right); this.y -= 19; this.text('Signature', this.left, this.y, 9, false, pdfColours.muted); this.y -= 33; this.rule(); this.y -= 16; }
    response() { this.need(118); this.heading('Builder response'); const top = this.y; this.page.drawRectangle({ x: this.left, y: top - 58, width: this.right - this.left, height: 68, borderColor: pdfColours.rule, borderWidth: .6 }); this.y -= 78; }
    async save() { const all = this.pdf.getPages(); for (const page of this.generated) {
        this.page = page;
        this.rule(43);
        this.text(this.fit([this.context.company?.company || 'PLAN.FLO', this.reference, this.context.project?.name].filter(Boolean).join('  |  '), 450, 7), this.left, 29, 7, false, pdfColours.muted);
        this.text(`${all.indexOf(page) + 1} / ${all.length}`, this.right, 29, 7, false, pdfColours.muted, true);
    } return this.pdf.save(); }
}
export function downloadPdf(bytes: Uint8Array, name: string) { const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })); const a = document.createElement('a'); a.href = url; a.download = name.replace(/[\\/:*?"<>|]/g, '-') + '.pdf'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
