'use client';

import { useState, useEffect, useRef } from 'react';

interface LaporanData {
  Id: number;
  Date: string;
  Start: string;
  Stop: string;
  KegiatanId: number;
  JenisKegiatanId: number;
  Location: string;
  TechnicalDirector: string;
  ShiftId: number;
  Ringkasan: string;
  TindakanKoordinasi: string;
  CatatanKhusus: string;
  StatusId: number;
  Feedback: string;
  CreateBy: string;
  ApproveBy: string;
  CreatedDate: string;
  ApproveDate: string;
  Kegiatan: string;
  Kegiatan_Desc: string;
  Jenis: string;
  JenisKegiatan_Desc: string;
  Shift: string;
  ShiftKerja_Desc: string;
}

interface PeralatanData {
  Id: number;
  LaporanId: number;
  Peralatan: string;
  Condition: string;
  Desc: string;
}

interface KondisiSiaranData {
  Id: number;
  LaporanId: number;
  Aspek: string;
  Status: string;
  Desc: string;
}

interface GangguanTeknisData {
  Id: number;
  LaporanId: number;
  Time: string;
  Peralatan: string;
  JenisGanguan: string;
  TindakanPerbaikan: string;
  Status: string;
}

interface DetailLaporanFormProps {
  laporanId: number;
  onClose: () => void;
}

export default function DetailLaporanForm({ laporanId, onClose }: DetailLaporanFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [laporanData, setLaporanData] = useState<LaporanData | null>(null);
  const [peralatanData, setPeralatanData] = useState<PeralatanData[]>([]);
  const [kondisiSiaranData, setKondisiSiaranData] = useState<KondisiSiaranData[]>([]);
  const [gangguanTeknisData, setGangguanTeknisData] = useState<GangguanTeknisData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLaporanDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const laporanResponse = await fetch(`/api/laporan/${laporanId}/detail`);
        if (!laporanResponse.ok) {
          throw new Error('Failed to fetch laporan data');
        }
        const laporanResult = await laporanResponse.json();
        
        if (laporanResult.success) {
          setLaporanData(laporanResult.data);
          
          const [peralatanResponse, kondisiResponse, gangguanResponse] = await Promise.all([
            fetch(`/api/laporan/${laporanId}/peralatan`),
            fetch(`/api/laporan/${laporanId}/kondisi-siaran`),
            fetch(`/api/laporan/${laporanId}/gangguan-teknis`)
          ]);

          const [peralatanResult, kondisiResult, gangguanResult] = await Promise.all([
            peralatanResponse.json(),
            kondisiResponse.json(),
            gangguanResponse.json()
          ]);

          if (peralatanResult.success) {
            setPeralatanData(peralatanResult.data || []);
          }
          if (kondisiResult.success) {
            setKondisiSiaranData(kondisiResult.data || []);
          }
          if (gangguanResult.success) {
            setGangguanTeknisData(gangguanResult.data || []);
          }
        } else {
          throw new Error(laporanResult.message || 'Failed to load laporan data');
        }
      } catch (error) {
        console.error('Error fetching laporan detail:', error);
        setError('Terjadi kesalahan saat memuat data laporan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLaporanDetail();
  }, [laporanId]);

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handlePrint = async () => {
    if (!laporanData || isPrinting) return;
    
    setIsPrinting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const printWindow = window.open('', '_blank', 'width=900,height=700,toolbar=yes,scrollbars=yes,resizable=yes');
      
      if (!printWindow) {
        alert('Mohon izinkan pop-up window untuk mencetak');
        setIsPrinting(false);
        return;
      }
      
      const printHtml = generatePrintHtml();
      
      printWindow.document.write(printHtml);
      printWindow.document.close();
      
      // Multiple fallback methods to ensure window closes
      const closePrintWindow = () => {
        if (printWindow && !printWindow.closed) {
          printWindow.close();
        }
        setIsPrinting(false);
      };
      
      printWindow.onload = () => {
        // Trigger print dialog
        printWindow.print();
        
        // Method 1: onafterprint event
        printWindow.onafterprint = closePrintWindow;
        
        // Method 2: setTimeout fallback (some browsers don't trigger onafterprint)
        setTimeout(closePrintWindow, 1000);
        
        // Method 3: onblur fallback (when user switches back to main window)
        printWindow.onblur = () => {
          setTimeout(closePrintWindow, 500);
        };
      };
      
      // Method 4: Additional safety timeout
      setTimeout(closePrintWindow, 3000);
      
    } catch (error) {
      console.error('Print error:', error);
      alert('Gagal mencetak, silakan coba lagi');
      setIsPrinting(false);
    }
  };
  
  const generatePrintHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Detail Laporan Harian - ${laporanData?.Kegiatan || 'Laporan'}</title>
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
          
          /* Page break controls - INI YANG PENTING! */
          .section-wrapper {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 25px;
          }
          
          .section-title-wrapper {
            page-break-after: avoid;
            break-after: avoid;
            page-break-inside: avoid;
            break-inside: avoid;
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
          
          .table-wrapper {
            page-break-inside: avoid;
            break-inside: avoid;
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
          
          /* Force page break untuk section tertentu jika diperlukan */
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
          
          /* Hindari orphan (judul di akhir halaman tanpa konten) */
          .avoid-orphan {
            page-break-inside: avoid;
            break-inside: avoid;
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
            
            /* Pastikan tidak ada page break di tengah section */
            .section-wrapper {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
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
          <!-- HEADER - selalu di halaman pertama -->
          <div class="header">
            <h2>DETAIL LAPORAN HARIAN</h2>
            <p>TECHNICAL DIRECTOR PRODUKSI & PENYIARAN</p>
          </div>
          
          <!-- A. IDENTITAS LAPORAN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">A. IDENTITAS LAPORAN</h3>
            </div>
            <div class="table-wrapper">
              <table class="label-table">
                <tr>
                  <td>Tanggal</td>
                  <td>${formatDateForDisplay(laporanData!.Date)}</td>
                </tr>
                <tr>
                  <td>Waktu Produksi</td>
                  <td>
                    <div class="flex gap-4">
                      <span><strong>Start:</strong> ${laporanData!.Start?.substring(0, 5) || '-'}</span>
                      <span><strong>Stop:</strong> ${laporanData!.Stop?.substring(0, 5) || '-'}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Nama Program / Kegiatan</td>
                  <td>
                    <strong>${laporanData!.Kegiatan || '-'}</strong><br>
                    <small>${laporanData!.Kegiatan_Desc || ''}</small>
                  </td>
                </tr>
                <tr>
                  <td>Jenis Produksi</td>
                  <td>
                    <strong>${laporanData!.Jenis || '-'}</strong><br>
                    <small>${laporanData!.JenisKegiatan_Desc || ''}</small>
                  </td>
                </tr>
                <tr>
                  <td>Lokasi</td>
                  <td>${laporanData!.Location || '-'}</td>
                </tr>
                <tr>
                  <td>Technical Director</td>
                  <td>${laporanData!.TechnicalDirector || '-'}</td>
                </tr>
                <tr>
                  <td>Shift Kerja</td>
                  <td>
                    <strong>${laporanData!.Shift || '-'}</strong><br>
                    <small>${laporanData!.ShiftKerja_Desc || ''}</small>
                  </td>
                </tr>
              </table>
            </div>
          </div>
          
          <!-- B. RINGKASAN KEGIATAN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">B. RINGKASAN KEGIATAN</h3>
            </div>
            <div class="print-textarea">${(laporanData!.Ringkasan || '-').replace(/\n/g, '<br>')}</div>
          </div>
          
          <!-- C. PERALATAN YANG DIGUNAKAN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">C. PERALATAN YANG DIGUNAKAN</h3>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style="width: 5%">No</th>
                    <th style="width: 35%">Peralatan / Sistem</th>
                    <th style="width: 25%">Kondisi</th>
                    <th style="width: 35%">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  ${peralatanData.length === 0 ? `
                    <tr>
                      <td colspan="4" class="no-data">Tidak ada data peralatan</td>
                    </tr>
                  ` : peralatanData.map((item, index) => `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td>${item.Peralatan || '-'}</td>
                      <td>${item.Condition || '-'}</td>
                      <td>${item.Desc || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- D. KONDISI SIARAN/PRODUKSI -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">D. KONDISI SIARAN/PRODUKSI</h3>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style="width: 5%">No</th>
                    <th style="width: 30%">Aspek</th>
                    <th style="width: 25%">Status</th>
                    <th style="width: 40%">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  ${kondisiSiaranData.length === 0 ? `
                    <tr>
                      <td colspan="4" class="no-data">Tidak ada data kondisi siaran</td>
                    </tr>
                  ` : kondisiSiaranData.map((item, index) => `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td>${item.Aspek || '-'}</td>
                      <td>${item.Status || '-'}</td>
                      <td>${item.Desc || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- E. GANGGUAN/KENDALA TEKNIS -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">E. GANGGUAN/KENDALA TEKNIS</h3>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style="width: 5%">No</th>
                    <th style="width: 10%">Waktu</th>
                    <th style="width: 20%">Peralatan / Sistem</th>
                    <th style="width: 20%">Jenis Gangguan</th>
                    <th style="width: 30%">Tindakan Perbaikan</th>
                    <th style="width: 15%">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${gangguanTeknisData.length === 0 ? `
                    <tr>
                      <td colspan="6" class="no-data">Tidak ada data gangguan teknis</td>
                    </tr>
                  ` : gangguanTeknisData.map((item, index) => `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td>${item.Time?.substring(0, 5) || '-'}</td>
                      <td>${item.Peralatan || '-'}</td>
                      <td>${item.JenisGanguan || '-'}</td>
                      <td>${item.TindakanPerbaikan || '-'}</td>
                      <td>${item.Status || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- F. TINDAKAN KOORDINASI -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">F. TINDAKAN KOORDINASI</h3>
            </div>
            <div class="print-textarea">${(laporanData!.TindakanKoordinasi || '-').replace(/\n/g, '<br>')}</div>
          </div>
          
          <!-- G. CATATAN KHUSUS -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">G. CATATAN KHUSUS</h3>
            </div>
            <div class="print-textarea">${(laporanData!.CatatanKhusus || '-').replace(/\n/g, '<br>')}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-xl bg-white">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data laporan...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-xl bg-white">
          <div className="text-center py-8">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!laporanData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-xl bg-white" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <style jsx>{`
          /* Hide scrollbar for Chrome, Safari and Opera */
          div::-webkit-scrollbar {
            display: none;
          }
          /* Hide scrollbar for IE, Edge and Firefox */
          div {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
        `}</style>
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
              {isPrinting ? 'Memproses...' : '🖨️ Print'}
            </button>
          </div>
        </div>
        
        {/* Konten untuk tampilan layar */}
        <div>
          {/* HEADER */}
          <div className="text-center border-b-2 border-gray-300 pb-5 mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-2">DETAIL LAPORAN HARIAN</h2>
            <p className="text-sm font-semibold text-gray-600">TECHNICAL DIRECTOR PRODUKSI & PENYIARAN</p>
          </div>

          {/* A. IDENTITAS LAPORAN */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-4">A. IDENTITAS LAPORAN</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Tanggal</td>
                  <td className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700">
                    {formatDateForDisplay(laporanData.Date)}
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Waktu Produksi</td>
                  <td className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-semibold">Start:</span>
                        <span>{laporanData.Start?.substring(0, 5) || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-semibold">Stop:</span>
                        <span>{laporanData.Stop?.substring(0, 5) || '-'}</span>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Nama Program / Kegiatan</td>
                  <td className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700">
                    <div>
                      <div className="font-medium">{laporanData.Kegiatan}</div>
                      <div className="text-sm text-gray-600">{laporanData.Kegiatan_Desc}</div>
                    </div>
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Jenis Produksi</td>
                  <td className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700">
                    <div>
                      <div className="font-medium">{laporanData.Jenis}</div>
                      <div className="text-sm text-gray-600">{laporanData.JenisKegiatan_Desc}</div>
                    </div>
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Lokasi</td>
                  <td className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700">
                    {laporanData.Location || '-'}
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Technical Director</td>
                  <td className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700">
                    {laporanData.TechnicalDirector || '-'}
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Shift Kerja</td>
                  <td className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-700">
                    <div>
                      <div className="font-medium">{laporanData.Shift}</div>
                      <div className="text-sm text-gray-600">{laporanData.ShiftKerja_Desc}</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* B. RINGKASAN KEGIATAN */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-4">B. RINGKASAN KEGIATAN</h3>
            <div className="border border-gray-300">
              <textarea
                value={laporanData.Ringkasan || '-'}
                readOnly
                className="w-full px-3 py-2 text-sm border-none outline-none bg-gray-100 text-gray-700 resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* C. PERALATAN YANG DIGUNAKAN */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-4">C. PERALATAN YANG DIGUNAKAN</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border border-gray-300 bg-blue-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">No</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Peralatan / Sistem</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Kondisi</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {peralatanData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                      Tidak ada data peralatan
                    </td>
                  </tr>
                ) : (
                  peralatanData.map((item, index) => (
                    <tr key={item.Id} className="border border-gray-300">
                      <td className="border border-gray-300 px-3 py-2 text-center bg-blue-50 text-blue-900 font-semibold">{index + 1}</td>
                      <td className="border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700">{item.Peralatan || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700">{item.Condition || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700">{item.Desc || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* D. KONDISI SIARAN/PRODUKSI */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-4">D. KONDISI SIARAN/PRODUKSI</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border border-gray-300 bg-blue-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">No</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Aspek</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Status</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {kondisiSiaranData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                      Tidak ada data kondisi siaran
                    </td>
                  </tr>
                ) : (
                  kondisiSiaranData.map((item, index) => (
                    <tr key={item.Id} className="border border-gray-300">
                      <td className="border border-gray-300 px-3 py-2 text-center bg-blue-50 text-blue-900 font-semibold">{index + 1}</td>
                      <td className="border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700">{item.Aspek || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700">{item.Status || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700">{item.Desc || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* E. GANGGUAN/KENDALA TEKNIS */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-4">E. GANGGUAN/KENDALA TEKNIS</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border border-gray-300 bg-blue-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">No</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Waktu</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Peralatan / Sistem</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Jenis Gangguan</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Tindakan Perbaikan</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {gangguanTeknisData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                      Tidak ada data gangguan teknis
                    </td>
                  </tr>
                ) : (
                  gangguanTeknisData.map((item, index) => (
                    <tr key={item.Id} className="border border-gray-300">
                      <td className="border border-gray-300 px-3 py-2 text-center bg-blue-50 text-blue-900 font-semibold">{index + 1}</td>
                      <td className="border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700">{item.Time?.substring(0, 5) || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700">{item.Peralatan || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700">{item.JenisGanguan || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700">{item.TindakanPerbaikan || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700">{item.Status || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* F. TINDAKAN KOORDINASI */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-4">F. TINDAKAN KOORDINASI</h3>
            <div className="border border-gray-300">
              <textarea
                value={laporanData.TindakanKoordinasi || '-'}
                readOnly
                className="w-full px-3 py-2 text-sm border-none outline-none bg-gray-100 text-gray-700 resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* G. CATATAN KHUSUS */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-4">G. CATATAN KHUSUS</h3>
            <div className="border border-gray-300">
              <textarea
                value={laporanData.CatatanKhusus || '-'}
                readOnly
                className="w-full px-3 py-2 text-sm border-none outline-none bg-gray-100 text-gray-700 resize-none"
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}