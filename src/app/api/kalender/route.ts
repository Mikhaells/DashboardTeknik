import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSession } from '@/lib/session';
import { STATUS_PENDING } from '@/types/kalender';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const TABLE_NAME = 'Teknik_TVRI.dbo.[KalenderKegiatan]';

async function ensureTableExists(): Promise<void> {
  const checkQuery = `
    SELECT OBJECT_ID('Teknik_TVRI.dbo.KalenderKegiatan') as TableId
  `;
  const result = await executeQuery<{ TableId: number | null }>(checkQuery);
  const tableId = result[0]?.TableId;

  if (!tableId) {
    const createQuery = `
      CREATE TABLE Teknik_TVRI.dbo.KalenderKegiatan (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Tanggal DATE NOT NULL,
        Jam TIME NULL,
        Kegiatan NVARCHAR(255) NOT NULL,
        Deskripsi NVARCHAR(MAX) NULL,
        Gambar NVARCHAR(255) NULL,
        StatusId INT NOT NULL DEFAULT 2,
        CreatedBy NVARCHAR(100) NOT NULL,
        CreatedDate DATETIME DEFAULT GETDATE(),
        ApprovedBy NVARCHAR(100) NULL,
        ApprovedDate DATETIME NULL
      )
    `;
    await executeQuery(createQuery);
  }
}

async function ensureColumnsExist(): Promise<void> {
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

  const checkGambarColumn = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'KalenderKegiatan' AND COLUMN_NAME = 'Gambar'
  `;
  const gambarResult = await executeQuery<{ COLUMN_NAME: string }>(checkGambarColumn);
  if (gambarResult.length === 0) {
    const alterGambarQuery = `
      ALTER TABLE Teknik_TVRI.dbo.KalenderKegiatan
      ADD Gambar NVARCHAR(255) NULL
    `;
    await executeQuery(alterGambarQuery);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');
    const filter = searchParams.get('filter') || '';

    if (filter === 'pending') {
      await ensureTableExists();
      await ensureColumnsExist();

      const query = `
        SELECT Id, CONVERT(VARCHAR(10), Tanggal, 23) as Tanggal, CONVERT(VARCHAR(5), Jam, 108) as Jam, Kegiatan, Deskripsi, Gambar, StatusId, CreatedBy, CreatedDate, ApprovedBy, ApprovedDate
        FROM ${TABLE_NAME}
        WHERE StatusId = 2
        ORDER BY Tanggal ASC, Jam ASC
      `;
      const data = await executeQuery(query);
      return NextResponse.json({ success: true, message: 'Data pending berhasil diambil', data });
    }

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, message: 'Parameter month dan year wajib diisi (month: 1-12)' },
        { status: 400 }
      );
    }

    await ensureTableExists();
    await ensureColumnsExist();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    let endDate: string;
    if (month === 12) {
      endDate = `${year + 1}-01-01`;
    } else {
      endDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    }

    const query = `
      SELECT Id, CONVERT(VARCHAR(10), Tanggal, 23) as Tanggal, CONVERT(VARCHAR(5), Jam, 108) as Jam, Kegiatan, Deskripsi, Gambar, StatusId, CreatedBy, CreatedDate, ApprovedBy, ApprovedDate
      FROM ${TABLE_NAME}
      WHERE Tanggal >= @startDate AND Tanggal < @endDate
      ORDER BY Tanggal ASC, Jam ASC
    `;

    const data = await executeQuery(query, { startDate, endDate });

    return NextResponse.json({
      success: true,
      message: 'Data kalender berhasil diambil',
      data,
    });
  } catch (error) {
    console.error('Error fetching kalender:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

const UPLOAD_BASE_PATH = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), 'public', 'uploads');

async function saveUploadedFile(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipe file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.');
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Ukuran file maksimal 2MB.');
  }

  const uploadDir = path.join(UPLOAD_BASE_PATH, 'kalender');
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/kalender/${filename}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const body: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (key !== 'Gambar') body[key] = value as string;
    });

    if (!body.Tanggal || !body.Jam || !body.Kegiatan) {
      return NextResponse.json(
        { success: false, message: 'Tanggal, Jam, dan Kegiatan wajib diisi' },
        { status: 400 }
      );
    }

    const file = formData.get('Gambar') as File | null;
    const gambarPath = await saveUploadedFile(file!);

    await ensureTableExists();
    await ensureColumnsExist();

    // Check duplicate jam on same date
    const checkDuplicateQuery = `
      SELECT Id FROM ${TABLE_NAME}
      WHERE Tanggal = @Tanggal AND Jam = @Jam
    `;
    const duplicates = await executeQuery<{ Id: number }>(checkDuplicateQuery, {
      Tanggal: body.Tanggal,
      Jam: body.Jam,
    });

    if (duplicates.length > 0) {
      return NextResponse.json(
        { success: false, message: `Jam ${body.Jam} pada tanggal ${body.Tanggal} sudah terisi. Pilih jam lain.` },
        { status: 409 }
      );
    }

    const insertQuery = `
      INSERT INTO ${TABLE_NAME} (Tanggal, Jam, Kegiatan, Deskripsi, Gambar, StatusId, CreatedBy)
      VALUES (@Tanggal, @Jam, @Kegiatan, @Deskripsi, @Gambar, @StatusId, @CreatedBy);
      SELECT SCOPE_IDENTITY() AS Id;
    `;

    const result = await executeQuery<{ Id: number }>(insertQuery, {
      Tanggal: body.Tanggal,
      Jam: body.Jam,
      Kegiatan: body.Kegiatan,
      Deskripsi: body.Deskripsi || null,
      Gambar: gambarPath,
      StatusId: STATUS_PENDING,
      CreatedBy: session.user.username,
    });

    const newId = result[0]?.Id;

    const fetchQuery = `
      SELECT Id, Tanggal, CONVERT(VARCHAR(5), Jam, 108) as Jam, Kegiatan, Deskripsi, Gambar, StatusId, CreatedBy, CreatedDate, ApprovedBy, ApprovedDate
      FROM ${TABLE_NAME}
      WHERE Id = @id
    `;
    const newData = await executeQuery(fetchQuery, { id: newId });

    return NextResponse.json(
      {
        success: true,
        message: 'Kegiatan berhasil ditambahkan, menunggu persetujuan',
        data: newData[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating kalender:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
