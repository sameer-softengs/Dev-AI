const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`✅ Server is live on: http://localhost:${PORT}`);
    console.log(`✅ Environment: Development`);
    console.log(`✅ Default Currency: PKR`);
    console.log(`-----------------------------------------`);
});

module.exports = app;