import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession } from '@/lib/session';
import { ConnectionPool, Transaction } from 'mssql';
import { saveMultipleFiles } from '@/lib/file-upload';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. Please login first.',
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const dataString = formData.get('data') as string;

    if (!dataString) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 400 }
      );
    }

    const body = JSON.parse(dataString);

    if (!body.TanggalPemeriksaan) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tanggal pemeriksaan wajib diisi',
        },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const transaction = new Transaction(pool);
    
    await transaction.begin();

    try {
      const insertLaporanQuery = `
        INSERT INTO Teknik_TVRI.dbo.[LaporanMaintenance]
          (TanggalPemeriksaan, CatatanTemuan, CreateBy, CreateDate, StatusLaporanId)
        VALUES 
          (@TanggalPemeriksaan, @CatatanTemuan, @CreateBy, GETDATE(), 2);
        
        SELECT SCOPE_IDENTITY() AS LaporanMaintenanceId;
      `;

      const laporanResult = await transaction.request()
        .input('TanggalPemeriksaan', body.TanggalPemeriksaan)
        .input('CatatanTemuan', body.CatatanTemuan || '')
        .input('CreateBy', session.user.username)
        .query(insertLaporanQuery);

      const LaporanMaintenanceId = laporanResult.recordset[0].LaporanMaintenanceId;

      if (body.LaporanMaintenance_Detail && body.LaporanMaintenance_Detail.length > 0) {
        const insertDetailQuery = `
          INSERT INTO Teknik_TVRI.dbo.[LaporanMaintenanceDetail]
             ([LaporanMaintenanceId], [Kegiatan], [Check], [Desc])
          VALUES
             (@LaporanMaintenanceId, @Kegiatan, @Check, @Desc);
        `;

        for (const item of body.LaporanMaintenance_Detail) {
          await transaction.request()
            .input('LaporanMaintenanceId', LaporanMaintenanceId)
            .input('Kegiatan', item.Kegiatan)
            .input('Check', item.Check)
            .input('Desc', item.Desc || '')
            .query(insertDetailQuery);
        }
      }

      await transaction.commit();

      let uploadedFiles: string[] = [];
      try {
        const imageFiles: File[] = [];
        for (const [key, value] of formData.entries()) {
          if (key.startsWith('image_') && value instanceof File) {
            imageFiles.push(value);
          }
        }

        if (imageFiles.length > 0) {
          uploadedFiles = await saveMultipleFiles(imageFiles, LaporanMaintenanceId, 'laporan-maintenance');
        }
      } catch (uploadError) {
        console.error('Error uploading files:', uploadError);
      }

      return NextResponse.json({
        success: true,
        message: 'Laporan maintenance berhasil ditambahkan',
        data: {
          LaporanMaintenanceId,
          TanggalPemeriksaan: body.TanggalPemeriksaan,
          Petugas: body.Petugas,
          uploadedFiles: uploadedFiles
        }
      });

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Error creating laporan maintenance:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
