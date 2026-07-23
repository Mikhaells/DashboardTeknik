import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQuerySingle } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: laporanId } = await params;

    if (!laporanId || isNaN(Number(laporanId))) {
      return NextResponse.json(
        { success: false, message: 'Invalid laporan ID' },
        { status: 400 }
      );
    }

    // Query main laporan data with joins
    const query = `
      SELECT 
        LH.Id,
        LH.Date,
        LH.Start,
        LH.Stop,
        LH.KegiatanId,
        LH.JenisKegiatanId,
        LH.Location,
        LH.TechnicalDirector,
        LH.ShiftId,
        LH.Ringkasan,
        LH.TindakanKoordinasi,
        LH.CatatanKhusus,
        LH.StatusId,
        LH.Feedback,
        LH.CreateBy,
        LH.ApproveBy,
        LH.CreatedDate,
        LH.ApproveDate,
        K.Id as Kegiatan_Id,
        K.Kegiatan,
        K.[Desc] as Kegiatan_Desc,
        JK.Id as JenisKegiatan_Id,
        JK.Jenis,
        JK.[Desc] as JenisKegiatan_Desc,
        SK.Id as ShiftKerja_Id,
        SK.Shift,
        SK.[Desc] as ShiftKerja_Desc
      FROM Teknik_TVRI.dbo.LaporanHarian LH
      INNER JOIN Teknik_TVRI.dbo.Kegiatan K ON K.Id = LH.KegiatanId
      INNER JOIN Teknik_TVRI.dbo.JenisKegiatan JK ON JK.Id = LH.JenisKegiatanId
      INNER JOIN Teknik_TVRI.dbo.ShiftKerja SK ON SK.Id = LH.ShiftId
      WHERE LH.Id = @LaporanId
    `;

    const result = await executeQuerySingle<any>(query, { LaporanId: Number(laporanId) });

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Laporan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching laporan detail:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data laporan'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: laporanId } = await params;
    const formData = await request.json();

    if (!laporanId || isNaN(Number(laporanId))) {
      return NextResponse.json(
        { success: false, message: 'Invalid laporan ID' },
        { status: 400 }
      );
    }

    // Start transaction
    const updateMainQuery = `
      UPDATE Teknik_TVRI.dbo.LaporanHarian
      SET 
        [Date] = @Date,
        [Start] = @Start,
        [Stop] = @Stop,
        KegiatanId = @KegiatanId,
        JenisKegiatanId = @JenisKegiatanId,
        Location = @Location,
        TechnicalDirector = @TechnicalDirector,
        ShiftId = @ShiftId,
        Ringkasan = @Ringkasan,
        TindakanKoordinasi = @TindakanKoordinasi,
        CatatanKhusus = @CatatanKhusus,
        StatusId = @StatusId,  -- Set based on user action (Draft=1 or Pending=2)
        ApproveBy = NULL,  -- Clear previous approval/rejection
        ApproveDate = NULL,  -- Clear previous approval/rejection date
        Feedback = NULL  -- Clear previous feedback
      WHERE Id = @LaporanId
    `;

    await executeQuery(updateMainQuery, {
      LaporanId: Number(laporanId),
      Date: formData.tanggal,
      Start: formData.waktuMulai,
      Stop: formData.waktuSelesai,
      KegiatanId: parseInt(formData.namaProgram),
      JenisKegiatanId: parseInt(formData.jenisProduksi),
      Location: formData.lokasi,
      TechnicalDirector: formData.technicalDirector,
      ShiftId: parseInt(formData.shift),
      Ringkasan: formData.ringkasan,
      TindakanKoordinasi: formData.tindakan,
      CatatanKhusus: formData.catatan,
      StatusId: formData.statusId || 2  // Default to Pending if not specified
    });

    // Update peralatan data
    if (formData.peralatan && formData.peralatan.length > 0) {
      // Delete existing peralatan
      await executeQuery(
        'DELETE FROM Teknik_TVRI.dbo.LaporanPeralatan WHERE LaporanId = @LaporanId',
        { LaporanId: Number(laporanId) }
      );

      // Insert new peralatan with manual ID generation
      let peralatanIdCounter = 1;
      for (const item of formData.peralatan) {
        if (item.nama) { // Only insert if nama is not empty
          await executeQuery(
            `INSERT INTO Teknik_TVRI.dbo.LaporanPeralatan 
             (Id, LaporanId, Peralatan, [Condition], [Desc]) 
             VALUES (@Id, @LaporanId, @Peralatan, @Condition, @Desc)`,
            {
              Id: peralatanIdCounter++, // Manual ID generation
              LaporanId: Number(laporanId),
              Peralatan: item.nama,
              Condition: item.kondisi,
              Desc: item.keterangan
            }
          );
        }
      }
    }

    // Update gangguan teknis data
    if (formData.gangguan && formData.gangguan.length > 0) {
      // Delete existing gangguan
      await executeQuery(
        'DELETE FROM Teknik_TVRI.dbo.GangguanTeknis WHERE LaporanId = @LaporanId',
        { LaporanId: Number(laporanId) }
      );

      // Insert new gangguan with manual ID generation
      let gangguanTeknisIdCounter = 1;
      for (const item of formData.gangguan) {
        if (item.waktu && item.peralatan) { // Only insert if required fields are not empty
          await executeQuery(
            `INSERT INTO Teknik_TVRI.dbo.GangguanTeknis 
             (Id, LaporanId, Time, Peralatan, JenisGanguan, TindakanPerbaikan, Status) 
             VALUES (@Id, @LaporanId, @Time, @Peralatan, @JenisGanguan, @TindakanPerbaikan, @Status)`,
            {
              Id: gangguanTeknisIdCounter++, // Manual ID generation
              LaporanId: Number(laporanId),
              Time: item.waktu,
              Peralatan: item.peralatan,
              JenisGanguan: item.jenis,
              TindakanPerbaikan: item.tindakan,
              Status: item.status
            }
          );
        }
      }
    }

    // Update kondisi siaran data
    const kondisiSiaranData = [
      { Aspek: 'Kualitas Video', Status: formData.video_quality, Desc: formData.video_ket },
      { Aspek: 'Kualitas Audio', Status: formData.audio_quality, Desc: formData.audio_ket },
      { Aspek: 'Sinkron Audio-Video', Status: formData.sinkron, Desc: formData.sinkron_ket },
      { Aspek: 'Stabilitas Sistem', Status: formData.stabilitas, Desc: formData.stabilitas_ket },
      { Aspek: 'Gangguan Siaran', Status: formData.gangguan_siaran, Desc: formData.gangguan_ket }
    ];

    // Delete existing kondisi siaran
    await executeQuery(
      'DELETE FROM Teknik_TVRI.dbo.KondisiSiaran WHERE LaporanId = @LaporanId',
      { LaporanId: Number(laporanId) }
    );

    // Insert new kondisi siaran with manual ID generation
    let kondisiSiaranIdCounter = 1;
    for (const item of kondisiSiaranData) {
      if (item.Status) { // Only insert if status is not empty
        await executeQuery(
          `INSERT INTO Teknik_TVRI.dbo.KondisiSiaran 
           (Id, LaporanId, Aspek, Status, [Desc]) 
           VALUES (@Id, @LaporanId, @Aspek, @Status, @Desc)`,
          {
            Id: kondisiSiaranIdCounter++, // Manual ID generation
            LaporanId: Number(laporanId),
            Aspek: item.Aspek,
            Status: item.Status,
            Desc: item.Desc
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan berhasil diperbarui'
    });

  } catch (error) {
    console.error('Error updating laporan:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat memperbarui laporan'
      },
      { status: 500 }
    );
  }
}
