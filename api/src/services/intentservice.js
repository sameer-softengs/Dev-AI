const { generateStructuredResponse } = require('./openrouter');

const imageKeywords = [
    'generate image',
    'create image',
    'make image',
    'draw',
    'illustration',
    'poster',
    'photo',
    'picture',
    'logo',
    'render'
];

const documentKeywords = [
    'pdf',
    'document',
    'docx',
    'word file',
    'report',
    'proposal',
    'summary document',
    'notes document',
    'brief'
];

const heuristicIntent = (prompt = '') => {
    const normalized = String(prompt).toLowerCase();

    if (imageKeywords.some((keyword) => normalized.includes(keyword))) {
        return { intent: 'image', format: null, confidence: 'medium', source: 'fallback' };
    }

    if (documentKeywords.some((keyword) => normalized.includes(keyword))) {
        return {
            intent: 'document',
            format: normalized.includes('docx') || normalized.includes('word') ? 'docx' : 'pdf',
            confidence: 'medium',
            source: 'fallback'
        };
    }

    return { intent: 'chat', format: null, confidence: 'low', source: 'fallback' };
};

const sanitizeIntent = (value) => {
    const intent = ['chat', 'image', 'document'].includes(value) ? value : 'chat';
    return intent;
};

const sanitizeFormat = (intent, value) => {
    if (intent !== 'document') {
        return null;
    }

    return value === 'docx' ? 'docx' : 'pdf';
};

const extractJson = (value) => {
    const raw = String(value || '').trim();
    const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);

    if (fencedMatch) {
        return fencedMatch[1].trim();
    }

    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');

    if (firstBrace >= 0 && lastBrace > firstBrace) {
        return raw.slice(firstBrace, lastBrace + 1);
    }

    return raw;
};

const classifyIntent = async (prompt, recentMessages = []) => {
    const normalizedPrompt = String(prompt || '').trim();

    if (!normalizedPrompt) {
        return { intent: 'chat', format: null, confidence: 'low', source: 'fallback' };
    }

    try {
        const contextSnippet = recentMessages
            .slice(-4)
            .map((message) => `${message.role || 'user'}: ${message.content || ''}`)
            .join('\n');

        const response = await generateStructuredResponse({
            userPrompt: [
                `Latest user message: ${normalizedPrompt}`,
                contextSnippet ? `Recent conversation:\n${contextSnippet}` : 'Recent conversation: none'
            ].join('\n\n'),
            systemInstruction: [
                'Classify the latest user request for an AI workspace.',
                'Return only JSON with keys intent, format, confidence.',
                'intent must be one of: chat, image, document.',
                'format must be null unless intent is document, then use pdf or docx.',
                'confidence must be high, medium, or low.',
                'Choose image only when the user is explicitly asking to create or generate a visual asset.',
                'Choose document only when the user explicitly wants a downloadable document or file output.',
                'Otherwise choose chat.'
            ].join(' ')
        });

        const parsed = JSON.parse(extractJson(response));
        const intent = sanitizeIntent(parsed.intent);
        const format = sanitizeFormat(intent, parsed.format);
        const confidence = ['high', 'medium', 'low'].includes(parsed.confidence)
            ? parsed.confidence
            : 'low';

        if (confidence === 'low') {
            return { ...heuristicIntent(normalizedPrompt), source: 'fallback-low-confidence' };
        }

        return {
            intent,
            format,
            confidence,
            source: 'model'
        };
    } catch (error) {
        return heuristicIntent(normalizedPrompt);
    }
};

module.exports = {
    classifyIntent
};
