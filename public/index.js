
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 12067;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files from public
app.use(express.static(path.join(__dirname, 'public')));

// Employee and Inventory routes
const employeeRoutes = require('./Employee');
app.use('/api', employeeRoutes);

// Test API
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working!'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
