import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'patient') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { prescription_id, items, payment_method } = await request.json();

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Calculate total price
      let totalPrice = 0;
      for (const item of items) {
        const [inventory] = await connection.query(
          'SELECT price FROM pharmacy_inventory WHERE id = ?',
          [item.inventory_id]
        );
        if (inventory.length === 0) {
          throw new Error(`Medicine with ID ${item.inventory_id} not found`);
        }
        totalPrice += inventory[0].price * item.quantity;
      }

      // Create order
      const [orderResult] = await connection.query(
        'INSERT INTO orders (patient_id, prescription_id, total_price, status) VALUES (?, ?, ?, ?)',
        [decoded.id, prescription_id, totalPrice, 'pending']
      );
      const orderId = orderResult.insertId;

      // Add order items and update inventory
      for (const item of items) {
        // Add order item
        await connection.query(
          'INSERT INTO order_items (order_id, inventory_id, quantity, price) VALUES (?, ?, ?, (SELECT price FROM pharmacy_inventory WHERE id = ?))',
          [orderId, item.inventory_id, item.quantity, item.inventory_id]
        );

        // Update inventory stock
        await connection.query(
          'UPDATE pharmacy_inventory SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.inventory_id]
        );
      }

      // Create payment record
      await connection.query(
        'INSERT INTO payments (order_id, patient_id, amount, payment_method, payment_status) VALUES (?, ?, ?, ?, ?)',
        [orderId, decoded.id, totalPrice, payment_method, 'pending']
      );

      await connection.commit();
      return NextResponse.json({ id: orderId }, { status: 201 });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}