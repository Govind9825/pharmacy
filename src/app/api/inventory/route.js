import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pharmacistId = searchParams.get('pharmacistId');

    if (!pharmacistId || pharmacistId !== decoded.id.toString()) {
      return NextResponse.json({ error: 'Invalid pharmacist ID' }, { status: 400 });
    }

    // Fetch inventory with medicine information
    const [inventory] = await pool.query(`
      SELECT 
        i.*,
        m.name as medicine_name,
        m.generic_name,
        m.manufacturer,
        m.description
      FROM inventory i
      JOIN medicines m ON i.medicine_id = m.id
      WHERE i.pharmacist_id = ?
      ORDER BY i.stock ASC
    `, [pharmacistId]);

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { medicine_id, stock, price, expiry_date } = data;

    // Validate required fields
    if (!medicine_id || !stock || !price || !expiry_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if medicine exists
    const [medicine] = await pool.query(
      'SELECT * FROM medicines WHERE id = ?',
      [medicine_id]
    );

    if (!medicine.length) {
      return NextResponse.json(
        { error: 'Medicine not found' },
        { status: 404 }
      );
    }

    // Add to inventory
    const [result] = await pool.query(
      `INSERT INTO inventory 
       (pharmacist_id, medicine_id, stock, price, expiry_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [decoded.id, medicine_id, stock, price, expiry_date]
    );

    return NextResponse.json(
      { id: result.insertId, message: 'Medicine added to inventory successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to inventory:', error);
    return NextResponse.json(
      { error: 'Failed to add medicine to inventory' },
      { status: 500 }
    );
  }
}