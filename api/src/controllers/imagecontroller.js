const { generateImage } = require('../services/huggingface');

const handleImageRequest = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || String(prompt).trim().length === 0) {
        return res.status(400).json({ error: "Image prompt is required" });
    }

    if (String(prompt).length > 1000) {
        return res.status(400).json({ error: "Image prompt is too long. Please keep it under 1000 characters." });
    }

    try {
        const imageData = await generateImage(prompt);
        res.status(200).json({
            success: true,
            imageUrl: imageData
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { handleImageRequest };
