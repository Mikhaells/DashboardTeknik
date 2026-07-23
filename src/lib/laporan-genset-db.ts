import * as sql from 'mssql';

// Database connection configuration
const config = {
  user: process.env.DB_USER || 'your_username',
  password: process.env.DB_PASSWORD || 'your_password',
  server: process.env.DB_SERVER || 'localhost',
  database: 'Teknik_TVRI',
  options: {
    encrypt: false, // For development
    trustServerCertificate: true, // For development
  },
};

// Interface for checklist item
interface ChecklistItem {
  Tindakan: string;
  Check: boolean;
}

// Interface for laporan data
interface LaporanData {
  TanggalPemeriksaan: string;
  JamOperasi: string;
  Operator: string;
  CatatandanTemuan: string;
  PemeriksaanGenset_SistemMesin?: ChecklistItem[];
  PemeriksaanGenset_SistemPendingin?: ChecklistItem[];
  PemeriksaanGenset_SistemBahanBakar?: ChecklistItem[];
  PemeriksaanGenset_SistemKelistrikan?: ChecklistItem[];
  PemeriksaanGenset_OutputListrik?: ChecklistItem[];
  PemeriksaanGenset_Mingguan?: ChecklistItem[];
  PemeriksaanGenset_Bulanan?: ChecklistItem[];
  PemeriksaanGenset_SistemKontrol_Proteksi?: ChecklistItem[];
  PemeriksaanGenset_ATS_AMF?: ChecklistItem[];
  PemeriksaanGenset_Kebersihan_Keamanan?: ChecklistItem[];
}

// Function to insert main laporan data
export async function insertLaporanPemeriksaanGenset(data: LaporanData) {
  const pool = new sql.ConnectionPool(config);
  await pool.connect();

  const transaction = pool.transaction();
  await transaction.begin();

  try {
    // 1. Insert main laporan data
    const insertLaporanQuery = `
      INSERT INTO [dbo].[LaporanPemeriksaanGenset]
         ([TanggalPemeriksaan]
         ,[JamOperasi]
         ,[Operator]
         ,[CatatandanTemuan]
         ,[CreatedBy]
         ,[CreatedDate]
         ,[ApprovedBy]
         ,[ApprovedDate]
         ,[StatusLaporanId])
   VALUES
         (@TanggalPemeriksaan, @JamOperasi, @Operator, @CatatandanTemuan, 
          @CreatedBy, GETDATE(), NULL, NULL, 1);
      
      SELECT SCOPE_IDENTITY() AS LaporanGensetId;
    `;

    const laporanResult = await transaction.request()
      .input('TanggalPemeriksaan', data.TanggalPemeriksaan)
      .input('JamOperasi', data.JamOperasi)
      .input('Operator', data.Operator)
      .input('CatatandanTemuan', data.CatatandanTemuan)
      .input('CreatedBy', data.Operator) // Using operator as created by
      .query(insertLaporanQuery);

    const LaporanGensetId = laporanResult.recordset[0].LaporanGensetId;

    // 2. Insert checklist data for each section
    const insertChecklistData = async (tableName: string, checklistData?: ChecklistItem[]) => {
      if (!checklistData || checklistData.length === 0) return;

      const insertQuery = `
        INSERT INTO [dbo].[${tableName}]
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
    await insertChecklistData('PemeriksaanGenset_SistemMesin', data.PemeriksaanGenset_SistemMesin);
    await insertChecklistData('PemeriksaanGenset_SistemPendingin', data.PemeriksaanGenset_SistemPendingin);
    await insertChecklistData('PemeriksaanGenset_SistemBahanBakar', data.PemeriksaanGenset_SistemBahanBakar);
    await insertChecklistData('PemeriksaanGenset_SistemKelistrikan', data.PemeriksaanGenset_SistemKelistrikan);
    await insertChecklistData('PemeriksaanGenset_OutputListrik', data.PemeriksaanGenset_OutputListrik);
    await insertChecklistData('PemeriksaanGenset_Mingguan', data.PemeriksaanGenset_Mingguan);
    await insertChecklistData('PemeriksaanGenset_Bulanan', data.PemeriksaanGenset_Bulanan);
    await insertChecklistData('PemeriksaanGenset_SistemKontrol_Proteksi', data.PemeriksaanGenset_SistemKontrol_Proteksi);
    await insertChecklistData('PemeriksaanGenset_ATS_AMF', data.PemeriksaanGenset_ATS_AMF);
    await insertChecklistData('PemeriksaanGenset_Kebersihan_Keamanan', data.PemeriksaanGenset_Kebersihan_Keamanan);

    // Commit transaction
    await transaction.commit();

    // Close connection
    await pool.close();

    return {
      success: true,
      message: 'Laporan genset berhasil ditambahkan',
      data: {
        LaporanGensetId,
        TanggalPemeriksaan: data.TanggalPemeriksaan,
        Operator: data.Operator
      }
    };

  } catch (error) {
    // Rollback transaction if any error occurs
    await transaction.rollback();
    await pool.close();
    throw error;
  }
}

// Function to validate required fields
export function validateLaporanData(data: LaporanData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.TanggalPemeriksaan) {
    errors.push('Tanggal pemeriksaan wajib diisi');
  }

  if (!data.JamOperasi) {
    errors.push('Jam operasi wajib diisi');
  }

  if (!data.Operator || data.Operator.trim() === '') {
    errors.push('Operator wajib diisi');
  }

  if (!data.CatatandanTemuan || data.CatatandanTemuan.trim() === '') {
    errors.push('Catatan dan temuan wajib diisi');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
