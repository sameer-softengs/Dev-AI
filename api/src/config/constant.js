const path = require('path');
const dotenvPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: dotenvPath });

if (!process.env.OPENROUTER_KEY) {
    console.error('FATAL: OPENROUTER_KEY is not set in .env');
    process.exit(1);
}

module.exports = {
    OPENROUTER_URL: "https://openrouter.ai/api/v1/chat/completions",
    OPENROUTER_KEY: process.env.OPENROUTER_KEY,
    DEFAULT_MODEL: "openrouter/free",
    SITE_URL: process.env.SITE_URL || "http://localhost:3000",
    SITE_NAME: "Sameer-AI-Platform",
    AUTH_TOKEN_SECRET: process.env.AUTH_TOKEN_SECRET
};
