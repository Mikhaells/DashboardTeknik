import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

const UPLOAD_BASE_PATH = process.env.UPLOAD_DIR
  ? resolve(process.env.UPLOAD_DIR)
  : join(process.cwd(), 'public', 'uploads');

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Path tidak valid' },
        { status: 400 }
      );
    }

    // Prevent directory traversal
    const safePath = pathSegments.map(s => s.replace(/\.\.\//g, '').replace(/\.\.\\/g, ''));
    const filePath = join(UPLOAD_BASE_PATH, ...safePath);

    // Security: ensure resolved path stays within UPLOAD_BASE_PATH
    const resolvedPath = resolve(filePath);
    if (!resolvedPath.startsWith(resolve(UPLOAD_BASE_PATH))) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak' },
        { status: 403 }
      );
    }

    if (!existsSync(resolvedPath)) {
      return NextResponse.json(
        { success: false, message: 'File tidak ditemukan' },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(resolvedPath);
    const ext = resolvedPath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[uploads serve] Error serving file:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membaca file' },
      { status: 500 }
    );
  }
}
