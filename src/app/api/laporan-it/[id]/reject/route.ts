import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, getDbPool } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: laporanId } = await params;
    const body = await req.json();

    if (!laporanId || isNaN(Number(laporanId))) {
      return NextResponse.json(
        { success: false, message: 'Invalid laporan ID' },
        { status: 400 }
      );
    }

    // Get feedback from request body
    const { feedback } = body;

    if (!feedback || feedback.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Feedback wajib diisi' },
        { status: 400 }
      );
    }

    // Get current user from session
    const currentUser = await getUserSession();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }
    
    const rejectedBy = currentUser.username;

    // Update laporan status to Rejected (StatusId = 6) with feedback
    const updateQuery = `
      UPDATE Teknik_TVRI.dbo.LaporanIT
      SET 
        StatusId = 6,
        ApprovedBy = @RejectedBy,
        ApprovedDate = GETDATE(),
        Feedback = @Feedback
      WHERE Id = @LaporanId
      AND StatusId IN (2, 3, 4) -- Only reject if currently pending, review, or revision
    `;

    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('LaporanId', Number(laporanId));
    request.input('RejectedBy', rejectedBy);
    request.input('Feedback', feedback.trim());
    
    const result = await request.query(updateQuery);
    
    // Check if any row was affected using rowsAffected
    if (!result || (result.rowsAffected && result.rowsAffected[0] === 0)) {
      return NextResponse.json(
        { success: false, message: 'Laporan tidak ditemukan atau status tidak valid untuk reject. Status harus Pending, Review, atau Revision.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan IT berhasil di-reject'
    });

  } catch (error) {
    console.error('Error rejecting laporan IT:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat reject laporan IT'
      },
      { status: 500 }
    );
  }
}
