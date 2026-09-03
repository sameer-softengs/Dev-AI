const crypto = require('crypto');
const { AUTH_TOKEN_SECRET } = require('../config/constant');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

const verifyPassword = (password, storedPassword) => {
    const [salt, storedHash] = String(storedPassword || '').split(':');

    if (!salt || !storedHash) {
        return false;
    }

    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
};

const base64UrlEncode = (value) =>
    Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const base64UrlDecode = (value) => {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
};

const signToken = (payload) => {
    const body = {
        ...payload,
        exp: Date.now() + TOKEN_TTL_MS
    };

    const encodedPayload = base64UrlEncode(JSON.stringify(body));
    const signature = crypto
        .createHmac('sha256', AUTH_TOKEN_SECRET)
        .update(encodedPayload)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');

    return `${encodedPayload}.${signature}`;
};

const verifyToken = (token) => {
    if (!token || !token.includes('.')) {
        throw new Error('Invalid token');
    }

    const [encodedPayload, signature] = token.split('.');
    const expectedSignature = crypto
        .createHmac('sha256', AUTH_TOKEN_SECRET)
        .update(encodedPayload)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        throw new Error('Invalid token signature');
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    if (!payload.exp || payload.exp < Date.now()) {
        throw new Error('Token expired');
    }

    return payload;
};

const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const hashResetToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
    hashPassword,
    verifyPassword,
    signToken,
    verifyToken,
    generateResetToken,
    hashResetToken
};
