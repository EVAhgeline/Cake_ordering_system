
const mysql = require('mysql2/promise');
require('dotenv').config();

const employeeDb = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: 'cake_ordering_system',
    port: process.env.DB_PORT || 3306,
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

