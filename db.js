const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Ilovefemboyz12345',
    database: process.env.DB_NAME || 'cake_design_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to normalized MySQL database!');
        connection.release();
    })
    .catch(err => console.error('MySQL connection error:', err));

module.exports = pool;