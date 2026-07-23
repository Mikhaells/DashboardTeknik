import { NextRequest, NextResponse } from 'next/server';
import { executeQuerySingle } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // Validate required fields
    if (!formData.namaPetugas || !formData.nipId || !formData.jabatan || !formData.tanggal) {
      return NextResponse.json(
        { success: false, message: 'Mohon lengkapi semua field wajib' },
        { status: 400 }
      );
    }

    // 1. Insert main LaporanIT and get LaporanITId
    const insertLaporanITQuery = `
      INSERT INTO Teknik_TVRI.dbo.LaporanIT 
      (Nama, NIP, JabatanId, EventDate, RingkasanKegiatan, 
       IncidentReport, PlannedActivities, Feedback, StatusId, 
       CreateBy, ApprovedBy, CreateDate, ApprovedDate)
      VALUES 
      (@Nama, @NIP, @JabatanId, @EventDate, @RingkasanKegiatan, 
       @IncidentReport, @PlannedActivities, @Feedback, @StatusId, 
       @CreateBy, @ApprovedBy, @CreateDate, @ApprovedDate);
      SELECT SCOPE_IDENTITY() as LaporanITId;
    `;

    const laporanITResult = await executeQuerySingle<any>(insertLaporanITQuery, {
      Nama: formData.namaPetugas,
      NIP: formData.nipId,
      JabatanId: parseInt(formData.jabatan),
      EventDate: formData.tanggal,
      RingkasanKegiatan: formData.ringkasan || '',
      IncidentReport: formData.incident || '',
      PlannedActivities: formData.planned || '',
      Feedback: '', // Default kosong
      StatusId: 1, // Draft
      CreateBy: formData.namaPetugas,
      ApprovedBy: null,
      CreateDate: new Date(),
      ApprovedDate: null
    });

    const laporanITId = laporanITResult.LaporanITId;

    // 2. Insert MonitoringSistemInfrastruktur (async)
    const monitoringPromises = [
      // Server Database
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.MonitoringSistemInfrastruktur 
        (LaporanITId, Id, Sistem, Status, [Desc])
        VALUES 
        (@LaporanITId, @Id, @Sistem, @Status, @Desc)
      `, {
        LaporanITId: laporanITId,
        Id: 1,
        Sistem: 'Server Database',
        Status: formData.server_db_status || '',
        Desc: formData.server_db_ket || ''
      }),
      
      // Server Application
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.MonitoringSistemInfrastruktur 
        (LaporanITId, Id, Sistem, Status, [Desc])
        VALUES 
        (@LaporanITId, @Id, @Sistem, @Status, @Desc)
      `, {
        LaporanITId: laporanITId,
        Id: 2,
        Sistem: 'Server Application',
        Status: formData.server_app_status || '',
        Desc: formData.server_app_ket || ''
      }),
      
      // Network
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.MonitoringSistemInfrastruktur 
        (LaporanITId, Id, Sistem, Status, [Desc])
        VALUES 
        (@LaporanITId, @Id, @Sistem, @Status, @Desc)
      `, {
        LaporanITId: laporanITId,
        Id: 3,
        Sistem: 'Network',
        Status: formData.network_status || '',
        Desc: formData.network_ket || ''
      }),
      
      // Internet
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.MonitoringSistemInfrastruktur 
        (LaporanITId, Id, Sistem, Status, [Desc])
        VALUES 
        (@LaporanITId, @Id, @Sistem, @Status, @Desc)
      `, {
        LaporanITId: laporanITId,
        Id: 4,
        Sistem: 'Internet',
        Status: formData.internet_status || '',
        Desc: formData.internet_ket || ''
      }),
      
      // Backup System
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.MonitoringSistemInfrastruktur 
        (LaporanITId, Id, Sistem, Status, [Desc])
        VALUES 
        (@LaporanITId, @Id, @Sistem, @Status, @Desc)
      `, {
        LaporanITId: laporanITId,
        Id: 5,
        Sistem: 'Backup System',
        Status: formData.backup_status || '',
        Desc: formData.backup_ket || ''
      }),
      
      // Security System
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.MonitoringSistemInfrastruktur 
        (LaporanITId, Id, Sistem, Status, [Desc])
        VALUES 
        (@LaporanITId, @Id, @Sistem, @Status, @Desc)
      `, {
        LaporanITId: laporanITId,
        Id: 6,
        Sistem: 'Security System',
        Status: formData.security_status || '',
        Desc: formData.security_ket || ''
      })
    ];

    // 3. Insert MaintenanceSistemUpdate (async)
    const maintenancePromises = [
      // System Patch Update
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.MaintenanceSistemUpdate 
        (LaporanITId, Id, KegiatanMaintenance, Waktu, Hasil, [Desc])
        VALUES 
        (@LaporanITId, @Id, @KegiatanMaintenance, @Waktu, @Hasil, @Desc)
      `, {
        LaporanITId: laporanITId,
        Id: 1,
        KegiatanMaintenance: 'System Patch Update',
        Waktu: formData.patch_waktu || '',
        Hasil: formData.patch_hasil || '',
        Desc: formData.patch_ket || ''
      }),
      
      // Database Maintenance
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.MaintenanceSistemUpdate 
        (LaporanITId, Id, KegiatanMaintenance, Waktu, Hasil, [Desc])
        VALUES 
        (@LaporanITId, @Id, @KegiatanMaintenance, @Waktu, @Hasil, @Desc)
      `, {
        LaporanITId: laporanITId,
        Id: 2,
        KegiatanMaintenance: 'Database Maintenance',
        Waktu: formData.db_maint_waktu || '',
        Hasil: formData.db_maint_hasil || '',
        Desc: formData.db_maint_ket || ''
      }),
      
      // Network Maintenance
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.MaintenanceSistemUpdate 
        (LaporanITId, Id, KegiatanMaintenance, Waktu, Hasil, [Desc])
        VALUES 
        (@LaporanITId, @Id, @KegiatanMaintenance, @Waktu, @Hasil, @Desc)
      `, {
        LaporanITId: laporanITId,
        Id: 3,
        KegiatanMaintenance: 'Network Maintenance',
        Waktu: formData.net_maint_waktu || '',
        Hasil: formData.net_maint_hasil || '',
        Desc: formData.net_maint_ket || ''
      }),
      
      // Hardware Maintenance
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.MaintenanceSistemUpdate 
        (LaporanITId, Id, KegiatanMaintenance, Waktu, Hasil, [Desc])
        VALUES 
        (@LaporanITId, @Id, @KegiatanMaintenance, @Waktu, @Hasil, @Desc)
      `, {
        LaporanITId: laporanITId,
        Id: 4,
        KegiatanMaintenance: 'Hardware Maintenance',
        Waktu: formData.hw_waktu || '',
        Hasil: formData.hw_hasil || '',
        Desc: formData.hw_ket || ''
      })
    ];

    // 4. Insert SecurityAuditMonitoring (async)
    const securityPromises = [
      // Firewall Log Monitoring
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.SecurityAuditMonitoring 
        (LaporanITId, Id, SecurityCheck, Status, Findings, ActionTaken)
        VALUES 
        (@LaporanITId, @Id, @SecurityCheck, @Status, @Findings, @ActionTaken)
      `, {
        LaporanITId: laporanITId,
        Id: 1,
        SecurityCheck: 'Firewall Log Monitoring',
        Status: formData.fw_log_status || '',
        Findings: formData.fw_log_findings || '',
        ActionTaken: formData.fw_log_action || ''
      }),
      
      // Antivirus Monitoring
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.SecurityAuditMonitoring 
        (LaporanITId, Id, SecurityCheck, Status, Findings, ActionTaken)
        VALUES 
        (@LaporanITId, @Id, @SecurityCheck, @Status, @Findings, @ActionTaken)
      `, {
        LaporanITId: laporanITId,
        Id: 2,
        SecurityCheck: 'Antivirus Monitoring',
        Status: formData.av_status || '',
        Findings: formData.av_findings || '',
        ActionTaken: formData.av_action || ''
      }),
      
      // User Access Monitoring
      executeQuerySingle(`
        INSERT INTO Teknik_TVRI.dbo.SecurityAuditMonitoring 
        (LaporanITId, Id, SecurityCheck, Status, Findings, ActionTaken)
        VALUES 
        (@LaporanITId, @Id, @SecurityCheck, @Status, @Findings, @ActionTaken)
      `, {
        LaporanITId: laporanITId,
        Id: 3,
        SecurityCheck: 'User Access Monitoring',
        Status: formData.user_access_status || '',
        Findings: formData.user_access_findings || '',
        ActionTaken: formData.user_access_action || ''
      })
    ];

    // Execute all async operations in parallel
    await Promise.all([
      Promise.all(monitoringPromises),
      Promise.all(maintenancePromises),
      Promise.all(securityPromises)
    ]);

    return NextResponse.json({
      success: true,
      message: 'Laporan IT berhasil disimpan',
      data: {
        laporanITId: laporanITId,
        totalMonitoring: 6,
        totalMaintenance: 4,
        totalSecurity: 3
      }
    });

  } catch (error) {
    console.error('Error creating laporan IT:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat menyimpan laporan IT',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
