import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if order exists and belongs to the pharmacist
    const [order] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND pharmacist_id = ?',
      [id, decoded.id]
    );

    if (!order.length) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status
    await pool.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    // If order is completed, update inventory
    if (status === 'completed') {
      const [items] = await pool.query(
        'SELECT medicine_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );

      for (const item of items) {
        await pool.query(
          'UPDATE inventory SET stock = stock - ? WHERE id = ? AND pharmacist_id = ?',
          [item.quantity, item.medicine_id, decoded.id]
        );
      }
    }

    return NextResponse.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
} 