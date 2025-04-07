import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'doctor') {
      return NextResponse.json({ error: 'Only doctors can create prescriptions' }, { status: 403 });
    }

    const requestData = await request.json();
    console.log('Received data:', requestData);

    // Check if the data is in the expected format
    if (!requestData.medicines || !Array.isArray(requestData.medicines) || requestData.medicines.length === 0) {
      return NextResponse.json(
        { error: 'At least one medicine is required' },
        { status: 400 }
      );
    }

    // Get patient_id from the first medicine entry
    const patient_id = requestData.medicines[0].patient_id;
    const diagnosis = requestData.diagnosis || '';
    const notes = requestData.notes || '';

    if (!patient_id) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Verify patient exists
      const [patients] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND role = "patient"',
        [patient_id]
      );

      if (patients.length === 0) {
        await connection.rollback();
        connection.release();
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        );
      }

      // Create a new prescription
      const [prescriptionResult] = await connection.query(
        `INSERT INTO prescriptions
         (doctor_id, patient_id, diagnosis, notes)
         VALUES (?, ?, ?, ?)`,
        [decoded.id, patient_id, diagnosis, notes]
      );

      const prescriptionId = prescriptionResult.insertId;
      console.log('Created prescription with ID:', prescriptionId);

      // Add medicines
      for (const medicine of requestData.medicines) {
        console.log('Adding medicine:', medicine);
        await connection.query(
          `INSERT INTO prescription_items
           (prescription_id, medicine_name, dosage, frequency, duration, instructions)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            prescriptionId,
            medicine.medicine_name,
            medicine.dosage,
            medicine.frequency || 'daily',
            medicine.duration || '7 days',
            medicine.instructions || null
          ]
        );
      }

      await connection.commit();
      return NextResponse.json({ 
        message: 'Prescription created successfully',
        prescriptionId 
      });
    } catch (error) {
      await connection.rollback();
      console.error('Prescription creation error:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription', details: error.message },
      { status: 500 }
    );
  }
}