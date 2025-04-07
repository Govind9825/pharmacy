import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request, { params }) {
  let connection;
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If the user is a patient, they can only access their own orders
    if (decoded.role === 'patient' && String(decoded.id) !== String(params.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Fetch orders from database
    const [orders] = await connection.query(
      `SELECT o.*, u.name as pharmacist_name
       FROM orders o
       JOIN users u ON o.patient_id = u.id
       WHERE o.patient_id = ?`,
      [params.id]
    );

    // Fetch items for each order
    for (let order of orders) {
      const [items] = await connection.query(
        `SELECT oi.*, pi.medicine_name, pi.dosage, pi.frequency, pi.duration, pi.instructions
         FROM order_items oi
         JOIN prescription_items pi ON oi.prescription_item_id = pi.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 