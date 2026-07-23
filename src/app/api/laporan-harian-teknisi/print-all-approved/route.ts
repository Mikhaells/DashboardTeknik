import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getLaporanByDateRange } from '@/lib/laporan-harian-teknisi';
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

    const [praProduksi, produksi, pascaProduksi] = await Promise.all([
      executeQuery<any>(
        `SELECT LaporanHarianTeknisiId, Kegiatan, [Check]
         FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_PraProduksi
         WHERE LaporanHarianTeknisiId IN (${idParams})`,
        idParamObj
      ),
      executeQuery<any>(
        `SELECT LaporanHarianTeknisiId, Kegiatan, [Check]
         FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_Produksi
         WHERE LaporanHarianTeknisiId IN (${idParams})`,
        idParamObj
      ),
      executeQuery<any>(
        `SELECT LaporanHarianTeknisiId, Kegiatan, [Check]
         FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_PascaProduksi
         WHERE LaporanHarianTeknisiId IN (${idParams})`,
        idParamObj
      ),
    ]);

    const praProduksiByLaporanId: Record<number, any[]> = {};
    const produksiByLaporanId: Record<number, any[]> = {};
    const pascaProduksiByLaporanId: Record<number, any[]> = {};

    (praProduksi || []).forEach((p: any) => {
      if (!praProduksiByLaporanId[p.LaporanHarianTeknisiId]) praProduksiByLaporanId[p.LaporanHarianTeknisiId] = [];
      praProduksiByLaporanId[p.LaporanHarianTeknisiId].push(p);
    });
    (produksi || []).forEach((p: any) => {
      if (!produksiByLaporanId[p.LaporanHarianTeknisiId]) produksiByLaporanId[p.LaporanHarianTeknisiId] = [];
      produksiByLaporanId[p.LaporanHarianTeknisiId].push(p);
    });
    (pascaProduksi || []).forEach((p: any) => {
      if (!pascaProduksiByLaporanId[p.LaporanHarianTeknisiId]) pascaProduksiByLaporanId[p.LaporanHarianTeknisiId] = [];
      pascaProduksiByLaporanId[p.LaporanHarianTeknisiId].push(p);
    });

    const data = laporanList.map((laporan) => ({
      laporan,
      PraProduksi: (praProduksiByLaporanId[laporan.Id] || []).map((p: any) => ({
        NamaKegiatan: p.Kegiatan,
        checked: Boolean(p.Check)
      })),
      Produksi: (produksiByLaporanId[laporan.Id] || []).map((p: any) => ({
        NamaKegiatan: p.Kegiatan,
        checked: Boolean(p.Check)
      })),
      PascaProduksi: (pascaProduksiByLaporanId[laporan.Id] || []).map((p: any) => ({
        NamaKegiatan: p.Kegiatan,
        checked: Boolean(p.Check)
      })),
    }));

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error('Error fetching approved laporan harian teknisi for print:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data laporan',
      },
      { status: 500 }
    );
  }
}
