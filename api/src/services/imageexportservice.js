const axios = require('axios');
const { jsPDF } = require('jspdf');

const parseDataUrl = (value) => {
    const match = String(value || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    if (!match) {
        throw new Error('Invalid image data');
    }

    return {
        mimeType: match[1],
        buffer: Buffer.from(match[2], 'base64')
    };
};

const normalizeImageSource = async (source) => {
    if (!source) {
        throw new Error('Image source is required.');
    }

    if (String(source).startsWith('data:image/')) {
        return parseDataUrl(source);
    }

    const response = await axios.get(source, {
        responseType: 'arraybuffer',
        timeout: 45000
    });

    return {
        mimeType: response.headers['content-type'] || 'image/png',
        buffer: Buffer.from(response.data)
    };
};

const exportImageAsPdf = async ({ source, title = 'generated-image' }) => {
    const { mimeType, buffer } = await normalizeImageSource(source);
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
    });

    const imageType = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'JPEG' : 'PNG';
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 36;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2 - 28;
    const dimensions = pdf.getImageProperties(dataUrl);
    const ratio = Math.min(maxWidth / dimensions.width, maxHeight / dimensions.height);
    const renderWidth = dimensions.width * ratio;
    const renderHeight = dimensions.height * ratio;
    const x = (pageWidth - renderWidth) / 2;
    const y = 28 + (maxHeight - renderHeight) / 2;

    pdf.setFontSize(14);
    pdf.text(title, margin, 20);
    pdf.addImage(dataUrl, imageType, x, y, renderWidth, renderHeight);

    return Buffer.from(pdf.output('arraybuffer'));
};

module.exports = {
    normalizeImageSource,
    exportImageAsPdf
};
