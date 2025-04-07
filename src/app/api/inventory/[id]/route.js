import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function GET(request, { params }) {
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

    // Fetch inventory item with medicine information
    const [inventory] = await pool.query(`
      SELECT 
        i.*,
        m.name as medicine_name,
        m.generic_name,
        m.manufacturer,
        m.description
      FROM inventory i
      JOIN medicines m ON i.medicine_id = m.id
      WHERE i.id = ? AND i.pharmacist_id = ?
    `, [id, decoded.id]);

    if (!inventory.length) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(inventory[0]);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory item' },
      { status: 500 }
    );
  }
}

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
    const data = await request.json();
    const { stock, price, expiry_date } = data;

    // Validate required fields
    if (!stock || !price || !expiry_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if inventory item exists and belongs to the pharmacist
    const [existingItem] = await pool.query(
      'SELECT * FROM inventory WHERE id = ? AND pharmacist_id = ?',
      [id, decoded.id]
    );

    if (!existingItem.length) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Update inventory item
    await pool.query(
      `UPDATE inventory 
       SET stock = ?, price = ?, expiry_date = ?, updated_at = NOW()
       WHERE id = ? AND pharmacist_id = ?`,
      [stock, price, expiry_date, id, decoded.id]
    );

    return NextResponse.json({ message: 'Inventory item updated successfully' });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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

    // Check if inventory item exists and belongs to the pharmacist
    const [existingItem] = await pool.query(
      'SELECT * FROM inventory WHERE id = ? AND pharmacist_id = ?',
      [id, decoded.id]
    );

    if (!existingItem.length) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Delete inventory item
    await pool.query(
      'DELETE FROM inventory WHERE id = ? AND pharmacist_id = ?',
      [id, decoded.id]
    );

    return NextResponse.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
} 