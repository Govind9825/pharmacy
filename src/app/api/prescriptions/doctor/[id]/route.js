// app/api/prescriptions/doctor/[id]/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request, { params }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  const doctorId = params?.id;
  
  try {
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'doctor' || decoded.id.toString() !== doctorId) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const connection = await pool.getConnection();
    
    try {
      const [prescriptions] = await connection.query(`
        SELECT 
          p.id,
          p.patient_id,
          u.name as patient_name,
          p.diagnosis,
          p.notes,
          p.created_at,
          DATEDIFF(NOW(), p.created_at) > 30 as is_expired
        FROM prescriptions p
        JOIN users u ON p.patient_id = u.id
        WHERE p.doctor_id = ?
        ORDER BY p.created_at DESC
      `, [doctorId]);

      return NextResponse.json(prescriptions);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Prescriptions endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch prescriptions',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      },
      { status: 500 }
    );
  }
}