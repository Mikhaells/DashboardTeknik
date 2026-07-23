import { executeQuery } from '@/lib/db';
import { LaporanGenset } from '@/types/laporan-genset';

export interface LaporanGensetStats {
  TotalLaporan: number;
  LaporanDisetujui: number;
  LaporanDitolak: number;
  LaporanPending: number;
}

export async function getLaporanByDateRange(startDate: string, endDate: string, userLevelId?: number, username?: string): Promise<LaporanGenset[]> {
  let whereClause = 'WHERE CAST(LPG.TanggalPemeriksaan AS DATE) BETWEEN @startDate AND @endDate';
  const params: Record<string, any> = { startDate, endDate };
  if (userLevelId && userLevelId !== 1 && username) {
    whereClause += ` AND LPG.CreatedBy = @username`;
    params.username = username;
  }

    const query = `
    SELECT 
      LPG.Id,
      LPG.TanggalPemeriksaan,
      CONVERT(VARCHAR(8), LPG.JamOperasi, 108) as JamOperasi,
      LPG.Operator,
      LPG.CatatandanTemuan,
      LPG.Feedback,
      LPG.CreatedBy,
      LPG.CreatedDate,
      LPG.ApprovedBy,
      LPG.ApprovedDate,
      LPG.StatusLaporanId,
      (SELECT [Status] FROM Teknik_TVRI.dbo.[StatusLaporan] WHERE Id = LPG.StatusLaporanId) as StatusLaporan
    FROM Teknik_TVRI.dbo.[LaporanPemeriksaanGenset] LPG
    ${whereClause}
    ORDER BY LPG.TanggalPemeriksaan DESC
  `;

  const result = await executeQuery(query, params);
  return (result || []) as LaporanGenset[];
}

/**
 * Get laporan genset statistics
 */
export async function getLaporanGensetStats(userLevelId?: number, username?: string): Promise<LaporanGensetStats> {
  try {
    let whereClause = '';
    const params: Record<string, any> = {};
    if (userLevelId && userLevelId !== 1 && username) {
      whereClause = 'WHERE CreatedBy = @username';
      params.username = username;
    }

    // Get total counts by status
    const statusQuery = `
      SELECT 
        StatusLaporanId,
        COUNT(*) as count
      FROM Teknik_TVRI.dbo.[LaporanPemeriksaanGenset]
      ${whereClause}
      GROUP BY StatusLaporanId
    `;
    
    const statusResult = await executeQuery(statusQuery, params);
    
        
    // Initialize stats
    const stats: LaporanGensetStats = {
      TotalLaporan: 0,
      LaporanDisetujui: 0,
      LaporanDitolak: 0,
      LaporanPending: 0,
    };
    
    // Calculate status counts
    statusResult.forEach((row: any) => {
      switch (row.StatusLaporanId) {
        case 1: // Draft
          // stats.LaporanDraft = row.count; // Optional: add draft field if needed
          break;
        case 2: // Pending
          stats.LaporanPending = row.count;
          break;
        case 3: // Review
          // stats.LaporanReview = row.count; // Optional: add review field if needed
          break;
        case 4: // Revision
          // stats.LaporanRevision = row.count; // Optional: add revision field if needed
          break;
        case 5: // Approved
          stats.LaporanDisetujui = row.count;
          break;
        case 6: // Rejected
          stats.LaporanDitolak = row.count;
          break;
      }
      stats.TotalLaporan += row.count;
    });
    
    return stats;
    
  } catch (error) {
    console.error('Error getting laporan genset stats:', error);
    
    // Return default stats on error
    return {
      TotalLaporan: 0,
      LaporanDisetujui: 0,
      LaporanDitolak: 0,
      LaporanPending: 0,
    };
  }
}

/**
 * Get laporan genset data with pagination
 */
export async function getLaporanGenset(page: number = 1, limit: number = 7, userLevel: number = 2, username: string = ''): Promise<{
  data: LaporanGenset[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  try {
    // Build WHERE clause for filtering
    let whereClause = '';
    const params: any = {};
    
    if (userLevel !== 1 && username) {
      whereClause = 'WHERE CreatedBy = @username';
      params.username = username;
    }

    // Get all data (without pagination in SQL)
    const dataQuery = `
      SELECT 
        Id,
        TanggalPemeriksaan,
        CONVERT(VARCHAR(8), JamOperasi, 108) as JamOperasi,
        Operator,
        CatatandanTemuan,
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
    
    const allData = await executeQuery(dataQuery, params);
    
    // Calculate pagination in client-side
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
    console.error('Error getting laporan genset:', error);
    
    // Return empty result on error
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

/**
 * Get single laporan genset by ID
 */
export async function getLaporanGensetById(id: number): Promise<LaporanGenset | null> {
  try {
    const query = `
      SELECT 
        Id,
        TanggalPemeriksaan,
        CONVERT(VARCHAR(8), JamOperasi, 108) as JamOperasi,
        Operator,
        CatatandanTemuan,
        CreatedBy,
        CreatedDate,
        ApprovedBy,
        ApprovedDate,
        StatusLaporanId,
        (SELECT [Status] FROM Teknik_TVRI.dbo.[StatusLaporan] WHERE Id = StatusLaporanId) as StatusLaporan
      FROM Teknik_TVRI.dbo.[LaporanPemeriksaanGenset]
      WHERE Id = @id
    `;

    const result = await executeQuery(query, { id });
    
    return result.length > 0 ? result[0] : null;

  } catch (error) {
    console.error('Error getting laporan genset by ID:', error);
    return null;
  }
}
