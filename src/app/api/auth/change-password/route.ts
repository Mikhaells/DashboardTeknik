import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, destroySession } from '@/lib/session';
import { executeQuery, getDbPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();
    
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 401 }
      );
    }

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password harus mengandung huruf kecil' },
        { status: 400 }
      );
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password harus mengandung huruf besar' },
        { status: 400 }
      );
    }

    if (!/(?=.*\d)/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password harus mengandung angka' },
        { status: 400 }
      );
    }

    // Get user's current password from database
    const pool = await getDbPool();
    
    const userQuery = `
      SELECT Password 
      FROM Teknik_TVRI.dbo.[User] 
      WHERE Id = @UserId
    `;
    const userResult = await pool.request()
      .input('UserId', user.id)
      .query(userQuery);
    
    if (userResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const storedPassword = userResult.recordset[0].Password;

    // Verify current password (plain text comparison)
    const isCurrentPasswordValid = currentPassword === storedPassword;
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Password lama salah' },
        { status: 400 }
      );
    }

    // Update password in database (plain text)
    const updateQuery = `
      UPDATE Teknik_TVRI.dbo.[User] 
      SET Password = @NewPassword
      WHERE Id = @UserId
    `;
    await pool.request()
      .input('UserId', user.id)
      .input('NewPassword', newPassword)
      .query(updateQuery);
    
    // Destroy user session to force logout
    await destroySession();
    
    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
