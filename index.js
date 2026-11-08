
const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const app = express();

// Main server port
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
// DATABASE CONNECTION
// ==========================================

const db = require('./db');

// ==========================================
// ROUTE IMPORTS
// ==========================================

const cakeDesignRoutes = require('./routes/cakeDesignRoutes');
const employeeRoutes = require('./Employee');
const supplierRoutes = require('./Supplier_backend/config/routes/supplierRoutes');
const orderRoutes = require('./routes/orderRoutes');

// ==========================================
// REGISTER ROUTES
// ==========================================

app.use('/api/cake-designs', cakeDesignRoutes);
app.use('/api/auth', employeeRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);

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
        message: 'Cake Ordering System API is working!'
    });
});

// ==========================================
// DATABASE TEST
// ==========================================

app.get('/api/test-db', async (req, res) => {
    try {
        await db.query('SELECT 1');

        res.json({
            success: true,
            message: 'Successfully connected to cake_ordering_system!'
        });
    } catch (error) {
        console.error('Database test error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Database connection failed.'
        });
    }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log('Cake Ordering System server started!');
    console.log(`Main server: http://localhost:${PORT}`);
    console.log(`Employee API: http://localhost:${PORT}/api/auth`);
    console.log(`Supplier API: http://localhost:${PORT}/api/suppliers`);
    console.log(`Cake Design API: http://localhost:${PORT}/api/cake-designs`);
});
