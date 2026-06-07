const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// FIXED: CORS middleware configured globally at the top before any routing logic
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully!'))
    .catch((err) => console.log('❌ Database Connection Failed:', err));

// Registering Routes
app.use('/api/assets', require('./routes/assetRoutes'));

app.get('/', (req, res) => {
    res.send('TagTrace Backend is running smoothly! 🚀');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}...`);
});

module.exports = app;