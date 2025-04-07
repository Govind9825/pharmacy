import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only doctors and pharmacists can search for patients
    if (decoded.role !== 'doctor' && decoded.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('id');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // TODO: Replace with actual database query
    const mockPatients = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, Country',
        date_of_birth: '1990-01-01',
        gender: 'male',
        medical_history: 'No significant medical history'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+0987654321',
        address: '456 Oak Ave, Town, Country',
        date_of_birth: '1985-05-15',
        gender: 'female',
        medical_history: 'Allergic to penicillin'
      }
    ];

    const patient = mockPatients.find(p => p.id === patientId);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error searching for patient:', error);
    return NextResponse.json(
      { error: 'Failed to search for patient' },
      { status: 500 }
    );
  }
} 