import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

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

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Fetch order details
    const [orders] = await connection.query(
      `SELECT o.*, u.name as pharmacist_name
       FROM orders o, users u
       WHERE o.id = ?`,
      [params.id]
    );

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];

    // Check if the requesting user is either the patient or an authorized medical professional
    if (String(decoded.id) !== String(order.patient_id) && decoded.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch prescription items for this order
    const [prescriptionItems] = await connection.query(
      `SELECT pi.medicine_name, pi.dosage, pi.frequency, pi.duration, pi.instructions
       FROM prescription_items pi
       WHERE pi.prescription_id = ?`,
      [order.prescription_id]
    );

    // Fetch order items
    const [orderItems] = await connection.query(
      `SELECT quantity, price
       FROM order_items
       WHERE order_id = ?`,
      [order.id]
    );

    // Combine prescription items with order items
    const items = prescriptionItems.map((prescriptionItem, index) => ({
      ...prescriptionItem,
      ...orderItems[index],
      name: prescriptionItem.medicine_name
    }));

    return NextResponse.json({
      ...order,
      items: items
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  } finally {
    // Always release the connection back to the pool
    if (connection) {
      connection.release();
    }
  }
} 