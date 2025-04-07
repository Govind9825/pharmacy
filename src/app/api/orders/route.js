import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const { patient_id, prescription_id, total_price, items } = await request.json();
    
    // Check if all items have sufficient stock
    for (const item of items) {
      const inventoryItem = await db.pharmacy_inventory.findUnique({
        where: { id: item.inventory_id }
      });
      
      if (!inventoryItem || inventoryItem.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${inventoryItem?.medicine_name || 'item'}` },
          { status: 400 }
        );
      }
    }
    
    // Create the order
    const order = await db.orders.create({
      data: {
        patient_id,
        prescription_id,
        total_price,
        status: 'pending',
        items: {
          create: items.map(item => ({
            inventory_id: item.inventory_id,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: {
          include: {
            inventory: true
          }
        }
      }
    });
    
    // Update inventory stock
    for (const item of items) {
      await db.pharmacy_inventory.update({
        where: { id: item.inventory_id },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }
    
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}