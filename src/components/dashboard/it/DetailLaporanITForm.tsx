'use client';

import React, { useState, useEffect } from 'react';

interface DetailLaporanITFormProps {
  laporanId: number;
  onClose: () => void;
}

interface LaporanITData {
  // A. IDENTITAS LAPORAN
  tanggal: string;
  namaPetugas: string;
  nipId: string;
  jabatan: string;
  shift: string;
  
  // B. RINGKASAN KEGIATAN HARIAN
  ringkasan: string;
  
  // C. MONITORING SISTEM & INFRASTRUKTUR
  server_db_status: string;
  server_db_ket: string;
  server_app_status: string;
  server_app_ket: string;
  network_status: string;
  network_ket: string;
  internet_status: string;
  internet_ket: string;
  backup_status: string;
  backup_ket: string;
  security_status: string;
  security_ket: string;
  
  // D. MAINTENANCE & SYSTEM UPDATE
  patch_waktu: string;
  patch_hasil: string;
  patch_ket: string;
  db_maint_waktu: string;
  db_maint_hasil: string;
  db_maint_ket: string;
  net_maint_waktu: string;
  net_maint_hasil: string;
  net_maint_ket: string;
  hw_waktu: string;
  hw_hasil: string;
  hw_ket: string;
  
  // E. SECURITY AUDIT & MONITORING
  fw_log_status: string;
  fw_log_findings: string;
  fw_log_action: string;
  av_status: string;
  av_findings: string;
  av_action: string;
  user_access_status: string;
  user_access_findings: string;
  user_access_action: string;
  
  // F. INCIDENT REPORT
  incident: string;
  
  // G. PLANNED ACTIVITIES
  planned: string;
}

export default function DetailLaporanITForm({ laporanId, onClose }: DetailLaporanITFormProps) {
  const [jabatanOptions, setJabatanOptions] = useState<Array<{ID: number, Jabatan: string, Desc: string}>>([]);
  const [shiftOptions, setShiftOptions] = useState<Array<{Id: number, Shift: string, Desc: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingDropdown, setIsLoadingDropdown] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const [laporanData, setLaporanData] = useState<LaporanITData | null>(null);

  // Fetch dropdown options
  useEffect(() => {
    fetchOptions();
  }, []);

  // Fetch laporan data
  useEffect(() => {
    if (laporanId) {
      fetchLaporanData();
    }
  }, [laporanId]);

  const fetchOptions = async () => {
    try {
      setIsLoadingDropdown(true);
      
      // Fetch all dropdown data in parallel
      const [jabatanResponse, shiftKerjaResponse] = await Promise.all([
        fetch('/api/teknisi/jabatan'),
        fetch('/api/dropdown/shift-kerja')
      ]);

      // Parse responses
      const [jabatanData, shiftKerjaData] = await Promise.all([
        jabatanResponse.json(),
        shiftKerjaResponse.json()
      ]);

      // Set dropdown data
      setJabatanOptions(jabatanData.success ? jabatanData.data : []);
      setShiftOptions(shiftKerjaData.success ? shiftKerjaData.data : []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      // Set empty arrays on error to prevent undefined errors
      setJabatanOptions([]);
      setShiftOptions([]);
    } finally {
      setIsLoadingDropdown(false);
    }
  };

  const fetchLaporanData = async () => {
    try {
      setLoading(true);
      
      // Fetch main laporan data
      const laporanResponse = await fetch(`/api/laporan-it/${laporanId}`);
      const laporanResult = await laporanResponse.json();
      
      if (laporanResult.success) {
        const mainData = laporanResult.data;
        
        // Fetch related data
        const [monitoringResponse, maintenanceResponse, securityResponse] = await Promise.all([
          fetch(`/api/laporan-it/${laporanId}/monitoring`),
          fetch(`/api/laporan-it/${laporanId}/maintenance`),
          fetch(`/api/laporan-it/${laporanId}/security`)
        ]);
        
        const [monitoringResult, maintenanceResult, securityResult] = await Promise.all([
          monitoringResponse.json(),
          maintenanceResponse.json(),
          securityResponse.json()
        ]);
        
        // Map monitoring data
        const monitoringData = monitoringResult.success ? monitoringResult.data : [];
        const monitoringMap: any = {};
        monitoringData.forEach((item: any) => {
          switch(item.Sistem) {
            case 'Server Database':
              monitoringMap.server_db_status = item.Status;
              monitoringMap.server_db_ket = item.Desc;
              break;
            case 'Server Application':
              monitoringMap.server_app_status = item.Status;
              monitoringMap.server_app_ket = item.Desc;
              break;
            case 'Network':
              monitoringMap.network_status = item.Status;
              monitoringMap.network_ket = item.Desc;
              break;
            case 'Internet':
              monitoringMap.internet_status = item.Status;
              monitoringMap.internet_ket = item.Desc;
              break;
            case 'Backup System':
              monitoringMap.backup_status = item.Status;
              monitoringMap.backup_ket = item.Desc;
              break;
            case 'Security System':
              monitoringMap.security_status = item.Status;
              monitoringMap.security_ket = item.Desc;
              break;
          }
        });
        
        // Map maintenance data
        const maintenanceData = maintenanceResult.success ? maintenanceResult.data : [];
        const maintenanceMap: any = {};
        maintenanceData.forEach((item: any) => {
          switch(item.KegiatanMaintenance) {
            case 'System Patch Update':
              maintenanceMap.patch_waktu = item.Waktu;
              maintenanceMap.patch_hasil = item.Hasil;
              maintenanceMap.patch_ket = item.Desc;
              break;
            case 'Database Maintenance':
              maintenanceMap.db_maint_waktu = item.Waktu;
              maintenanceMap.db_maint_hasil = item.Hasil;
              maintenanceMap.db_maint_ket = item.Desc;
              break;
            case 'Network Maintenance':
              maintenanceMap.net_maint_waktu = item.Waktu;
              maintenanceMap.net_maint_hasil = item.Hasil;
              maintenanceMap.net_maint_ket = item.Desc;
              break;
            case 'Hardware Maintenance':
              maintenanceMap.hw_waktu = item.Waktu;
              maintenanceMap.hw_hasil = item.Hasil;
              maintenanceMap.hw_ket = item.Desc;
              break;
          }
        });
        
        // Map security data
        const securityData = securityResult.success ? securityResult.data : [];
        const securityMap: any = {};
        securityData.forEach((item: any) => {
          switch(item.SecurityCheck) {
            case 'Firewall Log Monitoring':
              securityMap.fw_log_status = item.Status;
              securityMap.fw_log_findings = item.Findings;
              securityMap.fw_log_action = item.ActionTaken;
              break;
            case 'Antivirus Monitoring':
              securityMap.av_status = item.Status;
              securityMap.av_findings = item.Findings;
              securityMap.av_action = item.ActionTaken;
              break;
            case 'User Access Monitoring':
              securityMap.user_access_status = item.Status;
              securityMap.user_access_findings = item.Findings;
              securityMap.user_access_action = item.ActionTaken;
              break;
          }
        });
        
        // Combine all data
        const combinedData: LaporanITData = {
          // A. IDENTITAS LAPORAN
          tanggal: mainData.EventDate,
          namaPetugas: mainData.Nama,
          nipId: mainData.NIP,
          jabatan: mainData.JabatanId?.toString() || '',
          shift: '', // Tidak ada di database
          
          // B. RINGKASAN KEGIATAN HARIAN
          ringkasan: mainData.RingkasanKegiatan || '',
          
          // C. MONITORING SISTEM & INFRASTRUKTUR
          server_db_status: monitoringMap.server_db_status || '',
          server_db_ket: monitoringMap.server_db_ket || '',
          server_app_status: monitoringMap.server_app_status || '',
          server_app_ket: monitoringMap.server_app_ket || '',
          network_status: monitoringMap.network_status || '',
          network_ket: monitoringMap.network_ket || '',
          internet_status: monitoringMap.internet_status || '',
          internet_ket: monitoringMap.internet_ket || '',
          backup_status: monitoringMap.backup_status || '',
          backup_ket: monitoringMap.backup_ket || '',
          security_status: monitoringMap.security_status || '',
          security_ket: monitoringMap.security_ket || '',
          
          // D. MAINTENANCE & SYSTEM UPDATE
          patch_waktu: maintenanceMap.patch_waktu || '',
          patch_hasil: maintenanceMap.patch_hasil || '',
          patch_ket: maintenanceMap.patch_ket || '',
          db_maint_waktu: maintenanceMap.db_maint_waktu || '',
          db_maint_hasil: maintenanceMap.db_maint_hasil || '',
          db_maint_ket: maintenanceMap.db_maint_ket || '',
          net_maint_waktu: maintenanceMap.net_maint_waktu || '',
          net_maint_hasil: maintenanceMap.net_maint_hasil || '',
          net_maint_ket: maintenanceMap.net_maint_ket || '',
          hw_waktu: maintenanceMap.hw_waktu || '',
          hw_hasil: maintenanceMap.hw_hasil || '',
          hw_ket: maintenanceMap.hw_ket || '',
          
          // E. SECURITY AUDIT & MONITORING
          fw_log_status: securityMap.fw_log_status || '',
          fw_log_findings: securityMap.fw_log_findings || '',
          fw_log_action: securityMap.fw_log_action || '',
          av_status: securityMap.av_status || '',
          av_findings: securityMap.av_findings || '',
          av_action: securityMap.av_action || '',
          user_access_status: securityMap.user_access_status || '',
          user_access_findings: securityMap.user_access_findings || '',
          user_access_action: securityMap.user_access_action || '',
          
          // F. INCIDENT REPORT
          incident: mainData.IncidentReport || '',
          
          // G. PLANNED ACTIVITIES
          planned: mainData.PlannedActivities || ''
        };
        
        setLaporanData(combinedData);
      } else {
        throw new Error(laporanResult.message || 'Gagal mengambil data laporan');
      }
    } catch (error) {
      console.error('Error fetching laporan data:', error);
      alert('Gagal mengambil data laporan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!laporanData) return;
    
    setIsPrinting(true);
    
    try {
      // Generate print HTML
      const printHtml = generatePrintHtml();
      
      // Create new window and print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load before printing
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          setIsPrinting(false);
        }, 500);
      } else {
        setIsPrinting(false);
        alert('Gagal membuka jendela print. Pastikan popup blocker dinonaktifkan.');
      }
    } catch (error) {
      console.error('Print error:', error);
      setIsPrinting(false);
      alert('Gagal mencetak, silakan coba lagi');
    }
  };

  const generatePrintHtml = () => {
    if (!laporanData) return '';
    
    const jabatanText = jabatanOptions.find(j => j.ID.toString() === laporanData.jabatan)?.Jabatan || '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Detail Laporan IT - ${laporanData.namaPetugas}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 1.5cm;
            background: white;
            color: black;
            font-size: 11pt;
            line-height: 1.4;
            font-weight: 400;
          }
          
          /* Container utama */
          .print-container {
            max-width: 100%;
            margin: 0 auto;
          }
          
          /* Page break controls */
          .section-wrapper {
            margin-bottom: 25px;
          }
          
          .section-title-wrapper {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          .section-title {
            font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
            font-size: 13pt;
            font-weight: 700;
            margin: 0 0 12px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #000;
            color: #000;
            background: white;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          /* Header */
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
            page-break-after: avoid;
            break-after: avoid;
          }
          
          .header h2 {
            font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
            font-size: 16pt;
            font-weight: 700;
            margin-bottom: 5px;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .header p {
            font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
            font-size: 11pt;
            font-weight: 500;
            color: #000;
            letter-spacing: 0.3px;
          }
          
          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
            font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
          }
          
          th {
            background-color: #f5f5f5;
            font-weight: 700;
            font-size: 10pt;
            color: #000;
          }
          
          td {
            font-size: 10pt;
            color: #000;
          }
          
          /* Label table (identitas) */
          .label-table td:first-child {
            width: 30%;
            background-color: #f5f5f5;
            font-weight: 600;
            color: #000;
          }
          
          .label-table td:last-child {
            color: #000;
          }
          
          /* Textarea style untuk print */
          .print-textarea {
            border: 1px solid #000;
            padding: 8px 10px;
            min-height: 80px;
            background: white;
            margin-bottom: 20px;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
            font-size: 10pt;
            color: #000;
            line-height: 1.4;
          }
          
          /* No data message */
          .no-data {
            text-align: center;
            padding: 20px;
            color: #000;
            font-style: italic;
            font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
            font-size: 10pt;
          }
          
          /* Prevent individual rows from breaking */
          table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Prevent table headers from breaking */
          table tr:first-child {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          /* Force colors for print */
          @media print {
            body {
              margin: 1.5cm;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
              color: #000 !important;
              background: #fff !important;
            }
            
            th {
              background-color: #f5f5f5 !important;
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            td {
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
            }
            
            .label-table td:first-child {
              background-color: #f5f5f5 !important;
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .label-table td:last-child {
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
            }
            
            .section-title {
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
            }
            
            .header h2, .header p {
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
            }
            
            .print-textarea {
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
            }
            
            .no-data {
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
            }
            
            /* Allow natural flow for better space optimization */
            .section-wrapper {
              /* Removed strict page-break controls */
            }
            
            /* Force all text to black */
            * {
              color: #000 !important;
            }
          }
          
          @page {
            size: A4;
            margin: 0.5cm;
          }
          
          /* Hide browser header and footer */
          @page :header {
            display: none;
          }
          
          @page :footer {
            display: none;
          }
          
          /* Additional methods to hide header/footer */
          @page {
            size: A4;
            margin: 0.5cm;
          }
          
          /* Chrome/Edge specific */
          @page {
            size: A4;
            margin: 0.5cm 0.5cm 0.5cm 0.5cm;
          }
          
          /* Firefox specific */
          @page {
            size: A4;
            margin: 0.5cm;
          }
          
          /* Force hide header/footer in all browsers */
          @page {
            size: A4;
            margin: 0.5cm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Utility */
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .mb-2 { margin-bottom: 10px; }
          .mb-4 { margin-bottom: 20px; }
          .flex { display: flex; }
          .gap-4 { gap: 20px; }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- HEADER -->
          <div class="header">
            <h2>DETAIL LAPORAN KINERJA IT</h2>
            <p>DIVISI TEKNOLOGI INFORMASI</p>
          </div>
          
          <!-- A. IDENTITAS LAPORAN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">A. IDENTITAS LAPORAN</h3>
            </div>
            <table class="label-table">
              <tr>
                <td>Hari / Tanggal</td>
                <td>${laporanData.tanggal}</td>
              </tr>
              <tr>
                <td>Nama Petugas IT</td>
                <td>${laporanData.namaPetugas}</td>
              </tr>
              <tr>
                <td>NIP / ID</td>
                <td>${laporanData.nipId}</td>
              </tr>
              <tr>
                <td>Jabatan</td>
                <td>${jabatanText}</td>
              </tr>
              <tr>
                <td>Shift Kerja</td>
                <td>${laporanData.shift || '-'}</td>
              </tr>
            </table>
          </div>
          
          <!-- B. RINGKASAN KEGIATAN HARIAN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">B. RINGKASAN KEGIATAN HARIAN</h3>
            </div>
            <div class="print-textarea">${laporanData.ringkasan || 'Tidak ada ringkasan kegiatan'}</div>
          </div>
          
          <!-- C. MONITORING SISTEM & INFRASTRUKTUR -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">C. MONITORING SISTEM & INFRASTRUKTUR</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Sistem</th>
                  <th>Status</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Server Database</td>
                  <td>${laporanData.server_db_status || '-'}</td>
                  <td>${laporanData.server_db_ket || '-'}</td>
                </tr>
                <tr>
                  <td>Server Application</td>
                  <td>${laporanData.server_app_status || '-'}</td>
                  <td>${laporanData.server_app_ket || '-'}</td>
                </tr>
                <tr>
                  <td>Network</td>
                  <td>${laporanData.network_status || '-'}</td>
                  <td>${laporanData.network_ket || '-'}</td>
                </tr>
                <tr>
                  <td>Internet</td>
                  <td>${laporanData.internet_status || '-'}</td>
                  <td>${laporanData.internet_ket || '-'}</td>
                </tr>
                <tr>
                  <td>Backup System</td>
                  <td>${laporanData.backup_status || '-'}</td>
                  <td>${laporanData.backup_ket || '-'}</td>
                </tr>
                <tr>
                  <td>Security System</td>
                  <td>${laporanData.security_status || '-'}</td>
                  <td>${laporanData.security_ket || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- D. MAINTENANCE & SYSTEM UPDATE -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">D. MAINTENANCE & SYSTEM UPDATE</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Kegiatan Maintenance</th>
                  <th>Waktu</th>
                  <th>Hasil</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>System Patch Update</td>
                  <td>${laporanData.patch_waktu || '-'}</td>
                  <td>${laporanData.patch_hasil || '-'}</td>
                  <td>${laporanData.patch_ket || '-'}</td>
                </tr>
                <tr>
                  <td>Database Maintenance</td>
                  <td>${laporanData.db_maint_waktu || '-'}</td>
                  <td>${laporanData.db_maint_hasil || '-'}</td>
                  <td>${laporanData.db_maint_ket || '-'}</td>
                </tr>
                <tr>
                  <td>Network Maintenance</td>
                  <td>${laporanData.net_maint_waktu || '-'}</td>
                  <td>${laporanData.net_maint_hasil || '-'}</td>
                  <td>${laporanData.net_maint_ket || '-'}</td>
                </tr>
                <tr>
                  <td>Hardware Maintenance</td>
                  <td>${laporanData.hw_waktu || '-'}</td>
                  <td>${laporanData.hw_hasil || '-'}</td>
                  <td>${laporanData.hw_ket || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- E. SECURITY AUDIT & MONITORING -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">E. SECURITY AUDIT & MONITORING</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Security Check</th>
                  <th>Status</th>
                  <th>Findings</th>
                  <th>Action Taken</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Firewall Log Monitoring</td>
                  <td>${laporanData.fw_log_status || '-'}</td>
                  <td>${laporanData.fw_log_findings || '-'}</td>
                  <td>${laporanData.fw_log_action || '-'}</td>
                </tr>
                <tr>
                  <td>Antivirus Monitoring</td>
                  <td>${laporanData.av_status || '-'}</td>
                  <td>${laporanData.av_findings || '-'}</td>
                  <td>${laporanData.av_action || '-'}</td>
                </tr>
                <tr>
                  <td>User Access Monitoring</td>
                  <td>${laporanData.user_access_status || '-'}</td>
                  <td>${laporanData.user_access_findings || '-'}</td>
                  <td>${laporanData.user_access_action || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- F. INCIDENT REPORT -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">F. INCIDENT REPORT</h3>
            </div>
            <div class="print-textarea">${laporanData.incident || 'Tidak ada incident report'}</div>
          </div>
          
          <!-- G. PLANNED ACTIVITIES -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">G. PLANNED ACTIVITIES</h3>
            </div>
            <div class="print-textarea">${laporanData.planned || 'Tidak ada planned activities'}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Memuat data laporan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!laporanData) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-600">Data laporan tidak ditemukan</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .hide-scrollbar {
          -ms-overflow-style: none !important;  /* IE and Edge */
          scrollbar-width: none !important;  /* Firefox */
        }
        /* Hide scrollbar for all browsers */
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .hide-scrollbar::-moz-scrollbar {
          display: none !important;
        }
        .hide-scrollbar::-ms-scrollbar {
          display: none !important;
        }
        /* Smooth scrolling */
        .hide-scrollbar {
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-xl bg-white hide-scrollbar" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Top Action Buttons */}
        <div className="flex justify-center items-center mb-6">
          <div className="flex gap-3 no-print">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className={`px-6 py-3 rounded-lg text-white font-medium ${
                isPrinting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isPrinting ? 'Memproses...' : 'Print'}
            </button>
          </div>
        </div>

        {/* HEADER */}
        <div className="text-center border-b-2 border-gray-300 pb-5 mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-2">DETAIL LAPORAN KINERJA IT</h2>
          <p className="text-sm font-semibold text-gray-600">DIVISI TEKNOLOGI INFORMASI</p>
        </div>

        <div className="px-5">
          {/* A. IDENTITAS LAPORAN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">A. IDENTITAS LAPORAN</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Hari / Tanggal</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input
                      type="date"
                      name="tanggal"
                      value={laporanData.tanggal}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Nama Petugas IT</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input
                      type="text"
                      name="namaPetugas"
                      value={laporanData.namaPetugas}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">NIP / ID</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input
                      type="text"
                      name="nipId"
                      value={laporanData.nipId}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Jabatan</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <select
                      name="jabatan"
                      value={laporanData.jabatan}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    >
                      {isLoadingDropdown ? (
                        <option>Loading...</option>
                      ) : (
                    <>
                      <option value="">Pilih Jabatan</option>
                      {jabatanOptions.map((option) => (
                        <option key={option.ID} value={option.ID}>
                          {option.Jabatan} - {option.Desc}
                        </option>
                      ))}
                    </>
                  )}
                    </select>
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Shift Kerja</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <select
                      name="shift"
                      value={laporanData.shift}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    >
                      {isLoadingDropdown ? (
                        <option>Loading...</option>
                      ) : (
                    <>
                      <option value="">Pilih Shift</option>
                      {shiftOptions.map((option) => (
                        <option key={option.Id} value={option.Id}>
                          {option.Shift} - {option.Desc}
                        </option>
                      ))}
                    </>
                  )}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* B. RINGKASAN KEGIATAN HARIAN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">B. RINGKASAN KEGIATAN HARIAN</h3>
            <textarea
              name="ringkasan"
              value={laporanData.ringkasan}
              disabled
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-transparent text-gray-900 resize-none"
              placeholder="Masukkan ringkasan kegiatan harian..."
            />
          </div>

          {/* C. MONITORING SISTEM & INFRASTRUKTUR */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">C. MONITORING SISTEM & INFRASTRUKTUR</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Sistem</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">Server Database</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="server_db_status"
                      value={laporanData.server_db_status}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="server_db_ket"
                      value={laporanData.server_db_ket}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">Server Application</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="server_app_status"
                      value={laporanData.server_app_status}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="server_app_ket"
                      value={laporanData.server_app_ket}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">Network</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="network_status"
                      value={laporanData.network_status}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="network_ket"
                      value={laporanData.network_ket}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">Internet</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="internet_status"
                      value={laporanData.internet_status}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="internet_ket"
                      value={laporanData.internet_ket}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">Backup System</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="backup_status"
                      value={laporanData.backup_status}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="backup_ket"
                      value={laporanData.backup_ket}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">Security System</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="security_status"
                      value={laporanData.security_status}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="security_ket"
                      value={laporanData.security_ket}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* D. MAINTENANCE & SYSTEM UPDATE */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">D. MAINTENANCE & SYSTEM UPDATE</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Kegiatan Maintenance</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Waktu</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Hasil</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">System Patch Update</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="patch_waktu"
                      value={laporanData.patch_waktu}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="patch_hasil"
                      value={laporanData.patch_hasil}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="patch_ket"
                      value={laporanData.patch_ket}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">Database Maintenance</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="db_maint_waktu"
                      value={laporanData.db_maint_waktu}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="db_maint_hasil"
                      value={laporanData.db_maint_hasil}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="db_maint_ket"
                      value={laporanData.db_maint_ket}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">Network Maintenance</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="net_maint_waktu"
                      value={laporanData.net_maint_waktu}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="net_maint_hasil"
                      value={laporanData.net_maint_hasil}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="net_maint_ket"
                      value={laporanData.net_maint_ket}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">Hardware Maintenance</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="hw_waktu"
                      value={laporanData.hw_waktu}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="hw_hasil"
                      value={laporanData.hw_hasil}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="hw_ket"
                      value={laporanData.hw_ket}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* E. SECURITY AUDIT & MONITORING */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">E. SECURITY AUDIT & MONITORING</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Security Check</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Findings</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Action Taken</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">Firewall Log Monitoring</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="fw_log_status"
                      value={laporanData.fw_log_status}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="fw_log_findings"
                      value={laporanData.fw_log_findings}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="fw_log_action"
                      value={laporanData.fw_log_action}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">Antivirus Monitoring</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="av_status"
                      value={laporanData.av_status}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="av_findings"
                      value={laporanData.av_findings}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="av_action"
                      value={laporanData.av_action}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold px-3 py-2 bg-blue-50 text-blue-900 border border-gray-300">User Access Monitoring</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="user_access_status"
                      value={laporanData.user_access_status}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="user_access_findings"
                      value={laporanData.user_access_findings}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2 border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="user_access_action"
                      value={laporanData.user_access_action}
                      disabled
                      className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* F. INCIDENT REPORT */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">F. INCIDENT REPORT</h3>
            <textarea
              name="incident"
              value={laporanData.incident}
              disabled
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-transparent text-gray-900 resize-none"
              placeholder="Masukkan incident report..."
            />
          </div>

          {/* G. PLANNED ACTIVITIES */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">G. PLANNED ACTIVITIES</h3>
            <textarea
              name="planned"
              value={laporanData.planned}
              disabled
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-transparent text-gray-900 resize-none"
              placeholder="Masukkan planned activities..."
            />
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
