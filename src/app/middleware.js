import { NextResponse } from 'next/server';
import { verifyToken } from '../lib/auth';

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const protectedPaths = [
    '/dashboard',
    '/dashboard/patient',
    '/dashboard/doctor',
    '/dashboard/pharmacist',
    '/dashboard/admin'
  ];

  // Check if the current path is protected
  const isProtected = protectedPaths.some(protectedPath =>
    path.startsWith(protectedPath)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for token in cookies or headers
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const decoded = verifyToken(token);
    const userRole = decoded.role;

    // Check if user has access to the requested path
    if (path.startsWith('/dashboard/patient') && userRole !== 'patient') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (path.startsWith('/dashboard/doctor') && userRole !== 'doctor') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (path.startsWith('/dashboard/pharmacist') && userRole !== 'pharmacist') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (path.startsWith('/dashboard/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add user to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.id);
    requestHeaders.set('x-user-role', decoded.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/patient/:path*',
    '/dashboard/doctor/:path*',
    '/dashboard/pharmacist/:path*',
    '/dashboard/admin/:path*'
  ],
};