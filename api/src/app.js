const express = require('express');
const path = require('path');
const cors = require('cors');
const aiRoutes = require('./routes/airoute');
const { errorHandler } = require('./middleware/errorhandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'Dev-AI API' });
});

const frontendBuild = path.join(__dirname, '../../frontend/build');
const fs = require('fs');
if (fs.existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));
    app.get('/{*path}', (req, res) => {
        res.sendFile(path.join(frontendBuild, 'index.html'));
    });
}

app.use(errorHandler);

module.exports = app;
