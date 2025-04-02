// app/api/patients/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  
  try {
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'doctor') {
      return NextResponse.json({ error: 'Doctor access required' }, { status: 403 });
    }

    const connection = await pool.getConnection();
    
    try {
      const [patients] = await connection.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          p.date_of_birth,
          p.address,
          p.phone
        FROM users u
        JOIN patients p ON u.id = p.user_id
        ORDER BY u.name ASC
      `);

      return NextResponse.json(patients);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Patients endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch patients',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      },
      { status: 500 }
    );
  }
}