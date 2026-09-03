const { jsPDF } = require("jspdf");
const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    HeadingLevel,
    TabStopPosition,
    TabStopType,
    BorderStyle,
    ShadingType,
    ExternalHyperlink,
    PageNumber,
    Footer,
    Header
} = require("docx");

const COLORS = {
    text: [30, 30, 30],
    heading: [20, 20, 20],
    muted: [120, 120, 120],
    accent: [59, 130, 246],
    codeBg: [245, 245, 245],
    codeBorder: [220, 220, 220],
    quoteBar: [200, 200, 200],
    tableBorder: [200, 200, 200],
    tableHeader: [248, 248, 248],
    divider: [230, 230, 230]
};

const normalizePlainText = (value = "") =>
    String(value)
        .replace(/[‐–—]/g, '-')
        .replace(/['']/g, "'")
        .replace(/[""]/g, '"')
        .replace(/\u00A0/g, ' ')
        .replace(/\u2007/g, ' ')
        .replace(/\u202F/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/[^\x0A\x0D\x20-\x7E]/g, '');

const cleanInlineMarkdown = (value = "") =>
    normalizePlainText(value)
        .replace(/\|/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const stripBold = (value = "") =>
    value.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');

const stripListPrefix = (value = "") =>
    stripBold(
        String(value)
            .replace(/^(-|\*|•)\s+/, '')
            .replace(/^\d+\.\s+/, '')
    );

const isSeparatorLine = (line) => /^[-=*]{3,}$/.test(line.trim());
const isBulletLine = (line) => /^(-|\*|•)\s+/.test(line.trim());
const isNumberedLine = (line) => /^\d+\.\s+/.test(line.trim());
const isMarkdownHeading = (line) => /^#{1,4}\s+/.test(line.trim());
const isBlockquote = (line) => /^>\s+/.test(line.trim());
const isCodeFence = (line) => /^```/.test(line.trim());
const isLooseHeading = (line) =>
    /^(\d+(\.\d+)*\s+.+|[A-Za-z][A-Za-z\s]{1,60}:)$/.test(line.trim());
const isTableLine = (line) => line.includes('|');

const normalizeHeadingText = (line) =>
    stripBold(
        cleanInlineMarkdown(
            String(line)
                .replace(/^#{1,4}\s+/, '')
                .replace(/:$/, '')
                .replace(/^"+|"+$/g, '')
        )
    );

const parseInlineFormatting = (text) => {
    const parts = [];
    const regex = /(\*\*(.*?)\*\*|\*(.*?)\*|`([^`]+)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.slice(lastIndex, match.index), bold: false, italic: false, mono: false });
        }
        if (match[2]) {
            parts.push({ text: match[2], bold: true, italic: false, mono: false });
        } else if (match[3]) {
            parts.push({ text: match[3], bold: false, italic: true, mono: false });
        } else if (match[4]) {
            parts.push({ text: match[4], bold: false, italic: false, mono: true });
        }
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push({ text: text.slice(lastIndex), bold: false, italic: false, mono: false });
    }

    return parts.length > 0 ? parts : [{ text, bold: false, italic: false, mono: false }];
};

const parseStructuredBlocks = (content = "") => {
    const lines = normalizePlainText(content).split(/\r?\n/);
    const blocks = [];
    let paragraphBuffer = [];
    let inCodeBlock = false;
    let codeLines = [];

    const flushParagraph = () => {
        const text = cleanInlineMarkdown(paragraphBuffer.join(' '));
        if (text) {
            blocks.push({ type: 'paragraph', text, inline: parseInlineFormatting(text) });
        }
        paragraphBuffer = [];
    };

    for (let index = 0; index < lines.length; index += 1) {
        const rawLine = lines[index];
        const line = rawLine.trim();

        if (isCodeFence(line)) {
            if (inCodeBlock) {
                blocks.push({ type: 'code', lines: codeLines });
                codeLines = [];
                inCodeBlock = false;
            } else {
                flushParagraph();
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeLines.push(rawLine);
            continue;
        }

        if (!line || isSeparatorLine(line)) {
            flushParagraph();
            if (isSeparatorLine(line)) {
                blocks.push({ type: 'divider' });
            }
            continue;
        }

        if (isTableLine(line)) {
            flushParagraph();
            const rows = [];
            while (index < lines.length && isTableLine(lines[index].trim())) {
                const row = cleanInlineMarkdown(lines[index]);
                if (row && !/^:?-{2,}:?$/.test(row)) {
                    rows.push(row.split('|').map(c => c.trim()).filter(Boolean));
                }
                index += 1;
            }
            index -= 1;
            if (rows.length > 0) {
                blocks.push({ type: 'table', rows });
            }
            continue;
        }

        if (isBlockquote(line)) {
            flushParagraph();
            const quoteLines = [];
            while (index < lines.length && isBlockquote(lines[index].trim())) {
                quoteLines.push(stripBold(cleanInlineMarkdown(lines[index].trim().replace(/^>\s+/, ''))));
                index += 1;
            }
            index -= 1;
            blocks.push({ type: 'blockquote', text: quoteLines.join(' ') });
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
                if (!sameType) break;
                items.push(stripListPrefix(current));
                index += 1;
            }
            index -= 1;
            blocks.push({ type, items });
            continue;
        }

        if (isMarkdownHeading(line) || isLooseHeading(line)) {
            flushParagraph();
            blocks.push({ type: 'heading', text: normalizeHeadingText(line) });
            continue;
        }

        paragraphBuffer.push(line);
    }

    if (inCodeBlock && codeLines.length > 0) {
        blocks.push({ type: 'code', lines: codeLines });
    }

    flushParagraph();
    return blocks;
};

// ─── PDF Generation (Claude-style) ───

const ensurePdfSpace = (doc, y, neededHeight, meta) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomLimit = pageHeight - 25;

    if (y + neededHeight <= bottomLimit) {
        return y;
    }

    doc.addPage();
    meta.page += 1;
    return 35;
};

const addPdfFooter = (doc, pageNumber) => {
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(String(pageNumber), width / 2, height - 12, { align: 'center' });
};

const renderInlineParts = (doc, parts, x, y, baseOptions) => {
    let cursorX = x;
    const lineHeight = baseOptions.lineHeight || 6;
    const fontSize = baseOptions.fontSize || 10.5;

    parts.forEach((part) => {
        if (part.mono) {
            doc.setFont('courier', 'normal');
            doc.setFontSize(fontSize - 1);
            doc.setTextColor(60, 60, 60);
        } else if (part.bold && part.italic) {
            doc.setFont('helvetica', 'bolditalic');
            doc.setFontSize(fontSize);
            doc.setTextColor(...(baseOptions.color || COLORS.text));
        } else if (part.bold) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize);
            doc.setTextColor(...(baseOptions.color || COLORS.text));
        } else if (part.italic) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(fontSize);
            doc.setTextColor(...(baseOptions.color || COLORS.text));
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(fontSize);
            doc.setTextColor(...(baseOptions.color || COLORS.text));
        }

        const split = doc.splitTextToSize(part.text, baseOptions.maxWidth || 170);
        split.forEach((line, lineIndex) => {
            if (lineIndex > 0) {
                cursorX = x;
                y += lineHeight;
            }
            doc.text(line, cursorX, y);
            cursorX += doc.getTextWidth(line);
        });
    });

    return y;
};

const renderParagraph = (doc, block, y, meta, options = {}) => {
    const width = options.width || 170;
    const lineHeight = options.lineHeight || 6;
    const fontSize = options.fontSize || 10.5;
    const x = options.x || 20;

    const probe = doc.splitTextToSize(stripBold(block.text), width);
    const neededHeight = probe.length * lineHeight + (options.paddingBottom || 4);

    y = ensurePdfSpace(doc, y, neededHeight, meta);

    if (block.inline && block.inline.length > 1) {
        y = renderInlineParts(doc, block.inline, x, y, {
            lineHeight,
            fontSize,
            color: options.color || COLORS.text,
            maxWidth: width
        });
    } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(...(options.color || COLORS.text));
        const lines = doc.splitTextToSize(stripBold(block.text), width);
        doc.text(lines, x, y);
        y += lines.length * lineHeight;
    }

    return y + (options.paddingBottom || 4);
};

const renderHeading = (doc, block, y, meta) => {
    const x = 20;
    const text = block.text;

    y = ensurePdfSpace(doc, y, 16, meta);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.heading);
    doc.text(text, x, y);
    y += 4;

    doc.setDrawColor(...COLORS.divider);
    doc.setLineWidth(0.4);
    doc.line(x, y, x + 40, y);

    return y + 10;
};

const renderBlockquote = (doc, block, y, meta) => {
    const x = 20;
    const indent = 28;
    const width = 170 - (indent - x);
    const lineHeight = 6;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.muted);

    const probe = doc.splitTextToSize(block.text, width);
    const neededHeight = probe.length * lineHeight + 8;

    y = ensurePdfSpace(doc, y, neededHeight, meta);

    doc.setDrawColor(...COLORS.quoteBar);
    doc.setLineWidth(1.5);
    doc.line(indent - 4, y - 4, indent - 4, y + probe.length * lineHeight - 2);

    const lines = doc.splitTextToSize(block.text, width);
    doc.text(lines, indent, y);

    return y + lines.length * lineHeight + 6;
};

const renderCodeBlock = (doc, block, y, meta) => {
    const x = 20;
    const width = 170;
    const lineHeight = 5;
    const fontSize = 9;
    const padding = 6;
    const lineHeightInner = 5;

    const neededHeight = block.lines.length * lineHeightInner + padding * 2 + 4;
    y = ensurePdfSpace(doc, y, neededHeight, meta);

    doc.setFillColor(...COLORS.codeBg);
    doc.setDrawColor(...COLORS.codeBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(x - 2, y - 4, width + 4, neededHeight - 2, 3, 3, 'FD');

    doc.setFont('courier', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(50, 50, 50);

    let codeY = y + padding;
    block.lines.forEach((line) => {
        const trimmed = line.length > 100 ? line.slice(0, 100) + '...' : line;
        doc.text(trimmed || ' ', x + 4, codeY);
        codeY += lineHeightInner;
    });

    return codeY + padding;
};

const renderList = (doc, block, y, meta) => {
    const x = 24;
    const width = 166;
    const lineHeight = 6;

    block.items.forEach((item, index) => {
        const prefix = block.type === 'numbered-list' ? `${index + 1}.  ` : '•  ';
        const fullText = prefix + item;
        const probe = doc.splitTextToSize(stripBold(fullText), width);
        const neededHeight = probe.length * lineHeight + 3;

        y = ensurePdfSpace(doc, y, neededHeight, meta);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(...COLORS.text);

        const lines = doc.splitTextToSize(fullText, width);
        lines.forEach((line, lineIndex) => {
            doc.text(line, lineIndex === 0 ? x - 4 : x + 4, y);
            y += lineHeight;
        });

        y += 2;
    });

    return y + 2;
};

const renderTable = (doc, block, y, meta) => {
    const x = 20;
    const width = 170;
    const colCount = Math.max(...block.rows.map(r => r.length));
    const colWidth = width / colCount;
    const rowHeight = 8;
    const fontSize = 9;

    const totalHeight = block.rows.length * rowHeight + 4;
    y = ensurePdfSpace(doc, y, totalHeight, meta);

    block.rows.forEach((row, rowIndex) => {
        const isHeader = rowIndex === 0;

        if (isHeader) {
            doc.setFillColor(...COLORS.tableHeader);
            doc.rect(x, y - 4, width, rowHeight, 'F');
        }

        doc.setDrawColor(...COLORS.tableBorder);
        doc.setLineWidth(0.2);
        doc.rect(x, y - 4, width, rowHeight, 'S');

        row.forEach((cell, colIndex) => {
            const cellX = x + colIndex * colWidth + 3;
            doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
            doc.setFontSize(fontSize);
            doc.setTextColor(...COLORS.text);
            const truncated = cell.length > 30 ? cell.slice(0, 30) + '...' : cell;
            doc.text(truncated, cellX, y);
        });

        y += rowHeight;
    });

    return y + 4;
};

const renderDivider = (doc, y, meta) => {
    y = ensurePdfSpace(doc, y, 8, meta);
    doc.setDrawColor(...COLORS.divider);
    doc.setLineWidth(0.3);
    doc.line(20, y, 190, y);
    return y + 8;
};

const generatePDF = async (title, content, type = "General") => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const blocks = parseStructuredBlocks(content);
    const meta = { page: 1, title, type };

    // ── Title page ──
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 20, 30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...COLORS.heading);
    const titleLines = doc.splitTextToSize(stripBold(title), 160);
    doc.text(titleLines, 20, 50);

    let y = 50 + titleLines.length * 12 + 6;

    doc.setDrawColor(...COLORS.divider);
    doc.setLineWidth(0.5);
    doc.line(20, y, 80, y);
    y += 10;

    addPdfFooter(doc, meta.page);

    // ── Content ──
    blocks.forEach((block) => {
        switch (block.type) {
            case 'heading':
                y = renderHeading(doc, block, y, meta);
                break;
            case 'paragraph':
                y = renderParagraph(doc, block, y, meta, {
                    fontSize: 10.5,
                    lineHeight: 6,
                    paddingBottom: 4
                });
                break;
            case 'bullet-list':
            case 'numbered-list':
                y = renderList(doc, block, y, meta);
                break;
            case 'blockquote':
                y = renderBlockquote(doc, block, y, meta);
                break;
            case 'code':
                y = renderCodeBlock(doc, block, y, meta);
                break;
            case 'table':
                y = renderTable(doc, block, y, meta);
                break;
            case 'divider':
                y = renderDivider(doc, y, meta);
                break;
        }
    });

    // Add page numbers to all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addPdfFooter(doc, i);
    }

    return Buffer.from(doc.output('arraybuffer'));
};

// ─── DOCX Generation (Claude-style) ───

const buildDocxParagraphs = (title, content, type) => {
    const blocks = parseStructuredBlocks(content);
    const paragraphs = [];

    // Title block
    paragraphs.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    size: 18,
                    color: '787878',
                    font: 'Calibri'
                })
            ],
            spacing: { after: 200 }
        })
    );

    paragraphs.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: cleanInlineMarkdown(title),
                    bold: true,
                    size: 52,
                    font: 'Calibri',
                    color: '141414'
                })
            ],
            spacing: { after: 120 }
        })
    );

    paragraphs.push(
        new Paragraph({
            border: {
                bottom: { style: BorderStyle.SINGLE, size: 3, color: 'E6E6E6' }
            },
            spacing: { after: 300 }
        })
    );

    blocks.forEach((block) => {
        if (block.type === 'heading') {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: block.text,
                            bold: true,
                            size: 30,
                            font: 'Calibri',
                            color: '141414'
                        })
                    ],
                    border: {
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E6E6E6', space: 4 }
                    },
                    spacing: { before: 360, after: 160 }
                })
            );
            return;
        }

        if (block.type === 'paragraph') {
            const children = (block.inline || []).map((part) => {
                const runOptions = {
                    text: part.text,
                    size: 21,
                    font: 'Calibri',
                    color: '1E1E1E'
                };
                if (part.bold) runOptions.bold = true;
                if (part.italic) runOptions.italics = true;
                if (part.mono) {
                    runOptions.font = 'Courier New';
                    runOptions.size = 19;
                    runOptions.color = '323232';
                    runOptions.shading = {
                        type: ShadingType.SOLID,
                        color: 'F5F5F5',
                        fill: 'F5F5F5'
                    };
                }
                return new TextRun(runOptions);
            });

            paragraphs.push(
                new Paragraph({
                    children,
                    spacing: { after: 160, line: 360 }
                })
            );
            return;
        }

        if (block.type === 'bullet-list' || block.type === 'numbered-list') {
            block.items.forEach((item, index) => {
                const prefix = block.type === 'numbered-list' ? `${index + 1}. ` : '• ';
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: prefix + item,
                                size: 21,
                                font: 'Calibri',
                                color: '1E1E1E'
                            })
                        ],
                        spacing: { after: 80, line: 340 },
                        indent: { left: 360 }
                    })
                );
            });
            return;
        }

        if (block.type === 'blockquote') {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: block.text,
                            italics: true,
                            size: 21,
                            font: 'Calibri',
                            color: '6B6B6B'
                        })
                    ],
                    border: {
                        left: { style: BorderStyle.SINGLE, size: 6, color: 'C8C8C8', space: 8 }
                    },
                    indent: { left: 360 },
                    spacing: { after: 160, line: 360 }
                })
            );
            return;
        }

        if (block.type === 'code') {
            block.lines.forEach((line) => {
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: line || ' ',
                                size: 18,
                                font: 'Courier New',
                                color: '323232'
                            })
                        ],
                        shading: {
                            type: ShadingType.SOLID,
                            color: 'F5F5F5',
                            fill: 'F5F5F5'
                        },
                        spacing: { after: 40, line: 300 },
                        indent: { left: 240 }
                    })
                );
            });
            paragraphs.push(new Paragraph({ spacing: { after: 120 } }));
            return;
        }

        if (block.type === 'table') {
            block.rows.forEach((row, rowIndex) => {
                const isHeader = rowIndex === 0;
                const rowText = row.join('  |  ');
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: rowText,
                                bold: isHeader,
                                size: 18,
                                font: isHeader ? 'Calibri' : 'Calibri',
                                color: isHeader ? '14141E' : '1E1E1E'
                            })
                        ],
                        shading: isHeader ? {
                            type: ShadingType.SOLID,
                            color: 'F8F8F8',
                            fill: 'F8F8F8'
                        } : undefined,
                        spacing: { after: 60, line: 320 },
                        indent: { left: 240 }
                    })
                );
            });
            paragraphs.push(new Paragraph({ spacing: { after: 120 } }));
            return;
        }

        if (block.type === 'divider') {
            paragraphs.push(
                new Paragraph({
                    border: {
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E6E6E6' }
                    },
                    spacing: { before: 120, after: 120 }
                })
            );
        }
    });

    return paragraphs;
};

const generateDOCX = async (title, content, type = "Report") => {
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Calibri',
                        size: 21,
                        color: '1E1E1E'
                    }
                }
            }
        },
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1440,
                        right: 1440,
                        bottom: 1440,
                        left: 1440
                    }
                }
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    children: [PageNumber.CURRENT],
                                    font: 'Calibri',
                                    size: 18,
                                    color: '787878'
                                })
                            ]
                        })
                    ]
                })
            },
            children: buildDocxParagraphs(title, content, type)
        }]
    });

    return await Packer.toBuffer(doc);
};

module.exports = { generatePDF, generateDOCX };
