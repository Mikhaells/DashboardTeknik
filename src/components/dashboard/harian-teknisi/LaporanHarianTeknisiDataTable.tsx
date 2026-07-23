'use client';

import { useState } from 'react';
import { LaporanHarianTeknisi, LaporanHarianTeknisiPagination } from '@/lib/laporan-harian-teknisi';
import { PENDING_STATUSES } from '@/lib/status';
import Pagination from '@/components/dashboard/Pagination';
import FeedbackModal from '@/components/dashboard/FeedbackModal';

interface LaporanHarianTeknisiDataTableProps {
  data: LaporanHarianTeknisi[];
  pagination: LaporanHarianTeknisiPagination;
  onPageChange: (page: number) => void;
  userLevelId?: number;
  username?: string;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onSearch?: () => void;
  activeFilter?: string;
}

export default function LaporanHarianTeknisiDataTable({
  data,
  pagination,
  onPageChange,
  userLevelId = 2,
  username = '',
  searchTerm = '',
  onSearchChange,
  onSearch,
  activeFilter = 'all'
}: LaporanHarianTeknisiDataTableProps) {
  
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLaporanId, setSelectedLaporanId] = useState<number | null>(null);
  const [isProcessingFeedback, setIsProcessingFeedback] = useState(false);
  const [isPrintingApproved, setIsPrintingApproved] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    return timeString;
  };

  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case 1:
        return 'bg-gray-100 text-gray-800';
      case 2:
        return 'bg-yellow-100 text-yellow-800';
      case 3:
        return 'bg-blue-100 text-blue-800';
      case 4:
        return 'bg-orange-100 text-orange-800';
      case 5:
        return 'bg-green-100 text-green-800';
      case 6:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  
  const handleView = (id: number) => {
    window.location.href = `/dashboard/harian-teknisi/${id}`;
  };

  const handleApproveLaporan = (id: number) => {
    setSelectedLaporanId(id);
    setShowApproveModal(true);
  };

  const handleRejectLaporan = (id: number) => {
    setSelectedLaporanId(id);
    setShowRejectModal(true);
  };

  const handleApproveSubmit = async (feedback: string) => {
    if (!selectedLaporanId) return;
    
    try {
      setIsProcessingFeedback(true);
      
      const response = await fetch(`/api/laporan-harian-teknisi/${selectedLaporanId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Feedback: feedback,
          ApproveBy: username
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Laporan harian teknisi berhasil di-approve!');
        setShowApproveModal(false);
        setSelectedLaporanId(null);
        onPageChange(pagination.currentPage);
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
      
      const response = await fetch(`/api/laporan-harian-teknisi/${selectedLaporanId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Feedback: feedback,
          ApproveBy: username
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Laporan harian teknisi berhasil di-reject!');
        setShowRejectModal(false);
        setSelectedLaporanId(null);
        onPageChange(pagination.currentPage);
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

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus laporan ini?')) {
      try {
        const response = await fetch(`/api/laporan-harian-teknisi/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Refresh data
          onPageChange(pagination.currentPage);
        } else {
          alert('Gagal menghapus laporan');
        }
      } catch (error) {
        console.error('Error deleting laporan:', error);
        alert('Terjadi kesalahan saat menghapus laporan');
      }
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
      const response = await fetch(`/api/laporan-harian-teknisi/print-all-approved?startDate=${startDate}&endDate=${endDate}`);
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
            const imgResponse = await fetch(`/api/laporan-harian-teknisi/${laporanId}/images`);
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

  const generateSingleReportHtml = (item: any) => {
    const l = item.laporan;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>LAPORAN HARIAN TEKNISI - ${l.TanggalPengoperasian ? formatDateForPrint(l.TanggalPengoperasian) : 'Laporan'}</title>
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
          <h2>DETAIL LAPORAN HARIAN TEKNISI</h2>
          <p>LAPORAN HARIAN TEKNISI</p>
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">A. INFORMASI LAPORAN</h3>
          </div>
          <table class="label-table">
            <tr>
              <td>Operator</td>
              <td>${l.Operator || '-'}</td>
            </tr>
            <tr>
              <td>Tanggal Pengoperasian</td>
              <td>${l.TanggalPengoperasian ? l.TanggalPengoperasian.substring(0, 10) : '-'}</td>
            </tr>
            <tr>
              <td>Jam Operasional</td>
              <td>${l.JamOperasional || '-'}</td>
            </tr>
            <tr>
              <td>Profesi</td>
              <td>${l.Profesi || '-'}</td>
            </tr>
            <tr>
              <td>Sistem</td>
              <td>${l.Sistem || '-'}</td>
            </tr>
            <tr>
              <td>Lokasi Produksi</td>
              <td>${l.LokasiProduksi || '-'}</td>
            </tr>
          </table>
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">B. PRA PRODUKSI</h3>
          </div>
          ${(item.PraProduksi || []).map((p: any) => `
            <div class="checkbox-item ${p.checked ? 'checked' : ''}">
              <input type="checkbox" ${p.checked ? 'checked' : ''} readonly>
              <span>${p.NamaKegiatan || '-'}</span>
            </div>
          `).join('') || ''}
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">C. PRODUKSI</h3>
          </div>
          ${(item.Produksi || []).map((p: any) => `
            <div class="checkbox-item ${p.checked ? 'checked' : ''}">
              <input type="checkbox" ${p.checked ? 'checked' : ''} readonly>
              <span>${p.NamaKegiatan || '-'}</span>
            </div>
          `).join('') || ''}
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">D. PASCA PRODUKSI</h3>
          </div>
          ${(item.PascaProduksi || []).map((p: any) => `
            <div class="checkbox-item ${p.checked ? 'checked' : ''}">
              <input type="checkbox" ${p.checked ? 'checked' : ''} readonly>
              <span>${p.NamaKegiatan || '-'}</span>
            </div>
          `).join('') || ''}
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">E. CATATAN & EVALUASI</h3>
          </div>
          <div class="print-textarea">${(l.Catatan_Evaluasi || '-').replace(/\n/g, '<br>')}</div>
        </div>

        ${item.images && item.images.length > 0 ? `
        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">F. ATTACHMENT</h3>
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
            <h3 class="section-title">G. FEEDBACK</h3>
          </div>
          <div class="print-textarea" style="background-color: #f9fafb; border-left: 4px solid #ef4444; padding: 8px; margin: 4px 0;">${(l.Feedback || '-').replace(/\n/g, '<br>')}</div>
          <table class="label-table" style="margin-top: 10px;">
            <tr>
              <td>Approve By</td>
              <td>${l.ApproveBy || '-'}</td>
            </tr>
            <tr>
              <td>Approve Date</td>
              <td>${l.ApproveDate ? new Date(l.ApproveDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</td>
            </tr>
          </table>
        </div>
        ` : ''}
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Data Laporan Harian Teknisi
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
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                {isPrintingApproved ? 'Memproses...' : 'Cetak per Rentang Tanggal'}
              </button>
            </div>
            <button
              onClick={() => window.location.href = '/dashboard/harian-teknisi/create'}
              className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Tambah Laporan
            </button>
          </div>
        </div>
        {activeFilter !== 'all' && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-500">Filter status:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFilter === 'pending' ? 'Pending' : activeFilter === 'approved' ? 'Disetujui' : 'Ditolak'}
            </span>
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
                Jam
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operator
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sistem
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lokasi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profesi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.Id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(item.TanggalPengoperasian)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTime(item.JamOperasional)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.Operator}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.Sistem}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.LokasiProduksi}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.Profesi || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.StatusLaporanId)}`}>
                    {item.Status || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {(() => {
                    if (item.Id === -1) return null;

                    const isLevel1 = userLevelId === 1;
                    const laporanIsPending = PENDING_STATUSES.includes(item.StatusLaporanId);
                    const canEdit = userLevelId === 1 || (username && item.CreateBy === username);

                    if (isLevel1) {
                      if (laporanIsPending) {
                        return (
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleApproveLaporan(item.Id)}
                              className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectLaporan(item.Id)}
                              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleView(item.Id)}
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
                              onClick={() => handleView(item.Id)}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                            >
                              Detail
                            </button>
                          </div>
                        );
                      }
                    }

                    if (!isLevel1) {
                      if (canEdit && laporanIsPending) {
                        return (
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleDelete(item.Id)}
                              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => handleView(item.Id)}
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
                              onClick={() => handleView(item.Id)}
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
            ))}
          </tbody>
        </table>
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

      {/* Modal Approve Feedback */}
      <FeedbackModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onSubmit={handleApproveSubmit}
        title="Setujui Laporan"
        message="Apakah Anda yakin ingin menyetujui laporan harian teknisi ini? Berikan feedback untuk pembuat laporan."
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
        message="Apakah Anda yakin ingin menolak laporan harian teknisi ini? Berikan feedback untuk pembuat laporan."
        submitButtonText="Reject"
        submitButtonColor="bg-red-600 text-white"
        placeholder="Masukkan alasan penolakan atau catatan perbaikan..."
        isLoading={isProcessingFeedback}
      />
    </div>
  );
}
