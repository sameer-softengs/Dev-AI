const express = require('express');
const cors = require('cors');
const aiRoutes = require('./routes/airoute');
const { errorHandler } = require('./middleware/errorhandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/ai', aiRoutes);

// Simple Health Check for your browser
app.get('/', (req, res) => {
    res.send("Sameer's AI Platform Backend is Running! 🚀");
});

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;
