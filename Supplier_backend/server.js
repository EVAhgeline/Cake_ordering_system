const express = require('express');
const cors = require('cors');
app.use(cors()); // Allow requests from any local port
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, 'config', '.env')
});

const db = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Supplier routes
app.use('/api/suppliers', require('./config/routes/supplierRoutes'));

app.get('/', (req, res) => {
    res.send('Supplier Management API is running!');
});

const PORT = process.env.PORT || 12067;

async function startServer() {
    try {
        await db.query('SELECT 1');

        console.log('MySQL connected successfully!');

        app.listen(PORT, () => {
            console.log(`Supplier server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
}

startServer();