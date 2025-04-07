// pages/api/inventory/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Your MySQL connection pool

export async function GET() {
  let connection;
  try {
    // Get connection from pool
    connection = await pool.getConnection();
    
    // Execute raw MySQL query
    const [results] = await connection.query(`
      SELECT 
        id,
        medicine_name,
        generic_name,
        stock,
        price,
        expiry_date,
        pharmacist_id,
        created_at
      FROM pharmacy_inventory
      WHERE stock > 0
      ORDER BY medicine_name ASC
    `);

    // Format dates to ISO string for JSON serialization
    const inventory = results.map(item => ({
      ...item,
      expiry_date: item.expiry_date ? item.expiry_date.toISOString().split('T')[0] : null,
      created_at: item.created_at.toISOString()
    }));

    return NextResponse.json({
      success: true,
      inventory
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch inventory',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    // Release connection back to pool
    if (connection) connection.release();
  }
}