const crypto = require('crypto');
const { getHistoryCollection } = require('../utils/datastore');

const MAX_HISTORY_ITEMS_PER_USER = 100;
const IMAGE_DAILY_LIMIT = 4;

const dateToKey = (value) => {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getTodayKey = () => dateToKey(new Date());

const addHistoryItem = async ({ userId, type, prompt, responseText = '', imageUrl = '' }) => {
    const history = await getHistoryCollection();

    const entry = {
        id: crypto.randomUUID(),
        userId,
        type,
        prompt,
        responseText,
        imageUrl,
        createdAt: new Date().toISOString()
    };

    await history.insertOne(entry);

    const count = await history.countDocuments({ userId });
    if (count > MAX_HISTORY_ITEMS_PER_USER) {
        const excess = await history.find({ userId })
            .sort({ createdAt: -1 })
            .skip(MAX_HISTORY_ITEMS_PER_USER)
            .project({ _id: 1 })
            .toArray();
        if (excess.length > 0) {
            await history.deleteMany({ _id: { $in: excess.map((e) => e._id) } });
        }
    }

    return entry;
};

const getUserHistory = async (userId) => {
    const history = await getHistoryCollection();
    return await history
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
};

const getDailyImageUsage = async (userId) => {
    const today = getTodayKey();
    const history = await getHistoryCollection();
    const used = await history.countDocuments({
        userId,
        type: 'image',
        $expr: {
            $eq: [
                { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                today
            ]
        }
    });

    return {
        date: today,
        used,
        remaining: Math.max(IMAGE_DAILY_LIMIT - used, 0),
        limit: IMAGE_DAILY_LIMIT
    };
};

module.exports = {
    addHistoryItem,
    getUserHistory,
    getDailyImageUsage,
    IMAGE_DAILY_LIMIT
};
