import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password, role, ...additionalData } = await request.json();
    console.log('Registration attempt:', { name, email, role });

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['patient', 'doctor', 'pharmacist'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Validate role-specific fields
    if (role === 'patient' && (!additionalData.dateOfBirth || !additionalData.address || !additionalData.phone)) {
      return NextResponse.json(
        { error: 'Missing patient information' },
        { status: 400 }
      );
    }

    if (role === 'doctor' && (!additionalData.licenseNumber || !additionalData.specialization)) {
      return NextResponse.json(
        { error: 'Missing doctor information' },
        { status: 400 }
      );
    }

    if (role === 'pharmacist' && (!additionalData.pharmacyName || !additionalData.pharmacyAddress || !additionalData.licenseNumber)) {
      return NextResponse.json(
        { error: 'Missing pharmacist information' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    console.log('Existing users check:', existingUsers);
    
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed successfully');

    // Start transaction
    const connection = await pool.getConnection();
    console.log('Database connection established');
    await connection.beginTransaction();
    console.log('Transaction started');

    try {
      // Insert into users table
      const [userResult] = await connection.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
      );
      console.log('User inserted:', userResult);
      const userId = userResult.insertId;

      // Insert into role-specific table
      if (role === 'doctor') {
        await connection.query(
          'INSERT INTO doctors (user_id, license_number, specialization) VALUES (?, ?, ?)',
          [userId, additionalData.licenseNumber, additionalData.specialization]
        );
        console.log('Doctor details inserted');
      } else if (role === 'patient') {
        await connection.query(
          'INSERT INTO patients (user_id, date_of_birth, address, phone) VALUES (?, ?, ?, ?)',
          [userId, additionalData.dateOfBirth, additionalData.address, additionalData.phone]
        );
        console.log('Patient details inserted');
      } else if (role === 'pharmacist') {
        await connection.query(
          'INSERT INTO pharmacists (user_id, pharmacy_name, pharmacy_address, license_number) VALUES (?, ?, ?, ?)',
          [userId, additionalData.pharmacyName, additionalData.pharmacyAddress, additionalData.licenseNumber]
        );
        console.log('Pharmacist details inserted');
      }

      await connection.commit();
      console.log('Transaction committed successfully');
      return NextResponse.json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Error during registration:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
}