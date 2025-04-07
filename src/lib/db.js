import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'bankingsystem.mysql.database.azure.com',
  user: 'akshay202311006',
  password: 'qaz123!@#',
  database: 'pharmacy_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true
  }
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Database connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
})();

export default pool;