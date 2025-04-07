import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  let connection;
  try {
    // Get token from header
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Fetch pharmacists
    const [pharmacists] = await connection.query(
      `SELECT id, name
       FROM users 
       WHERE role = 'pharmacist'
       ORDER BY name ASC`
    );

    return NextResponse.json(pharmacists);

  } catch (error) {
    console.error('Error fetching pharmacists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pharmacists' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 