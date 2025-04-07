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
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Get prescription details with doctor name
    const [prescriptions] = await connection.execute(
      `SELECT p.id, p.doctor_id, p.patient_id, p.diagnosis, p.notes, p.created_at,
              u.name as doctor_name
       FROM prescriptions p
       JOIN users u ON p.doctor_id = u.id
       WHERE p.id = ?`,
      [params.id]
    );

    if (prescriptions.length === 0) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    // Get prescription items
    const [items] = await connection.execute(
      `SELECT id, medicine_name, dosage, frequency, duration, instructions
       FROM prescription_items
       WHERE prescription_id = ?`,
      [params.id]
    );

    // Check if prescription is expired (7 days from creation)
    const prescription = prescriptions[0];
    const createdDate = new Date(prescription.created_at);
    const now = new Date();
    const daysDifference = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    prescription.is_expired = daysDifference > 7;

    // Add items to prescription
    prescription.items = items;

    return NextResponse.json(prescription);

  } catch (error) {
    console.error('Error fetching prescription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescription' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 