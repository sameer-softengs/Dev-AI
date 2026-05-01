const { jsPDF } = require("jspdf");
const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    HeadingLevel
} = require("docx");

const COLORS = {
    brand: [40, 122, 184],
    brandDark: [25, 82, 130],
    heading: [27, 38, 49],
    body: [60, 72, 88],
    muted: [120, 132, 146],
    surface: [244, 248, 252],
    rule: [220, 228, 236]
};

const normalizePlainText = (value = "") =>
    String(value)
        .replace(/[‐‑–—]/g, '-')
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/•/g, '-')
        .replace(/\u00A0/g, ' ')
        .replace(/\u2007/g, ' ')
        .replace(/\u202F/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/[^\x0A\x0D\x20-\x7E]/g, '');

const cleanInlineMarkdown = (value = "") =>
    normalizePlainText(value)
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/^\s*"+|"+\s*$/g, '')
        .replace(/\|/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const stripListPrefix = (value = "") =>
    cleanInlineMarkdown(
        String(value)
            .replace(/^(-|\*|•)\s+/, '')
            .replace(/^\d+\.\s+/, '')
    );

const isSeparatorLine = (line) => /^[-=]{3,}$/.test(line.trim());
const isBulletLine = (line) => /^(-|\*|•)\s+/.test(line.trim());
const isNumberedLine = (line) => /^\d+\.\s+/.test(line.trim());
const isMarkdownHeading = (line) => /^#{1,4}\s+/.test(line.trim());
const isLooseHeading = (line) =>
    /^(\d+(\.\d+)*\s+.+|[A-Za-z][A-Za-z\s]{1,60}:)$/.test(line.trim());
const isTableLine = (line) => line.includes('|');

const normalizeHeadingText = (line) =>
    cleanInlineMarkdown(
        String(line)
            .replace(/^#{1,4}\s+/, '')
            .replace(/:$/, '')
            .replace(/^"+|"+$/g, '')
    );

const parseStructuredBlocks = (content = "") => {
    const lines = normalizePlainText(content).split(/\r?\n/);
    const blocks = [];
    let paragraphBuffer = [];

    const flushParagraph = () => {
        const text = cleanInlineMarkdown(paragraphBuffer.join(' '));
        if (text) {
            blocks.push({ type: 'paragraph', text });
        }
        paragraphBuffer = [];
    };

    for (let index = 0; index < lines.length; index += 1) {
        const rawLine = lines[index];
        const line = rawLine.trim();

        if (!line || isSeparatorLine(line)) {
            flushParagraph();
            continue;
        }

        if (isTableLine(line)) {
            flushParagraph();
            const rows = [];

            while (index < lines.length && isTableLine(lines[index].trim())) {
                const row = cleanInlineMarkdown(lines[index]);
                if (row && !/^:?-{2,}:?$/.test(row)) {
                    rows.push(row);
                }
                index += 1;
            }

            index -= 1;

            if (rows.length > 0) {
                blocks.push({ type: 'table', rows });
            }
            continue;
        }

        if (isBulletLine(line) || isNumberedLine(line)) {
            flushParagraph();
            const type = isNumberedLine(line) ? 'numbered-list' : 'bullet-list';
            const items = [];

            while (index < lines.length) {
                const current = lines[index].trim();
                const sameType =
                    (type === 'bullet-list' && isBulletLine(current)) ||
                    (type === 'numbered-list' && isNumberedLine(current));

                if (!sameType) {
                    break;
                }

                items.push(stripListPrefix(current));
                index += 1;
            }

            index -= 1;
            blocks.push({ type, items });
            continue;
        }

        if (isMarkdownHeading(line) || isLooseHeading(line)) {
            flushParagraph();
            blocks.push({
                type: 'heading',
                text: normalizeHeadingText(line)
            });
            continue;
        }

        paragraphBuffer.push(line);
    }

    flushParagraph();
    return blocks;
};

const addPdfPageChrome = (doc, type, title, pageNumber) => {
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    doc.setFillColor(...COLORS.brand);
    doc.rect(0, 0, width, 28, 'F');
    doc.setFillColor(...COLORS.surface);
    doc.rect(0, 28, width, 14, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(String(type || 'General').toUpperCase(), 14, 18);

    doc.setTextColor(...COLORS.brandDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(cleanInlineMarkdown(title).slice(0, 80), 14, 37);

    doc.setDrawColor(...COLORS.rule);
    doc.line(14, height - 16, width - 14, height - 16);
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Page ${pageNumber}`, width - 14, height - 9, { align: 'right' });
};

const ensurePdfSpace = (doc, y, neededHeight, meta) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomLimit = pageHeight - 22;

    if (y + neededHeight <= bottomLimit) {
        return y;
    }

    doc.addPage();
    meta.page += 1;
    addPdfPageChrome(doc, meta.type, meta.title, meta.page);
    return 50;
};

const renderWrappedText = (doc, text, x, y, width, options) => {
    const split = doc.splitTextToSize(cleanInlineMarkdown(text), width);
    doc.setFont('helvetica', options.fontStyle || 'normal');
    doc.setFontSize(options.fontSize);
    doc.setTextColor(...options.color);
    doc.text(split, x, y);
    return split.length;
};

const renderParagraph = (doc, text, y, meta, options = {}) => {
    const width = options.width || 176;
    const lineHeight = options.lineHeight || 6.5;
    const probe = doc.splitTextToSize(cleanInlineMarkdown(text), width);
    const height = probe.length * lineHeight + (options.paddingBottom || 0);

    y = ensurePdfSpace(doc, y, height, meta);

    const lines = renderWrappedText(doc, text, 16, y, width, {
        fontSize: options.fontSize || 11,
        fontStyle: options.fontStyle || 'normal',
        color: options.color || COLORS.body
    });

    return y + lines * lineHeight + (options.paddingBottom || 0);
};

const renderSectionHeading = (doc, text, y, meta) => {
    y = ensurePdfSpace(doc, y, 12, meta);
    doc.setTextColor(...COLORS.heading);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(cleanInlineMarkdown(text), 16, y);
    doc.setDrawColor(...COLORS.brand);
    doc.setLineWidth(0.6);
    doc.line(16, y + 2, 74, y + 2);
    return y + 8;
};

const renderList = (doc, items, y, meta, numbered = false) => {
    items.forEach((item, index) => {
        const prefix = numbered ? `${index + 1}. ` : '- ';
        y = renderParagraph(doc, `${prefix}${item}`, y, meta, {
            fontSize: 11,
            color: COLORS.body,
            lineHeight: 6.2,
            paddingBottom: 1.5
        });
    });
    return y + 1;
};

const renderPseudoTable = (doc, rows, y, meta) => {
    rows.forEach((row, index) => {
        y = ensurePdfSpace(doc, y, 10, meta);
        doc.setFillColor(index === 0 ? 230 : 247, index === 0 ? 239 : 249, index === 0 ? 248 : 252);
        doc.roundedRect(16, y - 4.5, 176, 8, 2, 2, 'F');
        y = renderParagraph(doc, row, y, meta, {
            fontSize: index === 0 ? 10.5 : 10,
            fontStyle: index === 0 ? 'bold' : 'normal',
            color: index === 0 ? COLORS.brandDark : COLORS.body,
            lineHeight: 5.6,
            paddingBottom: 1.5,
            width: 170
        });
    });

    return y + 1;
};

const generatePDF = async (title, content, type = "General") => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const blocks = parseStructuredBlocks(content);
    const meta = {
        page: 1,
        title,
        type
    };

    addPdfPageChrome(doc, type, title, meta.page);

    let y = 54;
    doc.setTextColor(...COLORS.heading);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    const titleLines = doc.splitTextToSize(cleanInlineMarkdown(title), 170);
    doc.text(titleLines, 16, y);
    y += titleLines.length * 8 + 2;

    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Prepared for export', 16, y);
    y += 10;

    blocks.forEach((block) => {
        if (block.type === 'heading') {
            y = renderSectionHeading(doc, block.text, y, meta);
            return;
        }

        if (block.type === 'paragraph') {
            y = renderParagraph(doc, block.text, y, meta, {
                fontSize: 11,
                color: COLORS.body,
                lineHeight: 6.4,
                paddingBottom: 2.5
            });
            return;
        }

        if (block.type === 'bullet-list') {
            y = renderList(doc, block.items, y, meta, false);
            return;
        }

        if (block.type === 'numbered-list') {
            y = renderList(doc, block.items, y, meta, true);
            return;
        }

        if (block.type === 'table') {
            y = renderPseudoTable(doc, block.rows, y, meta);
        }
    });

    return Buffer.from(doc.output('arraybuffer'));
};

const buildDocxParagraphs = (title, content, type) => {
    const blocks = parseStructuredBlocks(content);
    const paragraphs = [
        new Paragraph({
            text: String(type || 'General').toUpperCase(),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: cleanInlineMarkdown(title),
                    bold: true,
                    size: 34
                })
            ],
            spacing: { after: 220 }
        })
    ];

    blocks.forEach((block) => {
        if (block.type === 'heading') {
            paragraphs.push(
                new Paragraph({
                    text: block.text,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 220, after: 100 }
                })
            );
            return;
        }

        if (block.type === 'paragraph') {
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: block.text, size: 24 })],
                    spacing: { after: 120 }
                })
            );
            return;
        }

        if (block.type === 'bullet-list' || block.type === 'numbered-list') {
            block.items.forEach((item, index) => {
                const prefix = block.type === 'numbered-list' ? `${index + 1}. ` : '- ';
                paragraphs.push(
                    new Paragraph({
                        children: [new TextRun({ text: `${prefix}${item}`, size: 24 })],
                        spacing: { after: 80 }
                    })
                );
            });
            return;
        }

        if (block.type === 'table') {
            block.rows.forEach((row, rowIndex) => {
                const prefix = rowIndex === 0 ? 'Columns: ' : `Row ${rowIndex}: `;
                paragraphs.push(
                    new Paragraph({
                        children: [new TextRun({ text: `${prefix}${row}`, size: 22 })],
                        spacing: { after: 80 }
                    })
                );
            });
        }
    });

    return paragraphs;
};

const generateDOCX = async (title, content, type = "Report") => {
    const doc = new Document({
        sections: [{
            children: buildDocxParagraphs(title, content, type)
        }]
    });

    return await Packer.toBuffer(doc);
};

module.exports = { generatePDF, generateDOCX };
