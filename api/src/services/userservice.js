const crypto = require('crypto');
const { getUsersCollection, getResetTokensCollection } = require('../utils/datastore');
const { hashPassword, verifyPassword, generateResetToken, hashResetToken } = require('./authservice');

const sanitizeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
});

const findUserByEmail = async (email) => {
    const users = await getUsersCollection();
    return await users.findOne({ email: String(email || '').trim().toLowerCase() }) || null;
};

const findUserById = async (userId) => {
    const users = await getUsersCollection();
    return await users.findOne({ id: userId }) || null;
};

const createUser = async ({ name, email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const users = await getUsersCollection();

    const existingUser = await users.findOne({ email: normalizedEmail });
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

    await users.insertOne(user);
    return sanitizeUser(user);
};

const authenticateUser = async ({ email, password }) => {
    const user = await findUserByEmail(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
        throw new Error('Invalid email or password.');
    }

    return sanitizeUser(user);
};

const createResetToken = async (email) => {
    const user = await findUserByEmail(email);
    if (!user) {
        return { success: true };
    }

    const rawToken = generateResetToken();
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = Date.now() + 1000 * 60 * 60;

    const resetTokens = await getResetTokensCollection();
    await resetTokens.deleteMany({ userId: user.id });
    await resetTokens.insertOne({
        userId: user.id,
        tokenHash,
        expiresAt
    });

    return { success: true, rawToken, userId: user.id };
};

const resetPassword = async (token, newPassword) => {
    const tokenHash = hashResetToken(token);
    const resetTokens = await getResetTokensCollection();

    const entry = await resetTokens.findOne({
        tokenHash,
        expiresAt: { $gt: Date.now() }
    });

    if (!entry) {
        throw new Error('Invalid or expired reset token.');
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ id: entry.userId });
    if (!user) {
        throw new Error('User not found.');
    }

    await users.updateOne(
        { id: entry.userId },
        { $set: { passwordHash: hashPassword(newPassword) } }
    );

    await resetTokens.deleteMany({ userId: entry.userId });
    return sanitizeUser(user);
};

module.exports = {
    createUser,
    authenticateUser,
    findUserById,
    findUserByEmail,
    sanitizeUser,
    createResetToken,
    resetPassword
};
