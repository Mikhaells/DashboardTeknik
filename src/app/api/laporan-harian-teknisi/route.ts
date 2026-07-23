import { NextRequest, NextResponse } from 'next/server';
import { getLaporanHarianTeknisiWithActivities } from '@/lib/laporan-harian-teknisi';

/**
 * API Route: GET /api/laporan-harian-teknisi
 * 
 * Handles fetching laporan harian teknisi with pagination and filtering
 * Now uses multiple tables for activities (PraProduksi, Produksi, PascaProduksi)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '7');
    const userLevel = searchParams.get('userLevel');
    const username = searchParams.get('username');
    const search = searchParams.get('search');
    const statusFilter = searchParams.get('statusFilter');

    const result = await getLaporanHarianTeknisiWithActivities(
      page,
      limit,
      userLevel ? parseInt(userLevel) : undefined,
      username || undefined,
      search || undefined,
      statusFilter || undefined
    );

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching laporan harian teknisi:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data laporan harian teknisi',
      },
      { status: 500 }
    );
  }
}
