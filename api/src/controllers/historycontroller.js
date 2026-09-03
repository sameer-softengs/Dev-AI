const { getUserHistory, getDailyImageUsage } = require('../services/historyservice');

const getHistory = async (req, res) => {
    try {
        const items = await getUserHistory(req.user.id);
        const usage = await getDailyImageUsage(req.user.id);

        res.status(200).json({
            success: true,
            items,
            imageUsage: usage
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load history.' });
    }
};

module.exports = { getHistory };
