import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Verify token and get user data
    const decoded = verifyToken(token);
    
    // Ensure the user is a doctor
    if (decoded.role !== 'doctor') {
      return NextResponse.json({ error: 'Only doctors can create prescriptions' }, { status: 403 });
    }

    // Parse request body
    const requestData = await request.json();
    console.log('Received data:', requestData);
    
    // Validate required fields for the prescription
    if (!requestData.medicines[0].patient_id) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'Patient ID is required' 
      }, { status: 400 });
    }
    
    // Validate that medicines array exists and isn't empty
    if (!requestData.medicines || requestData.medicines.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'At least one medicine must be added' 
      }, { status: 400 });
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Check if the patient exists
      const [patients] = await connection.query(
        'SELECT id FROM users WHERE id = ?',
        [requestData.medicines[0].patient_id]
      );
      
      if (patients.length === 0) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }
      
      // Create a new prescription
      const [prescriptionResult] = await connection.query(
        `INSERT INTO prescriptions 
         (patient_id, doctor_id, diagnosis, notes, created_at, status) 
         VALUES (?, ?, ?, ?, NOW(), 'active')`,
        [
          requestData.medicines[0].patient_id,
          decoded.id,
          requestData.diagnosis || '',
          requestData.notes || ''
        ]
      );
      
      const prescriptionId = prescriptionResult.insertId;
      
      // Add all medicines to the prescription
      for (const medicine of requestData.medicines) {
        await connection.query(
          `INSERT INTO prescription_items 
           (prescription_id, medicine_name, dosage, frequency, duration, instructions) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            prescriptionId,
            medicine.medicine_name, // Using the field name from your frontend
            medicine.dosage,
            medicine.frequency || 'daily',
            medicine.duration || '7 days',
            medicine.instructions || ''
          ]
        );
      }
      
      // Commit the transaction
      await connection.commit();
      connection.release();
      
      return NextResponse.json({
        success: true,
        message: 'Prescription created successfully',
        id: prescriptionId
      }, { status: 201 });
    } catch (transactionError) {
      // If anything goes wrong, roll back the transaction
      await connection.rollback();
      connection.release();
      throw transactionError;
    }
    
  } catch (error) {
    console.error('Prescription creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create prescription', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}