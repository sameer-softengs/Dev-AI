const { getUserHistory, getDailyImageUsage } = require('../services/historyservice');

const getHistory = (req, res) => {
    const items = getUserHistory(req.user.id);
    const usage = getDailyImageUsage(req.user.id);

    res.status(200).json({
        success: true,
        items,
        imageUsage: usage
    });
};

module.exports = { getHistory };
