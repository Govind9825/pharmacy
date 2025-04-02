import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request, { params }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Authorization token missing' }, { status: 401 });
  }
  
  try {
    const decoded = verifyToken(token);
    const patientId = await params?.id;

    // Verify the requesting user is a doctor
    if (decoded.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch patient details
    const [patients] = await pool.query(
      'SELECT id, name, email, phone, date_of_birth, address FROM users WHERE id = ? AND role = "patient"',
      [patientId]
    );

    if (patients.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json(patients[0]);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient', details: error.message },
      { status: 500 }
    );
  }
}