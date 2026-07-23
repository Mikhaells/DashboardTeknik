import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT [Id]
            ,[Profesi]
      FROM [Teknik_TVRI].[dbo].[LaporanHarianTeknisi_Profesi]
      ORDER BY [Profesi]
    `;

    const result = await executeQuery(query);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching profesi data:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data profesi'
    }, { status: 500 });
  }
}
