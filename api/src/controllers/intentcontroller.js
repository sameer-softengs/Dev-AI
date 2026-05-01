const { classifyIntent } = require('../services/intentservice');

const handleIntentDetection = async (req, res) => {
    const { prompt, recentMessages = [] } = req.body;

    if (!prompt || String(prompt).trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Prompt is required.' });
    }

    try {
        const result = await classifyIntent(prompt, Array.isArray(recentMessages) ? recentMessages : []);
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    handleIntentDetection
};
