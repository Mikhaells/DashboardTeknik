import { executeQuery } from '@/lib/db';
import { KalenderKegiatan } from '@/types/kalender';

async function ensureColumnsExist(): Promise<void> {
  const checkTableQuery = `
    SELECT OBJECT_ID('Teknik_TVRI.dbo.KalenderKegiatan') as TableId
  `;
  const tableResult = await executeQuery<{ TableId: number | null }>(checkTableQuery);
  if (!tableResult[0]?.TableId) {
    const createQuery = `
      CREATE TABLE Teknik_TVRI.dbo.KalenderKegiatan (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Tanggal DATE NOT NULL,
        Jam TIME NULL,
        Kegiatan NVARCHAR(255) NOT NULL,
        Deskripsi NVARCHAR(MAX) NULL,
        StatusId INT NOT NULL DEFAULT 2,
        CreatedBy NVARCHAR(100) NOT NULL,
        CreatedDate DATETIME DEFAULT GETDATE(),
        ApprovedBy NVARCHAR(100) NULL,
        ApprovedDate DATETIME NULL
      )
    `;
    await executeQuery(createQuery);
    return;
  }

  const checkColumnQuery = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'KalenderKegiatan' AND COLUMN_NAME = 'StatusId'
  `;
  const columnResult = await executeQuery<{ COLUMN_NAME: string }>(checkColumnQuery);
  if (columnResult.length === 0) {
    const alterQuery = `
      ALTER TABLE Teknik_TVRI.dbo.KalenderKegiatan
      ADD StatusId INT NOT NULL DEFAULT 2,
          ApprovedBy NVARCHAR(100) NULL,
          ApprovedDate DATETIME NULL
    `;
    await executeQuery(alterQuery);
  }

  const checkJamColumn = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'KalenderKegiatan' AND COLUMN_NAME = 'Jam'
  `;
  const jamResult = await executeQuery<{ COLUMN_NAME: string }>(checkJamColumn);
  if (jamResult.length === 0) {
    const alterJamQuery = `
      ALTER TABLE Teknik_TVRI.dbo.KalenderKegiatan
      ADD Jam TIME NULL
    `;
    await executeQuery(alterJamQuery);
  }
}

export async function getKalenderData(month: number, year: number): Promise<KalenderKegiatan[]> {
  try {
    await ensureColumnsExist();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    let endDate: string;
    if (month === 12) {
      endDate = `${year + 1}-01-01`;
    } else {
      endDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    }

    const query = `
      SELECT Id, CONVERT(VARCHAR(10), Tanggal, 23) as Tanggal, CONVERT(VARCHAR(5), Jam, 108) as Jam, Kegiatan, Deskripsi, StatusId, CreatedBy, CreatedDate, ApprovedBy, ApprovedDate
      FROM Teknik_TVRI.dbo.[KalenderKegiatan]
      WHERE Tanggal >= @startDate AND Tanggal < @endDate
      ORDER BY Tanggal ASC, Jam ASC
    `;

    const data = await executeQuery<KalenderKegiatan>(query, { startDate, endDate });
    return data;
  } catch (error) {
    console.error('Error fetching kalender data:', error);
    return [];
  }
}

export async function getPendingKalender(): Promise<KalenderKegiatan[]> {
  try {
    await ensureColumnsExist();

    const query = `
      SELECT Id, CONVERT(VARCHAR(10), Tanggal, 23) as Tanggal, CONVERT(VARCHAR(5), Jam, 108) as Jam, Kegiatan, Deskripsi, StatusId, CreatedBy, CreatedDate, ApprovedBy, ApprovedDate
      FROM Teknik_TVRI.dbo.[KalenderKegiatan]
      WHERE StatusId = 2
      ORDER BY Tanggal ASC, Jam ASC
    `;

    const data = await executeQuery<KalenderKegiatan>(query);
    return data;
  } catch (error) {
    console.error('Error fetching pending kalender:', error);
    return [];
  }
}
