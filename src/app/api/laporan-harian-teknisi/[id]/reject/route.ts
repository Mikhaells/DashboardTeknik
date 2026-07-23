import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

/**
 * API Route: POST /api/laporan-harian-teknisi/[id]/reject
 * 
 * Handles rejecting laporan harian teknisi
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

    const body = await request.json();
    const { Feedback } = body;

    if (!Feedback) {
      return NextResponse.json(
        {
          success: false,
          message: 'Feedback wajib diisi',
        },
        { status: 400 }
      );
    }

    // Get user session for ApproveBy
    const userSession = await getUserSession();
    const approveBy = userSession?.username || '';

    // Update query sesuai request user
    const updateQuery = `
      UPDATE Teknik_TVRI.dbo.LaporanHarianTeknisi
      SET 
        StatusLaporanId = 6, 
        Feedback = @Feedback, 
        ApproveBy = @ApproveBy, 
        ApproveDate = GETDATE()
      WHERE Id = @id
    `;

    await executeQuery(updateQuery, {
      id,
      Feedback,
      ApproveBy: approveBy
    });

    return NextResponse.json({
      success: true,
      message: 'Laporan berhasil ditolak',
    });
  } catch (error) {
    console.error('Error rejecting laporan harian teknisi:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat menolak laporan',
      },
      { status: 500 }
    );
  }
}
