import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { LaporanMaintenanceDetailResponse } from '@/types/laporan-maintenance';
import { saveMultipleFiles } from '@/lib/file-upload';
import { unlink } from 'fs/promises';
import { join, resolve } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<LaporanMaintenanceDetailResponse>> {
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
        LM.Id,
        LM.TanggalPemeriksaan,
        LM.CatatanTemuan,
        LM.CreateBy,
        LM.CreateDate,
        LM.ApproveBy,
        LM.ApproveDate,
        LM.Feedback,
        LM.StatusLaporanId,
        SL.[Status] as StatusLaporan
      FROM Teknik_TVRI.dbo.[LaporanMaintenance] LM
      INNER JOIN Teknik_TVRI.dbo.[StatusLaporan] SL ON SL.Id = LM.StatusLaporanId
      WHERE LM.Id = @id
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
    if (mainData.TanggalPemeriksaan) {
      try {
        if (mainData.TanggalPemeriksaan instanceof Date) {
          const date = new Date(mainData.TanggalPemeriksaan);
          formattedTanggal = date.toISOString().split('T')[0];
        } else {
          const tanggalStr = String(mainData.TanggalPemeriksaan);
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
      `SELECT [LaporanMaintenanceId], [Kegiatan], [Check], [Desc]
       FROM Teknik_TVRI.dbo.[LaporanMaintenanceDetail]
       WHERE [LaporanMaintenanceId] = @id
       ORDER BY [LaporanMaintenanceId]`,
      { id }
    );

    const responseData = {
      ...mainData,
      TanggalPemeriksaan: formattedTanggal,
      LaporanMaintenance_Detail: detailResult,
    };

    return NextResponse.json({
      success: true,
      message: 'Data laporan maintenance berhasil diambil',
      data: responseData,
    });

  } catch (error) {
    console.error('Error fetching laporan maintenance:', error);
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

    if (!body.TanggalPemeriksaan) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tanggal pemeriksaan wajib diisi',
        },
        { status: 400 }
      );
    }

    const checkQuery = `
      SELECT StatusLaporanId 
      FROM Teknik_TVRI.dbo.[LaporanMaintenance]
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
      UPDATE Teknik_TVRI.dbo.[LaporanMaintenance]
      SET 
        TanggalPemeriksaan = @TanggalPemeriksaan,
        CatatanTemuan = @CatatanTemuan,
        StatusLaporanId = 2
      WHERE Id = @id
    `;

    const updateParams = {
      id,
      TanggalPemeriksaan: body.TanggalPemeriksaan,
      CatatanTemuan: body.CatatanTemuan || '',
      StatusLaporanId: 2
    };

    await executeQuery(updateQuery, updateParams);

    await executeQuery(
      `DELETE FROM Teknik_TVRI.dbo.[LaporanMaintenanceDetail] WHERE [LaporanMaintenanceId] = @id`,
      { id }
    );

    if (body.LaporanMaintenance_Detail && body.LaporanMaintenance_Detail.length > 0) {
      for (const item of body.LaporanMaintenance_Detail) {
        await executeQuery(
          `INSERT INTO Teknik_TVRI.dbo.[LaporanMaintenanceDetail]
           ([LaporanMaintenanceId], [Kegiatan], [Check], [Desc])
           VALUES (@id, @Kegiatan, @Check, @Desc)`,
          {
            id,
            Kegiatan: item.Kegiatan,
            Check: item.Check ? 1 : 0,
            Desc: item.Desc || '',
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
        const uploadDir = join(UPLOAD_BASE_PATH, 'laporan-maintenance', id.toString());
        
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
      await saveMultipleFiles(imageFiles, id, 'laporan-maintenance');
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan maintenance berhasil diupdate',
    });

  } catch (error) {
    console.error('Error updating laporan maintenance:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}
