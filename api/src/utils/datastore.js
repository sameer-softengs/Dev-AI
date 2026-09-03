const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'devai';

let client = null;
let db = null;

const connectDB = async () => {
    if (db) return db;

    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not set');
    }

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    return db;
};

const getCollection = async (name) => {
    const database = await connectDB();
    return database.collection(name);
};

const getUsersCollection = async () => getCollection('users');
const getHistoryCollection = async () => getCollection('history');
const getResetTokensCollection = async () => getCollection('resetTokens');

module.exports = {
    connectDB,
    getUsersCollection,
    getHistoryCollection,
    getResetTokensCollection
};
