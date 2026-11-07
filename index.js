
const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database connections
const cakeDb = require('./db');
const employeeDb = require('./employeeDb');

// Cake Design API
const cakeDesignRoutes = require('./cake_design');
app.use('/api/cake-designs', cakeDesignRoutes);

// Employee and Inventory API
const employeeRoutes = require('./Employee');
app.use('/api', employeeRoutes);

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test API
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Start server
const PORT = process.env.PORT || 12067;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
