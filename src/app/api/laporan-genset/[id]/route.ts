import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { LaporanGensetDetailResponse } from '@/types/laporan-genset';
import { saveMultipleFiles } from '@/lib/file-upload';
import { unlink } from 'fs/promises';
import { join, resolve } from 'path';

/**
 * API Route: GET /api/laporan-genset/[id]
 * 
 * Handles fetching single laporan genset by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<LaporanGensetDetailResponse>> {
  try {
    // Unwrap params dengan await untuk Next.js 15
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

    // Get main laporan data
    const mainQuery = `
      SELECT 
        Id,
        TanggalPemeriksaan,
        JamOperasi,
        Operator,
        CatatandanTemuan,
        Feedback,
        CreatedBy,
        CreatedDate,
        ApprovedBy,
        ApprovedDate,
        StatusLaporanId,
        (SELECT [Desc] FROM Teknik_TVRI.dbo.[StatusLaporan] WHERE Id = StatusLaporanId) as StatusLaporan
      FROM Teknik_TVRI.dbo.[LaporanPemeriksaanGenset]
      WHERE Id = @id
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

    // Get checklist data in parallel
    const checklistQueries = [
      `SELECT [LaporanGensetId], [Tindakan], [Check] FROM Teknik_TVRI.dbo.[PemeriksaanGenset_SistemMesin] WHERE [LaporanGensetId] = @id`,
      `SELECT [LaporanGensetId], [Tindakan], [Check] FROM Teknik_TVRI.dbo.[PemeriksaanGenset_SistemPendingin] WHERE [LaporanGensetId] = @id`,
      `SELECT [LaporanGensetId], [Tindakan], [Check] FROM Teknik_TVRI.dbo.[PemeriksaanGenset_SistemBahanBakar] WHERE [LaporanGensetId] = @id`,
      `SELECT [LaporanGensetId], [Tindakan], [Check] FROM Teknik_TVRI.dbo.[PemeriksaanGenset_SistemKelistrikan] WHERE [LaporanGensetId] = @id`,
      `SELECT [LaporanGensetId], [Tindakan], [Check] FROM Teknik_TVRI.dbo.[PemeriksaanGenset_OutputListrik] WHERE [LaporanGensetId] = @id`,
      `SELECT [LaporanGensetId], [Tindakan], [Check] FROM Teknik_TVRI.dbo.[PemeriksaanGenset_Mingguan] WHERE [LaporanGensetId] = @id`,
      `SELECT [LaporanGensetId], [Tindakan], [Check] FROM Teknik_TVRI.dbo.[PemeriksaanGenset_Bulanan] WHERE [LaporanGensetId] = @id`,
      `SELECT [LaporanGensetId], [Tindakan], [Check] FROM Teknik_TVRI.dbo.[PemeriksaanGenset_SistemKontrol_Proteksi] WHERE [LaporanGensetId] = @id`,
      `SELECT [LaporanGensetId], [Tindakan], [Check] FROM Teknik_TVRI.dbo.[PemeriksaanGenset_ATS_AMF] WHERE [LaporanGensetId] = @id`,
      `SELECT [LaporanGensetId], [Tindakan], [Check] FROM Teknik_TVRI.dbo.[PemeriksaanGenset_Kebersihan_Keamanan] WHERE [LaporanGensetId] = @id`
    ];

    const checklistResults = await Promise.all(
      checklistQueries.map(query => executeQuery(query, { id }))
    );

    // Transform checklist data
    const transformChecklist = (data: any[]) => {
      return data.map(item => {
        // SQL Server BIT conversion - most robust approach
        let checkValue = false;
        
        // Handle all possible SQL Server BIT representations
        if (item.Check === true) {
          checkValue = true;  // Boolean true
        } else if (item.Check === 1) {
          checkValue = true;  // Number 1
        } else if (item.Check === 'true') {
          checkValue = true;  // String "true"
        } else if (item.Check === 'TRUE') {
          checkValue = true;  // String "TRUE"
        } else if (item.Check == 1 && item.Check !== 0 && item.Check !== '0' && item.Check !== false) {
          checkValue = true;  // Loose equality with exclusions
        }
        
        return {
          Tindakan: item.Tindakan,
          Check: checkValue
        };
      });
    };

    // Format date and time safely
    const mainData = mainResult[0];
    
    // Date formatting - handle Date objects
    let formattedTanggal = '';
    if (mainData.TanggalPemeriksaan) {
      try {
        // Check if it's a Date object
        if (mainData.TanggalPemeriksaan instanceof Date) {
          const date = new Date(mainData.TanggalPemeriksaan);
          // Format: YYYY-MM-DD
          formattedTanggal = date.toISOString().split('T')[0];
        } else {
          // Handle string format
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
    
    // Time formatting - handle Date objects
    let formattedJam = '';
    if (mainData.JamOperasi) {
      try {
        // Check if it's a Date object
        if (mainData.JamOperasi instanceof Date) {
          const time = new Date(mainData.JamOperasi);
          // Get UTC time to avoid timezone conversion issues
          const hours = String(time.getUTCHours()).padStart(2, '0');
          const minutes = String(time.getUTCMinutes()).padStart(2, '0');
          formattedJam = `${hours}:${minutes}`;
        } else {
          // Handle string format
          const timeStr = String(mainData.JamOperasi);
          if (timeStr.includes(':')) {
            // Extract HH:MM from various formats
            const timeParts = timeStr.split(':');
            if (timeParts.length >= 2) {
              formattedJam = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
            } else {
              formattedJam = timeStr;
            }
          } else if (timeStr.length > 5) {
            formattedJam = timeStr.substring(0, 5);
          } else {
            formattedJam = timeStr;
          }
        }
      } catch (e) {
        formattedJam = '';
      }
    }

    // Combine all data
    const responseData = {
      ...mainData,
      TanggalPemeriksaan: formattedTanggal,
      JamOperasi: formattedJam,
      PemeriksaanGenset_SistemMesin: transformChecklist(checklistResults[0]),
      PemeriksaanGenset_SistemPendingin: transformChecklist(checklistResults[1]),
      PemeriksaanGenset_SistemBahanBakar: transformChecklist(checklistResults[2]),
      PemeriksaanGenset_SistemKelistrikan: transformChecklist(checklistResults[3]),
      PemeriksaanGenset_OutputListrik: transformChecklist(checklistResults[4]),
      PemeriksaanGenset_Mingguan: transformChecklist(checklistResults[5]),
      PemeriksaanGenset_Bulanan: transformChecklist(checklistResults[6]),
      PemeriksaanGenset_SistemKontrol_Proteksi: transformChecklist(checklistResults[7]),
      PemeriksaanGenset_ATS_AMF: transformChecklist(checklistResults[8]),
      PemeriksaanGenset_Kebersihan_Keamanan: transformChecklist(checklistResults[9])
    };

    return NextResponse.json({
      success: true,
      message: 'Data laporan genset berhasil diambil',
      data: responseData,
    });

  } catch (error) {
    console.error('Error fetching laporan genset:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route: PUT /api/laporan-genset/[id]
 * 
 * Handles updating laporan genset by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Unwrap params dengan await untuk Next.js 15
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

    // Parse FormData
    const formData = await request.formData();
    const dataString = formData.get('data') as string;

    if (!dataString) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 400 }
      );
    }

    const body = JSON.parse(dataString);

    
    // Validate required fields
    if (!body.TanggalPemeriksaan || !body.JamOperasi || !body.Operator || !body.CatatandanTemuan) {
      return NextResponse.json(
        {
          success: false,
          message: 'Semua field wajib diisi',
        },
        { status: 400 }
      );
    }

    
    // Check if laporan exists
    const checkQuery = `
      SELECT StatusLaporanId 
      FROM Teknik_TVRI.dbo.[LaporanPemeriksaanGenset]
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

    // Update laporan dengan StatusLaporanId = 2 untuk semua mode
    const updateQuery = `
      UPDATE Teknik_TVRI.dbo.[LaporanPemeriksaanGenset]
      SET 
        TanggalPemeriksaan = @TanggalPemeriksaan,
        JamOperasi = @JamOperasi,
        Operator = @Operator,
        CatatandanTemuan = @CatatandanTemuan,
        StatusLaporanId = 2
      WHERE Id = @id
    `;

    const updateParams = {
      id,
      TanggalPemeriksaan: body.TanggalPemeriksaan,
      JamOperasi: body.JamOperasi,
      Operator: body.Operator,
      CatatandanTemuan: body.CatatandanTemuan,
      StatusLaporanId: 2
    };

    
    await executeQuery(updateQuery, updateParams);

    // Update checklist tables
    const updateChecklistTable = async (tableName: string, checklistData: any[]) => {
      const deleteQuery = `
        DELETE FROM Teknik_TVRI.dbo.[${tableName}]
        WHERE [LaporanGensetId] = @id
      `;
      await executeQuery(deleteQuery, { id });

      for (const item of checklistData) {
        const insertQuery = `
          INSERT INTO Teknik_TVRI.dbo.[${tableName}]
          ([LaporanGensetId], [Tindakan], [Check])
          VALUES (@id, @Tindakan, @Check)
        `;
        await executeQuery(insertQuery, {
          id,
          Tindakan: item.Tindakan,
          Check: item.Check ? 1 : 0
        });
      }
    };

    // Update all checklist tables in parallel
    const checklistUpdates = [
      updateChecklistTable('PemeriksaanGenset_SistemMesin', body.PemeriksaanGenset_SistemMesin || []),
      updateChecklistTable('PemeriksaanGenset_SistemPendingin', body.PemeriksaanGenset_SistemPendingin || []),
      updateChecklistTable('PemeriksaanGenset_SistemBahanBakar', body.PemeriksaanGenset_SistemBahanBakar || []),
      updateChecklistTable('PemeriksaanGenset_SistemKelistrikan', body.PemeriksaanGenset_SistemKelistrikan || []),
      updateChecklistTable('PemeriksaanGenset_OutputListrik', body.PemeriksaanGenset_OutputListrik || []),
      updateChecklistTable('PemeriksaanGenset_Mingguan', body.PemeriksaanGenset_Mingguan || []),
      updateChecklistTable('PemeriksaanGenset_Bulanan', body.PemeriksaanGenset_Bulanan || []),
      updateChecklistTable('PemeriksaanGenset_SistemKontrol_Proteksi', body.PemeriksaanGenset_SistemKontrol_Proteksi || []),
      updateChecklistTable('PemeriksaanGenset_ATS_AMF', body.PemeriksaanGenset_ATS_AMF || []),
      updateChecklistTable('PemeriksaanGenset_Kebersihan_Keamanan', body.PemeriksaanGenset_Kebersihan_Keamanan || [])
    ];

    await Promise.all(checklistUpdates);

    // Handle image deletions
    const imagesToDeleteStr = formData.get('imagesToDelete') as string;
    if (imagesToDeleteStr) {
      try {
        const imagesToDelete: string[] = JSON.parse(imagesToDeleteStr);
        const UPLOAD_BASE_PATH = process.env.UPLOAD_DIR
          ? resolve(process.env.UPLOAD_DIR)
          : join(process.cwd(), 'public', 'uploads');
        const uploadDir = join(UPLOAD_BASE_PATH, 'laporan-genset', id.toString());
        
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

    // Handle new image uploads
    const imageFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        imageFiles.push(value);
      }
    }

    if (imageFiles.length > 0) {
      await saveMultipleFiles(imageFiles, id, 'laporan-genset');
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan genset berhasil diupdate',
    });

  } catch (error) {
    console.error('Error updating laporan genset:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}
