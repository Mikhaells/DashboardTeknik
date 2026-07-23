import { NextRequest, NextResponse } from 'next/server';
import { executeQuerySingle } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract form data
    const {
      // A. IDENTITAS LAPORAN
      Date: tanggal,
      Start: waktuMulai,
      Stop: waktuSelesai,
      KegiatanId: namaProgram,
      JenisKegiatanId: jenisProduksi,
      Location: lokasi,
      TechnicalDirector: technicalDirector,
      ShiftId: shift,
      
      // B. RINGKASAN KEGIATAN
      Ringkasan: ringkasan,
      
      // F. TINDAKAN & KOORDINASI
      TindakanKoordinasi: tindakan,
      
      // G. CATATAN KHUSUS / REKOMENDASI
      CatatanKhusus: catatan,
      
      // Dynamic tables
      peralatan,
      gangguan,
      
      // Status (1 = Simpan, 2 = Ajukan)
      StatusId: statusId,
      
      // User info
      CreateBy: createBy
    } = body;

    // Extract kondisi siaran data from form body
    const {
      video_quality = 'Normal',
      video_ket = '',
      audio_quality = 'Normal',
      audio_ket = '',
      sinkron = 'Normal',
      sinkron_ket = '',
      stabilitas = 'Normal',
      stabilitas_ket = '',
      gangguan_siaran = 'Normal',
      gangguan_siaran_ket = ''
    } = body;

    // 1. Insert main laporan and get LaporanId
    const insertLaporanQuery = `
      INSERT INTO LaporanHarian 
      (Date, Start, Stop, KegiatanId, JenisKegiatanId, Location, TechnicalDirector, ShiftId, Ringkasan, TindakanKoordinasi, CatatanKhusus, StatusId, CreateBy, CreatedDate)
      VALUES 
      (@Date, @Start, @Stop, @KegiatanId, @JenisKegiatanId, @Location, @TechnicalDirector, @ShiftId, @Ringkasan, @TindakanKoordinasi, @CatatanKhusus, @StatusId, @CreateBy, GETDATE());
      SELECT SCOPE_IDENTITY() as LaporanId;
    `;

    const laporanResult = await executeQuerySingle<any>(insertLaporanQuery, {
      Date: tanggal,
      Start: waktuMulai,
      Stop: waktuSelesai,
      KegiatanId: namaProgram,
      JenisKegiatanId: jenisProduksi,
      Location: lokasi,
      TechnicalDirector: technicalDirector,
      ShiftId: shift,
      Ringkasan: ringkasan,
      TindakanKoordinasi: tindakan,
      CatatanKhusus: catatan,
      StatusId: statusId,
      CreateBy: createBy
    });

    const laporanId = laporanResult.LaporanId;

    // 2. Insert peralatan (async) - skip if Peralatan is empty or null
    let peralatanIdCounter = 1;
    const peralatanPromises = peralatan
      .filter((item: any) => item.nama && item.nama.trim() !== '')
      .map((item: any) => {
        const query = `
          INSERT INTO LaporanPeralatan 
          (Id, LaporanId, Peralatan, Condition, [Desc])
          VALUES 
          (@Id, @LaporanId, @Peralatan, @Condition, @Desc)
        `;
        
        return executeQuerySingle(query, {
          Id: peralatanIdCounter++, // Manual ID generation
          LaporanId: laporanId,
          Peralatan: item.nama,
          Condition: item.kondisi || '',
          Desc: item.keterangan || ''
        });
      });

    // 3. Insert kondisi siaran (async)
    let kondisiSiaranIdCounter = 1;
    const kondisiSiaranPromises = [
      // Kualitas Video
      executeQuerySingle(`
        INSERT INTO KondisiSiaran 
        (Id, LaporanId, Aspek, Status, [Desc])
        VALUES 
        (@Id, @LaporanId, @Aspek, @Status, @Desc)
      `, {
        Id: kondisiSiaranIdCounter++, // Manual ID generation
        LaporanId: laporanId,
        Aspek: 'Kualitas Video',
        Status: video_quality,
        Desc: video_ket
      }),
      
      // Kualitas Audio
      executeQuerySingle(`
        INSERT INTO KondisiSiaran 
        (Id, LaporanId, Aspek, Status, [Desc])
        VALUES 
        (@Id, @LaporanId, @Aspek, @Status, @Desc)
      `, {
        Id: kondisiSiaranIdCounter++, // Manual ID generation
        LaporanId: laporanId,
        Aspek: 'Kualitas Audio',
        Status: audio_quality,
        Desc: audio_ket
      }),
      
      // Sinkron Audio-Video
      executeQuerySingle(`
        INSERT INTO KondisiSiaran 
        (Id, LaporanId, Aspek, Status, [Desc])
        VALUES 
        (@Id, @LaporanId, @Aspek, @Status, @Desc)
      `, {
        Id: kondisiSiaranIdCounter++, // Manual ID generation
        LaporanId: laporanId,
        Aspek: 'Sinkron Audio-Video',
        Status: sinkron,
        Desc: sinkron_ket
      }),
      
      // Stabilitas Sistem
      executeQuerySingle(`
        INSERT INTO KondisiSiaran 
        (Id, LaporanId, Aspek, Status, [Desc])
        VALUES 
        (@Id, @LaporanId, @Aspek, @Status, @Desc)
      `, {
        Id: kondisiSiaranIdCounter++, // Manual ID generation
        LaporanId: laporanId,
        Aspek: 'Stabilitas Sistem',
        Status: stabilitas,
        Desc: stabilitas_ket
      }),
      
      // Gangguan Siaran
      executeQuerySingle(`
        INSERT INTO KondisiSiaran 
        (Id, LaporanId, Aspek, Status, [Desc])
        VALUES 
        (@Id, @LaporanId, @Aspek, @Status, @Desc)
      `, {
        Id: kondisiSiaranIdCounter++, // Manual ID generation
        LaporanId: laporanId,
        Aspek: 'Gangguan Siaran',
        Status: gangguan_siaran,
        Desc: gangguan_siaran_ket
      })
    ];

    // 4. Insert gangguan teknis (async) - skip if Peralatan is empty or null
    let gangguanTeknisIdCounter = 1;
    const gangguanPromises = gangguan
      .filter((item: any) => item.peralatan && item.peralatan.trim() !== '')
      .map((item: any) => {
        const query = `
          INSERT INTO GangguanTeknis 
          (Id, LaporanId, Time, Peralatan, JenisGanguan, TindakanPerbaikan, Status)
          VALUES 
          (@Id, @LaporanId, @Time, @Peralatan, @JenisGanguan, @TindakanPerbaikan, @Status)
        `;
        
        return executeQuerySingle(query, {
          Id: gangguanTeknisIdCounter++, // Manual ID generation
          LaporanId: laporanId,
          Time: item.waktu || '',
          Peralatan: item.peralatan,
          JenisGanguan: item.jenis || '',
          TindakanPerbaikan: item.tindakan || '',
          Status: item.status || ''
        });
      });

    // Execute all async operations
    await Promise.all([
      Promise.all(peralatanPromises),
      Promise.all(kondisiSiaranPromises),
      Promise.all(gangguanPromises)
    ]);

    return NextResponse.json({
      success: true,
      message: statusId === 1 ? 'Laporan berhasil disimpan' : 'Laporan berhasil diajukan',
      laporanId: laporanId
    });

  } catch (error) {
    console.error('Error creating laporan:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat menyimpan laporan',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
