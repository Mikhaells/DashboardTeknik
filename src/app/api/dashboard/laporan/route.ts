import { NextRequest, NextResponse } from 'next/server';
import { getLaporanHarian } from '@/lib/dashboard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const userLevel = searchParams.get('userLevel');
    const username = searchParams.get('username');

    const result = await getLaporanHarian(page, limit, userLevel ? parseInt(userLevel) : undefined, username || undefined);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching laporan data:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data laporan',
      },
      { status: 500 }
    );
  }
}
