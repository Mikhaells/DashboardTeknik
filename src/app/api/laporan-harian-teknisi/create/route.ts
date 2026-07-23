import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSession } from '@/lib/session';
import { saveMultipleFiles } from '@/lib/file-upload';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check session
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
    
    // Extract form data
    const {
      Operator,
      TanggalPengoperasian,
      JamOperasional,
      ProfesiId,
      Sistem,
      LokasiProduksi,
      PraProduksi,
      Produksi,
      PascaProduksi,
      CatatanEvaluasi
    } = body;

    // Get current user from session
    const createBy = session.user.username;

    try {
      // Build complete transaction query
      let transactionQuery = `
        BEGIN TRANSACTION;
        
        INSERT INTO Teknik_TVRI.dbo.LaporanHarianTeknisi 
        (Operator, TanggalPengoperasian, JamOperasional, ProfesiId, Sistem, LokasiProduksi, 
         Catatan_Evaluasi, CreateBy, CreateDate, StatusLaporanId)
        VALUES 
        ('${Operator}', '${TanggalPengoperasian}', '${JamOperasional}', ${ProfesiId}, '${Sistem}', '${LokasiProduksi}',
         '${CatatanEvaluasi}', '${createBy}', GETDATE(), 2);
        
        DECLARE @NewLaporanId INT = SCOPE_IDENTITY();
      `;

      // Add PraProduksi inserts
      if (PraProduksi && PraProduksi.length > 0) {
        const praProduksiValues = PraProduksi.map((item: any) => 
          `(@NewLaporanId, '${item.NamaKegiatan.replace(/'/g, "''")}', ${item.checked ? 1 : 0})`
        ).join(', ');

        transactionQuery += `
          INSERT INTO Teknik_TVRI.dbo.LaporanHarianTeknisi_PraProduksi 
          (LaporanHarianTeknisiId, Kegiatan, [Check])
          VALUES ${praProduksiValues};
        `;
      }

      // Add Produksi inserts
      if (Produksi && Produksi.length > 0) {
        const produksiValues = Produksi.map((item: any) => 
          `(@NewLaporanId, '${item.NamaKegiatan.replace(/'/g, "''")}', ${item.checked ? 1 : 0})`
        ).join(', ');

        transactionQuery += `
          INSERT INTO Teknik_TVRI.dbo.LaporanHarianTeknisi_Produksi 
          (LaporanHarianTeknisiId, Kegiatan, [Check])
          VALUES ${produksiValues};
        `;
      }

      // Add PascaProduksi inserts
      if (PascaProduksi && PascaProduksi.length > 0) {
        const pascaProduksiValues = PascaProduksi.map((item: any) => 
          `(@NewLaporanId, '${item.NamaKegiatan.replace(/'/g, "''")}', ${item.checked ? 1 : 0})`
        ).join(', ');

        transactionQuery += `
          INSERT INTO Teknik_TVRI.dbo.LaporanHarianTeknisi_PascaProduksi 
          (LaporanHarianTeknisiId, Kegiatan, [Check])
          VALUES ${pascaProduksiValues};
        `;
      }

      // Complete transaction
      transactionQuery += `
        COMMIT TRANSACTION;
        
        SELECT @NewLaporanId AS NewLaporanId;
      `;

      // Execute entire transaction in single call
      const result = await executeQuery(transactionQuery);
      const newLaporanId = result[0].NewLaporanId;

      // Handle file uploads after laporan is created
      let uploadedFiles: string[] = [];
      try {
        // Extract all image files from FormData
        const imageFiles: File[] = [];
        for (const [key, value] of formData.entries()) {
          if (key.startsWith('image_') && value instanceof File) {
            imageFiles.push(value);
          }
        }

        // Save files if any
        if (imageFiles.length > 0) {
          uploadedFiles = await saveMultipleFiles(imageFiles, newLaporanId);
          console.log('Files uploaded successfully:', uploadedFiles);
        }
      } catch (uploadError) {
        console.error('Error uploading files:', uploadError);
        // Continue even if file upload fails, laporan is already saved
      }

      return NextResponse.json({
        success: true,
        message: 'Laporan harian teknisi berhasil disimpan',
        data: {
          laporanId: newLaporanId,
          uploadedFiles: uploadedFiles
        }
      });

    } catch (transactionError: any) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json({
        success: false,
        message: 'Gagal menyimpan laporan harian teknisi',
        error: transactionError.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error creating laporan harian teknisi:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal menyimpan laporan harian teknski',
      error: error.message
    }, { status: 500 });
  }
}
