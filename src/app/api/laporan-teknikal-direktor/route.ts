import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { LaporanTeknikalDirektorResponse } from '@/types/laporan-teknikal-direktor';

export async function GET(request: NextRequest): Promise<NextResponse<LaporanTeknikalDirektorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '7');
    const userLevel = parseInt(searchParams.get('userLevel') || '2');
    const username = searchParams.get('username') || '';
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('statusFilter') || '';

    let whereClause = '';
    const params: any = {};
    
    if (userLevel !== 1 && username) {
      whereClause = 'WHERE CAST(LT.CreateBy AS NVARCHAR(MAX)) = @username';
      params.username = username;
    }

    if (search) {
      if (whereClause) {
        whereClause += ' AND LT.NamaTechnicalDirector LIKE @search';
      } else {
        whereClause = 'WHERE LT.NamaTechnicalDirector LIKE @search';
      }
      params.search = `%${search}%`;
    }

    if (statusFilter && statusFilter !== 'all') {
      let statusCondition = '';
      switch (statusFilter) {
        case 'pending':
          statusCondition = 'LT.StatusLaporanId IN (2, 3, 4)';
          break;
        case 'approved':
          statusCondition = 'LT.StatusLaporanId = 5';
          break;
        case 'rejected':
          statusCondition = 'LT.StatusLaporanId = 6';
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

    const dataQuery = `
      SELECT 
        LT.Id,
        LT.NamaProgram,
        LT.JenisProduksi,
        LT.TanggalProduksi,
        LT.LokasiProduksi,
        LT.NamaTechnicalDirector,
        LT.NamaPDU,
        LT.JumlahKamera,
        LT.FormatVideo,
        LT.ResolusiOutput,
        LT.AudioOutput,
        LT.MediaRecording,
        LT.JalurDistribusi,
        LT.KendalaTindakan,
        LT.CreateBy,
        LT.CreateDate,
        LT.Feedback,
        LT.ApproveBy,
        LT.ApproveDate,
        LT.StatusLaporanId,
        SL.[Status] as StatusLaporan
      FROM Teknik_TVRI.dbo.[LaporanTeknikalDirektor] LT
      INNER JOIN Teknik_TVRI.dbo.[StatusLaporan] SL ON SL.Id = LT.StatusLaporanId
      ${whereClause}
      ORDER BY LT.TanggalProduksi DESC
    `;
    
    const countQuery = `
      SELECT COUNT(*) as totalRecords
      FROM Teknik_TVRI.dbo.[LaporanTeknikalDirektor] LT
      INNER JOIN Teknik_TVRI.dbo.[StatusLaporan] SL ON SL.Id = LT.StatusLaporanId
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
      message: 'Data laporan teknikal direktor berhasil diambil',
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
    console.error('Error fetching laporan teknikal direktor:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}
