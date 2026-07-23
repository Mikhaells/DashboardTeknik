import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

interface Jabatan {
  ID: number;
  Jabatan: string;
  Desc: string;
}

export async function GET() {
  try {
    const query = `
      SELECT ID, Jabatan, [Desc]
      FROM Teknik_TVRI.dbo.Jabatan
      ORDER BY Jabatan
    `;
    
    const jabatan = await executeQuery<Jabatan>(query);
    
    return NextResponse.json({
      success: true,
      data: jabatan
    });
  } catch (error) {
    console.error('Error fetching jabatan options:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch jabatan options',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
