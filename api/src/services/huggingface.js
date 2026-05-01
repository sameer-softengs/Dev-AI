const axios = require('axios');

const toDataUrl = (buffer, mimeType = 'image/png') =>
    `data:${mimeType};base64,${Buffer.from(buffer).toString('base64')}`;

const fetchImageAsDataUrl = async (url, options = {}) => {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 45000,
        ...options
    });

    return toDataUrl(response.data, response.headers['content-type'] || 'image/png');
};

const generateWithPollinations = async (prompt) => {
    const encodedPrompt = encodeURIComponent(prompt);
    const urls = [
        `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=1024&nologo=true`,
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`
    ];

    let lastError = null;

    for (const url of urls) {
        try {
            return await fetchImageAsDataUrl(url, {
                headers: {
                    Accept: 'image/*'
                }
            });
        } catch (error) {
            lastError = error;
            console.error(`Pollinations Error (${error.response?.status || 'Network'}): ${url}`);
        }
    }

    throw lastError || new Error('Pollinations generation failed.');
};

const generateWithHuggingFace = async (prompt) => {
    if (!process.env.HF_TOKEN) {
        throw new Error('HF token not configured.');
    }

    try {
        console.log("Attempting Hugging Face Generation...");
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
            { inputs: prompt },
            {
                headers: { 
                    Authorization: `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                responseType: 'arraybuffer',
                timeout: 30000 // 30 seconds timeout
            }
        );

        return toDataUrl(response.data, response.headers['content-type'] || 'image/png');
    } catch (error) {
        console.error(`HF Error (${error.response?.status || 'Timeout'})`);
        throw error;
    }
};

const generateImage = async (prompt) => {
    const errors = [];

    try {
        return await generateWithPollinations(prompt);
    } catch (error) {
        errors.push(`Pollinations: ${error.response?.status || error.message}`);
    }

    try {
        return await generateWithHuggingFace(prompt);
    } catch (error) {
        errors.push(`HuggingFace: ${error.response?.status || error.message}`);
    }

    throw new Error(`Image generation failed. ${errors.join(' | ')}`);
};

module.exports = { generateImage };
