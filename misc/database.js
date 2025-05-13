const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log('MySQL pool created');
  return pool;
}

module.exports = initDB;