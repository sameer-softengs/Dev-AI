const { generateChatResponse, generateChatStream } = require('../services/openrouter');

const handleChatRequest = async (req, res) => {
    const { prompt, systemPrompt, messages, summary } = req.body;
    const normalizedMessages = Array.isArray(messages)
        ? messages.filter((message) => message && message.role && message.content)
        : [];

    if ((!prompt || String(prompt).trim().length === 0) && normalizedMessages.length === 0) {
        return res.status(400).json({ error: "Prompt or messages are required" });
    }

    if (prompt && String(prompt).length > 4000) {
        return res.status(400).json({ error: "Prompt is too long. Please keep it under 4000 characters." });
    }

    if (normalizedMessages.length > 20) {
        return res.status(400).json({ error: "Too many messages provided. Please keep it under 20 messages." });
    }

    const oversizedMessage = normalizedMessages.find(
        (message) => String(message.content || "").length > 4000
    );

    if (oversizedMessage) {
        return res.status(400).json({ error: "A message is too long. Please keep each under 4000 characters." });
    }

    if (summary && String(summary).length > 2000) {
        return res.status(400).json({ error: "Summary is too long. Please keep it under 2000 characters." });
    }

    try {
        const aiText = await generateChatResponse({
            userPrompt: prompt,
            systemInstruction: systemPrompt,
            messages: normalizedMessages,
            summary
        });
        res.status(200).json({
            success: true,
            data: aiText,
            currency: "PKR",
            cost: 0 // Since we are using a :free model
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const handleChatStream = async (req, res) => {
    const { prompt, systemPrompt, messages, summary } = req.body;
    const normalizedMessages = Array.isArray(messages)
        ? messages.filter((message) => message && message.role && message.content)
        : [];

    if ((!prompt || String(prompt).trim().length === 0) && normalizedMessages.length === 0) {
        return res.status(400).json({ error: "Prompt or messages are required" });
    }

    if (prompt && String(prompt).length > 4000) {
        return res.status(400).json({ error: "Prompt is too long. Please keep it under 4000 characters." });
    }

    if (normalizedMessages.length > 20) {
        return res.status(400).json({ error: "Too many messages provided. Please keep it under 20 messages." });
    }

    const oversizedMessage = normalizedMessages.find(
        (message) => String(message.content || "").length > 4000
    );

    if (oversizedMessage) {
        return res.status(400).json({ error: "A message is too long. Please keep each under 4000 characters." });
    }

    if (summary && String(summary).length > 2000) {
        return res.status(400).json({ error: "Summary is too long. Please keep it under 2000 characters." });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
    }

    try {
        const stream = await generateChatStream({
            userPrompt: prompt,
            systemInstruction: systemPrompt,
            messages: normalizedMessages,
            summary
        });

        req.on('close', () => {
            stream.destroy();
        });

        let buffer = '';

        stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) {
                    return;
                }

                const data = trimmed.replace(/^data:\s*/, '');
                if (data === '[DONE]') {
                    res.write('data: [DONE]\n\n');
                    res.end();
                    stream.destroy();
                    return;
                }

                try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta?.content || '';
                    if (delta) {
                        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
                    }
                } catch (parseError) {
                    // Ignore malformed chunks
                }
            });
        });

        stream.on('end', () => {
            res.write('data: [DONE]\n\n');
            res.end();
        });

        stream.on('error', (error) => {
            console.error('Stream error:', error.message);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        });
    } catch (error) {
        console.error('Chat stream setup error:', error.message);
        res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to get AI response.' })}\n\n`);
        res.end();
    }
};

module.exports = { handleChatRequest, handleChatStream };
