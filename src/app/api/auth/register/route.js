import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  const { name, email, password, role, ...additionalData } = await request.json();

  try {
    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert into users table
      const [userResult] = await connection.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
      );
      const userId = userResult.insertId;

      // Insert into role-specific table
      if (role === 'doctor') {
        await connection.query(
          'INSERT INTO doctors (user_id, license_number, specialization) VALUES (?, ?, ?)',
          [userId, additionalData.licenseNumber, additionalData.specialization]
        );
      } else if (role === 'patient') {
        await connection.query(
          'INSERT INTO patients (user_id, date_of_birth, address, phone) VALUES (?, ?, ?, ?)',
          [userId, additionalData.dateOfBirth, additionalData.address, additionalData.phone]
        );
      } else if (role === 'pharmacist') {
        await connection.query(
          'INSERT INTO pharmacists (user_id, pharmacy_name, pharmacy_address, license_number) VALUES (?, ?, ?, ?)',
          [userId, additionalData.pharmacyName, additionalData.pharmacyAddress, additionalData.licenseNumber]
        );
      }

      await connection.commit();
      return NextResponse.json({ message: 'User registered successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
}