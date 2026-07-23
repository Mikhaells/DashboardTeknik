import { NextRequest, NextResponse } from 'next/server';
import { getLaporanHarianTeknisiById } from '@/lib/laporan-harian-teknisi';
import { executeQuery } from '@/lib/db';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * API Route: GET /api/laporan-harian-teknisi/[id]
 * 
 * Handles fetching a single laporan harian teknisi by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID laporan tidak valid',
        },
        { status: 400 }
      );
    }

    const laporan = await getLaporanHarianTeknisiById(id);

    if (!laporan) {
      return NextResponse.json(
        {
          success: false,
          message: 'Laporan tidak ditemukan',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: laporan,
    });
  } catch (error) {
    console.error('Error fetching laporan harian teknisi:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data laporan harian teknisi',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route: DELETE /api/laporan-harian-teknisi/[id]
 * 
 * Handles deleting a laporan harian teknisi and all related activities
 * Uses multiple DELETE queries as requested by user
 * No manual transaction - let executeQuery handle connection pooling
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID laporan tidak valid',
        },
        { status: 400 }
      );
    }

    // Delete uploaded images/attachments first
    const UPLOAD_BASE_PATH = process.env.UPLOAD_DIR
      ? resolve(process.env.UPLOAD_DIR)
      : join(process.cwd(), 'public', 'uploads');
    const uploadDir = join(
      UPLOAD_BASE_PATH,
      'laporan-harian-teknisi',
      id.toString()
    );

    // Check if directory exists and delete it
    if (existsSync(uploadDir)) {
      try {
        await rm(uploadDir, { recursive: true, force: true });
      } catch (fileError) {
        console.error('Error deleting upload directory:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete activities first (foreign key dependencies)
    // 1. Delete PraProduksi activities
    await executeQuery(`
      DELETE FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_PraProduksi 
      WHERE LaporanHarianTeknisiId = ${id}
    `);

    // 2. Delete Produksi activities
    await executeQuery(`
      DELETE FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_Produksi 
      WHERE LaporanHarianTeknisiId = ${id}
    `);

    // 3. Delete PascaProduksi activities
    await executeQuery(`
      DELETE FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_PascaProduksi 
      WHERE LaporanHarianTeknisiId = ${id}
    `);

    // 4. Delete main laporan record
    await executeQuery(`
      DELETE FROM Teknik_TVRI.dbo.LaporanHarianTeknisi 
      WHERE Id = ${id}
    `);

    return NextResponse.json({
      success: true,
      message: 'Laporan harian teknisi dan attachment berhasil dihapus',
    });

  } catch (error) {
    console.error('Error deleting laporan harian teknisi:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat menghapus laporan harian teknisi',
      },
      { status: 500 }
    );
  }
}
