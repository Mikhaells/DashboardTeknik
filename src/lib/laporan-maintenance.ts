import { executeQuery } from '@/lib/db';
import { LaporanMaintenance } from '@/types/laporan-maintenance';

export interface LaporanMaintenanceStats {
  TotalLaporan: number;
  LaporanDisetujui: number;
  LaporanDitolak: number;
  LaporanPending: number;
}

export async function getLaporanByDateRange(startDate: string, endDate: string, userLevelId?: number, username?: string): Promise<LaporanMaintenance[]> {
  let whereClause = 'WHERE CAST(LM.TanggalPemeriksaan AS DATE) BETWEEN @startDate AND @endDate';
  const params: Record<string, any> = { startDate, endDate };
  if (userLevelId && userLevelId !== 1 && username) {
    whereClause += ` AND LM.CreateBy = @username`;
    params.username = username;
  }

  const query = `
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

  const result = await executeQuery(query, params);
  return (result || []) as LaporanMaintenance[];
}

export async function getLaporanMaintenanceStats(userLevelId?: number, username?: string): Promise<LaporanMaintenanceStats> {
  try {
    let whereClause = '';
    const params: Record<string, any> = {};
    if (userLevelId && userLevelId !== 1 && username) {
      whereClause = 'WHERE LM.CreateBy = @username';
      params.username = username;
    }

    const statusQuery = `
      SELECT 
        StatusLaporanId,
        COUNT(*) as count
      FROM Teknik_TVRI.dbo.[LaporanMaintenance] LM
      ${whereClause}
      GROUP BY StatusLaporanId
    `;
    
    const statusResult = await executeQuery(statusQuery, params);
    
    const stats: LaporanMaintenanceStats = {
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
    console.error('Error getting laporan maintenance stats:', error);
    return {
      TotalLaporan: 0,
      LaporanDisetujui: 0,
      LaporanDitolak: 0,
      LaporanPending: 0,
    };
  }
}

export async function getLaporanMaintenance(page: number = 1, limit: number = 7, userLevel: number = 2, username: string = ''): Promise<{
  data: LaporanMaintenance[];
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
      whereClause = 'WHERE LM.CreateBy = @username';
      params.username = username;
    }

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
    console.error('Error getting laporan maintenance:', error);
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

export async function getLaporanMaintenanceById(id: number): Promise<LaporanMaintenance | null> {
  try {
    const query = `
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
      WHERE LM.Id = @id
    `;

    const result = await executeQuery(query, { id });
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error getting laporan maintenance by ID:', error);
    return null;
  }
}
