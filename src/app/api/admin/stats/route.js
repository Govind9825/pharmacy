import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    // Verify admin token first
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Get connection from pool
    const connection = await pool.getConnection();
    
    try {
      // Execute all queries in parallel
      const [
        [totalUsers],
        [doctors],
        [pharmacists],
        [patients]
      ] = await Promise.all([
        connection.query('SELECT COUNT(*) as count FROM users'),
        connection.query('SELECT COUNT(*) as count FROM users WHERE role = "doctor"'),
        connection.query('SELECT COUNT(*) as count FROM users WHERE role = "pharmacist"'),
        connection.query('SELECT COUNT(*) as count FROM users WHERE role = "patient"')
      ]);

      return NextResponse.json({
        totalUsers: totalUsers[0].count,
        doctors: doctors[0].count,
        pharmacists: pharmacists[0].count,
        patients: patients[0].count
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      },
      { status: 500 }
    );
  }
}