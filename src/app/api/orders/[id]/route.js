// pages/api/orders/[id]/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Your MySQL connection pool

export async function GET(request, { params }) {
  let connection;
  try {
    connection = await pool.getConnection();
    const orderId = parseInt(params.id);

    // 1. Fetch the main order details
    const [orders] = await connection.query(`
      SELECT 
        o.*,
        p.id as payment_id,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.transaction_id,
        p.payment_date,
        doc.name as doctor_name
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      LEFT JOIN prescriptions pr ON o.prescription_id = pr.id
      LEFT JOIN doctors doc ON pr.doctor_id = doc.id
      WHERE o.id = ?
      LIMIT 1
    `, [orderId]);

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // 2. Fetch order items
    const [items] = await connection.query(`
      SELECT 
        oi.*,
        i.medicine_name,
        i.generic_name
      FROM order_items oi
      JOIN pharmacy_inventory i ON oi.inventory_id = i.id
      WHERE oi.order_id = ?
    `, [orderId]);

    // 3. Format dates and structure the response
    const transformedOrder = {
      ...order,
      order_date: order.order_date.toISOString(),
      payment_date: order.payment_date ? order.payment_date.toISOString() : null,
      items: items.map(item => ({
        ...item,
        price: parseFloat(item.price) // Ensure proper number format
      })),
      payment: order.payment_id ? {
        id: order.payment_id,
        amount: order.amount,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        transaction_id: order.transaction_id,
        payment_date: order.payment_date ? order.payment_date.toISOString() : null
      } : null,
      prescription: order.prescription_id ? {
        id: order.prescription_id,
        doctor: order.doctor_name ? {
          name: order.doctor_name
        } : null
      } : null
    };

    // Remove the joined fields we don't need in the final response
    delete transformedOrder.payment_id;
    delete transformedOrder.amount;
    delete transformedOrder.payment_method;
    delete transformedOrder.payment_status;
    delete transformedOrder.transaction_id;
    delete transformedOrder.doctor_name;

    return NextResponse.json({ 
      success: true,
      order: transformedOrder 
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order details',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}