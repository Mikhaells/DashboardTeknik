import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSession } from '@/lib/session';
import { FeedbackRequest } from '@/types/laporan-teknikal-direktor';
import { PENDING_STATUSES } from '@/lib/status';

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

    if (session.user.levelId !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Anda tidak memiliki izin untuk menyetujui laporan',
        },
        { status: 403 }
      );
    }

    const body: FeedbackRequest = await request.json();

    const checkQuery = `
      SELECT StatusLaporanId 
      FROM Teknik_TVRI.dbo.[LaporanTeknikalDirektor]
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
    
    if (!PENDING_STATUSES.includes(statusId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Laporan tidak dapat disetujui karena statusnya tidak memungkinkan',
        },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE Teknik_TVRI.dbo.[LaporanTeknikalDirektor]
      SET 
        Feedback = @Feedback,
        ApproveBy = @ApproveBy,
        ApproveDate = GETDATE(),
        StatusLaporanId = 5
      WHERE Id = @id
    `;

    const updateParams = {
      id,
      Feedback: body.Catatan || '',
      ApproveBy: session.user.username,
    };

    await executeQuery(updateQuery, updateParams);

    return NextResponse.json({
      success: true,
      message: 'Laporan teknikal direktor berhasil disetujui',
    });

  } catch (error) {
    console.error('Error approving laporan teknikal direktor:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}
