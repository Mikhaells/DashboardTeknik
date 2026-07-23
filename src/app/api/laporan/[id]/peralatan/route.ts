import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

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

    const query = `
      SELECT 
        Id,
        LaporanId,
        Peralatan,
        [Condition],
        [Desc]
      FROM Teknik_TVRI.dbo.LaporanPeralatan
      WHERE LaporanId = @LaporanId
      ORDER BY Id
    `;

    const result = await executeQuery<any>(query, { LaporanId: Number(laporanId) });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching peralatan data:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data peralatan'
      },
      { status: 500 }
    );
  }
}
