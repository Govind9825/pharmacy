import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const { payment_method } = await request.json();
    const orderId = parseInt(params.id);
    
    // Verify order exists and is not already paid
    const order = await db.orders.findUnique({
      where: { id: orderId },
      include: {
        payment: true
      }
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    if (order.payment) {
      return NextResponse.json(
        { error: 'Payment already exists for this order' },
        { status: 400 }
      );
    }
    
    // Create payment (simplified - in real app you'd integrate with payment gateway)
    const payment = await db.payments.create({
      data: {
        order_id: orderId,
        patient_id: order.patient_id,
        amount: order.total_price,
        payment_method,
        payment_status: 'completed',
        transaction_id: `txn_${Math.random().toString(36).substr(2, 9)}`
      }
    });
    
    // Update order status if payment is successful
    if (payment.payment_status === 'completed') {
      await db.orders.update({
        where: { id: orderId },
        data: {
          status: 'processing'
        }
      });
    }
    
    return NextResponse.json({ payment });
  } catch (error) {
    return NextResponse.json(
      { error: 'Payment failed', details: error.message },
      { status: 500 }
    );
  }
}