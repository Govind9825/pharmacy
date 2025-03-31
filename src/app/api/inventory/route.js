import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [inventory] = await pool.query(
      'SELECT * FROM pharmacy_inventory WHERE pharmacist_id = ? ORDER BY medicine_name',
      [decoded.id]
    );

    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch inventory', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { medicine_name, generic_name, stock, price, expiry_date } = await request.json();

    const [result] = await pool.query(
      'INSERT INTO pharmacy_inventory (medicine_name, generic_name, stock, price, expiry_date, pharmacist_id) VALUES (?, ?, ?, ?, ?, ?)',
      [medicine_name, generic_name, stock, price, expiry_date, decoded.id]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add medicine', details: error.message },
      { status: 500 }
    );
  }
}