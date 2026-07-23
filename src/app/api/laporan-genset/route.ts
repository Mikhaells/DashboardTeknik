import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { LaporanGensetResponse } from '@/types/laporan-genset';

/**
 * API Route: GET /api/laporan-genset
 * 
 * Handles fetching laporan genset data with pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse<LaporanGensetResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '7');
    const userLevel = parseInt(searchParams.get('userLevel') || '2');
    const username = searchParams.get('username') || '';
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('statusFilter') || '';

    // Build WHERE clause for filtering
    let whereClause = '';
    const params: any = {};
    
    if (userLevel !== 1 && username) {
      whereClause = 'WHERE CreatedBy = @username';
      params.username = username;
    }

    if (search) {
      if (whereClause) {
        whereClause += ' AND Operator LIKE @search';
      } else {
        whereClause = 'WHERE Operator LIKE @search';
      }
      params.search = `%${search}%`;
    }

    if (statusFilter && statusFilter !== 'all') {
      let statusCondition = '';
      switch (statusFilter) {
        case 'pending':
          statusCondition = 'StatusLaporanId IN (2, 3, 4)';
          break;
        case 'approved':
          statusCondition = 'StatusLaporanId = 5';
          break;
        case 'rejected':
          statusCondition = 'StatusLaporanId = 6';
          break;
      }
      if (statusCondition) {
        if (whereClause) {
          whereClause += ` AND ${statusCondition}`;
        } else {
          whereClause = `WHERE ${statusCondition}`;
        }
      }
    }

    // Get all data (without pagination in SQL)
    const dataQuery = `
      SELECT 
        Id,
        TanggalPemeriksaan,
        CONVERT(VARCHAR(8), JamOperasi, 108) as JamOperasi,
        Operator,
        CatatandanTemuan,
        Feedback,
        CreatedBy,
        CreatedDate,
        ApprovedBy,
        ApprovedDate,
        StatusLaporanId,
        (SELECT [Status] FROM Teknik_TVRI.dbo.[StatusLaporan] WHERE Id = StatusLaporanId) as StatusLaporan
      FROM Teknik_TVRI.dbo.[LaporanPemeriksaanGenset]
      ${whereClause}
      ORDER BY TanggalPemeriksaan DESC
    `;
    
    const countQuery = `
      SELECT COUNT(*) as totalRecords
      FROM Teknik_TVRI.dbo.[LaporanPemeriksaanGenset]
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, params);
    const totalRecords = countResult[0]?.totalRecords || 0;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const allData = await executeQuery(dataQuery, params);
    const paginatedData = allData.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      message: 'Data laporan genset berhasil diambil',
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching laporan genset:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}
