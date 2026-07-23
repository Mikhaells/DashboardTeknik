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
    
    const approvedBy = currentUser.username;

    // Update laporan status to Approved (StatusId = 5) with feedback
    const updateQuery = `
      UPDATE Teknik_TVRI.dbo.LaporanIT
      SET 
        StatusId = 5,
        ApprovedBy = @ApprovedBy,
        ApprovedDate = GETDATE(),
        Feedback = @Feedback
      WHERE Id = @LaporanId
      AND StatusId IN (2, 3, 4) -- Only approve if currently pending, review, or revision
    `;

    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('LaporanId', Number(laporanId));
    request.input('ApprovedBy', approvedBy);
    request.input('Feedback', feedback.trim());
    
    const result = await request.query(updateQuery);
    
    // Check if any row was affected using rowsAffected
    if (!result || (result.rowsAffected && result.rowsAffected[0] === 0)) {
      return NextResponse.json(
        { success: false, message: 'Laporan tidak ditemukan atau status tidak valid untuk approve. Status harus Pending, Review, atau Revision.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan IT berhasil di-approve'
    });

  } catch (error) {
    console.error('Error approving laporan IT:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat approve laporan IT'
      },
      { status: 500 }
    );
  }
}
