import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { LaporanTeknikalDirektorDetailResponse } from '@/types/laporan-teknikal-direktor';
import { saveMultipleFiles } from '@/lib/file-upload';
import { unlink } from 'fs/promises';
import { join, resolve } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<LaporanTeknikalDirektorDetailResponse>> {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID laporan tidak valid',
        },
        { status: 400 }
      );
    }

    const mainQuery = `
      SELECT 
        LT.Id,
        LT.NamaProgram,
        LT.JenisProduksi,
        LT.TanggalProduksi,
        LT.LokasiProduksi,
        LT.NamaTechnicalDirector,
        LT.NamaPDU,
        LT.JumlahKamera,
        LT.FormatVideo,
        LT.ResolusiOutput,
        LT.AudioOutput,
        LT.MediaRecording,
        LT.JalurDistribusi,
        LT.KendalaTindakan,
        LT.CreateBy,
        LT.CreateDate,
        LT.Feedback,
        LT.ApproveBy,
        LT.ApproveDate,
        LT.StatusLaporanId,
        SL.[Status] as StatusLaporan
      FROM Teknik_TVRI.dbo.[LaporanTeknikalDirektor] LT
      INNER JOIN Teknik_TVRI.dbo.[StatusLaporan] SL ON SL.Id = LT.StatusLaporanId
      WHERE LT.Id = @id
    `;

    const mainResult = await executeQuery(mainQuery, { id });

    if (mainResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Laporan tidak ditemukan',
        },
        { status: 404 }
      );
    }

    const mainData = mainResult[0];
    
    let formattedTanggal = '';
    if (mainData.TanggalProduksi) {
      try {
        if (mainData.TanggalProduksi instanceof Date) {
          const date = new Date(mainData.TanggalProduksi);
          formattedTanggal = date.toISOString().split('T')[0];
        } else {
          const tanggalStr = String(mainData.TanggalProduksi);
          if (tanggalStr.includes('T')) {
            formattedTanggal = tanggalStr.split('T')[0];
          } else if (tanggalStr.includes(' ')) {
            formattedTanggal = tanggalStr.split(' ')[0];
          } else {
            formattedTanggal = tanggalStr;
          }
        }
      } catch (e) {
        formattedTanggal = '';
      }
    }

    const detailResult = await executeQuery(
      `SELECT [LaporanTeknikalDirektorId], [AlatProduksi], [Check], [Keterangan]
       FROM Teknik_TVRI.dbo.[LaporanTeknikalDirektorDetail]
       WHERE [LaporanTeknikalDirektorId] = @id
       ORDER BY [LaporanTeknikalDirektorId]`,
      { id }
    );

    const responseData = {
      ...mainData,
      TanggalProduksi: formattedTanggal,
      LaporanTeknikalDirektor_Detail: detailResult,
    };

    return NextResponse.json({
      success: true,
      message: 'Data laporan teknikal direktor berhasil diambil',
      data: responseData,
    });

  } catch (error) {
    console.error('Error fetching laporan teknikal direktor:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID laporan tidak valid',
        },
        { status: 400 }
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

    const checkQuery = `
      SELECT StatusLaporanId 
      FROM Teknik_TVRI.dbo.[LaporanTeknikalDirektor]
      WHERE Id = @id
    `;

    const checkResult = await executeQuery(checkQuery, { id });

    if (checkResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Laporan tidak ditemukan',
        },
        { status: 404 }
      );
    }

    const updateQuery = `
      UPDATE Teknik_TVRI.dbo.[LaporanTeknikalDirektor]
      SET 
        NamaProgram = @NamaProgram,
        JenisProduksi = @JenisProduksi,
        TanggalProduksi = @TanggalProduksi,
        LokasiProduksi = @LokasiProduksi,
        NamaTechnicalDirector = @NamaTechnicalDirector,
        NamaPDU = @NamaPDU,
        JumlahKamera = @JumlahKamera,
        FormatVideo = @FormatVideo,
        ResolusiOutput = @ResolusiOutput,
        AudioOutput = @AudioOutput,
        MediaRecording = @MediaRecording,
        JalurDistribusi = @JalurDistribusi,
        KendalaTindakan = @KendalaTindakan,
        StatusLaporanId = 2
      WHERE Id = @id
    `;

    const updateParams = {
      id,
      NamaProgram: body.NamaProgram || '',
      JenisProduksi: body.JenisProduksi || '',
      TanggalProduksi: body.TanggalProduksi,
      LokasiProduksi: body.LokasiProduksi || '',
      NamaTechnicalDirector: body.NamaTechnicalDirector || '',
      NamaPDU: body.NamaPDU || '',
      JumlahKamera: body.JumlahKamera || 0,
      FormatVideo: body.FormatVideo || '',
      ResolusiOutput: body.ResolusiOutput || '',
      AudioOutput: body.AudioOutput || '',
      MediaRecording: body.MediaRecording || '',
      JalurDistribusi: body.JalurDistribusi || '',
      KendalaTindakan: body.KendalaTindakan || '',
    };

    await executeQuery(updateQuery, updateParams);

    await executeQuery(
      `DELETE FROM Teknik_TVRI.dbo.[LaporanTeknikalDirektorDetail] WHERE [LaporanTeknikalDirektorId] = @id`,
      { id }
    );

    if (body.LaporanTeknikalDirektor_Detail && body.LaporanTeknikalDirektor_Detail.length > 0) {
      for (const item of body.LaporanTeknikalDirektor_Detail) {
        await executeQuery(
          `INSERT INTO Teknik_TVRI.dbo.[LaporanTeknikalDirektorDetail]
           ([LaporanTeknikalDirektorId], [AlatProduksi], [Check], [Keterangan])
           VALUES (@id, @AlatProduksi, @Check, @Keterangan)`,
          {
            id,
            AlatProduksi: item.AlatProduksi,
            Check: item.Check ? 1 : 0,
            Keterangan: item.Keterangan || '',
          }
        );
      }
    }

    const imagesToDeleteStr = formData.get('imagesToDelete') as string;
    if (imagesToDeleteStr) {
      try {
        const imagesToDelete: string[] = JSON.parse(imagesToDeleteStr);
        const UPLOAD_BASE_PATH = process.env.UPLOAD_DIR
          ? resolve(process.env.UPLOAD_DIR)
          : join(process.cwd(), 'public', 'uploads');
        const uploadDir = join(UPLOAD_BASE_PATH, 'laporan-teknikal-direktor', id.toString());
        
        for (const filename of imagesToDelete) {
          try {
            const filePath = join(uploadDir, filename);
            await unlink(filePath);
          } catch (deleteErr) {
            console.error(`Error deleting image ${filename}:`, deleteErr);
          }
        }
      } catch (parseErr) {
        console.error('Error parsing imagesToDelete:', parseErr);
      }
    }

    const imageFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        imageFiles.push(value);
      }
    }

    if (imageFiles.length > 0) {
      await saveMultipleFiles(imageFiles, id, 'laporan-teknikal-direktor');
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan teknikal direktor berhasil diupdate',
    });

  } catch (error) {
    console.error('Error updating laporan teknikal direktor:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}
