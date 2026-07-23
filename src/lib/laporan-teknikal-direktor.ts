import { executeQuery } from '@/lib/db';
import { LaporanTeknikalDirektor } from '@/types/laporan-teknikal-direktor';

export interface LaporanTeknikalDirektorStats {
  TotalLaporan: number;
  LaporanDisetujui: number;
  LaporanDitolak: number;
  LaporanPending: number;
}

export async function getLaporanByDateRange(startDate: string, endDate: string, userLevelId?: number, username?: string): Promise<LaporanTeknikalDirektor[]> {
  let whereClause = 'WHERE CAST(LT.TanggalProduksi AS DATE) BETWEEN @startDate AND @endDate';
  const params: Record<string, any> = { startDate, endDate };
  if (userLevelId && userLevelId !== 1 && username) {
    whereClause += ` AND CAST(LT.CreateBy AS NVARCHAR(MAX)) = @username`;
    params.username = username;
  }

  const query = `
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

  const result = await executeQuery(query, params);
  return (result || []) as LaporanTeknikalDirektor[];
}

export async function getLaporanTeknikalDirektorStats(userLevelId?: number, username?: string): Promise<LaporanTeknikalDirektorStats> {
  try {
    let whereClause = '';
    const params: Record<string, any> = {};
    if (userLevelId && userLevelId !== 1 && username) {
      whereClause = 'WHERE CAST(LT.CreateBy AS NVARCHAR(MAX)) = @username';
      params.username = username;
    }

    const statusQuery = `
      SELECT 
        StatusLaporanId,
        COUNT(*) as count
      FROM Teknik_TVRI.dbo.[LaporanTeknikalDirektor] LT
      ${whereClause}
      GROUP BY StatusLaporanId
    `;
    
    const statusResult = await executeQuery(statusQuery, params);
    
    const stats: LaporanTeknikalDirektorStats = {
      TotalLaporan: 0,
      LaporanDisetujui: 0,
      LaporanDitolak: 0,
      LaporanPending: 0,
    };
    
    statusResult.forEach((row: any) => {
      switch (row.StatusLaporanId) {
        case 2:
          stats.LaporanPending = row.count;
          break;
        case 5:
          stats.LaporanDisetujui = row.count;
          break;
        case 6:
          stats.LaporanDitolak = row.count;
          break;
      }
      stats.TotalLaporan += row.count;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting laporan teknikal direktor stats:', error);
    return {
      TotalLaporan: 0,
      LaporanDisetujui: 0,
      LaporanDitolak: 0,
      LaporanPending: 0,
    };
  }
}

export async function getLaporanTeknikalDirektor(page: number = 1, limit: number = 7, userLevel: number = 2, username: string = ''): Promise<{
  data: LaporanTeknikalDirektor[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  try {
    let whereClause = '';
    const params: any = {};
    
    if (userLevel !== 1 && username) {
      whereClause = 'WHERE CAST(LT.CreateBy AS NVARCHAR(MAX)) = @username';
      params.username = username;
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
    
    const allData = await executeQuery(dataQuery, params);
    
    const totalRecords = allData.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = allData.slice(startIndex, endIndex);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error('Error getting laporan teknikal direktor:', error);
    return {
      data: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalRecords: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}

export async function getLaporanTeknikalDirektorById(id: number): Promise<LaporanTeknikalDirektor | null> {
  try {
    const query = `
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
      WHERE LT.Id = @id
    `;

    const result = await executeQuery(query, { id });
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error getting laporan teknikal direktor by ID:', error);
    return null;
  }
}
