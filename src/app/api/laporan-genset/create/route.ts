import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession } from '@/lib/session';
import { ConnectionPool, Transaction } from 'mssql';
import { saveMultipleFiles } from '@/lib/file-upload';

// Interface for checklist item
interface ChecklistItem {
  Tindakan: string;
  Check: boolean;
}

/**
 * API Route: POST /api/laporan-genset/create
 * 
 * Handles creating new laporan genset with full checklist data and image uploads
 */
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

    // Get database connection and create transaction
    const pool = await getDbPool();
    const transaction = new Transaction(pool);
    
    await transaction.begin();

    try {
      // 1. Insert main laporan data
      const insertLaporanQuery = `
        INSERT INTO Teknik_TVRI.dbo.[LaporanPemeriksaanGenset]
          (TanggalPemeriksaan, JamOperasi, Operator, CatatandanTemuan, Feedback, CreatedBy, CreatedDate, StatusLaporanId)
        VALUES 
          (@TanggalPemeriksaan, @JamOperasi, @Operator, @CatatandanTemuan, @Feedback, @CreatedBy, GETDATE(), 2);
        
        SELECT SCOPE_IDENTITY() AS LaporanGensetId;
      `;

      const laporanResult = await transaction.request()
        .input('TanggalPemeriksaan', body.TanggalPemeriksaan)
        .input('JamOperasi', body.JamOperasi)
        .input('Operator', body.Operator)
        .input('CatatandanTemuan', body.CatatandanTemuan)
        .input('Feedback', body.Feedback || '')
        .input('CreatedBy', session.user.username)
        .query(insertLaporanQuery);

      const LaporanGensetId = laporanResult.recordset[0].LaporanGensetId;

      // 2. Insert checklist data for each section
      const insertChecklistData = async (tableName: string, checklistData?: ChecklistItem[]) => {
        if (!checklistData || checklistData.length === 0) return;

        const insertQuery = `
          INSERT INTO Teknik_TVRI.dbo.[${tableName}]
             ([LaporanGensetId]
             ,[Tindakan]
             ,[Check])
       VALUES
             (@LaporanGensetId, @Tindakan, @Check);
        `;

        for (const item of checklistData) {
          await transaction.request()
            .input('LaporanGensetId', LaporanGensetId)
            .input('Tindakan', item.Tindakan)
            .input('Check', item.Check)
            .query(insertQuery);
        }
      };

      // Insert all checklist sections
      await insertChecklistData('PemeriksaanGenset_SistemMesin', body.PemeriksaanGenset_SistemMesin);
      await insertChecklistData('PemeriksaanGenset_SistemPendingin', body.PemeriksaanGenset_SistemPendingin);
      await insertChecklistData('PemeriksaanGenset_SistemBahanBakar', body.PemeriksaanGenset_SistemBahanBakar);
      await insertChecklistData('PemeriksaanGenset_SistemKelistrikan', body.PemeriksaanGenset_SistemKelistrikan);
      await insertChecklistData('PemeriksaanGenset_OutputListrik', body.PemeriksaanGenset_OutputListrik);
      await insertChecklistData('PemeriksaanGenset_Mingguan', body.PemeriksaanGenset_Mingguan);
      await insertChecklistData('PemeriksaanGenset_Bulanan', body.PemeriksaanGenset_Bulanan);
      await insertChecklistData('PemeriksaanGenset_SistemKontrol_Proteksi', body.PemeriksaanGenset_SistemKontrol_Proteksi);
      await insertChecklistData('PemeriksaanGenset_ATS_AMF', body.PemeriksaanGenset_ATS_AMF);
      await insertChecklistData('PemeriksaanGenset_Kebersihan_Keamanan', body.PemeriksaanGenset_Kebersihan_Keamanan);

      // Commit transaction
      await transaction.commit();

      // Handle file uploads after laporan is created
      let uploadedFiles: string[] = [];
      try {
        const imageFiles: File[] = [];
        for (const [key, value] of formData.entries()) {
          if (key.startsWith('image_') && value instanceof File) {
            imageFiles.push(value);
          }
        }

        if (imageFiles.length > 0) {
          uploadedFiles = await saveMultipleFiles(imageFiles, LaporanGensetId, 'laporan-genset');
        }
      } catch (uploadError) {
        console.error('Error uploading files:', uploadError);
      }

      return NextResponse.json({
        success: true,
        message: 'Laporan genset berhasil ditambahkan',
        data: {
          LaporanGensetId,
          TanggalPemeriksaan: body.TanggalPemeriksaan,
          Operator: body.Operator,
          uploadedFiles: uploadedFiles
        }
      });

    } catch (transactionError) {
      // Rollback transaction if any error occurs
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Error creating laporan genset:', error);
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
