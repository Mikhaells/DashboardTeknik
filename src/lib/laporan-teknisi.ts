import { executeQuery, executeQuerySingle } from './db';
import { LaporanTeknisi, LaporanTeknisiStats, LaporanTeknisiResult } from '@/types/laporan-teknisi';

/**
 * Mendapatkan statistik laporan technical director untuk dashboard widget
 */
export async function getLaporanTeknisiStats(userLevelId?: number, username?: string): Promise<LaporanTeknisiStats> {
  let whereClause = '';
  const params: Record<string, any> = {};
  if (userLevelId && userLevelId !== 1 && username) {
    whereClause = 'WHERE LT.CreatedBy = @username';
    params.username = username;
  }

  const query = `
    SELECT 
      COUNT(*) as TotalLaporan,
      SUM(CASE WHEN SL.Status = 'Approved' THEN 1 ELSE 0 END) as LaporanDisetujui,
      SUM(CASE WHEN SL.Status = 'Rejected' THEN 1 ELSE 0 END) as LaporanDitolak,
      SUM(CASE WHEN SL.Status = 'Pending' THEN 1 ELSE 0 END) as LaporanPending
    FROM Teknik_TVRI.dbo.LaporanTeknisi LT
    INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LT.StatusId
    ${whereClause}
  `;

  const result = await executeQuerySingle<LaporanTeknisiStats>(query, params);
  return result || {
    TotalLaporan: 0,
    LaporanDisetujui: 0,
    LaporanDitolak: 0,
    LaporanPending: 0
  };
}

/**
 * Mendapatkan data laporan technical director untuk datatable dengan pagination
 */
export async function getLaporanTeknisi(page: number = 1, limit: number = 5, userLevelId?: number, username?: string): Promise<LaporanTeknisiResult> {
  let whereClause = '';
  const params: Record<string, any> = {};
  if (userLevelId && userLevelId !== 1 && username) {
    whereClause = 'WHERE LT.CreatedBy = @username';
    params.username = username;
  }
  const offset = (page - 1) * limit;

  // Get total count first
  const countQuery = `
    SELECT COUNT(*) as TotalRecords
    FROM Teknik_TVRI.dbo.LaporanTeknisi LT
    INNER JOIN Teknik_TVRI.dbo.Jabatan J ON LT.JabatanId = J.ID
    INNER JOIN Teknik_TVRI.dbo.Kegiatan K ON K.Id = LT.KegiatanId
    INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LT.StatusId
    ${whereClause}
  `;

  const countResult = await executeQuerySingle<{ TotalRecords: number }>(countQuery, params);
  const totalRecords = countResult?.TotalRecords || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  // Get paginated data
  const dataQuery = `
    SELECT 
      LT.Id, LT.Nama, LT.NIP, LT.JabatanId, LT.EventDate, LT.KegiatanId, 
      LT.Lokasi, LT.Kendala, LT.Path, LT.CreatedBy, LT.CreateDate, 
      LT.StatusId, LT.ApprovedBy, LT.ApprovedDate,
      J.ID as Jabatan_ID, J.Jabatan, J.[Desc] as Jabatan_Desc,
      K.Id as Kegiatan_Id, K.Kegiatan, K.[Desc] as Kegiatan_Desc,
      SL.Id as StatusLaporan_Id, SL.Status, SL.[Desc] as StatusLaporan_Desc
    FROM Teknik_TVRI.dbo.LaporanTeknisi LT
    INNER JOIN Teknik_TVRI.dbo.Jabatan J ON LT.JabatanId = J.ID
    INNER JOIN Teknik_TVRI.dbo.Kegiatan K ON K.Id = LT.KegiatanId
    INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LT.StatusId
    ${whereClause}
    ORDER BY LT.CreateDate DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `;

  const result = await executeQuery<LaporanTeknisi>(dataQuery, {
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
