import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the requesting user is the patient
    const patientId = await params.id;
    if (String(decoded.id) !== String(patientId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get a connection from the pool
    const connection = await pool.getConnection();

    try {
      // Fetch prescriptions with doctor's name
      const [prescriptions] = await connection.query(
        `SELECT p.*, u.name as doctor_name
         FROM prescriptions p
         JOIN users u ON p.doctor_id = u.id
         WHERE p.patient_id = ?`,
        [patientId]
      );

      // Fetch items for each prescription
      for (const prescription of prescriptions) {
        const [items] = await connection.query(
          `SELECT *
           FROM prescription_items
           WHERE prescription_id = ?`,
          [prescription.id]
        );
        prescription.medications = items;
      }

      return NextResponse.json(prescriptions);
    } finally {
      // Always release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}