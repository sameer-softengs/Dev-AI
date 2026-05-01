const axios = require('axios');
const { OPENROUTER_URL, OPENROUTER_KEY, DEFAULT_MODEL, SITE_URL, SITE_NAME } = require('../config/constant');

const createHeaders = () => ({
    "Authorization": `Bearer ${OPENROUTER_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": SITE_URL,
    "X-Title": SITE_NAME
});

const DEFAULT_SYSTEM_INSTRUCTION =
    "You are a helpful AI assistant on Sameer's platform. Write polished, well-structured responses with short headings, concise paragraphs, and clean bullet lists when useful. Avoid raw unformatted walls of text.";

const buildSystemPrompt = ({ systemInstruction = "", summary = "" }) => {
    const instruction = String(systemInstruction || "").trim();
    const memory = String(summary || "").trim();
    let prompt = DEFAULT_SYSTEM_INSTRUCTION;

    if (instruction) {
        prompt += `\n\nAdditional instructions:\n${instruction}`;
    }

    if (memory) {
        prompt += `\n\nConversation memory:\n${memory}`;
    }

    return prompt;
};

const createPayload = ({ userPrompt = "", systemInstruction = "", messages = [], summary = "", stream = false }) => {
    const normalizedMessages = Array.isArray(messages) && messages.length
        ? messages
        : [
            {
                role: "user",
                content: userPrompt
            }
        ];

    return {
        model: DEFAULT_MODEL,
        stream,
        messages: [
            {
                role: "system",
                content: buildSystemPrompt({ systemInstruction, summary })
            },
            ...normalizedMessages
        ]
    };
};

const generateChatResponse = async ({ userPrompt = "", systemInstruction = "", messages = [], summary = "" }) => {
    try {
        const response = await axios.post(
            OPENROUTER_URL,
            createPayload({ userPrompt, systemInstruction, messages, summary }),
            {
            headers: createHeaders()
            }
        );

        // OpenRouter returns an array of choices
        return response.data.choices[0].message.content;

    } catch (error) {
        console.error("OpenRouter Service Error:", error.response?.data || error.message);
        throw new Error("Failed to get response from OpenRouter.");
    }
};

const generateStructuredResponse = async ({ userPrompt, systemInstruction = "", messages = [], summary = "" }) => {
    try {
        const response = await axios.post(
            OPENROUTER_URL,
            createPayload({ userPrompt, systemInstruction, messages, summary }),
            {
            headers: createHeaders()
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("OpenRouter Structured Service Error:", error.response?.data || error.message);
        throw new Error("Failed to get structured response from OpenRouter.");
    }
};

const generateChatStream = async ({ userPrompt = "", systemInstruction = "", messages = [], summary = "" }) => {
    try {
        const response = await axios.post(
            OPENROUTER_URL,
            createPayload({ userPrompt, systemInstruction, messages, summary, stream: true }),
            {
                headers: createHeaders(),
                responseType: 'stream'
            }
        );

        return response.data;
    } catch (error) {
        console.error("OpenRouter Stream Error:", error.response?.data || error.message);
        throw new Error("Failed to get stream from OpenRouter.");
    }
};

module.exports = { generateChatResponse, generateStructuredResponse, generateChatStream };
