

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({
    path: path.join(__dirname, '.env')
});

console.log('Employee DB configuration:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    passwordLoaded: !!process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const employeeDb = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Ilovefemboyz12345',
    database: process.env.DB_NAME || 'cake_ordering_system',
    port: Number(process.env.DB_PORT || 12067),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

employeeDb.getConnection()
    .then(connection => {
        console.log('Connected to Employee and Inventory database!');
        connection.release();
    })
    .catch(error => {
        console.error('Employee database connection error:', error.message);
    });

module.exports = employeeDb;
