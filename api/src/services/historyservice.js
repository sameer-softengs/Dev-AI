const crypto = require('crypto');
const { readStore, writeStore } = require('../utils/datastore');

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

const addHistoryItem = ({ userId, type, prompt, responseText = '', imageUrl = '' }) => {
    const store = readStore();

    const entry = {
        id: crypto.randomUUID(),
        userId,
        type,
        prompt,
        responseText,
        imageUrl,
        createdAt: new Date().toISOString()
    };

    store.history.unshift(entry);

    const perUserHistory = store.history.filter((item) => item.userId === userId);
    if (perUserHistory.length > MAX_HISTORY_ITEMS_PER_USER) {
        const idsToKeep = new Set(perUserHistory.slice(0, MAX_HISTORY_ITEMS_PER_USER).map((item) => item.id));
        store.history = store.history.filter((item) => item.userId !== userId || idsToKeep.has(item.id));
    }

    writeStore(store);
    return entry;
};

const getUserHistory = (userId) => {
    const store = readStore();
    return store.history
        .filter((item) => item.userId === userId)
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
};

const getDailyImageUsage = (userId) => {
    const today = getTodayKey();
    const store = readStore();
    const used = store.history.filter(
        (item) => item.userId === userId && item.type === 'image' && dateToKey(item.createdAt) === today
    ).length;

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
