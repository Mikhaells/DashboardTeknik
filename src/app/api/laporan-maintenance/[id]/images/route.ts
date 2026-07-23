import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

const UPLOAD_BASE_PATH = process.env.UPLOAD_DIR
  ? resolve(process.env.UPLOAD_DIR)
  : join(process.cwd(), 'public', 'uploads');

const PUBLIC_UPLOAD_PATH = join(process.cwd(), 'public', 'uploads');

function getUploadDir(laporanId: string): string {
  return join(UPLOAD_BASE_PATH, 'laporan-maintenance', laporanId);
}

function getPublicUploadDir(laporanId: string): string {
  return join(PUBLIC_UPLOAD_PATH, 'laporan-maintenance', laporanId);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const laporanId = id;

    if (!laporanId || isNaN(Number(laporanId))) {
      return NextResponse.json(
        { success: false, message: 'Invalid laporan ID' },
        { status: 400 }
      );
    }

    let uploadDir = getUploadDir(laporanId);
    let urlPrefix = '/api/uploads';

    if (!existsSync(uploadDir)) {
      const publicDir = getPublicUploadDir(laporanId);
      if (existsSync(publicDir)) {
        uploadDir = publicDir;
        urlPrefix = '/uploads';
      } else {
        return NextResponse.json({
          success: true,
          data: { images: [] }
        });
      }
    }

    const files = await readdir(uploadDir);

    const imageFiles = files
      .filter(file => {
        const ext = file.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
      })
      .sort()
      .map(file => {
        const relativeUrl = `${urlPrefix}/laporan-maintenance/${laporanId}/${file}`;

        return {
          filename: file,
          url: relativeUrl
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        images: imageFiles,
        total: imageFiles.length
      }
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data gambar',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
