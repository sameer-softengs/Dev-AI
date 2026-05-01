const path = require('path');
const dotenvPath = path.resolve(__dirname, '../../.env');
console.log(`Loading .env from: ${dotenvPath}`);
require('dotenv').config({ path: dotenvPath });

// DEBUG: This will print in your terminal so we can see if it worked
console.log("-----------------------------------------");
console.log("System Check:");
console.log("API Key Status:", process.env.OPENROUTER_KEY ? "EXISTS ✅" : "MISSING ❌");
console.log("Key Prefix:", process.env.OPENROUTER_KEY ? process.env.OPENROUTER_KEY.substring(0, 10) + "..." : "N/A");
console.log("-----------------------------------------");

module.exports = {
    OPENROUTER_URL: "https://openrouter.ai/api/v1/chat/completions",
    OPENROUTER_KEY: process.env.OPENROUTER_KEY,
    DEFAULT_MODEL: "openai/gpt-oss-120b:free", 
    SITE_URL: "http://localhost:3000",
    SITE_NAME: "Sameer-AI-Platform",
    AUTH_TOKEN_SECRET: process.env.AUTH_TOKEN_SECRET || "change-me-in-production"
};
