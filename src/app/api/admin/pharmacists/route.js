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
      const [pharmacists] = await connection.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.is_verified,
          u.created_at,
          p.pharmacy_name,
          p.pharmacy_address,
          p.license_number
        FROM users u
        LEFT JOIN pharmacists p ON u.id = p.user_id
        WHERE u.role = 'pharmacist'
        ORDER BY u.created_at DESC
      `);

      return NextResponse.json(pharmacists);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Pharmacists endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch pharmacists',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      },
      { status: 500 }
    );
  }
}