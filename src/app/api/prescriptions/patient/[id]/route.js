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
    const patientId = params.id;

    // Verify the requesting user is either the patient themselves or a doctor
    if (!['patient', 'doctor'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    // If patient is requesting, verify they're requesting their own data
    if (decoded.role === 'patient' && decoded.id.toString() !== patientId.toString()) {
      return NextResponse.json(
        { error: 'Not authorized to view prescriptions for this patient' },
        { status: 403 }
      );
    }

    // First, get all prescriptions for the patient with doctor info
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
      WHERE p.patient_id = ?
      ORDER BY p.created_at DESC
    `, [patientId]);

    // Get all prescription items for this patient's prescriptions
    const prescriptionIds = prescriptions.map(p => p.id);
    
    let items = [];
    if (prescriptionIds.length > 0) {
      const placeholders = prescriptionIds.map(() => '?').join(',');
      const [prescriptionItems] = await pool.query(`
        SELECT * FROM prescription_items
        WHERE prescription_id IN (${placeholders})
        ORDER BY prescription_id ASC, id ASC
      `, prescriptionIds);
      
      items = prescriptionItems;
    }

    // Group prescription items by prescription_id
    const itemsByPrescription = {};
    items.forEach(item => {
      if (!itemsByPrescription[item.prescription_id]) {
        itemsByPrescription[item.prescription_id] = [];
      }
      itemsByPrescription[item.prescription_id].push(item);
    });

    // Add items to each prescription
    const prescriptionsWithItems = prescriptions.map(p => ({
      ...p,
      items: itemsByPrescription[p.id] || []
    }));

    return NextResponse.json({
      success: true,
      prescriptions: prescriptionsWithItems
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch patient prescriptions',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}