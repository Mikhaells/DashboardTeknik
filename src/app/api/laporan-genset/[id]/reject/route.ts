import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSession } from '@/lib/session';
import { FeedbackRequest } from '@/types/laporan-genset';
import { PENDING_STATUSES } from '@/lib/status';

/**
 * API Route: POST /api/laporan-genset/[id]/reject
 * 
 * Handles rejecting laporan genset by ID
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID laporan tidak valid',
        },
        { status: 400 }
      );
    }

    // Check session and user level
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. Please login first.',
        },
        { status: 401 }
      );
    }

    // Only allow admin (LevelId: 1) to reject
    if (session.user.levelId !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Anda tidak memiliki izin untuk menolak laporan',
        },
        { status: 403 }
      );
    }

    const body: FeedbackRequest = await request.json();

    // Check if laporan exists and is pending
    const checkQuery = `
      SELECT StatusLaporanId 
      FROM Teknik_TVRI.dbo.[LaporanPemeriksaanGenset]
      WHERE Id = @id
    `;

    const checkResult = await executeQuery(checkQuery, { id });

    if (checkResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Laporan tidak ditemukan',
        },
        { status: 404 }
      );
    }

    const statusId = checkResult[0]?.StatusLaporanId;
    
    // Only allow reject if status is in PENDING_STATUSES (2, 3, 4)
    if (!PENDING_STATUSES.includes(statusId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Laporan tidak dapat ditolak karena statusnya tidak memungkinkan',
        },
        { status: 400 }
      );
    }

    // Update laporan status to rejected (6) with feedback
    const updateQuery = `
      UPDATE Teknik_TVRI.dbo.[LaporanPemeriksaanGenset]
      SET 
        Feedback = @Feedback,
        StatusLaporanId = 6
      WHERE Id = @id
    `;

    const updateParams = {
      id,
      Feedback: body.Catatan || '',
    };

    await executeQuery(updateQuery, updateParams);

    return NextResponse.json({
      success: true,
      message: 'Laporan genset berhasil ditolak',
    });

  } catch (error) {
    console.error('Error rejecting laporan genset:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}
