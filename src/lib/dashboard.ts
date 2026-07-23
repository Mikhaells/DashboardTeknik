import { executeQuery, executeQuerySingle } from './db';

// Interface untuk statistik laporan
export interface LaporanStats {
  TotalLaporan: number;
  LaporanDisetujui: number;
  LaporanDitolak: number;
  LaporanPending: number;
}

// Interface untuk data laporan harian
export interface LaporanHarian {
  Id: number;
  Date: string;
  Start: string;
  Stop: string;
  KegiatanId: number;
  JenisKegiatanId: number;
  Location: string;
  TechnicalDirector: string;
  ShiftId: number;
  Ringkasan: string;
  TindakanKoordinasi: string;
  CatatanKhusus: string;
  StatusId: number;
  Feedback: string;
  CreateBy: string;
  ApproveBy: string;
  CreatedDate: string;
  ApproveDate: string;
  // Joined data
  Kegiatan_Id: number;
  Kegiatan: string;
  Kegiatan_Desc: string;
  JenisKegiatan_Id: number;
  Jenis: string;
  JenisKegiatan_Desc: string;
  ShiftKerja_Id: number;
  Shift: string;
  ShiftKerja_Desc: string;
  StatusLaporan_Id: number;
  Status: string;
  StatusLaporan_Desc: string;
}

export interface Kegiatan {
  Id: number;
  Kegiatan: string;
  Desc: string;
}

export interface JenisKegiatan {
  Id: number;
  Jenis: string;
  Desc: string;
}

export interface ShiftKerja {
  Id: number;
  Shift: string;
  Desc: string;
}

/**
 * Mendapatkan data dropdown Kegiatan
 */
export async function getKegiatanOptions(): Promise<Kegiatan[]> {
  const query = `
    SELECT Id, Kegiatan, [Desc]
    FROM Teknik_TVRI.dbo.Kegiatan
    ORDER BY Kegiatan
  `;
  
  return await executeQuery<Kegiatan>(query);
}

/**
 * Mendapatkan data dropdown JenisKegiatan
 */
export async function getJenisKegiatanOptions(): Promise<JenisKegiatan[]> {
  const query = `
    SELECT Id, Jenis, [Desc]
    FROM Teknik_TVRI.dbo.JenisKegiatan
    ORDER BY Jenis
  `;
  
  return await executeQuery<JenisKegiatan>(query);
}

/**
 * Mendapatkan data dropdown ShiftKerja
 */
export async function getShiftKerjaOptions(): Promise<ShiftKerja[]> {
  const query = `
    SELECT Id, Shift, [Desc]
    FROM Teknik_TVRI.dbo.ShiftKerja
    ORDER BY Id
  `;
  
  return await executeQuery<ShiftKerja>(query);
}

/**
 * Mendapatkan statistik laporan untuk dashboard widget
 */
export async function getLaporanStats(userLevelId?: number, username?: string): Promise<LaporanStats> {
  let whereClause = '';
  const params: Record<string, any> = {};
  if (userLevelId && userLevelId !== 1 && username) {
    whereClause = 'WHERE LH.CreateBy = @username';
    params.username = username;
  }

  const query = `
    SELECT 
      COUNT(*) as TotalLaporan,
      SUM(CASE WHEN SL.Status = 'Approved' THEN 1 ELSE 0 END) as LaporanDisetujui,
      SUM(CASE WHEN SL.Status = 'Rejected' THEN 1 ELSE 0 END) as LaporanDitolak,
      SUM(CASE WHEN SL.Status = 'Pending' THEN 1 ELSE 0 END) as LaporanPending
    FROM Teknik_TVRI.dbo.LaporanHarian LH
    INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LH.StatusId
    ${whereClause}
  `;

  const result = await executeQuerySingle<LaporanStats>(query, params);
  return result || {
    TotalLaporan: 0,
    LaporanDisetujui: 0,
    LaporanDitolak: 0,
    LaporanPending: 0
  };
}

/**
 * Mendapatkan data laporan harian untuk datatable dengan pagination
 */
/**
 * Mendapatkan laporan berdasarkan tanggal (tanpa pagination)
 */
export async function getLaporanByDateRange(startDate: string, endDate: string, userLevelId?: number, username?: string): Promise<LaporanHarian[]> {
  let whereClause = 'WHERE CAST(LH.[Date] AS DATE) BETWEEN @startDate AND @endDate';
  const params: Record<string, any> = { startDate, endDate };
  if (userLevelId && userLevelId !== 1 && username) {
    whereClause += ' AND LH.CreateBy = @username';
    params.username = username;
  }

  const query = `
    SELECT 
      LH.Id, LH.[Date], LH.[Start], LH.[Stop], LH.KegiatanId, LH.JenisKegiatanId, 
      LH.Location, LH.TechnicalDirector, LH.ShiftId, LH.Ringkasan, LH.TindakanKoordinasi, 
      LH.CatatanKhusus, LH.StatusId, LH.Feedback, LH.CreateBy, LH.ApproveBy, 
      LH.CreatedDate, LH.ApproveDate,
      K.Id as Kegiatan_Id, K.Kegiatan, K.[Desc] as Kegiatan_Desc,
      JK.Id as JenisKegiatan_Id, JK.Jenis, JK.[Desc] as JenisKegiatan_Desc,
      SK.Id as ShiftKerja_Id, SK.Shift, SK.[Desc] as ShiftKerja_Desc,
      SL.Id as StatusLaporan_Id, SL.Status, SL.[Desc] as StatusLaporan_Desc
    FROM Teknik_TVRI.dbo.LaporanHarian LH
    INNER JOIN Teknik_TVRI.dbo.Kegiatan K ON K.Id = LH.KegiatanId
    INNER JOIN Teknik_TVRI.dbo.JenisKegiatan JK ON JK.Id = LH.JenisKegiatanId
    INNER JOIN Teknik_TVRI.dbo.ShiftKerja SK ON SK.Id = LH.ShiftId
    INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LH.StatusId
    ${whereClause}
    ORDER BY LH.CreatedDate DESC
  `;

  const result = await executeQuery<LaporanHarian>(query, params);
  return result || [];
}

export async function getLaporanHarian(page: number = 1, limit: number = 5, userLevelId?: number, username?: string): Promise<{
  data: LaporanHarian[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  let whereClause = '';
  const params: Record<string, any> = {};
  if (userLevelId && userLevelId !== 1 && username) {
    whereClause = 'WHERE LH.CreateBy = @username';
    params.username = username;
  }
  const offset = (page - 1) * limit;

  // Get total count first
  const countQuery = `
    SELECT COUNT(*) as TotalRecords
    FROM Teknik_TVRI.dbo.LaporanHarian LH
    INNER JOIN Teknik_TVRI.dbo.Kegiatan K ON K.Id = LH.KegiatanId
    INNER JOIN Teknik_TVRI.dbo.JenisKegiatan JK ON JK.Id = LH.JenisKegiatanId
    INNER JOIN Teknik_TVRI.dbo.ShiftKerja SK ON SK.Id = LH.ShiftId
    INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LH.StatusId
    ${whereClause}
  `;

  const countResult = await executeQuerySingle<{ TotalRecords: number }>(countQuery, params);
  const totalRecords = countResult?.TotalRecords || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  // Get paginated data
  const dataQuery = `
    SELECT 
      LH.Id, LH.[Date], LH.[Start], LH.[Stop], LH.KegiatanId, LH.JenisKegiatanId, 
      LH.Location, LH.TechnicalDirector, LH.ShiftId, LH.Ringkasan, LH.TindakanKoordinasi, 
      LH.CatatanKhusus, LH.StatusId, LH.Feedback, LH.CreateBy, LH.ApproveBy, 
      LH.CreatedDate, LH.ApproveDate,
      K.Id as Kegiatan_Id, K.Kegiatan, K.[Desc] as Kegiatan_Desc,
      JK.Id as JenisKegiatan_Id, JK.Jenis, JK.[Desc] as JenisKegiatan_Desc,
      SK.Id as ShiftKerja_Id, SK.Shift, SK.[Desc] as ShiftKerja_Desc,
      SL.Id as StatusLaporan_Id, SL.Status, SL.[Desc] as StatusLaporan_Desc
    FROM Teknik_TVRI.dbo.LaporanHarian LH
    INNER JOIN Teknik_TVRI.dbo.Kegiatan K ON K.Id = LH.KegiatanId
    INNER JOIN Teknik_TVRI.dbo.JenisKegiatan JK ON JK.Id = LH.JenisKegiatanId
    INNER JOIN Teknik_TVRI.dbo.ShiftKerja SK ON SK.Id = LH.ShiftId
    INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LH.StatusId
    ${whereClause}
    ORDER BY LH.CreatedDate DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `;

  const result = await executeQuery<LaporanHarian>(dataQuery, {
    offset,
    limit,
    ...params,
  });

  return {
    data: result || [],
    pagination: {
      currentPage: page,
      totalPages,
      totalRecords,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
