const crypto = require('crypto');
const { readStore, writeStore } = require('../utils/datastore');
const { hashPassword, verifyPassword } = require('./authservice');

const sanitizeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
});

const findUserByEmail = (email) => {
    const store = readStore();
    return store.users.find((user) => user.email === String(email || '').trim().toLowerCase()) || null;
};

const findUserById = (userId) => {
    const store = readStore();
    return store.users.find((user) => user.id === userId) || null;
};

const createUser = ({ name, email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const store = readStore();

    const existingUser = store.users.find((user) => user.email === normalizedEmail);
    if (existingUser) {
        throw new Error('An account with this email already exists.');
    }

    const user = {
        id: crypto.randomUUID(),
        name: String(name || '').trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
    };

    store.users.push(user);
    writeStore(store);

    return sanitizeUser(user);
};

const authenticateUser = ({ email, password }) => {
    const user = findUserByEmail(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
        throw new Error('Invalid email or password.');
    }

    return sanitizeUser(user);
};

module.exports = {
    createUser,
    authenticateUser,
    findUserById,
    sanitizeUser
};
