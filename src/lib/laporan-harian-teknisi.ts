import { executeQuery } from '@/lib/db';

export interface LaporanHarianTeknisi {
  Id: number;
  Operator: string;
  TanggalPengoperasian: string;
  JamOperasional: string;
  Sistem: string;
  LokasiProduksi: string;
  Catatan_Evaluasi: string;
  ProfesiId?: number;
  Profesi?: string;
  StatusLaporanId: number;
  Status?: string;
  Feedback: string;
  CreateBy: string;
  CreateDate: string;
  ApproveBy: string;
  ApproveDate: string;
  // Activities untuk detail form
  PraProduksi?: { NamaKegiatan: string; checked: boolean }[];
  Produksi?: { NamaKegiatan: string; checked: boolean }[];
  PascaProduksi?: { NamaKegiatan: string; checked: boolean }[];
}

export interface LaporanHarianTeknisiStats {
  TotalLaporan: number;
  LaporanDisetujui: number;
  LaporanDitolak: number;
  LaporanPending: number;
}

export interface LaporanHarianTeknisiPagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LaporanHarianTeknisiResult {
  data: LaporanHarianTeknisi[];
  pagination: LaporanHarianTeknisiPagination;
}

export async function getLaporanHarianTeknisi(
  page: number = 1,
  limit: number = 7,
  userLevelId?: number,
  username?: string
): Promise<LaporanHarianTeknisiResult> {
  try {
    const offset = (page - 1) * limit;
    
    // Build WHERE clause based on user level
    let whereClause = '';
    if (userLevelId && userLevelId !== 1 && username) {
      whereClause = `WHERE LHT.CreateBy = '${username}'`;
    }

    // Main query with joins
    const dataQuery = `
      SELECT LHT.Id, LHT.Operator, LHT.TanggalPengoperasian, CONVERT(VARCHAR(8), LHT.JamOperasional, 108) as JamOperasional, LHT.Sistem,
      LHT.LokasiProduksi, LHT.Catatan_Evaluasi, LHT.ProfesiId, LHTP.Profesi, LHT.StatusLaporanId,
      SL.[Status], LHT.Feedback, LHT.CreateBy, LHT.CreateDate, LHT.ApproveBy, LHT.ApproveDate
      FROM Teknik_TVRI.dbo.LaporanHarianTeknisi LHT
      INNER JOIN Teknik_TVRI.dbo.LaporanHarianTeknisi_Profesi LHTP ON LHT.ProfesiId = LHTP.Id
      INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LHT.StatusLaporanId
      ${whereClause}
      ORDER BY LHT.TanggalPengoperasian DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Teknik_TVRI.dbo.LaporanHarianTeknisi LHT
      ${whereClause}
    `;

    // Execute queries
    const dataResult = await executeQuery(dataQuery);
    const countResult = await executeQuery(countQuery);
    
    const totalRecords = parseInt(countResult[0].total);
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: dataResult.map((row: any) => ({
        ...row,
        CreateDate: row.CreateDate ? new Date(row.CreateDate).toISOString() : '',
        ApproveDate: row.ApproveDate ? new Date(row.ApproveDate).toISOString() : '',
      })) as LaporanHarianTeknisi[],
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error('Error fetching laporan harian teknisi:', error);
    throw error;
  }
}

export async function getLaporanHarianTeknisiWithActivities(
  page: number = 1,
  limit: number = 7,
  userLevelId?: number,
  username?: string,
  search?: string,
  statusFilter?: string
): Promise<LaporanHarianTeknisiResult> {
  try {
    const offset = (page - 1) * limit;
    
    // Build WHERE clause based on user level
    let whereClause = '';
    const queryParams: Record<string, any> = {};
    if (userLevelId && userLevelId !== 1 && username) {
      whereClause = `WHERE LHT.CreateBy = '${username}'`;
    }

    if (search) {
      if (whereClause) {
        whereClause += ` AND LHT.Operator LIKE @search`;
      } else {
        whereClause = `WHERE LHT.Operator LIKE @search`;
      }
      queryParams.search = `%${search}%`;
    }

    if (statusFilter && statusFilter !== 'all') {
      let statusCondition = '';
      switch (statusFilter) {
        case 'pending':
          statusCondition = 'LHT.StatusLaporanId IN (2, 3, 4)';
          break;
        case 'approved':
          statusCondition = 'LHT.StatusLaporanId = 5';
          break;
        case 'rejected':
          statusCondition = 'LHT.StatusLaporanId = 6';
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

    // Main query
    const dataQuery = `
      SELECT LHT.Id, LHT.Operator, LHT.TanggalPengoperasian, CONVERT(VARCHAR(8), LHT.JamOperasional, 108) as JamOperasional, LHT.Sistem,
      LHT.LokasiProduksi, LHT.Catatan_Evaluasi, LHT.ProfesiId, LHTP.Profesi, LHT.StatusLaporanId,
      SL.[Status], LHT.Feedback, LHT.CreateBy, LHT.CreateDate, LHT.ApproveBy, LHT.ApproveDate
      FROM Teknik_TVRI.dbo.LaporanHarianTeknisi LHT
      INNER JOIN Teknik_TVRI.dbo.LaporanHarianTeknisi_Profesi LHTP ON LHT.ProfesiId = LHTP.Id
      INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LHT.StatusLaporanId
      ${whereClause}
      ORDER BY LHT.TanggalPengoperasian DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Teknik_TVRI.dbo.LaporanHarianTeknisi LHT
      ${whereClause}
    `;

    // Execute queries
    const dataResult = await executeQuery(dataQuery, queryParams);
    const countResult = await executeQuery(countQuery, queryParams);
    
    const totalRecords = parseInt(countResult[0].total);
    const totalPages = Math.ceil(totalRecords / limit);

    // Get activities for each laporan
    const laporanWithActivities = await Promise.all(
      dataResult.map(async (row: any) => {
        const laporanId = row.Id;
        
        // Get PraProduksi activities
        const praProduksiQuery = `
          SELECT Kegiatan, [Check] 
          FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_PraProduksi 
          WHERE LaporanHarianTeknisiId = ${laporanId}
        `;
        const praProduksiResult = await executeQuery(praProduksiQuery);
        
        // Get Produksi activities
        const produksiQuery = `
          SELECT Kegiatan, [Check] 
          FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_Produksi 
          WHERE LaporanHarianTeknisiId = ${laporanId}
        `;
        const produksiResult = await executeQuery(produksiQuery);
        
        // Get PascaProduksi activities
        const pascaProduksiQuery = `
          SELECT Kegiatan, [Check] 
          FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_PascaProduksi 
          WHERE LaporanHarianTeknisiId = ${laporanId}
        `;
        const pascaProduksiResult = await executeQuery(pascaProduksiQuery);

        return {
          ...row,
          CreateDate: row.CreateDate ? new Date(row.CreateDate).toISOString() : '',
          ApproveDate: row.ApproveDate ? new Date(row.ApproveDate).toISOString() : '',
          PraProduksi: praProduksiResult.map((item: any) => item.Kegiatan),
          Produksi: produksiResult.map((item: any) => item.Kegiatan),
          PascaProduksi: pascaProduksiResult.map((item: any) => item.Kegiatan),
        };
      })
    );

    return {
      data: laporanWithActivities as LaporanHarianTeknisi[],
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error('Error fetching laporan harian teknisi with activities:', error);
    throw error;
  }
}

export async function getLaporanByDateRange(startDate: string, endDate: string, userLevelId?: number, username?: string): Promise<LaporanHarianTeknisi[]> {
  let whereClause = 'WHERE CAST(LHT.TanggalPengoperasian AS DATE) BETWEEN @startDate AND @endDate';
  const params: Record<string, any> = { startDate, endDate };
  if (userLevelId && userLevelId !== 1 && username) {
    whereClause += ` AND LHT.CreateBy = @username`;
    params.username = username;
  }

  const query = `
    SELECT LHT.Id, LHT.Operator, LHT.TanggalPengoperasian, CONVERT(VARCHAR(8), LHT.JamOperasional, 108) as JamOperasional, LHT.Sistem,
    LHT.LokasiProduksi, LHT.Catatan_Evaluasi, LHT.ProfesiId, LHTP.Profesi, LHT.StatusLaporanId,
    SL.[Status], LHT.Feedback, LHT.CreateBy, LHT.CreateDate, LHT.ApproveBy, LHT.ApproveDate
    FROM Teknik_TVRI.dbo.LaporanHarianTeknisi LHT
    INNER JOIN Teknik_TVRI.dbo.LaporanHarianTeknisi_Profesi LHTP ON LHT.ProfesiId = LHTP.Id
    INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LHT.StatusLaporanId
    ${whereClause}
    ORDER BY LHT.TanggalPengoperasian DESC
  `;

  const result = await executeQuery(query, params);
  return (result || []).map((row: any) => ({
    ...row,
    CreateDate: row.CreateDate ? new Date(row.CreateDate).toISOString() : '',
    ApproveDate: row.ApproveDate ? new Date(row.ApproveDate).toISOString() : '',
  })) as LaporanHarianTeknisi[];
}

export async function getLaporanHarianTeknisiStats(userLevelId?: number, username?: string): Promise<LaporanHarianTeknisiStats> {
  try {
    let whereClause = '';
    const params: Record<string, any> = {};
    if (userLevelId && userLevelId !== 1 && username) {
      whereClause = 'WHERE CreateBy = @username';
      params.username = username;
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as TotalLaporan,
        SUM(CASE WHEN StatusLaporanId = 5 THEN 1 ELSE 0 END) as LaporanDisetujui,
        SUM(CASE WHEN StatusLaporanId = 6 THEN 1 ELSE 0 END) as LaporanDitolak,
        SUM(CASE WHEN StatusLaporanId IN (2, 3, 4) THEN 1 ELSE 0 END) as LaporanPending
      FROM Teknik_TVRI.dbo.LaporanHarianTeknisi
      ${whereClause}
    `;

    const result = await executeQuery(statsQuery, params);
    const stats = result[0];

    return {
      TotalLaporan: parseInt(stats.TotalLaporan),
      LaporanDisetujui: parseInt(stats.LaporanDisetujui),
      LaporanDitolak: parseInt(stats.LaporanDitolak),
      LaporanPending: parseInt(stats.LaporanPending),
    };
  } catch (error) {
    console.error('Error fetching laporan harian teknisi stats:', error);
    throw error;
  }
}

export async function getLaporanHarianTeknisiById(id: number): Promise<LaporanHarianTeknisi | null> {
  try {
    // Query yang diminta user untuk data bagian A dan E
    const mainQuery = `
      SELECT LHT.Operator, 
             CONVERT(VARCHAR(10), LHT.TanggalPengoperasian, 23) as TanggalPengoperasian,
             CONVERT(VARCHAR(8), LHT.JamOperasional, 108) as JamOperasional,
             LHTP.Profesi, LHT.Sistem, LHT.LokasiProduksi,
             LHT.Catatan_Evaluasi, LHT.StatusLaporanId, SL.[Status],
             LHT.Feedback, LHT.CreateBy, LHT.CreateDate, LHT.ApproveBy, LHT.ApproveDate
      FROM Teknik_TVRI.dbo.LaporanHarianTeknisi LHT
      INNER JOIN Teknik_TVRI.dbo.LaporanHarianTeknisi_Profesi LHTP ON LHT.ProfesiId = LHTP.Id
      INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON LHT.StatusLaporanId = SL.Id
      WHERE LHT.Id = ${id}
    `;

    const result = await executeQuery(mainQuery);
    
    if (result.length === 0) {
      return null;
    }

    const row = result[0];

    // Get PraProduksi activities
    const praProduksiQuery = `
      SELECT Kegiatan, [Check] 
      FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_PraProduksi 
      WHERE LaporanHarianTeknisiId = ${id}
    `;
    const praProduksiResult = await executeQuery(praProduksiQuery);
    
    // Get Produksi activities
    const produksiQuery = `
      SELECT Kegiatan, [Check] 
      FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_Produksi 
      WHERE LaporanHarianTeknisiId = ${id}
    `;
    const produksiResult = await executeQuery(produksiQuery);
    
    // Get PascaProduksi activities
    const pascaProduksiQuery = `
      SELECT Kegiatan, [Check] 
      FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_PascaProduksi 
      WHERE LaporanHarianTeknisiId = ${id}
    `;
    const pascaProduksiResult = await executeQuery(pascaProduksiQuery);

    return {
      Id: id,
      Operator: row.Operator,
      TanggalPengoperasian: row.TanggalPengoperasian,
      JamOperasional: row.JamOperasional,
      Profesi: row.Profesi,
      Sistem: row.Sistem,
      LokasiProduksi: row.LokasiProduksi,
      Catatan_Evaluasi: row.Catatan_Evaluasi,
      StatusLaporanId: row.StatusLaporanId,
      Status: row.Status,
      Feedback: row.Feedback,
      CreateBy: row.CreateBy,
      CreateDate: row.CreateDate ? new Date(row.CreateDate).toISOString() : '',
      ApproveBy: row.ApproveBy,
      ApproveDate: row.ApproveDate ? new Date(row.ApproveDate).toISOString() : '',
      // Activities dengan format yang sesuai untuk form
      PraProduksi: praProduksiResult.map((item: any) => ({
        NamaKegiatan: item.Kegiatan,
        checked: Boolean(item.Check)
      })),
      Produksi: produksiResult.map((item: any) => ({
        NamaKegiatan: item.Kegiatan,
        checked: Boolean(item.Check)
      })),
      PascaProduksi: pascaProduksiResult.map((item: any) => ({
        NamaKegiatan: item.Kegiatan,
        checked: Boolean(item.Check)
      }))
    } as LaporanHarianTeknisi;
  } catch (error) {
    console.error('Error fetching laporan harian teknisi by ID:', error);
    throw error;
  }
}
