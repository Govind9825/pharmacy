import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request, { params }) {
  let connection;
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    connection = await pool.getConnection();

    // Update order status to completed
    const [result] = await connection.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['completed', params.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Order completed successfully',
      order_id: params.id,
      status: 'completed'
    });

  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 