const { generatePDF, generateDOCX } = require('../services/filegenerator');
const { normalizeImageSource, exportImageAsPdf } = require('../services/imageexportservice');

const handleFileExport = async (req, res) => {
    const { format, title, content, type } = req.body;
    const safeTitle = String(title || 'generated-document');
    const safeType = String(type || 'General');

    if (!content) return res.status(400).json({ error: "Content is required." });

    try {
        let buffer;
        let contentType;
        const isPdf = format === 'pdf';
        const extension = isPdf ? 'pdf' : 'docx';
        let fileName = `${safeTitle.replace(/\s+/g, '_')}_${safeType}.${extension}`;

        if (isPdf) {
            buffer = await generatePDF(safeTitle, content, safeType);
            contentType = 'application/pdf';
        } else {
            buffer = await generateDOCX(safeTitle, content, safeType);
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.send(buffer);
    } catch (error) {
        console.error('File export error:', error);
        res.status(500).json({ error: "Generation failed." });
    }
};

const handleImageExport = async (req, res) => {
    const { source, format = 'jpg', title = 'generated-image' } = req.body;
    const safeTitle = String(title || 'generated-image');

    if (!source) {
        return res.status(400).json({ success: false, error: 'Image source is required.' });
    }

    try {
        if (format === 'pdf') {
            const buffer = await exportImageAsPdf({ source, title: safeTitle });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${safeTitle.replace(/\s+/g, '_')}.pdf`);
            return res.send(buffer);
        }

        const { mimeType, buffer } = await normalizeImageSource(source);
        const extension = mimeType.includes('png') ? 'png' : 'jpg';

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename=${safeTitle.replace(/\s+/g, '_')}.${extension}`);
        return res.send(buffer);
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Image export failed.' });
    }
};

module.exports = { handleFileExport, handleImageExport };
