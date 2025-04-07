// app/api/prescriptions/doctor/[id]/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request, { params }) {
  let connection;
  try {
    // Get token from header
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Get doctor's prescriptions with patient names
    const doctorId = await Promise.resolve(params.id);
    const [prescriptions] = await connection.execute(
      `SELECT p.id, p.diagnosis, p.notes, p.created_at,
              u.name as patient_name, u.email as patient_email
       FROM prescriptions p
       JOIN users u ON p.patient_id = u.id
       WHERE p.doctor_id = ?
       ORDER BY p.created_at DESC`,
      [doctorId]
    );

    // Get items for each prescription
    for (const prescription of prescriptions) {
      const [items] = await connection.execute(
        `SELECT id, medicine_name, dosage, frequency, duration, instructions
         FROM prescription_items
         WHERE prescription_id = ?`,
        [prescription.id]
      );
      prescription.items = items;
    }

    return NextResponse.json(prescriptions);

  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}