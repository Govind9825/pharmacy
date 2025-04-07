import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
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

    connection = await pool.getConnection();

    let query;
    let queryParams;

    if (decoded.role === 'patient') {
      query = `
        SELECT o.*, p.diagnosis, p.created_at as prescription_date
        FROM orders o
        JOIN prescriptions p ON o.prescription_id = p.id
        WHERE p.patient_id = ?
        ORDER BY o.order_date DESC`;
      queryParams = [decoded.id];
    } else if (decoded.role === 'pharmacist') {
      query = `
        SELECT o.*, p.diagnosis, p.created_at as prescription_date,
               u.name as patient_name
        FROM orders o
        JOIN prescriptions p ON o.prescription_id = p.id
        JOIN users u ON p.patient_id = u.id
        ORDER BY o.order_date DESC`;
      queryParams = [];
    } else {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    const [orders] = await connection.query(query, queryParams);

    // Get prescription items for each order
    for (let order of orders) {
      const [items] = await connection.query(
        `SELECT pi.medicine_name, pi.dosage, pi.frequency, pi.duration, pi.instructions
         FROM prescription_items pi
         WHERE pi.prescription_id = ?`,
        [order.prescription_id]
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

export async function POST(request) {
  let connection;
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log(body);
    const { prescription_id } = body;
    const { patient_id } = body;

    if (!prescription_id) {
      return NextResponse.json(
        { error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Verify prescription belongs to patient
    const [prescriptions] = await connection.query(
      'SELECT * FROM prescriptions WHERE id = ? AND patient_id = ?',
      [prescription_id, decoded.id]
    );

    if (prescriptions.length === 0) {
      return NextResponse.json(
        { error: 'Prescription not found or unauthorized' },
        { status: 404 }
      );
    }

    // Calculate total price from prescription items
    // const [items] = await connection.query(
    //   `SELECT SUM(price) as total_price 
    //    FROM prescription_items 
    //    WHERE prescription_id = ?`,
    //   [prescription_id]
    // );

    // const total_price = items[0].total_price || 0;

    // Create order
    const [result] = await connection.query(
      `INSERT INTO orders (prescription_id, patient_id, status) 
       VALUES (?, ?,  'pending')`,
      [prescription_id, patient_id]
    );

    return NextResponse.json({
      id: result.insertId,
      prescription_id,
      // total_price,
      status: 'pending'
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}