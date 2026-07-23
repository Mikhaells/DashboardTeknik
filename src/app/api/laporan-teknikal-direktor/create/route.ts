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

    if (!body.TanggalProduksi) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tanggal produksi wajib diisi',
        },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const transaction = new Transaction(pool);
    
    await transaction.begin();

    try {
      const insertLaporanQuery = `
        INSERT INTO Teknik_TVRI.dbo.[LaporanTeknikalDirektor]
          (NamaProgram, JenisProduksi, TanggalProduksi, LokasiProduksi, NamaTechnicalDirector, NamaPDU, JumlahKamera, FormatVideo, ResolusiOutput, AudioOutput, MediaRecording, JalurDistribusi, KendalaTindakan, CreateBy, CreateDate, StatusLaporanId)
        VALUES 
          (@NamaProgram, @JenisProduksi, @TanggalProduksi, @LokasiProduksi, @NamaTechnicalDirector, @NamaPDU, @JumlahKamera, @FormatVideo, @ResolusiOutput, @AudioOutput, @MediaRecording, @JalurDistribusi, @KendalaTindakan, @CreateBy, GETDATE(), 2);
        
        SELECT SCOPE_IDENTITY() AS LaporanTeknikalDirektorId;
      `;

      const laporanResult = await transaction.request()
        .input('NamaProgram', body.NamaProgram || '')
        .input('JenisProduksi', body.JenisProduksi || '')
        .input('TanggalProduksi', body.TanggalProduksi)
        .input('LokasiProduksi', body.LokasiProduksi || '')
        .input('NamaTechnicalDirector', body.NamaTechnicalDirector || '')
        .input('NamaPDU', body.NamaPDU || '')
        .input('JumlahKamera', body.JumlahKamera || 0)
        .input('FormatVideo', body.FormatVideo || '')
        .input('ResolusiOutput', body.ResolusiOutput || '')
        .input('AudioOutput', body.AudioOutput || '')
        .input('MediaRecording', body.MediaRecording || '')
        .input('JalurDistribusi', body.JalurDistribusi || '')
        .input('KendalaTindakan', body.KendalaTindakan || '')
        .input('CreateBy', session.user.username)
        .query(insertLaporanQuery);

      const LaporanTeknikalDirektorId = laporanResult.recordset[0].LaporanTeknikalDirektorId;

      if (body.LaporanTeknikalDirektor_Detail && body.LaporanTeknikalDirektor_Detail.length > 0) {
        const insertDetailQuery = `
          INSERT INTO Teknik_TVRI.dbo.[LaporanTeknikalDirektorDetail]
             ([LaporanTeknikalDirektorId], [AlatProduksi], [Check], [Keterangan])
          VALUES
             (@LaporanTeknikalDirektorId, @AlatProduksi, @Check, @Keterangan);
        `;

        for (const item of body.LaporanTeknikalDirektor_Detail) {
          await transaction.request()
            .input('LaporanTeknikalDirektorId', LaporanTeknikalDirektorId)
            .input('AlatProduksi', item.AlatProduksi)
            .input('Check', item.Check)
            .input('Keterangan', item.Keterangan || '')
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
          uploadedFiles = await saveMultipleFiles(imageFiles, LaporanTeknikalDirektorId, 'laporan-teknikal-direktor');
        }
      } catch (uploadError) {
        console.error('Error uploading files:', uploadError);
      }

      return NextResponse.json({
        success: true,
        message: 'Laporan teknikal direktor berhasil ditambahkan',
        data: {
          LaporanTeknikalDirektorId,
          TanggalProduksi: body.TanggalProduksi,
          NamaTechnicalDirector: body.NamaTechnicalDirector,
          uploadedFiles: uploadedFiles
        }
      });

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Error creating laporan teknikal direktor:', error);
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
