import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSession } from '@/lib/session';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

const TABLE_NAME = 'Teknik_TVRI.dbo.[KalenderKegiatan]';

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const kegiatanId = parseInt(id);

    if (isNaN(kegiatanId)) {
      return NextResponse.json(
        { success: false, message: 'ID tidak valid' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const body: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (key !== 'Gambar') body[key] = value as string;
    });

    const checkQuery = `
      SELECT Id, Tanggal, Jam, Gambar, CreatedBy FROM ${TABLE_NAME} WHERE Id = @id
    `;
    const existing = await executeQuery<{ Id: number; Tanggal: string; Jam: string | null; Gambar: string | null; CreatedBy: string }>(checkQuery, { id: kegiatanId });

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Kegiatan tidak ditemukan' },
        { status: 404 }
      );
    }

    const currentData = existing[0];

    if (currentData.CreatedBy !== session.user.username) {
      return NextResponse.json(
        { success: false, message: 'Anda tidak memiliki izin untuk mengedit kegiatan ini' },
        { status: 403 }
      );
    }

    // Handle image upload
    const file = formData.get('Gambar') as File | null;
    const hapusGambar = body.HapusGambar === '1';
    let gambarBaru: string | null | undefined = undefined;

    if (file && file.size > 0) {
      const uploaded = await saveUploadedFile(file);
      if (uploaded) {
        body.Gambar = uploaded;
        gambarBaru = uploaded;
      }
      // Delete old image file if exists
      if (currentData.Gambar) {
        const relativePath = currentData.Gambar.replace('/uploads/', '');
        const oldPath = path.join(UPLOAD_BASE_PATH, relativePath);
        try { await unlink(oldPath); } catch {}
      }
    } else if (hapusGambar && currentData.Gambar) {
      gambarBaru = null;
      const relativePath = currentData.Gambar.replace('/uploads/', '');
      const oldPath = path.join(UPLOAD_BASE_PATH, relativePath);
      try { await unlink(oldPath); } catch {}
    }
    // Remove HapusGambar from body since it's not a DB column
    delete body.HapusGambar;

    // If Jam is being changed, check for duplicates on same date
    if (body.Jam !== undefined && body.Jam !== currentData.Jam) {
      const tanggal = body.Tanggal || currentData.Tanggal;
      const checkDuplicateQuery = `
        SELECT Id FROM ${TABLE_NAME}
        WHERE Tanggal = @Tanggal AND Jam = @Jam AND Id != @id
      `;
      const duplicates = await executeQuery<{ Id: number }>(checkDuplicateQuery, {
        Tanggal: tanggal,
        Jam: body.Jam,
        id: kegiatanId,
      });

      if (duplicates.length > 0) {
        return NextResponse.json(
          { success: false, message: `Jam ${body.Jam} pada tanggal ${tanggal} sudah terisi. Pilih jam lain.` },
          { status: 409 }
        );
      }
    }

    const updateFields: string[] = [];
    const updateParams: Record<string, string | number | null> = { id: kegiatanId };

    if (body.Kegiatan !== undefined) {
      updateFields.push('Kegiatan = @Kegiatan');
      updateParams.Kegiatan = body.Kegiatan;
    }
    if (body.Deskripsi !== undefined) {
      updateFields.push('Deskripsi = @Deskripsi');
      updateParams.Deskripsi = body.Deskripsi;
    }
    if (body.Tanggal !== undefined) {
      updateFields.push('Tanggal = @Tanggal');
      updateParams.Tanggal = body.Tanggal;
    }
    if (body.Jam !== undefined) {
      updateFields.push('Jam = @Jam');
      updateParams.Jam = body.Jam;
    }
    if (body.Gambar !== undefined || gambarBaru !== undefined) {
      updateFields.push('Gambar = @Gambar');
      updateParams.Gambar = gambarBaru !== undefined ? gambarBaru : body.Gambar;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada field yang diupdate' },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE ${TABLE_NAME}
      SET ${updateFields.join(', ')}
      WHERE Id = @id
    `;

    await executeQuery(updateQuery, updateParams);

    const fetchQuery = `
      SELECT Id, CONVERT(VARCHAR(10), Tanggal, 23) as Tanggal, CONVERT(VARCHAR(5), Jam, 108) as Jam, Kegiatan, Deskripsi, Gambar, StatusId, CreatedBy, CreatedDate, ApprovedBy, ApprovedDate
      FROM ${TABLE_NAME}
      WHERE Id = @id
    `;
    const updatedData = await executeQuery(fetchQuery, { id: kegiatanId });

    return NextResponse.json({
      success: true,
      message: 'Kegiatan berhasil diupdate',
      data: updatedData[0],
    });
  } catch (error) {
    console.error('Error updating kalender:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const kegiatanId = parseInt(id);

    if (isNaN(kegiatanId)) {
      return NextResponse.json(
        { success: false, message: 'ID tidak valid' },
        { status: 400 }
      );
    }

    const checkQuery = `
      SELECT Id, CreatedBy, Gambar FROM ${TABLE_NAME} WHERE Id = @id
    `;
    const existing = await executeQuery<{ Id: number; CreatedBy: string; Gambar: string | null }>(checkQuery, { id: kegiatanId });

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Kegiatan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existing[0].CreatedBy !== session.user.username) {
      return NextResponse.json(
        { success: false, message: 'Anda tidak memiliki izin untuk menghapus kegiatan ini' },
        { status: 403 }
      );
    }

    // Delete image file if exists
    if (existing[0].Gambar) {
      // Gambar column stores path like "/uploads/kalender/filename"
      // UPLOAD_BASE_PATH is the upload root, so we extract the relative part
      const relativePath = existing[0].Gambar.replace('/uploads/', '');
      const filePath = path.join(UPLOAD_BASE_PATH, relativePath);
      try { await unlink(filePath); } catch {}
    }

    const deleteQuery = `
      DELETE FROM ${TABLE_NAME} WHERE Id = @id
    `;
    await executeQuery(deleteQuery, { id: kegiatanId });

    return NextResponse.json({
      success: true,
      message: 'Kegiatan berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting kalender:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
