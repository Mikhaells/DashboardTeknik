'use client';

import { useState, useEffect } from 'react';
import { LaporanTeknisi, ChecklistItem } from '@/types/laporan-teknisi';
import { Button } from '@/components/ui/Button';

interface DetailLaporanTeknisiFormProps {
  laporanId: number;
  onClose: () => void;
}

export default function DetailLaporanTeknisiForm({ laporanId, onClose }: DetailLaporanTeknisiFormProps) {
  const [laporan, setLaporan] = useState<LaporanTeknisi | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchLaporanDetail();
  }, [laporanId]);

  const fetchLaporanDetail = async () => {
    try {
      const response = await fetch(`/api/teknisi/laporan/${laporanId}`);
      const result = await response.json();
      
      if (result.success) {
        // Combine laporan data with checklist data
        const laporanData = {
          ...result.data.laporan,
          preProduction: result.data.preProduction || [],
          production: result.data.production || [],
          postProduction: result.data.postProduction || [],
          // Add status options for reference
          statusOptions: result.data.statusOptions || []
        };
        setLaporan(laporanData);
      } else {
        throw new Error(result.message || 'Failed to fetch laporan detail');
      }
    } catch (error) {
      console.error('Error fetching laporan detail:', error);
      alert('Gagal mengambil detail laporan');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-green-100 text-green-800';
      case 4: return 'bg-red-100 text-red-800';
      case 5: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (statusId: number, statusOptions: any[] = []) => {
    // Try to find status name from statusOptions first
    const statusOption = statusOptions.find((option: any) => option.Id === statusId);
    if (statusOption) {
      return statusOption.Status;
    }
    
    // Fallback to hardcoded mapping
    switch (statusId) {
      case 1: return 'Draft';
      case 2: return 'Pending';
      case 3: return 'Approved';
      case 4: return 'Rejected';
      case 5: return 'Processing';
      default: return 'Unknown';
    }
  };

  const generatePrintHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Detail Laporan Technical Director - ${laporan?.Kegiatan || 'Laporan'}</title>
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
            margin-bottom: 25px;
          }
          
          .section-title-wrapper {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          /* Header */
          .header {
            text-align: center;
            margin-bottom: 30px;
            page-break-after: avoid;
            break-after: avoid;
          }
          
          .header h2 {
            font-size: 18pt;
            font-weight: 700;
            color: #000;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          
          .header p {
            font-size: 10pt;
            color: #000;
            font-weight: 600;
          }
          
          /* Section titles */
          .section-title {
            font-size: 13pt;
            font-weight: 700;
            color: #000;
            margin-bottom: 12px;
            padding: 8px 12px;
            background-color: #f5f5f5;
            border-left: 4px solid #000;
            page-break-after: avoid;
            break-after: avoid;
          }
          
          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          td {
            border: 1px solid #000;
            padding: 8px 10px;
            font-size: 10pt;
            vertical-align: top;
            color: #000;
          }
          
          .label-table td:first-child {
            font-weight: 600;
            background-color: #f5f5f5;
            width: 30%;
            color: #000;
          }
          
          .label-table td:last-child {
            background-color: #fff;
            color: #000;
          }
          
          /* Textarea style untuk print */
          .print-textarea {
            border: 1px solid #000;
            padding: 8px 10px;
            min-height: 80px;
            font-size: 10pt;
            line-height: 1.4;
            color: #000;
            background-color: #fff;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Checklist tables */
          .checklist-table {
            margin-bottom: 15px;
          }
          
          .checklist-table td {
            font-size: 9pt;
            padding: 6px 8px;
            color: #000;
          }
          
          .checklist-table td:first-child {
            font-weight: 600;
            width: 5%;
            text-align: center;
            background-color: #f5f5f5;
          }
          
          .checklist-table td:nth-child(2) {
            width: 40%;
            background-color: #fff;
          }
          
          .checklist-table td:nth-child(3) {
            width: 55%;
            background-color: #fff;
          }
          
          /* Prevent individual rows from breaking */
          .checklist-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Prevent table headers from breaking */
          .checklist-table tr:first-child {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          /* Status badge */
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            font-size: 9pt;
            font-weight: 600;
            border-radius: 4px;
            text-transform: uppercase;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Force colors for print */
          @media print {
            body {
              margin: 1.5cm;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            td {
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .label-table td:last-child {
              background-color: #fff !important;
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .section-title {
              color: #000 !important;
              background-color: #f5f5f5 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
            }
            
            .print-textarea {
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
            }
            
            .checklist-table td {
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
            }
            
            .status-badge {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          
          @page {
            size: A4;
            margin: 0.5cm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Utility */
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- HEADER - selalu di halaman pertama -->
          <div class="header">
            <h2>DETAIL LAPORAN TECHNICAL DIRECTOR</h2>
            <p>TECHNICAL DIRECTOR PRODUKSI & PENYIARAN</p>
          </div>
          
          <!-- A. IDENTITAS LAPORAN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">A. IDENTITAS LAPORAN</h3>
            </div>
            <table class="label-table">
              <tr>
                <td>Nama Petugas</td>
                <td>${laporan!.Nama || '-'}</td>
              </tr>
              <tr>
                <td>NIP</td>
                <td>${laporan!.NIP || '-'}</td>
              </tr>
              <tr>
                <td>Jabatan</td>
                <td>${laporan!.Jabatan || '-'}</td>
              </tr>
              <tr>
                <td>Tanggal Event</td>
                <td>${formatDate(laporan!.EventDate)}</td>
              </tr>
              <tr>
                <td>Program Kegiatan</td>
                <td>${laporan!.Kegiatan || '-'}</td>
              </tr>
              <tr>
                <td>Lokasi</td>
                <td>${laporan!.Lokasi || '-'}</td>
              </tr>
              <tr>
                <td>Status</td>
                <td>${getStatusName(laporan!.StatusId || 0, laporan!.statusOptions || [])}</td>
              </tr>
            </table>
          </div>
          
          <!-- B. CATATAN TEKNIS -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">B. CATATAN TEKNIS</h3>
            </div>
            <div class="print-textarea">${(laporan!.Kendala || '-').replace(/\n/g, '<br>')}</div>
          </div>
          
          <!-- C. PRE-PRODUCTION CHECKLIST -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">C. PRE-PRODUCTION</h3>
            </div>
            <table class="checklist-table">
              <tr>
                <td>No</td>
                <td>Kegiatan</td>
                <td>Keterangan</td>
              </tr>
              ${(laporan!.preProduction || []).map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.Kegiatan || '-'}</td>
                  <td>${item.Keterangan || '-'}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <!-- D. PRODUCTION CHECKLIST -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">D. PRODUCTION</h3>
            </div>
            <table class="checklist-table">
              <tr>
                <td>No</td>
                <td>Kegiatan</td>
                <td>Keterangan</td>
              </tr>
              ${(laporan!.production || []).map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.Kegiatan || '-'}</td>
                  <td>${item.Keterangan || '-'}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <!-- E. POST-PRODUCTION CHECKLIST -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">E. POST-PRODUCTION</h3>
            </div>
            <table class="checklist-table">
              <tr>
                <td>No</td>
                <td>Kegiatan</td>
                <td>Keterangan</td>
              </tr>
              ${(laporan!.postProduction || []).map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.Kegiatan || '-'}</td>
                  <td>${item.Keterangan || '-'}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <!-- F. INFORMASI PEMBUATAN & APPROVAL -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">F. INFORMASI PEMBUATAN & APPROVAL</h3>
            </div>
            <table class="label-table">
              <tr>
                <td>Dibuat Oleh</td>
                <td>${laporan!.CreatedBy || '-'}</td>
              </tr>
              <tr>
                <td>Tanggal Dibuat</td>
                <td>${formatDate(laporan!.CreateDate)}</td>
              </tr>
              ${(laporan!.ApprovedBy || laporan!.ApprovedDate) ? `
                <tr>
                  <td>Disetujui Oleh</td>
                  <td>${laporan!.ApprovedBy || '-'}</td>
                </tr>
                <tr>
                  <td>Tanggal Disetujui</td>
                  <td>${formatDate(laporan!.ApprovedDate)}</td>
                </tr>
              ` : ''}
            </table>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    if (!laporan || isPrinting) return;
    
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-700">Memuat detail laporan...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!laporan) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <p className="text-red-600">Laporan tidak ditemukan</p>
          <Button onClick={onClose} className="mt-4">Tutup</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-xl bg-white hide-scrollbar" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
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
          
          /* Custom checkbox styling */
          .custom-checkbox {
            appearance: none !important;
            width: 16px !important;
            height: 16px !important;
            border: 2px solid #d1d5db !important;
            border-radius: 4px !important;
            background-color: transparent !important;
            cursor: pointer !important;
            position: relative !important;
            transition: all 0.2s ease !important;
          }
          
          .custom-checkbox:checked {
            background-color: #16a34a !important;
            border-color: #16a34a !important;
            accent-color: #16a34a !important;
          }
          
          .custom-checkbox:checked::after {
            content: '✓' !important;
            position: absolute !important;
            top: -2px !important;
            left: 2px !important;
            color: white !important;
            font-size: 12px !important;
            font-weight: bold !important;
          }
          
          .custom-checkbox:disabled {
            opacity: 1 !important;
            cursor: not-allowed !important;
          }
          
          .custom-checkbox:disabled:checked {
            background-color: #16a34a !important;
            border-color: #16a34a !important;
            accent-color: #16a34a !important;
          }
          
          .custom-checkbox:disabled:checked::after {
            content: '✓' !important;
            position: absolute !important;
            top: -2px !important;
            left: 2px !important;
            color: white !important;
            font-size: 12px !important;
            font-weight: bold !important;
          }
          
          @media print {
            input[type="checkbox"]:checked {
              background-color: #16a34a !important;
              border-color: #16a34a !important;
              accent-color: #16a34a !important;
            }
            
            table {
              border-collapse: collapse !important;
              margin-bottom: 20px !important;
            }
            
            th, td {
              border: 1px solid #000 !important;
              padding: 8px 10px !important;
              text-align: left !important;
              vertical-align: top !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
              color: #000 !important;
            }
            
            th {
              background-color: #f5f5f5 !important;
              font-weight: 700 !important;
              font-size: 10pt !important;
            }
            
            .label-table td:first-child {
              width: 30% !important;
              background-color: #f5f5f5 !important;
              font-weight: 600 !important;
              color: #000 !important;
            }
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
        
        {/* HEADER */}
        <div className="text-center border-b-2 border-gray-300 pb-5 mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-2">FORM KEGIATAN TEKNISI SIARAN</h2>
          <p className="text-sm font-semibold text-gray-600">OPERASIONAL PERALATAN PRODUKSI DAN PENYIARAN</p>
        </div>
        
        <div className="px-6 py-4">
          {/* A. IDENTITAS LAPORAN */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-4">A. IDENTITAS LAPORAN</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Nama Petugas</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">{laporan.Nama}</td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">NIP</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">{laporan.NIP}</td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Jabatan</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <div>
                      <div className="font-medium">{laporan.Jabatan}</div>
                      <div className="text-sm text-gray-600">{laporan.Jabatan_Desc}</div>
                    </div>
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Tanggal</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">{formatDate(laporan.EventDate)}</td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Program / Kegiatan</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <div>
                      <div className="font-medium">{laporan.Kegiatan}</div>
                      <div className="text-sm text-gray-600">{laporan.Kegiatan_Desc}</div>
                    </div>
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Lokasi</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">{laporan.Lokasi}</td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Status</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(laporan.StatusId)}`}>
                      {getStatusName(laporan.StatusId, laporan.statusOptions || [])}
                    </span>
                    <div className="text-sm text-gray-600 mt-1">
                      {laporan.StatusLaporan_Desc || ''}
                    </div>
                  </td>
                </tr>
                {laporan.Path && (
                  <tr className="border border-gray-300">
                    <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Path/Dokumen</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">{laporan.Path}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* B. PRE-PRODUCTION CHECKLIST */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">2. PRE-PRODUCTION</h3>
            <div className="overflow-x-auto mb-3 hide-scrollbar">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">No</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Kegiatan</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Check</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {laporan.preProduction && laporan.preProduction.length > 0 ? (
                    laporan.preProduction.map((item: ChecklistItem, index: number) => (
                      <tr key={index} className="border border-gray-300 bg-white">
                        <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 1}</td>
                        <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item.Kegiatan}</td>
                        <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                          <input
                            type="checkbox"
                            checked={item.Check}
                            disabled
                            className="custom-checkbox"
                          />
                        </td>
                        <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                          {item.Keterangan || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center px-3 py-4 border border-gray-300 text-gray-500">
                        Tidak ada data pre-production checklist
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* C. PRODUCTION CHECKLIST */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">3. PRODUCTION</h3>
            <div className="overflow-x-auto mb-3 hide-scrollbar">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">No</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Kegiatan</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Check</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {laporan.production && laporan.production.length > 0 ? (
                    laporan.production.map((item: ChecklistItem, index: number) => (
                      <tr key={index} className="border border-gray-300 bg-white">
                        <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 1}</td>
                        <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item.Kegiatan}</td>
                        <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                          <input
                            type="checkbox"
                            checked={item.Check}
                            disabled
                            className="custom-checkbox"
                          />
                        </td>
                        <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                          {item.Keterangan || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center px-3 py-4 border border-gray-300 text-gray-500">
                        Tidak ada data production checklist
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* D. POST-PRODUCTION CHECKLIST */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">4. POST-PRODUCTION</h3>
            <div className="overflow-x-auto mb-3 hide-scrollbar">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">No</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Kegiatan</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Check</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {laporan.postProduction && laporan.postProduction.length > 0 ? (
                    laporan.postProduction.map((item: ChecklistItem, index: number) => (
                      <tr key={index} className="border border-gray-300 bg-white">
                        <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 1}</td>
                        <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item.Kegiatan}</td>
                        <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                          <input
                            type="checkbox"
                            checked={item.Check}
                            disabled
                            className="custom-checkbox"
                          />
                        </td>
                        <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                          {item.Keterangan || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center px-3 py-4 border border-gray-300 text-gray-500">
                        Tidak ada data post-production checklist
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* E. CATATAN TEKNIS / KENDALA */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">5. CATATAN TEKNIS / KENDALA</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-900">
                {laporan.Kendala || 'Tidak ada kendala yang dilaporkan'}
              </p>
            </div>
          </div>

          {/* F. INFORMASI PEMBUATAN & APPROVAL */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">F. INFORMASI PEMBUATAN & APPROVAL</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Dibuat Oleh</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">{laporan.CreatedBy}</td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Tanggal Dibuat</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">{formatDate(laporan.CreateDate)}</td>
                </tr>
                {(laporan.ApprovedBy || laporan.ApprovedDate) && (
                  <>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Disetujui Oleh</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">{laporan.ApprovedBy}</td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Tanggal Disetujui</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">{formatDate(laporan.ApprovedDate)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <Button onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </div>
  );
}
