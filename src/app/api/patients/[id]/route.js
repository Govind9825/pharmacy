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

    // Get the patient ID and await it
    const patientId = await Promise.resolve(params.id);

    // Allow access for doctors and the patient themselves
    if (decoded.role !== 'doctor' && (decoded.role !== 'patient' || String(decoded.id) !== String(patientId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Get patient details
    const [patients] = await connection.execute(
      `SELECT id, name, email, role, is_verified, created_at, 
              address, date_of_birth, gender, medical_history
       FROM users 
       WHERE id = ? AND role = 'patient'`,
      [patientId]
    );

    if (patients.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Get patient's prescriptions with doctor name
    const [prescriptions] = await connection.execute(
      `SELECT p.id, p.diagnosis, p.notes, p.created_at,
              u.name as doctor_name
       FROM prescriptions p
       JOIN users u ON p.doctor_id = u.id
       WHERE p.patient_id = ?
       ORDER BY p.created_at DESC`,
      [patientId]
    );

    // Get prescription items for each prescription
    for (let prescription of prescriptions) {
      const [items] = await connection.execute(
        `SELECT id, medicine_name, dosage, frequency, duration, instructions
         FROM prescription_items
         WHERE prescription_id = ?`,
        [prescription.id]
      );
      prescription.items = items;
    }

    // Get recent orders
    const [orders] = await connection.execute(
      `SELECT o.id, o.status, o.created_at as order_date, o.total_price,
              u.name as pharmacist_name
       FROM orders o
       LEFT JOIN users u ON o.pharmacist_id = u.id
       WHERE o.patient_id = ?
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [patientId]
    );

    // Get order items for each order
    for (let order of orders) {
      const [items] = await connection.execute(
        `SELECT oi.medicine_name, oi.dosage, oi.quantity, oi.price
         FROM order_items oi
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    // Combine all data
    const patientData = {
      ...patients[0],
      prescriptions,
      recent_orders: orders
    };

    return NextResponse.json(patientData);

  } catch (error) {
    console.error('Error fetching patient details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient details' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 