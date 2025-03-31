import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const connection = await pool.getConnection();
    
    try {
      const [doctors] = await connection.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.is_verified,
          u.created_at,
          d.license_number,
          d.specialization
        FROM users u
        LEFT JOIN doctors d ON u.id = d.user_id
        WHERE u.role = 'doctor'
        ORDER BY u.created_at DESC
      `);

      return NextResponse.json(doctors);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Doctors endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch doctors',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      },
      { status: 500 }
    );
  }
}