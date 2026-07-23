import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getLaporanByDateRange } from '@/lib/laporan-genset';
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

    const tabelChecklist = [
      'PemeriksaanGenset_SistemMesin',
      'PemeriksaanGenset_SistemPendingin',
      'PemeriksaanGenset_SistemBahanBakar',
      'PemeriksaanGenset_SistemKelistrikan',
      'PemeriksaanGenset_OutputListrik',
      'PemeriksaanGenset_Mingguan',
      'PemeriksaanGenset_Bulanan',
      'PemeriksaanGenset_SistemKontrol_Proteksi',
      'PemeriksaanGenset_ATS_AMF',
      'PemeriksaanGenset_Kebersihan_Keamanan',
    ];

    const checklistResults = await Promise.all(
      tabelChecklist.map((tableName) =>
        executeQuery<any>(
          `SELECT LaporanGensetId, Tindakan, [Check]
           FROM Teknik_TVRI.dbo.[${tableName}]
           WHERE LaporanGensetId IN (${idParams})`,
          idParamObj
        )
      )
    );

    const checklistMap = tabelChecklist.map(() => ({} as Record<number, any[]>));
    checklistResults.forEach((result, idx) => {
      const map: Record<number, any[]> = {};
      (result || []).forEach((item: any) => {
        if (!map[item.LaporanGensetId]) map[item.LaporanGensetId] = [];
        map[item.LaporanGensetId].push(item);
      });
      checklistMap[idx] = map;
    });

    const sectionKeys = [
      'PemeriksaanGenset_SistemMesin',
      'PemeriksaanGenset_SistemPendingin',
      'PemeriksaanGenset_SistemBahanBakar',
      'PemeriksaanGenset_SistemKelistrikan',
      'PemeriksaanGenset_OutputListrik',
      'PemeriksaanGenset_Mingguan',
      'PemeriksaanGenset_Bulanan',
      'PemeriksaanGenset_SistemKontrol_Proteksi',
      'PemeriksaanGenset_ATS_AMF',
      'PemeriksaanGenset_Kebersihan_Keamanan',
    ];

    const transformChecklist = (items: any[]) =>
      (items || []).map((item: any) => ({
        Tindakan: item.Tindakan,
        Check: item.Check === true || item.Check === 1 || item.Check === 'true' || item.Check === 'TRUE',
      }));

    const data = laporanList.map((laporan) => {
      const result: any = { laporan };
      sectionKeys.forEach((key, idx) => {
        result[key] = transformChecklist(checklistMap[idx][laporan.Id]);
      });
      return result;
    });

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error('Error fetching approved laporan genset for print:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data laporan',
      },
      { status: 500 }
    );
  }
}
