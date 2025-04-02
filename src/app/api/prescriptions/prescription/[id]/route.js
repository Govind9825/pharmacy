import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Change this function to match the correct route pattern
// The route should be /api/prescriptions/prescription/[id]
export async function GET(request, { params }) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Authorization token missing' }, { status: 401 });
  }
  
  try {
    const decoded = verifyToken(token);
    const prescriptionId = await params?.id; // This now correctly uses the id from the route
    
    // Verify the requesting user is either the patient or their doctor
    if (!['patient', 'doctor'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }
    
    // First, get the prescription with patient and doctor info
    const [prescriptions] = await pool.query(`
      SELECT 
        p.*,
        pat.name AS patient_name,
        pat.email AS patient_email,
        doc.name AS doctor_name,
        doc.email AS doctor_email,
        DATEDIFF(NOW(), p.created_at) > 30 AS is_expired
      FROM prescriptions p
      JOIN users pat ON p.patient_id = pat.id
      JOIN users doc ON p.doctor_id = doc.id
      WHERE p.id = ?
    `, [prescriptionId]);
    
    if (prescriptions.length === 0) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }
    
    const prescription = prescriptions[0];
    
    // Verify the requesting patient owns this prescription
    if (decoded.role === 'patient' && decoded.id.toString() !== prescription.patient_id.toString()) {
      return NextResponse.json(
        { error: 'Not authorized to view this prescription' },
        { status: 403 }
      );
    }
    
    // Get prescription items
    const [items] = await pool.query(`
      SELECT * FROM prescription_items
      WHERE prescription_id = ?
      ORDER BY id ASC
    `, [prescriptionId]);
    
    return NextResponse.json({
      success: true,
      prescription: {
        ...prescription,
        items: items || []
      }
    });
   
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch prescription',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}