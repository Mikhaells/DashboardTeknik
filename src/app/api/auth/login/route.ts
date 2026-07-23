import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executeQuerySingle } from '@/lib/db';
import { createUserSession } from '@/lib/session';
import { LoginRequest, LoginResponse, UserQueryResult } from '@/types/auth';

// Zod schema for request validation
const loginRequestSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
});

/**
 * API Route: POST /api/auth/login
 * 
 * Handles user authentication by:
 * 1. Validating request data
 * 2. Querying database for user
 * 3. Comparing credentials (plain text for now)
 * 4. Creating session if authentication succeeds
 * 5. Returning appropriate response
 * 
 * TODO: Implement bcrypt for password hashing
 * TODO: Add rate limiting for brute force protection
 * TODO: Add audit logging for login attempts
 */

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { username, password }: LoginRequest = validationResult.data;

    // Query user from database with level information
    const query = `
      SELECT U.Id, U.Username, U.Fullname, U.Password, U.LevelId, U.CreateDate,
             LU.Id as LevelUserId, LU.Level, LU.[Desc] as LevelDescription
      FROM Teknik_TVRI.dbo.[User] U 
      INNER JOIN Teknik_TVRI.dbo.[LevelUser] LU ON LU.Id = U.LevelId
      WHERE U.Username = @username
    `;

    const user = await executeQuerySingle<UserQueryResult>(query, {
      username,
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username atau password salah',
        },
        { status: 401 }
      );
    }

    // TODO: Implement bcrypt password comparison
    // For now, using plain text comparison (NOT SECURE FOR PRODUCTION)
    const isPasswordValid = user.Password === password;

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username atau password salah',
        },
        { status: 401 }
      );
    }

    // Create user session
    await createUserSession({
      id: user.Id,
      username: user.Username,
      fullname: user.Fullname,
      levelId: user.LevelId,
      level: user.Level,
      levelDescription: user.LevelDescription,
    });

    // Return success response with user data (excluding password)
    return NextResponse.json(
      {
        success: true,
        message: 'Login berhasil',
        user: {
          id: user.Id,
          username: user.Username,
          fullname: user.Fullname,
          levelId: user.LevelId,
          level: user.Level,
          levelDescription: user.LevelDescription,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/login
 * Returns method not allowed for GET requests
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed',
    },
    { status: 405 }
  );
}
