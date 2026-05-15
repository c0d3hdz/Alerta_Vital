const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'monitoreo_vital',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306,
});

module.exports = pool;
