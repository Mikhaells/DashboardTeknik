import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getDbPool, executeQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { getLaporanTeknisi } from '@/lib/laporan-teknisi';
import { LaporanData, ChecklistItem } from '@/types/laporan-teknisi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const userLevel = searchParams.get('userLevel');
    const username = searchParams.get('username');

    const result = await getLaporanTeknisi(page, limit, userLevel ? parseInt(userLevel) : undefined, username || undefined);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching laporan teknisi data:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data laporan teknisi',
      },
      { status: 500 }
    );
  }
}

// Helper function to get Jabatan ID from name
async function getJabatanId(jabatanName: string): Promise<number | null> {
  try {
    const result = await executeQuery<{ID: number}>(
      `SELECT ID FROM Teknik_TVRI.dbo.Jabatan WHERE Jabatan = @jabatanName`,
      {
        jabatanName: jabatanName
      }
    );
    
    return result.length > 0 ? result[0].ID : null;
  } catch (error) {
    console.error('Error getting Jabatan ID:', error);
    return null;
  }
}

// Helper function to get Kegiatan ID from name
async function getKegiatanId(kegiatanName: string): Promise<number | null> {
  try {
    const result = await executeQuery<{Id: number}>(
      `SELECT Id FROM Teknik_TVRI.dbo.Kegiatan WHERE Kegiatan = @kegiatanName`,
      {
        kegiatanName: kegiatanName
      }
    );
    
    return result.length > 0 ? result[0].Id : null;
  } catch (error) {
    console.error('Error getting Kegiatan ID:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Tidak ada data yang dikirim. Pastikan form terisi dengan benar.'
      }, { status: 400 });
    }

    // Get proper IDs from names
    const jabatanId = await getJabatanId(body.jabatan);
    const kegiatanId = await getKegiatanId(body.programKegiatan);

    if (!jabatanId) {
      return NextResponse.json({
        success: false,
        message: `Jabatan "${body.jabatan}" tidak ditemukan di database. Silakan pilih jabatan yang valid.` 
      }, { status: 400 });
    }

    if (!kegiatanId) {
      return NextResponse.json({
        success: false,
        message: `Kegiatan "${body.programKegiatan}" tidak ditemukan di database. Silakan pilih kegiatan yang valid.` 
      }, { status: 400 });
    }

    // Get current user for CreatedBy field
    let currentUser = 'Unknown User';
    try {
      const user = await getCurrentUser();
      if (user) {
        currentUser = user.username;
      }
    } catch (error) {
      console.warn('Could not fetch current user:', error);
    }

    // Collect form data
    const laporanData: LaporanData = {
      nama: body.namaPetugas,
      nip: body.nipId,
      jabatan: body.jabatan, // Store name for display
      jabatanId: jabatanId, // Store ID for database
      tanggal: body.tanggal,
      kegiatan: body.programKegiatan, // Store name for display
      kegiatanId: kegiatanId, // Store ID for database
      lokasi: body.lokasi,
      createBy: currentUser, // Use actual logged-in user
      
      // Collect pre-production data
      preProduction: [],
      production: [],
      postProduction: [],
      catatanTeknis: body.catatanTeknis || null
    };
    
    // Handle pre-production arrays from form
    // Count total pre-production items by checking for hidden fields
    const prepCount = Object.keys(body).filter(key => key.startsWith('prep_')).length / 3; // prep_X_check, prep_X_ket, prep_X_kegiatan
    for (let i = 0; i < prepCount; i++) {
      const checklistItem: ChecklistItem = {
        Id: i + 1,
        Kegiatan: body[`prep_${i}_kegiatan`] || '', // Get kegiatan text from form
        Check: body[`prep_${i}_check`] === true,
        Keterangan: body[`prep_${i}_ket`] || null
      };
      laporanData.preProduction.push(checklistItem);
    } 
     
    // Handle production arrays from form
    // Count total production items by checking for hidden fields
    const prodCount = Object.keys(body).filter(key => key.startsWith('prod_')).length / 3; // prod_X_check, prod_X_ket, prod_X_kegiatan
    for (let i = 0; i < prodCount; i++) {
      const checklistItem: ChecklistItem = {
        Id: i + 1,
        Kegiatan: body[`prod_${i}_kegiatan`] || '', // Get kegiatan text from form
        Check: body[`prod_${i}_check`] === true,
        Keterangan: body[`prod_${i}_ket`] || null
      };
      laporanData.production.push(checklistItem);
    } 
    
    // Handle post-production arrays from form
    // Count total post-production items by checking for hidden fields
    const postCount = Object.keys(body).filter(key => key.startsWith('post_')).length / 3; // post_X_check, post_X_ket, post_X_kegiatan
    for (let i = 0; i < postCount; i++) {
      const checklistItem: ChecklistItem = {
        Id: i + 1,
        Kegiatan: body[`post_${i}_kegiatan`] || '', // Get kegiatan text from form
        Check: body[`post_${i}_check`] === true,
        Keterangan: body[`post_${i}_ket`] || null
      };
      laporanData.postProduction.push(checklistItem);
    } 

    // Validate required fields
    if (!laporanData.nama || !laporanData.jabatan || !laporanData.tanggal || !laporanData.kegiatan) {
      return NextResponse.json({
        success: false,
        message: 'Field nama, jabatan, tanggal, dan kegiatan wajib diisi'
      }, { status: 400 });
    }
    
    // Get database connection
    const pool = await getDbPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Insert into laporanTeknisi main table
      const laporanResult = await transaction.request()
        .input('nama', sql.NVarChar, laporanData.nama)
        .input('nip', sql.NVarChar, laporanData.nip)
        .input('jabatanId', sql.Int, laporanData.jabatanId)
        .input('eventDate', sql.Date, laporanData.tanggal)
        .input('kegiatanId', sql.Int, laporanData.kegiatanId)
        .input('lokasi', sql.NVarChar, laporanData.lokasi)
        .input('kendala', sql.NVarChar, laporanData.catatanTeknis)
        .input('createdBy', sql.NVarChar, laporanData.createBy)
        .input('statusId', sql.Int, body.statusId || 2) // Use status from form or default to Pending
        .query(`
          INSERT INTO Teknik_TVRI.dbo.laporanTeknisi 
          (Nama, NIP, JabatanId, EventDate, KegiatanId, Lokasi, Kendala, CreatedBy, StatusId, CreateDate)
          VALUES (@nama, @nip, @jabatanId, @eventDate, @kegiatanId, @lokasi, @kendala, @createdBy, @statusId, GETDATE());
          
          SELECT SCOPE_IDENTITY() as LaporanTeknisiId;
        `);
      
      const laporanTeknisiId = laporanResult.recordset[0].LaporanTeknisiId;
      
      // Insert pre-production data
      if (laporanData.preProduction.length > 0) {
        for (const item of laporanData.preProduction) {
          await transaction.request()
            .input('laporanTeknisiId', sql.Int, laporanTeknisiId)
            .input('id', sql.Int, item.Id)
            .input('kegiatan', sql.NVarChar, item.Kegiatan)
            .input('check', sql.Bit, item.Check)
            .input('keterangan', sql.NVarChar, item.Keterangan)
            .query(`
              INSERT INTO Teknik_TVRI.dbo.PreProduction 
              (LaporanTeknisiId, Id, Kegiatan, [Check], Keterangan)
              VALUES (@laporanTeknisiId, @id, @kegiatan, @check, @keterangan)
            `); 
        }
      }
      
      // Insert production data
      if (laporanData.production.length > 0) {
        for (const item of laporanData.production) {
          await transaction.request()
            .input('laporanTeknisiId', sql.Int, laporanTeknisiId)
            .input('id', sql.Int, item.Id)
            .input('kegiatan', sql.NVarChar, item.Kegiatan)
            .input('check', sql.Bit, item.Check)
            .input('keterangan', sql.NVarChar, item.Keterangan)
            .query(`
              INSERT INTO Teknik_TVRI.dbo.Production 
              (LaporanTeknisiId, Id, Kegiatan, [Check], Keterangan)
              VALUES (@laporanTeknisiId, @id, @kegiatan, @check, @keterangan)
            `); 
        }
      }
      
      // Insert post-production data
      if (laporanData.postProduction.length > 0) {
        for (const item of laporanData.postProduction) {
          await transaction.request()
            .input('laporanTeknisiId', sql.Int, laporanTeknisiId)
            .input('id', sql.Int, item.Id)
            .input('kegiatan', sql.NVarChar, item.Kegiatan)
            .input('check', sql.Bit, item.Check)
            .input('keterangan', sql.NVarChar, item.Keterangan)
            .query(`
              INSERT INTO Teknik_TVRI.dbo.PostProduction 
              (LaporanTeknisiId, Id, Kegiatan, [Check], Keterangan)
              VALUES (@laporanTeknisiId, @id, @kegiatan, @check, @keterangan)
            `); 
        }
      }
      
      await transaction.commit();
      
      return NextResponse.json({
        success: true,
        message: 'Laporan Technical Director berhasil disimpan',
        laporanId: laporanTeknisiId,
        data: laporanData,
        redirect: '/dashboard/teknisi'
      });
      
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }
    
  } catch (error) {
    console.error('Error saving laporan technical director:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan laporan technical director: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}
