import { executeQuery, executeQuerySingle } from './db';
import { LaporanIT, LaporanITStats, LaporanITResult } from '@/types/laporan-it';

/**
 * Mendapatkan statistik laporan IT untuk dashboard widget
 */
export async function getLaporanITStats(userLevelId?: number, username?: string): Promise<LaporanITStats> {
  let whereClause = '';
  const params: Record<string, any> = {};
  if (userLevelId && userLevelId !== 1 && username) {
    whereClause = 'WHERE LT.CreateBy = @username';
    params.username = username;
  }

  const query = `
    SELECT 
      COUNT(*) as TotalLaporan,
      SUM(CASE WHEN SL.Status = 'Approved' THEN 1 ELSE 0 END) as LaporanDisetujui,
      SUM(CASE WHEN SL.Status = 'Rejected' THEN 1 ELSE 0 END) as LaporanDitolak,
      SUM(CASE WHEN SL.Status = 'Pending' THEN 1 ELSE 0 END) as LaporanPending
    FROM Teknik_TVRI.dbo.LaporanIT LT
    INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LT.StatusId
    ${whereClause}
  `;

  const result = await executeQuerySingle<LaporanITStats>(query, params);
  return result || {
    TotalLaporan: 0,
    LaporanDisetujui: 0,
    LaporanDitolak: 0,
    LaporanPending: 0
  };
}

/**
 * Mendapatkan data laporan IT untuk datatable dengan pagination
 */
export async function getLaporanIT(page: number = 1, limit: number = 5, userLevelId?: number, username?: string): Promise<LaporanITResult> {
  let whereClause = '';
  const params: Record<string, any> = {};
  if (userLevelId && userLevelId !== 1 && username) {
    whereClause = 'WHERE LT.CreateBy = @username';
    params.username = username;
  }
  const offset = (page - 1) * limit;

  // Get total count first
  const countQuery = `
    SELECT COUNT(*) as TotalRecords
    FROM Teknik_TVRI.dbo.LaporanIT LT
    INNER JOIN Teknik_TVRI.dbo.Jabatan J ON LT.JabatanId = J.ID
    INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LT.StatusId
    ${whereClause}
  `;

  const countResult = await executeQuerySingle<{ TotalRecords: number }>(countQuery, params);
  const totalRecords = countResult?.TotalRecords || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  // Get paginated data
  const dataQuery = `
    SELECT 
      LT.Id, LT.Nama, LT.NIP, LT.JabatanId, LT.EventDate, 
      LT.RingkasanKegiatan, LT.IncidentReport, LT.PlannedActivities, 
      LT.Feedback, LT.StatusId, LT.CreateBy, LT.ApprovedBy, 
      LT.CreateDate, LT.ApprovedDate,
      J.Jabatan as JabatanName,
      SL.Status as StatusName
    FROM Teknik_TVRI.dbo.LaporanIT LT
    INNER JOIN Teknik_TVRI.dbo.Jabatan J ON LT.JabatanId = J.ID
    INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LT.StatusId
    ${whereClause}
    ORDER BY LT.CreateDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY
  `;

  const data = await executeQuery<LaporanIT>(dataQuery, {
    Offset: offset,
    Limit: limit,
    ...params,
  });

  return {
    data: data || [],
    pagination: {
      currentPage: page,
      totalPages,
      totalRecords,
      limit,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

/**
 * Mendapatkan data laporan IT berdasarkan ID
 */
export async function getLaporanITById(id: number): Promise<LaporanIT | null> {
  const query = `
    SELECT 
      LT.Id, LT.Nama, LT.NIP, LT.JabatanId, LT.EventDate, 
      LT.RingkasanKegiatan, LT.IncidentReport, LT.PlannedActivities, 
      LT.Feedback, LT.StatusId, LT.CreateBy, LT.ApprovedBy, 
      LT.CreateDate, LT.ApprovedDate,
      J.Jabatan as JabatanName,
      SL.Status as StatusName
    FROM Teknik_TVRI.dbo.LaporanIT LT
    INNER JOIN Teknik_TVRI.dbo.Jabatan J ON LT.JabatanId = J.ID
    INNER JOIN Teknik_TVRI.dbo.StatusLaporan SL ON SL.Id = LT.StatusId
    WHERE LT.Id = @Id
  `;

  const result = await executeQuerySingle<LaporanIT>(query, { Id: id });
  return result || null;
}

/**
 * Membuat laporan IT baru
 */
export async function createLaporanIT(data: Partial<LaporanIT>): Promise<LaporanIT> {
  const query = `
    INSERT INTO Teknik_TVRI.dbo.LaporanIT (
      Nama, NIP, JabatanId, EventDate, RingkasanKegiatan, 
      IncidentReport, PlannedActivities, Feedback, StatusId, CreateBy
    )
    OUTPUT INSERTED.*
    VALUES (
      @Nama, @NIP, @JabatanId, @EventDate, @RingkasanKegiatan, 
      @IncidentReport, @PlannedActivities, @Feedback, @StatusId, @CreateBy
    )
  `;

  const result = await executeQuerySingle<LaporanIT>(query, data);
  if (!result) {
    throw new Error('Failed to create laporan IT');
  }
  return result;
}

/**
 * Update laporan IT
 */
export async function updateLaporanIT(id: number, data: Partial<LaporanIT>): Promise<LaporanIT> {
  const query = `
    UPDATE Teknik_TVRI.dbo.LaporanIT
    SET 
      Nama = @Nama,
      NIP = @NIP,
      JabatanId = @JabatanId,
      EventDate = @EventDate,
      RingkasanKegiatan = @RingkasanKegiatan,
      IncidentReport = @IncidentReport,
      PlannedActivities = @PlannedActivities,
      Feedback = @Feedback,
      StatusId = @StatusId,
      ApprovedBy = @ApprovedBy,
      ApprovedDate = @ApprovedDate
    OUTPUT INSERTED.*
    WHERE Id = @Id
  `;

  const result = await executeQuerySingle<LaporanIT>(query, { ...data, Id: id });
  if (!result) {
    throw new Error('Failed to update laporan IT');
  }
  return result;
}

/**
 * Delete laporan IT
 */
export async function deleteLaporanIT(id: number): Promise<boolean> {
  const query = `
    DELETE FROM Teknik_TVRI.dbo.LaporanIT
    WHERE Id = @Id
  `;

  const result = await executeQuerySingle<{ rowsAffected: number }>(query, { Id: id });
  return (result?.rowsAffected || 0) > 0;
}
