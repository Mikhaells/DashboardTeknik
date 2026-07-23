import { NextResponse } from 'next/server';
import { getJenisKegiatanOptions } from '@/lib/dashboard';

export async function GET() {
  try {
    const jenisKegiatan = await getJenisKegiatanOptions();
    
    return NextResponse.json({
      success: true,
      data: jenisKegiatan
    });
  } catch (error) {
    console.error('Error fetching jenis kegiatan options:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch jenis kegiatan options',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
