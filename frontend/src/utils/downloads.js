import { apiClient } from '../lib/api';

const slugify = (value) =>
  String(value || 'generated-image')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'generated-image';

const triggerDownload = (href, filename) => {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load image for download.'));
    image.src = src;
  });

export const downloadAsJpg = async (source, title) => {
  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);

  const href = canvas.toDataURL('image/jpeg', 0.92);
  triggerDownload(href, `${slugify(title)}.jpg`);
};

export const downloadAsPdf = async (source, title, token) => {
  const response = await apiClient.post(
    '/export-image',
    { source, format: 'pdf', title },
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }
  );

  const href = URL.createObjectURL(response.data);
  triggerDownload(href, `${slugify(title)}.pdf`);
  URL.revokeObjectURL(href);
};

export const exportDocumentFile = async ({
  content,
  format = 'pdf',
  title,
  token,
  type = 'General'
}) => {
  const response = await apiClient.post(
    '/export',
    { content, format: format === 'docx' ? 'doc' : format, title, type },
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }
  );

  const extension = format === 'docx' ? 'docx' : 'pdf';
  const href = URL.createObjectURL(response.data);
  triggerDownload(href, `${slugify(title)}.${extension}`);
  URL.revokeObjectURL(href);
};
