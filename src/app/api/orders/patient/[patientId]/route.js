// pages/api/orders/patient/[patientId]/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Your MySQL connection pool

export async function GET(request, { params }) {
  let connection;
  try {
    connection = await pool.getConnection();
    const patientId = parseInt(params.patientId);

    // Main orders query
    const [orders] = await connection.query(`
      SELECT 
        o.id,
        o.patient_id,
        o.prescription_id,
        o.total_price,
        o.status,
        o.order_date,
        p.id as payment_id,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.transaction_id,
        p.payment_date
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.patient_id = ?
      ORDER BY o.order_date DESC
    `, [patientId]);

    // Get items for each order
    for (const order of orders) {
      const [items] = await connection.query(`
        SELECT 
          oi.id,
          oi.order_id,
          oi.inventory_id,
          oi.quantity,
          oi.price,
          i.medicine_name,
          i.generic_name
        FROM order_items oi
        JOIN pharmacy_inventory i ON oi.inventory_id = i.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      order.items = items;
    }

    // Format dates for JSON serialization
    const transformedOrders = orders.map(order => ({
      ...order,
      order_date: order.order_date.toISOString(),
      payment_date: order.payment_date ? order.payment_date.toISOString() : null,
      items: order.items || [] // Ensure items array exists
    }));

    return NextResponse.json({ 
      success: true,
      orders: transformedOrders 
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch patient orders',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}