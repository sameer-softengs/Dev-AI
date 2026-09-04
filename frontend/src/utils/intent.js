const imageKeywords = [
  'image',
  'picture',
  'photo',
  'poster',
  'illustration',
  'logo',
  'generate image',
  'create image',
  'make image',
  'draw'
];

const documentKeywords = [
  'pdf',
  'document',
  'docx',
  'report',
  'proposal',
  'notes',
  'summary',
  'brief',
  'srs'
];

export const detectIntent = (message) => {
  const normalized = String(message || '').toLowerCase();

  if (imageKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'image';
  }

  if (documentKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'document';
  }

  return 'chat';
};

export const inferDocumentFormat = (message) => {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('docx') || normalized.includes('word') ? 'docx' : 'pdf';
};
