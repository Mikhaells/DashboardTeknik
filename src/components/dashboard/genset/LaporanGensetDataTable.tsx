'use client';

import { useState } from 'react';
import { LaporanGenset } from '@/types/laporan-genset';
import { getStatusName, getStatusColor, isPending, isApproved, isRejected, isAdminEditable, isManagerEditable } from '@/lib/status';
import Pagination from '../Pagination';
import DetailLaporanGensetForm from './DetailLaporanGensetForm';
import EditLaporanGensetFormAdvanced from './EditLaporanGensetFormAdvanced';
import FeedbackModal from '../FeedbackModal';
import TambahLaporanGensetFormAdvanced from './TambahLaporanGensetFormAdvanced';

interface LaporanGensetDataTableProps {
  data: LaporanGenset[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange: (page: number) => void;
  userLevelId?: number;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onSearch?: () => void;
  activeFilter?: string;
}

export default function LaporanGensetDataTable({ data, pagination, onPageChange, userLevelId = 2, searchTerm = '', onSearchChange, onSearch, activeFilter = 'all' }: LaporanGensetDataTableProps) {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLaporanId, setSelectedLaporanId] = useState<number | null>(null);
  const [isProcessingFeedback, setIsProcessingFeedback] = useState(false);
  const [isPrintingApproved, setIsPrintingApproved] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
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

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '-';
    return timeString;
  };

  const handleAddLaporan = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleEditLaporan = (id: number) => {
    setSelectedLaporanId(id);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedLaporanId(null);
  };

  const handleDetailLaporan = (id: number) => {
    setSelectedLaporanId(id);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedLaporanId(null);
  };

  const handleApproveLaporan = (id: number) => {
    setSelectedLaporanId(id);
    setShowApproveModal(true);
  };

  const handleCloseApproveModal = () => {
    setShowApproveModal(false);
    setSelectedLaporanId(null);
  };

  const handleRejectLaporan = (id: number) => {
    setSelectedLaporanId(id);
    setShowRejectModal(true);
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setSelectedLaporanId(null);
  };

  const handleApproveSubmit = async (feedback: string) => {
    if (!selectedLaporanId) return;
    
    try {
      setIsProcessingFeedback(true);
      
      const response = await fetch(`/api/laporan-genset/${selectedLaporanId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Catatan: feedback }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Laporan genset berhasil di-approve!');
        setShowApproveModal(false);
        setSelectedLaporanId(null);
        window.location.reload();
      } else {
        throw new Error(result.message || 'Failed to approve laporan');
      }
    } catch (error) {
      console.error('Error approving laporan:', error);
      alert('Gagal approve laporan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessingFeedback(false);
    }
  };

  const handleRejectSubmit = async (feedback: string) => {
    if (!selectedLaporanId) return;
    
    try {
      setIsProcessingFeedback(true);
      
      const response = await fetch(`/api/laporan-genset/${selectedLaporanId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Catatan: feedback }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Laporan genset berhasil di-reject!');
        setShowRejectModal(false);
        setSelectedLaporanId(null);
        window.location.reload();
      } else {
        throw new Error(result.message || 'Failed to reject laporan');
      }
    } catch (error) {
      console.error('Error rejecting laporan:', error);
      alert('Gagal reject laporan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessingFeedback(false);
    }
  };

  const formatDateForPrint = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handlePrintByDate = async () => {
    if (isPrintingApproved || !startDate || !endDate) return;
    setIsPrintingApproved(true);

    try {
      const response = await fetch(`/api/laporan-genset/print-all-approved?startDate=${startDate}&endDate=${endDate}`);
      const result = await response.json();

      if (!result.success) throw new Error(result.message || 'Failed to fetch data');

      if (result.data.length === 0) {
        alert(`Tidak ada laporan untuk rentang tanggal ${startDate} s.d. ${endDate}.`);
        setIsPrintingApproved(false);
        return;
      }

      const dataWithImages = await Promise.all(
        result.data.map(async (item: any) => {
          try {
            const laporanId = item.laporan.Id;
            const imgResponse = await fetch(`/api/laporan-genset/${laporanId}/images`);
            const imgResult = await imgResponse.json();
            if (imgResult.success && imgResult.data?.images?.length > 0) {
              const imagesWithBase64 = await Promise.all(
                imgResult.data.images.map(async (img: { filename: string; url: string }) => {
                  try {
                    const imgFetch = await fetch(img.url);
                    const blob = await imgFetch.blob();
                    return new Promise<{ filename: string; base64: string }>((resolve) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve({ filename: img.filename, base64: reader.result as string });
                      reader.readAsDataURL(blob);
                    });
                  } catch {
                    return { filename: img.filename, base64: img.url };
                  }
                })
              );
              return { ...item, images: imagesWithBase64 };
            }
            return { ...item, images: [] };
          } catch {
            return { ...item, images: [] };
          }
        })
      );

      let currentIndex = 0;
      let printWindow: Window | null = null;
      let currentBlobUrl: string | null = null;

      const printNext = () => {
        if (currentIndex >= dataWithImages.length) {
          setIsPrintingApproved(false);
          return;
        }

        const html = generateSingleReportHtml(dataWithImages[currentIndex]);
        const blob = new Blob([html], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);

        const handleAfterPrint = () => {
          currentIndex++;
          if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
          setTimeout(() => printNext(), 200);
        };

        const onPageLoad = () => {
          printWindow!.print();
          printWindow!.onafterprint = handleAfterPrint;
        };

        if (!printWindow || printWindow.closed) {
          printWindow = window.open(blobUrl, '_blank', 'width=900,height=700,toolbar=yes,scrollbars=yes,resizable=yes');
          if (!printWindow) {
            alert('Mohon izinkan pop-up window untuk mencetak');
            setIsPrintingApproved(false);
            return;
          }
          printWindow.addEventListener('load', onPageLoad);
        } else {
          const onNextLoad = () => {
            printWindow!.removeEventListener('load', onNextLoad);
            printWindow!.print();
            printWindow!.onafterprint = handleAfterPrint;
          };
          printWindow.addEventListener('load', onNextLoad);
          printWindow.location.href = blobUrl;
        }

        currentBlobUrl = blobUrl;

        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            handleAfterPrint();
          } else {
            setIsPrintingApproved(false);
          }
        }, 60000);
      };

      printNext();
    } catch (error) {
      console.error('Print all approved error:', error);
      alert('Gagal mencetak, silakan coba lagi');
      setIsPrintingApproved(false);
    }
  };

  const checklistSections = [
    { key: 'PemeriksaanGenset_SistemMesin', title: 'B. SISTEM MESIN' },
    { key: 'PemeriksaanGenset_SistemPendingin', title: 'C. SISTEM PENDINGIN' },
    { key: 'PemeriksaanGenset_SistemBahanBakar', title: 'D. SISTEM BAHAN BAKAR' },
    { key: 'PemeriksaanGenset_SistemKelistrikan', title: 'E. SISTEM KELISTRIKAN' },
    { key: 'PemeriksaanGenset_OutputListrik', title: 'F. OUTPUT LISTRIK' },
    { key: 'PemeriksaanGenset_Mingguan', title: 'G. PEMERIKSAAN MINGGUAN' },
    { key: 'PemeriksaanGenset_Bulanan', title: 'H. PEMERIKSAAN BULANAN' },
    { key: 'PemeriksaanGenset_SistemKontrol_Proteksi', title: 'I. PEMERIKSAAN SISTEM KONTROL & PROTEKSI' },
    { key: 'PemeriksaanGenset_ATS_AMF', title: 'J. PEMERIKSAAN ATS / AMF' },
    { key: 'PemeriksaanGenset_Kebersihan_Keamanan', title: 'K. KEBERSIHAN & KEAMANAN' },
  ];

  const tindakanLabelMap: Record<string, string> = {
    'Level Oli Mesin Normal': 'Level oli mesin dalam batas normal',
    'Tidak Ada Kebocoran Oli': 'Tidak ada kebocoran oli',
    'Suara Mesin Normal': 'Suara mesin normal (tidak kasar / knocking)',
    'Getaran Mesin Normal': 'Getaran mesin normal',
    'Warna Asap Normal': 'Warna asap (normal: tidak hitam/putih pekat)',
    'Level Coolant Cukup': 'Level coolant / air radiator cukup',
    'Tidak Ada Kebocoran Radiator': 'Tidak ada kebocoran radiator / selang',
    'Kipas Radiator Normal': 'Kipas radiator berfungsi normal',
    'Temperatur Mesin Normal': 'Temperatur mesin normal',
    'Level Solar Cukup': 'Level Solar mencukupi',
    'Tidak Ada Kebocoran Pipa': 'Tidak ada kebocoran pada pipa / tangki',
    'Filter Solar Baik': 'Filter solar dalam kondisi baik',
    'Tegangan Baterai Normal': 'Tegangan baterai normal',
    'Terminal Baterai Bersih': 'Terminal baterai bersih dan kencang',
    'Panel Kontrol Normal': 'Panel kontrol normal',
    'Tidak Ada Alarm Fault': 'Tidak ada alarm / fault',
    'Tegangan Output Stabil': 'Tegangan output stabil (380 - 400 v)',
    'Frekuensi Stabil': 'Frekuensi stabil (50 Hz)',
    'Arus Beban Aman': 'Arus beban dalam batas aman',
    'Faktor Daya Normal': 'Faktor daya normal',
    'Test Run Tanpa Beban': 'Test run tanpa beban (15 menit)',
    'Test Run Dengan Beban': 'Test run dengan beban (jika memungkinkan)',
    'Pemeriksaan Kondisi Belt': 'Pemeriksaan kondisi belt',
    'Pembersihan Area Genset': 'Pembersihan area genset',
    'Pengecekan Oli Mesin': 'Pengecekan oli mesin',
    'Pemeriksaan Filter Oli': 'Pemeriksaan filter oli',
    'Pemeriksaan Filter Udara': 'Pemeriksaan filter udara',
    'Pemeriksaan Filter Bahan Bakar': 'Pemeriksaan filter bahan bakar',
    'Overload Protection Berfungsi': 'Overload protection berfungsi',
    'Over/Under Voltage Protection': 'Over/Under voltage protection',
    'Over Temperature Shutdown': 'Over temperature shutdown',
    'Low Oil Pressure Shutdown': 'Low oil pressure shutdown',
    'Emergency Stop Berfungsi': 'Emergency stop berfungsi',
    'ATS Berpindah Otomatis': 'ATS berpindah otomatis saat PLN padam',
    'ATS Kembali Normal': 'ATS kembali normal saat PLN hidup',
    'Waktu Transfer Sesuai Standar': 'Waktu transfer sesuai standar',
    'Area Genset Bersih': 'Area genset bersih dari debu dan oli',
    'Ventilasi Ruangan Baik': 'Ventilasi ruangan baik',
    'Tidak Ada Material Mudah Terbakar': 'Tidak ada material mudah terbakar di sekitar genset',
    'APAR Tersedia Dan Siap Pakai': 'APAR tersedia dan siap pakai',
  };

  const generateSingleReportHtml = (item: any) => {
    const l = item.laporan;
    const checklistHtml = checklistSections.map((section) => `
      <div class="section-wrapper">
        <div class="section-title-wrapper">
          <h3 class="section-title">${section.title}</h3>
        </div>
        ${(item[section.key] || []).map((p: any) => `
          <div class="checkbox-item ${p.Check ? 'checked' : ''}">
            <input type="checkbox" ${p.Check ? 'checked' : ''} readonly>
            <span>${tindakanLabelMap[p.Tindakan] || p.Tindakan || '-'}</span>
          </div>
        `).join('') || ''}
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>LAPORAN PEMERIKSAAN GENSET - ${l.TanggalPemeriksaan ? formatDateForPrint(l.TanggalPemeriksaan) : 'Laporan'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
            margin: 0; padding: 1.5cm;
            background: white; color: black;
            font-size: 11pt; line-height: 1.4; font-weight: 400;
          }
          .print-container { max-width: 100%; margin: 0 auto; }
          .section-wrapper { margin-bottom: 25px; }
          .section-title-wrapper { page-break-after: avoid; break-after: avoid; }
          .section-title {
            font-size: 13pt; font-weight: 700; color: #000;
            margin-bottom: 12px; padding: 8px 12px;
            background-color: #f5f5f5; border-left: 4px solid #000;
            page-break-after: avoid; break-after: avoid;
          }
          .header {
            text-align: center; margin-bottom: 30px;
            page-break-after: avoid; break-after: avoid;
          }
          .header h2 {
            font-size: 18pt; font-weight: 700; color: #000;
            margin-bottom: 8px; text-transform: uppercase;
          }
          .header p { font-size: 10pt; color: #000; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          td {
            border: 1px solid #000; padding: 8px 10px;
            font-size: 10pt; vertical-align: top; color: #000;
          }
          .label-table td:first-child { width: 30%; background-color: #f5f5f5; font-weight: 600; color: #000; }
          .label-table td:last-child { background-color: #fff; color: #000; }
          .print-textarea {
            border: 1px solid #000; padding: 8px 10px; min-height: 80px;
            font-size: 10pt; line-height: 1.4; color: #000; background-color: #fff;
            page-break-inside: avoid; break-inside: avoid;
          }
          .checkbox-item {
            display: flex; align-items: center; margin-bottom: 8px;
            page-break-inside: avoid; break-inside: avoid;
          }
          .checkbox-item input[type="checkbox"] { margin-right: 8px; accent-color: #000; }
          .checkbox-item.checked input[type="checkbox"] { accent-color: #000; }
          .checkbox-item.checked input[type="checkbox"]:checked { background-color: #000; border-color: #000; }
          .image-gallery { display: grid; grid-template-columns: 1fr; gap: 20px; margin: 10px 0; }
          .image-item { border: 1px solid #000; padding: 10px; text-align: center; page-break-inside: avoid; break-inside: avoid; background: #fff; }
          .image-item img { max-width: 100%; max-height: 450px; height: auto; width: auto; object-fit: contain; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto; }
          .image-item p { font-size: 9pt; margin: 8px 0 0 0; word-break: break-word; color: #000; font-weight: normal; display: none; }
          @media print {
            body { margin: 1.5cm; font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            td { color: #000 !important; font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .label-table td:last-child { background-color: #fff !important; color: #000 !important; font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .section-title { color: #000 !important; background-color: #f5f5f5 !important; font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important; }
            .print-textarea { color: #000 !important; font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important; }
            .checkbox-item { color: #000 !important; font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important; }
            .image-gallery { display: grid !important; grid-template-columns: 1fr !important; gap: 20px !important; }
            .image-item { border: 1px solid #000 !important; padding: 10px !important; text-align: center !important; page-break-inside: avoid !important; break-inside: avoid !important; background: white !important; }
            .image-item img { max-width: 100% !important; max-height: 450px !important; height: auto !important; width: auto !important; object-fit: contain !important; display: block !important; margin: 0 auto 10px !important; border: none !important; }
            .image-item p { font-size: 9pt !important; margin: 8px 0 0 0 !important; word-break: break-word !important; color: #000 !important; font-weight: normal !important; display: none !important; }
          }
          @page { size: A4; margin: 0.5cm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
          <h2>DETAIL LAPORAN PEMERIKSAAN GENSET</h2>
          <p>LAPORAN PEMERIKSAAN HARIAN GENSET</p>
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">A. INFORMASI PEMERIKSAAN</h3>
          </div>
          <table class="label-table">
            <tr><td>Tanggal Pemeriksaan</td><td>${l.TanggalPemeriksaan ? formatDateForPrint(l.TanggalPemeriksaan) : '-'}</td></tr>
            <tr><td>Jam Operasi</td><td>${l.JamOperasi || '-'}</td></tr>
            <tr><td>Operator</td><td>${l.Operator || '-'}</td></tr>
          </table>
        </div>

        ${checklistHtml}

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">L. CATATAN DAN TEMUAN</h3>
          </div>
          <div class="print-textarea">${(l.CatatandanTemuan || '-').replace(/\n/g, '<br>')}</div>
        </div>

        ${item.images && item.images.length > 0 ? `
        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">M. ATTACHMENT</h3>
          </div>
          <div class="image-gallery">
            ${item.images.map((img: any, i: number) => `
              <div class="image-item">
                <img src="${img.base64}" alt="Attachment ${i + 1}" />
                <p>${img.filename}</p>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${(l.StatusLaporanId === 5 || l.StatusLaporanId === 6) ? `
        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">N. FEEDBACK</h3>
          </div>
          <div class="print-textarea" style="background-color: #f9fafb; border-left: 4px solid #ef4444; padding: 8px; margin: 4px 0;">${(l.Feedback || '-').replace(/\n/g, '<br>')}</div>
          <table class="label-table" style="margin-top: 10px;">
            <tr><td>Approve By</td><td>${l.ApprovedBy || '-'}</td></tr>
            <tr><td>Approve Date</td><td>${l.ApprovedDate ? new Date(l.ApprovedDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</td></tr>
          </table>
        </div>
        ` : ''}
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6">
      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Data Laporan Pemeriksaan Genset
            </h3>
            <div className="flex items-center space-x-2">
              {userLevelId === 1 && (
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSearch?.(); }}
                    placeholder="Cari operator..."
                    className="pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                  />
                  <svg
                    className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                />
                <span className="text-gray-500 text-sm">s.d.</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  onClick={handlePrintByDate}
                  disabled={isPrintingApproved}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isPrintingApproved
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  {isPrintingApproved ? 'Memproses...' : 'Cetak per Rentang Tanggal'}
                </button>
              </div>
              <button
                onClick={handleAddLaporan}
                className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                + Tambah Laporan
              </button>
            </div>
          </div>
          {activeFilter !== 'all' && (
            <div className="px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Filter status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {activeFilter === 'pending' ? 'Pending' : activeFilter === 'approved' ? 'Disetujui' : 'Ditolak'}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jam Operasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catatan & Temuan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dibuat Oleh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <p>Belum ada data laporan pemeriksaan genset.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((laporan) => (
                  <tr key={laporan.Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(laporan.TanggalPemeriksaan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(laporan.JamOperasi)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {laporan.Operator}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {laporan.CatatandanTemuan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(laporan.StatusLaporanId)}`}>
                        {laporan.StatusLaporan || getStatusName(laporan.StatusLaporanId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {laporan.CreatedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {(() => {
                        if (laporan.Id === -1) return null;

                        const isLevel1 = userLevelId === 1;
                        const laporanIsPending = isPending(laporan.StatusLaporanId || 0);
                        const laporanIsEditable = isAdminEditable(laporan.StatusLaporanId) || isManagerEditable(laporan.StatusLaporanId);

                        if (isLevel1) {
                          if (laporanIsPending) {
                            return (
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => handleApproveLaporan(laporan.Id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectLaporan(laporan.Id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleDetailLaporan(laporan.Id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                                >
                                  Detail
                                </button>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex justify-center">
                                <button
                                  onClick={() => handleDetailLaporan(laporan.Id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                                >
                                  Detail
                                </button>
                              </div>
                            );
                          }
                        }

                        if (!isLevel1) {
                          if (laporanIsEditable) {
                            return (
                              <div className="flex justify-center">
                                <button
                                  onClick={() => handleEditLaporan(laporan.Id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors duration-200"
                                >
                                  Edit
                                </button>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex justify-center">
                                <button
                                  onClick={() => handleDetailLaporan(laporan.Id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                                >
                                  Detail
                                </button>
                              </div>
                            );
                          }
                        }

                        return null;
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalRecords={pagination.totalRecords}
        onPageChange={onPageChange}
        hasNext={pagination.hasNext}
        hasPrev={pagination.hasPrev}
        limit={7}
      />

      {/* Modals */}
      {showModal && (
        <TambahLaporanGensetFormAdvanced
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            window.location.reload();
          }}
        />
      )}

      {showEditModal && selectedLaporanId && (
        <EditLaporanGensetFormAdvanced
          laporanId={selectedLaporanId}
          onClose={handleCloseEditModal}
          onSuccess={() => {
            handleCloseEditModal();
            window.location.reload();
          }}
        />
      )}

      {showDetailModal && selectedLaporanId && (
        <DetailLaporanGensetForm
          laporanId={selectedLaporanId}
          onClose={handleCloseDetailModal}
          onSuccess={() => {
            handleCloseDetailModal();
            window.location.reload();
          }}
        />
      )}

      {/* Modal Approve Feedback */}
      <FeedbackModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onSubmit={handleApproveSubmit}
        title="Setujui Laporan"
        message="Apakah Anda yakin ingin menyetujui laporan genset ini? Berikan feedback untuk pembuat laporan."
        submitButtonText="Approve"
        submitButtonColor="bg-green-600 text-white"
        placeholder="Masukkan alasan persetujuan atau catatan tambahan..."
        isLoading={isProcessingFeedback}
      />

      {/* Modal Reject Feedback */}
      <FeedbackModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onSubmit={handleRejectSubmit}
        title="Tolak Laporan"
        message="Apakah Anda yakin ingin menolak laporan genset ini? Berikan feedback untuk pembuat laporan."
        submitButtonText="Reject"
        submitButtonColor="bg-red-600 text-white"
        placeholder="Masukkan alasan penolakan atau catatan perbaikan..."
        isLoading={isProcessingFeedback}
      />
    </div>
  );
}
