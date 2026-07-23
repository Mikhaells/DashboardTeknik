import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { LaporanMaintenanceResponse } from '@/types/laporan-maintenance';

export async function GET(request: NextRequest): Promise<NextResponse<LaporanMaintenanceResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '7');
    const userLevel = parseInt(searchParams.get('userLevel') || '2');
    const username = searchParams.get('username') || '';
    const searchName = searchParams.get('searchName') || '';
    const searchDate = searchParams.get('searchDate') || '';
    const statusFilter = searchParams.get('statusFilter') || '';

    const conditions: string[] = [];
    const params: any = {};

    if (userLevel !== 1 && username) {
      conditions.push('LM.CreateBy = @username');
      params.username = username;
    }

    if (searchName) {
      conditions.push('LM.CreateBy LIKE @searchName');
      params.searchName = `%${searchName}%`;
    }

    if (searchDate) {
      conditions.push('CAST(LM.TanggalPemeriksaan AS DATE) = @searchDate');
      params.searchDate = searchDate;
    }

    if (statusFilter && statusFilter !== 'all') {
      let statusCondition = '';
      switch (statusFilter) {
        case 'pending':
          statusCondition = 'LM.StatusLaporanId IN (2, 3, 4)';
          break;
        case 'approved':
          statusCondition = 'LM.StatusLaporanId = 5';
          break;
        case 'rejected':
          statusCondition = 'LM.StatusLaporanId = 6';
          break;
      }
      if (statusCondition) {
        conditions.push(statusCondition);
      }
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const dataQuery = `
      SELECT 
        LM.Id,
        LM.TanggalPemeriksaan,
        LM.CatatanTemuan,
        LM.CreateBy,
        LM.CreateDate,
        LM.ApproveBy,
        LM.ApproveDate,
        LM.Feedback,
        LM.StatusLaporanId,
        SL.[Status] as StatusLaporan
      FROM Teknik_TVRI.dbo.[LaporanMaintenance] LM
      INNER JOIN Teknik_TVRI.dbo.[StatusLaporan] SL ON SL.Id = LM.StatusLaporanId
      ${whereClause}
      ORDER BY LM.TanggalPemeriksaan DESC
    `;
    
    const countQuery = `
      SELECT COUNT(*) as totalRecords
      FROM Teknik_TVRI.dbo.[LaporanMaintenance] LM
      INNER JOIN Teknik_TVRI.dbo.[StatusLaporan] SL ON SL.Id = LM.StatusLaporanId
      ${whereClause}
    `;
    const countParams = params;
    const countResult = await executeQuery(countQuery, countParams);
    const totalRecords = countResult[0]?.totalRecords || 0;
    const totalPages = Math.ceil(totalRecords / limit);
    const offset = (page - 1) * limit;
    const dataQueryWithPagination = dataQuery + ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    const paginatedData = await executeQuery(dataQueryWithPagination, params);

    return NextResponse.json({
      success: true,
      message: 'Data laporan maintenance berhasil diambil',
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
    console.error('Error fetching laporan maintenance:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}
