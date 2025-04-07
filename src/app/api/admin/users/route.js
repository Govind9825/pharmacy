import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const connection = await pool.getConnection();
    
    try {
      // Simplified query that works with your current schema
      const [users] = await connection.query(`
        SELECT 
          id, 
          name, 
          email, 
          role, 
          is_verified,
          created_at
        FROM users
        Where role != 'admin'
        ORDER BY created_at DESC
      `);

      return NextResponse.json(users);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Users endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      },
      { status: 500 }
    );
  }
}