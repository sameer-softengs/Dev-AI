const express = require('express');
const path = require('path');
const cors = require('cors');
const aiRoutes = require('./routes/airoute');
const { errorHandler } = require('./middleware/errorhandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/ai', aiRoutes);

if (!process.env.VERCEL) {
    const fs = require('fs');
    const frontendBuild = path.join(__dirname, '../../frontend/build');
    if (fs.existsSync(frontendBuild)) {
        app.use(express.static(frontendBuild));
        app.get('*', (req, res) => {
            res.sendFile(path.join(frontendBuild, 'index.html'));
        });
    }
}

app.use(errorHandler);

module.exports = app;
