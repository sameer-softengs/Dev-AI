module.exports = {
    OPENROUTER_URL: "https://openrouter.ai/api/v1/chat/completions",
    OPENROUTER_KEY: process.env.OPENROUTER_KEY,
    DEFAULT_MODEL: "openrouter/free",
    SITE_URL: process.env.SITE_URL || "http://localhost:3000",
    SITE_NAME: "Sameer-AI-Platform",
    AUTH_TOKEN_SECRET: process.env.AUTH_TOKEN_SECRET
};
