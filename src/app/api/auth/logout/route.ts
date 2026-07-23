import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';

/**
 * API Route: POST /api/auth/logout
 * 
 * Handles user logout by:
 * 1. Destroying the session
 * 2. Clearing session cookies
 * 3. Redirecting to login page
 * 
 * TODO: Add audit logging for logout events
 * TODO: Add session invalidation for all devices
 */

export async function POST(): Promise<NextResponse> {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal logout' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout
 * Also handles logout for GET requests and redirects to login
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Destroy the session
    await destroySession();

    // Get the host from request headers
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;
    
    // Redirect to login page with dynamic host
    return NextResponse.redirect(`${baseUrl}/login`);

  } catch (error) {
    // Even if error occurs, try to redirect to login
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;
    return NextResponse.redirect(`${baseUrl}/login`);
  }
}
