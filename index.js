
const express = require('express');
const cors = require('cors');
const path = require('path');
const supplierRoutes = require('./Supplier_backend/config/routes/supplierRoutes');

require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const app = express();

// Employee backend uses port 12068.
// Supplier backend uses port 12067.
const PORT = process.env.EMPLOYEE_PORT || 12068;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// FRONTEND
// ==========================================

app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// DATABASE CONNECTIONS
// ==========================================

const cakeDb = require('./db');
const employeeDb = require('./employeeDb');

// ==========================================
// ROUTE IMPORTS
// ==========================================

const cakeDesignRoutes = require('./routes/cakeDesignRoutes');
const employeeRoutes = require('./Employee');

// ==========================================
// REGISTER ROUTES
// ==========================================

app.use('/api/cake-designs', cakeDesignRoutes);
app.use('/api/auth', employeeRoutes);
app.use('/api/suppliers', supplierRoutes);

// ==========================================
// HOMEPAGE
// ==========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// API TEST
// ==========================================

app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Employee API is working!'
    });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log('Cake Ordering System server started!');
    console.log(`Employee server: http://localhost:${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
});
