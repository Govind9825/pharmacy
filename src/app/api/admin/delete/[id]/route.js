import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function DELETE(request, { params }) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const userId = await params.id;
        console.log('User ID:', userId);
        const connection = await pool.getConnection();

        try {
            const [result] = await connection.query(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );

            if (result.affectedRows === 0) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            return NextResponse.json({ message: 'User deleted successfully' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete user',
                details: process.env.NODE_ENV === 'development' ? error.message : null,
            },
            { status: 500 }
        );
    }
}
