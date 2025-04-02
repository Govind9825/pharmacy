import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request, { params }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const decoded = verifyToken(token);
    const patientId = params.id;
    
    // Verify the requesting user is either the patient or their doctor
    if (decoded.role !== 'doctor' && decoded.id.toString() !== patientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // First, check if the patient exists
    const [patients] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND (role = "patient" OR role = "user")',
      [patientId]
    );
    
    if (patients.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch patient: Patient not found' },
        { status: 404 }
      );
    }
    
    // Then fetch prescriptions for the patient
    const [prescriptions] = await pool.query(`
      SELECT p.*, u.name AS doctor_name,
             DATEDIFF(p.created_at, NOW()) < -30 AS is_expired
      FROM prescriptions p
      JOIN users u ON p.doctor_id = u.id
      WHERE p.patient_id = ?
      ORDER BY p.created_at DESC
    `, [patientId]);
    
    return NextResponse.json({
      patient: patients[0],
      prescriptions: prescriptions
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient data', details: error.message },
      { status: 500 }
    );
  }
}