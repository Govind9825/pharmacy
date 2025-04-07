import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, verify } = await request.json();
    console.log('Doctor ID:', userId);
    console.log('Verify:', verify);

    await pool.query(
      'UPDATE users SET is_verified = ? WHERE id = ?',
      [verify, userId]
    );

    return NextResponse.json({ message: 'Doctor verification updated' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update verification', details: error.message },
      { status: 500 }
    );
  }
}