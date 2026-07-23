import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getLaporanByDateRange } from '@/lib/laporan-teknikal-direktor';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userLevelId = session.user?.levelId;
    const username = session.user?.username;
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Parameter startDate dan endDate diperlukan' },
        { status: 400 }
      );
    }

    const laporanList = await getLaporanByDateRange(startDate, endDate, userLevelId, username);

    if (laporanList.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const ids = laporanList.map((l) => l.Id);
    const idParams = ids.map((_, i) => `@Id${i}`).join(',');
    const idParamObj: Record<string, number> = {};
    ids.forEach((id, i) => {
      idParamObj[`Id${i}`] = id;
    });

    const detailList = await executeQuery<any>(
      `SELECT LaporanTeknikalDirektorId, AlatProduksi, [Check], Keterangan
       FROM Teknik_TVRI.dbo.[LaporanTeknikalDirektorDetail]
       WHERE LaporanTeknikalDirektorId IN (${idParams})`,
      idParamObj
    );

    const detailByLaporanId: Record<number, any[]> = {};
    (detailList || []).forEach((item: any) => {
      if (!detailByLaporanId[item.LaporanTeknikalDirektorId]) detailByLaporanId[item.LaporanTeknikalDirektorId] = [];
      detailByLaporanId[item.LaporanTeknikalDirektorId].push(item);
    });

    const data = laporanList.map((laporan) => ({
      laporan,
      LaporanTeknikalDirektor_Detail: (detailByLaporanId[laporan.Id] || []).map((item: any) => ({
        AlatProduksi: item.AlatProduksi,
        Check: item.Check === true || item.Check === 1 || item.Check === 'true' || item.Check === 'TRUE',
        Keterangan: item.Keterangan || '',
      })),
    }));

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error('Error fetching approved laporan teknikal direktor for print:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data laporan',
      },
      { status: 500 }
    );
  }
}
