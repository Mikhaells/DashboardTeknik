import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getLaporanByDateRange } from '@/lib/dashboard';
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

    const [peralatanList, kondisiList, gangguanList] = await Promise.all([
      executeQuery<any>(
        `SELECT Id, LaporanId, Peralatan, [Condition], [Desc]
         FROM Teknik_TVRI.dbo.LaporanPeralatan
         WHERE LaporanId IN (${idParams})
         ORDER BY LaporanId, Id`,
        idParamObj
      ),
      executeQuery<any>(
        `SELECT Id, LaporanId, Aspek, Status, [Desc]
         FROM Teknik_TVRI.dbo.KondisiSiaran
         WHERE LaporanId IN (${idParams})
         ORDER BY LaporanId, Id`,
        idParamObj
      ),
      executeQuery<any>(
        `SELECT Id, LaporanId, Time, Peralatan, JenisGanguan, TindakanPerbaikan, Status
         FROM Teknik_TVRI.dbo.GangguanTeknis
         WHERE LaporanId IN (${idParams})
         ORDER BY LaporanId, Id`,
        idParamObj
      ),
    ]);

    const peralatanByLaporanId: Record<number, any[]> = {};
    const kondisiByLaporanId: Record<number, any[]> = {};
    const gangguanByLaporanId: Record<number, any[]> = {};

    (peralatanList || []).forEach((p: any) => {
      if (!peralatanByLaporanId[p.LaporanId]) peralatanByLaporanId[p.LaporanId] = [];
      peralatanByLaporanId[p.LaporanId].push(p);
    });
    (kondisiList || []).forEach((k: any) => {
      if (!kondisiByLaporanId[k.LaporanId]) kondisiByLaporanId[k.LaporanId] = [];
      kondisiByLaporanId[k.LaporanId].push(k);
    });
    (gangguanList || []).forEach((g: any) => {
      if (!gangguanByLaporanId[g.LaporanId]) gangguanByLaporanId[g.LaporanId] = [];
      gangguanByLaporanId[g.LaporanId].push(g);
    });

    const data = laporanList.map((laporan) => ({
      laporan,
      peralatan: peralatanByLaporanId[laporan.Id] || [],
      kondisiSiaran: kondisiByLaporanId[laporan.Id] || [],
      gangguanTeknis: gangguanByLaporanId[laporan.Id] || [],
    }));

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error('Error fetching approved laporan for print:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data laporan',
      },
      { status: 500 }
    );
  }
}
