import mysql from 'mysql2/promise';

// const pool = mysql.createPool({
//   host: 'bankingsystem.mysql.database.azure.com',
//   user: 'akshay202311006',
//   password: 'qaz123!@#',
//   database: 'pharmacy_system',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   ssl: {
//     rejectUnauthorized: true
//   }
// });

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'IIITV@icd#5560711',
  database: 'pharmacy_system',
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