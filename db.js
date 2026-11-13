const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '4321dekay',
    database: process.env.DB_NAME || 'cake_ordering_system',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to cake_ordering_system!');
        connection.release();
    })
    .catch(err => console.error('MySQL connection error:', err));

module.exports = pool;