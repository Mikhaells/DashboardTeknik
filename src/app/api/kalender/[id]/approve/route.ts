import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSession } from '@/lib/session';
import { STATUS_APPROVED } from '@/types/kalender';

const TABLE_NAME = 'Teknik_TVRI.dbo.[KalenderKegiatan]';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const kegiatanId = parseInt(id);

    if (isNaN(kegiatanId)) {
      return NextResponse.json(
        { success: false, message: 'ID tidak valid' },
        { status: 400 }
      );
    }

    const checkQuery = `
      SELECT Id, StatusId FROM ${TABLE_NAME} WHERE Id = @id
    `;
    const existing = await executeQuery<{ Id: number; StatusId: number }>(checkQuery, { id: kegiatanId });

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Kegiatan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existing[0].StatusId !== 2) {
      return NextResponse.json(
        { success: false, message: 'Kegiatan sudah diproses sebelumnya' },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE ${TABLE_NAME}
      SET StatusId = @StatusId, ApprovedBy = @ApprovedBy, ApprovedDate = GETDATE()
      WHERE Id = @id
    `;

    await executeQuery(updateQuery, {
      id: kegiatanId,
      StatusId: STATUS_APPROVED,
      ApprovedBy: session.user.username,
    });

    const fetchQuery = `
      SELECT Id, CONVERT(VARCHAR(10), Tanggal, 23) as Tanggal, CONVERT(VARCHAR(5), Jam, 108) as Jam, Kegiatan, Deskripsi, StatusId, CreatedBy, CreatedDate, ApprovedBy, ApprovedDate
      FROM ${TABLE_NAME}
      WHERE Id = @id
    `;
    const updatedData = await executeQuery(fetchQuery, { id: kegiatanId });

    return NextResponse.json({
      success: true,
      message: 'Kegiatan berhasil disetujui',
      data: updatedData[0],
    });
  } catch (error) {
    console.error('Error approving kalender:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
