import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'doctor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { patient_id, diagnosis, notes, medicines } = await request.json();

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert prescription
      const [prescriptionResult] = await connection.query(
        'INSERT INTO prescriptions (doctor_id, patient_id, diagnosis, notes) VALUES (?, ?, ?, ?)',
        [decoded.id, patient_id, diagnosis, notes]
      );
      const prescriptionId = prescriptionResult.insertId;

      // Insert prescription items
      for (const medicine of medicines) {
        await connection.query(
          'INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES (?, ?, ?, ?, ?, ?)',
          [
            prescriptionId,
            medicine.name,
            medicine.dosage,
            medicine.frequency,
            medicine.duration,
            medicine.instructions
          ]
        );
      }

      await connection.commit();
      return NextResponse.json({ id: prescriptionId }, { status: 201 });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create prescription', details: error.message },
      { status: 500 }
    );
  }
}