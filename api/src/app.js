const express = require('express');
const path = require('path');
const cors = require('cors');
const aiRoutes = require('./routes/airoute');
const { errorHandler } = require('./middleware/errorhandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/ai', aiRoutes);

// Serve frontend build (Docker)
const frontendBuild = path.join(__dirname, '../../frontend/build');
app.use(express.static(frontendBuild));
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
});

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;
