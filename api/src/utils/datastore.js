const fs = require('fs');
const path = require('path');

const dataDir = path.resolve(__dirname, '../../data');
const dataFile = path.join(dataDir, 'app-data.json');

const defaultState = {
    users: [],
    history: []
};

const ensureStore = () => {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, JSON.stringify(defaultState, null, 2), 'utf8');
    }
};

const readStore = () => {
    ensureStore();

    try {
        const raw = fs.readFileSync(dataFile, 'utf8');
        const parsed = JSON.parse(raw);

        return {
            users: Array.isArray(parsed.users) ? parsed.users : [],
            history: Array.isArray(parsed.history) ? parsed.history : []
        };
    } catch (error) {
        fs.writeFileSync(dataFile, JSON.stringify(defaultState, null, 2), 'utf8');
        return { ...defaultState };
    }
};

const writeStore = (state) => {
    ensureStore();
    fs.writeFileSync(dataFile, JSON.stringify(state, null, 2), 'utf8');
};

module.exports = {
    readStore,
    writeStore
};
