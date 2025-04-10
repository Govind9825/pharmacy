// app/api/prescriptions/doctor/[id]/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    // Await the params to be resolved
    const { id } = params;
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (decoded.role !== 'doctor' || decoded.id.toString() !== id) {
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
          DATEDIFF(NOW(), p.created_at) > 30 as is_expired,
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'name', pi.medicine_name,
                'dosage', pi.dosage,
                'frequency', pi.frequency,
                'duration', pi.duration,
                'instructions', pi.instructions
              )
            )
            FROM prescription_items pi
            WHERE pi.prescription_id = p.id
          ) as medicines
        FROM prescriptions p
        JOIN users u ON p.patient_id = u.id
        WHERE p.doctor_id = ?
        ORDER BY p.created_at DESC
      `, [id]);

      // Parse the JSON medicines array
      const parsedPrescriptions = prescriptions.map(prescription => ({
        ...prescription,
        medicines: prescription.medicines ? JSON.parse(prescription.medicines) : []
      }));

      return NextResponse.json(parsedPrescriptions);
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