import { NextRequest, NextResponse } from 'next/server';
import { executeQuerySingle } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: laporanId } = await params;

    if (!laporanId || isNaN(Number(laporanId))) {
      return NextResponse.json(
        { success: false, message: 'Invalid laporan ID' },
        { status: 400 }
      );
    }

    // Query main laporan data with joins
    const query = `
      SELECT 
        LH.Id,
        LH.Date,
        LH.Start,
        LH.Stop,
        LH.KegiatanId,
        LH.JenisKegiatanId,
        LH.Location,
        LH.TechnicalDirector,
        LH.ShiftId,
        LH.Ringkasan,
        LH.TindakanKoordinasi,
        LH.CatatanKhusus,
        LH.StatusId,
        LH.Feedback,
        LH.CreateBy,
        LH.ApproveBy,
        LH.CreatedDate,
        LH.ApproveDate,
        K.Id as Kegiatan_Id,
        K.Kegiatan,
        K.[Desc] as Kegiatan_Desc,
        JK.Id as JenisKegiatan_Id,
        JK.Jenis,
        JK.[Desc] as JenisKegiatan_Desc,
        SK.Id as ShiftKerja_Id,
        SK.Shift,
        SK.[Desc] as ShiftKerja_Desc
      FROM Teknik_TVRI.dbo.LaporanHarian LH
      INNER JOIN Teknik_TVRI.dbo.Kegiatan K ON K.Id = LH.KegiatanId
      INNER JOIN Teknik_TVRI.dbo.JenisKegiatan JK ON JK.Id = LH.JenisKegiatanId
      INNER JOIN Teknik_TVRI.dbo.ShiftKerja SK ON SK.Id = LH.ShiftId
      WHERE LH.Id = @LaporanId
    `;

    const result = await executeQuerySingle<any>(query, { LaporanId: Number(laporanId) });

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Laporan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching laporan detail:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data laporan'
      },
      { status: 500 }
    );
  }
}
