import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getDbPool, executeQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { LaporanData, ChecklistItem, LaporanTeknisi } from '@/types/laporan-teknisi';

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

// GET - Fetch laporan data for edit form
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: laporanId } = await params;
    
    if (!laporanId) {
      return NextResponse.json({
        success: false,
        message: 'ID laporan diperlukan'
      }, { status: 400 });
    }

    // Get main laporan data with joins
    interface LaporanWithJoins extends LaporanTeknisi {
      Jabatan_ID: number;
      Jabatan: string;
      Jabatan_Desc: string;
      Kegiatan_Id: number;
      Kegiatan: string;
      Kegiatan_Desc: string;
      StatusLaporan_Id: number;
      Status: string;
      StatusLaporan_Desc: string;
    }
    
    const laporanResult = await executeQuery<LaporanWithJoins>(
      `SELECT 
        lt.Id,
        lt.Nama,
        lt.NIP,
        lt.JabatanId,
        lt.EventDate,
        lt.KegiatanId,
        lt.Lokasi,
        lt.Kendala,
        lt.Path,
        lt.CreatedBy,
        lt.CreateDate,
        lt.StatusId,
        lt.ApprovedBy,
        lt.ApprovedDate,
        j.ID as Jabatan_ID,
        j.Jabatan,
        j.[Desc] as Jabatan_Desc,
        k.Id as Kegiatan_Id,
        k.Kegiatan,
        k.[Desc] as Kegiatan_Desc,
        s.Id as StatusLaporan_Id,
        s.Status,
        s.[Desc] as StatusLaporan_Desc
      FROM Teknik_TVRI.dbo.laporanTeknisi lt
      LEFT JOIN Teknik_TVRI.dbo.Jabatan j ON lt.JabatanId = j.ID
      LEFT JOIN Teknik_TVRI.dbo.Kegiatan k ON lt.KegiatanId = k.Id
      LEFT JOIN Teknik_TVRI.dbo.StatusLaporan s ON lt.StatusId = s.Id
      WHERE lt.Id = @laporanTeknisiId`,
      { laporanTeknisiId: parseInt(laporanId) }
    );

    if (laporanResult.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Laporan tidak ditemukan'
      }, { status: 404 });
    }

    const laporanData = laporanResult[0];

    // Get PreProduction data
    const preProductionResult = await executeQuery<ChecklistItem>(
      `SELECT LaporanTeknisiId, Id, Kegiatan, [Check], Keterangan 
      FROM Teknik_TVRI.dbo.PreProduction 
      WHERE LaporanTeknisiId = @laporanTeknisiId`,
      { laporanTeknisiId: parseInt(laporanId) }
    );

    // Get Production data
    const productionResult = await executeQuery<ChecklistItem>(
      `SELECT LaporanTeknisiId, Id, Kegiatan, [Check], Keterangan 
      FROM Teknik_TVRI.dbo.Production 
      WHERE LaporanTeknisiId = @laporanTeknisiId`,
      { laporanTeknisiId: parseInt(laporanId) }
    );

    // Get PostProduction data
    const postProductionResult = await executeQuery<ChecklistItem>(
      `SELECT LaporanTeknisiId, Id, Kegiatan, [Check], Keterangan 
      FROM Teknik_TVRI.dbo.PostProduction 
      WHERE LaporanTeknisiId = @laporanTeknisiId`,
      { laporanTeknisiId: parseInt(laporanId) }
    );

    // Get all jabatan options
    const jabatanResult = await executeQuery<{ID: number; Jabatan: string}>(
      `SELECT ID, Jabatan FROM Teknik_TVRI.dbo.Jabatan ORDER BY Jabatan`
    );

    // Get all status options
    const statusResult = await executeQuery<{Id: number; Status: string; Desc: string}>(
      `SELECT Id, Status, [Desc] FROM Teknik_TVRI.dbo.StatusLaporan ORDER BY Status`
    );

    // Get all kegiatan options
    const kegiatanResult = await executeQuery<{Id: number; Kegiatan: string}>(
      `SELECT Id, Kegiatan FROM Teknik_TVRI.dbo.Kegiatan ORDER BY Kegiatan`
    );

    // Get all checklist items for each category
    const preProductionItems = await executeQuery<{Kegiatan: string}>(
      `SELECT Kegiatan FROM Teknik_TVRI.dbo.PreProduction`
    );

    const productionItems = await executeQuery<{Kegiatan: string}>(
      `SELECT Kegiatan FROM Teknik_TVRI.dbo.Production`
    );

    const postProductionItems = await executeQuery<{Kegiatan: string}>(
      `SELECT Kegiatan FROM Teknik_TVRI.dbo.PostProduction`
    );

    return NextResponse.json({
      success: true,
      data: {
        laporan: laporanData,
        preProduction: preProductionResult,
        production: productionResult,
        postProduction: postProductionResult,
        jabatanOptions: jabatanResult,
        kegiatanOptions: kegiatanResult,
        statusOptions: statusResult,
        preProductionItems: preProductionItems,
        productionItems: productionItems,
        postProductionItems: postProductionItems
      }
    });
    
  } catch (error) {
    console.error('Error fetching laporan data:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat memuat data laporan'
    }, { status: 500 });
  }
}

// PUT - Update laporan data
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id: laporanId } = await params;
    
        
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

    // Prepare laporan data
    const laporanData: LaporanData = {
      nama: body.namaPetugas,
      nip: body.nipId,
      jabatan: body.jabatan,
      jabatanId: jabatanId,
      tanggal: body.tanggal,
      kegiatan: body.programKegiatan,
      kegiatanId: kegiatanId,
      lokasi: body.lokasi,
      createBy: currentUser,
      preProduction: [],
      production: [],
      postProduction: [],
      catatanTeknis: body.catatanTeknis
    };

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
      
      // Update main laporan table
      await transaction.request()
        .input('id', sql.Int, parseInt(laporanId))
        .input('nama', sql.NVarChar, laporanData.nama)
        .input('nip', sql.NVarChar, laporanData.nip)
        .input('jabatanId', sql.Int, laporanData.jabatanId)
        .input('eventDate', sql.Date, laporanData.tanggal)
        .input('kegiatanId', sql.Int, laporanData.kegiatanId)
        .input('lokasi', sql.NVarChar, laporanData.lokasi)
        .input('kendala', sql.NVarChar, laporanData.catatanTeknis)
        .input('createdBy', sql.NVarChar, laporanData.createBy)
        .input('statusId', sql.Int, body.statusId || 2)
        .query(`
          UPDATE Teknik_TVRI.dbo.laporanTeknisi 
          SET Nama = @nama, NIP = @nip, JabatanId = @jabatanId, EventDate = @eventDate, 
              KegiatanId = @kegiatanId, Lokasi = @lokasi, Kendala = @kendala, 
              CreatedBy = @createdBy, StatusId = @statusId, CreateDate = GETDATE()
          WHERE Id = @id
        `);

      // Delete existing checklist items
      await transaction.request()
        .input('laporanTeknisiId', sql.Int, parseInt(laporanId))
        .query('DELETE FROM Teknik_TVRI.dbo.PreProduction WHERE LaporanTeknisiId = @laporanTeknisiId');

      await transaction.request()
        .input('laporanTeknisiId', sql.Int, parseInt(laporanId))
        .query('DELETE FROM Teknik_TVRI.dbo.Production WHERE LaporanTeknisiId = @laporanTeknisiId');

      await transaction.request()
        .input('laporanTeknisiId', sql.Int, parseInt(laporanId))
        .query('DELETE FROM Teknik_TVRI.dbo.PostProduction WHERE LaporanTeknisiId = @laporanTeknisiId');

      // Insert updated PreProduction checklist items
      for (let i = 0; i < 13; i++) {
        const checkKey = `prep_${i}_check`;
        const ketKey = `prep_${i}_ket`;
        const kegiatanKey = `prep_${i}_kegiatan`;
        
        if (body[checkKey] !== undefined || body[ketKey] || body[kegiatanKey]) {
          await transaction.request()
            .input('laporanTeknisiId', sql.Int, parseInt(laporanId))
            .input('id', sql.Int, i + 1)
            .input('kegiatan', sql.NVarChar, body[kegiatanKey] || `Pre Production Item ${i + 1}`)
            .input('check', sql.Bit, body[checkKey] || false)
            .input('keterangan', sql.NVarChar, body[ketKey] || null)
            .query(`
              INSERT INTO Teknik_TVRI.dbo.PreProduction 
              (LaporanTeknisiId, Id, Kegiatan, [Check], Keterangan)
              VALUES (@laporanTeknisiId, @id, @kegiatan, @check, @keterangan)
            `); 
        }
      }

      // Insert updated Production checklist items
      for (let i = 0; i < 10; i++) {
        const checkKey = `prod_${i}_check`;
        const ketKey = `prod_${i}_ket`;
        const kegiatanKey = `prod_${i}_kegiatan`;
        
        if (body[checkKey] !== undefined || body[ketKey] || body[kegiatanKey]) {
          await transaction.request()
            .input('laporanTeknisiId', sql.Int, parseInt(laporanId))
            .input('id', sql.Int, i + 1)
            .input('kegiatan', sql.NVarChar, body[kegiatanKey] || `Production Item ${i + 1}`)
            .input('check', sql.Bit, body[checkKey] || false)
            .input('keterangan', sql.NVarChar, body[ketKey] || null)
            .query(`
              INSERT INTO Teknik_TVRI.dbo.Production 
              (LaporanTeknisiId, Id, Kegiatan, [Check], Keterangan)
              VALUES (@laporanTeknisiId, @id, @kegiatan, @check, @keterangan)
            `); 
        }
      }

      // Insert updated PostProduction checklist items
      for (let i = 0; i < 8; i++) {
        const checkKey = `post_${i}_check`;
        const ketKey = `post_${i}_ket`;
        const kegiatanKey = `post_${i}_kegiatan`;
        
        if (body[checkKey] !== undefined || body[ketKey] || body[kegiatanKey]) {
          await transaction.request()
            .input('laporanTeknisiId', sql.Int, parseInt(laporanId))
            .input('id', sql.Int, i + 1)
            .input('kegiatan', sql.NVarChar, body[kegiatanKey] || `Post Production Item ${i + 1}`)
            .input('check', sql.Bit, body[checkKey] || false)
            .input('keterangan', sql.NVarChar, body[ketKey] || null)
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
        message: 'Laporan Technical Director berhasil diperbarui',
        laporanId: parseInt(laporanId),
        data: laporanData,
        redirect: '/dashboard/teknisi'
      });
      
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }
    
  } catch (error) {
    console.error('Error updating laporan technical director:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui laporan technical director: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}
