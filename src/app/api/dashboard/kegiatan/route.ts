import { NextResponse } from 'next/server';
import { getKegiatanOptions } from '@/lib/dashboard';

export async function GET() {
  try {
    const kegiatan = await getKegiatanOptions();
    
    return NextResponse.json({
      success: true,
      data: kegiatan
    });
  } catch (error) {
    console.error('Error fetching kegiatan options:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch kegiatan options',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
