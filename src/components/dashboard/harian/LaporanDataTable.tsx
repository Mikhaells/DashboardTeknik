'use client';

import { useState, useEffect } from 'react';
import { LaporanHarian } from '@/lib/dashboard';
import { getStatusName, getStatusColor, isPending, isApproved, isRejected, isEditable } from '@/lib/status';
import Pagination from '../Pagination';
import { Button } from '@/components/ui/Button';
import TambahLaporanForm from './TambahLaporanForm';
import DetailLaporanForm from './DetailLaporanForm';
import EditLaporanForm from './EditLaporanForm';
import FeedbackModal from '../FeedbackModal';

interface LaporanDataTableProps {
  data: LaporanHarian[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange: (page: number) => void;
  userLevelId?: number; // Add user levelId prop
}

export default function LaporanDataTable({ data, pagination, onPageChange, userLevelId = 2 }: LaporanDataTableProps) {
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

  const handleAddLaporan = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    // Restore body scroll
    document.body.style.overflow = '';
    setShowModal(false);
  };

  const handleSubmitLaporan = async (formData: any) => {
    try {
      // TODO: Implement API call to save laporan
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert('Laporan berhasil disimpan!');
      
      // TODO: Refresh data or navigate
      window.location.reload(); // Temporary solution
    } catch (error) {
      console.error('Error saving laporan:', error);
      alert('Gagal menyimpan laporan, silakan coba lagi');
    }
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5); // HH:MM format
  };

  
  const handleApprove = (laporanId: number) => {
    setSelectedLaporanId(laporanId);
    setShowApproveModal(true);
  };

  const handleReject = (laporanId: number) => {
    setSelectedLaporanId(laporanId);
    setShowRejectModal(true);
  };

  const handleApproveSubmit = async (feedback: string) => {
    if (!selectedLaporanId) return;
    
    try {
      setIsProcessingFeedback(true);
      
      const response = await fetch(`/api/laporan/${selectedLaporanId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Laporan berhasil di-approve!');
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
      
      const response = await fetch(`/api/laporan/${selectedLaporanId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Laporan berhasil di-reject!');
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

  const handleEdit = (laporanId: number) => {
    setSelectedLaporanId(laporanId);
    setShowEditModal(true);
  };

  const handleDetail = (laporanId: number) => {
    setSelectedLaporanId(laporanId);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    // Restore body scroll
    document.body.style.overflow = '';
    setShowDetailModal(false);
    setSelectedLaporanId(null);
    // Refresh dashboard to update any changes
    window.location.reload();
  };

  const handleCloseEditModal = () => {
    // Restore body scroll
    document.body.style.overflow = '';
    setShowEditModal(false);
    setSelectedLaporanId(null);
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateForPrint = (dateString: string) => {
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const handlePrintByDate = async () => {
    if (isPrintingApproved || !startDate || !endDate) return;
    setIsPrintingApproved(true);

    try {
      const response = await fetch(`/api/laporan/print-all-approved?startDate=${startDate}&endDate=${endDate}`);
      const result = await response.json();

      if (!result.success) throw new Error(result.message || 'Failed to fetch data');

      if (result.data.length === 0) {
        alert(`Tidak ada laporan untuk rentang tanggal ${startDate} s.d. ${endDate}.`);
        setIsPrintingApproved(false);
        return;
      }

      let currentIndex = 0;
      let printWindow: Window | null = null;
      let currentBlobUrl: string | null = null;

      const printNext = () => {
        if (currentIndex >= result.data.length) {
          setIsPrintingApproved(false);
          return;
        }

        const html = generateSingleReportHtml(result.data[currentIndex]);
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
        <title>LAPORAN KEGIATAN HARIAN - ${l.Tanggal ? formatDateForPrint(l.Tanggal) : 'Laporan'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 1.5cm;
            background: white;
            color: black;
            font-size: 11pt;
            line-height: 1.4;
          }
          .section-wrapper { margin-bottom: 25px; }
          .section-title-wrapper { page-break-after: avoid; break-after: avoid; }
          .section-title {
            font-size: 13pt; font-weight: 700; margin: 0 0 12px 0;
            padding-bottom: 5px; border-bottom: 2px solid #000;
            text-transform: uppercase; letter-spacing: 0.5px;
          }
          .header {
            text-align: center; border-bottom: 2px solid #000;
            padding-bottom: 15px; margin-bottom: 20px;
            page-break-after: avoid; break-after: avoid;
          }
          .header h2 { font-size: 16pt; font-weight: 700; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { font-size: 11pt; font-weight: 500; letter-spacing: 0.3px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td {
            border: 1px solid #000; padding: 8px 10px;
            text-align: left; vertical-align: top;
          }
          th { background-color: #f5f5f5; font-weight: 700; font-size: 10pt; }
          td { font-size: 10pt; }
          .label-table td:first-child { width: 30%; background-color: #f5f5f5; font-weight: 600; }
          table tr { page-break-inside: avoid; break-inside: avoid; }
          .print-textarea {
            border: 1px solid #000; padding: 8px 10px; min-height: 80px;
            background: white; margin-bottom: 20px;
            white-space: pre-wrap; word-wrap: break-word; font-size: 10pt; line-height: 1.4;
          }
          .no-data { text-align: center; padding: 20px; font-style: italic; font-size: 10pt; }
          .text-center { text-align: center; }
          .flex { display: flex; }
          .gap-4 { gap: 20px; }
          @media print {
            body { margin: 1.5cm; color: #000 !important; background: #fff !important; }
            th { background-color: #f5f5f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .label-table td:first-child { background-color: #f5f5f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            * { color: #000 !important; }
          }
          @page { size: A4; margin: 0.5cm; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>DETAIL LAPORAN HARIAN</h2>
          <p>TECHNICAL DIRECTOR PRODUKSI & PENYIARAN</p>
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">A. IDENTITAS LAPORAN</h3>
          </div>
          <table class="label-table">
            <tr>
              <td>Tanggal</td>
              <td>${formatDateForDisplay(l.Date)}</td>
            </tr>
            <tr>
              <td>Waktu Produksi</td>
              <td>
                <div class="flex gap-4">
                  <span><strong>Start:</strong> ${(l.Start || '').substring(0, 5) || '-'}</span>
                  <span><strong>Stop:</strong> ${(l.Stop || '').substring(0, 5) || '-'}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td>Nama Program / Kegiatan</td>
              <td>
                <strong>${l.Kegiatan || '-'}</strong><br>
                <small>${l.Kegiatan_Desc || ''}</small>
              </td>
            </tr>
            <tr>
              <td>Jenis Produksi</td>
              <td>
                <strong>${l.Jenis || '-'}</strong><br>
                <small>${l.JenisKegiatan_Desc || ''}</small>
              </td>
            </tr>
            <tr>
              <td>Lokasi</td>
              <td>${l.Location || '-'}</td>
            </tr>
            <tr>
              <td>Technical Director</td>
              <td>${l.TechnicalDirector || '-'}</td>
            </tr>
            <tr>
              <td>Shift Kerja</td>
              <td>
                <strong>${l.Shift || '-'}</strong><br>
                <small>${l.ShiftKerja_Desc || ''}</small>
              </td>
            </tr>
          </table>
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">B. RINGKASAN KEGIATAN</h3>
          </div>
          <div class="print-textarea">${(l.Ringkasan || '-').replace(/\n/g, '<br>')}</div>
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">C. PERALATAN YANG DIGUNAKAN</h3>
          </div>
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
              ${item.peralatan.length === 0 ? `
                <tr>
                  <td colspan="4" class="no-data">Tidak ada data peralatan</td>
                </tr>
              ` : item.peralatan.map((p: any, i: number) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td>${p.Peralatan || '-'}</td>
                  <td>${p.Condition || '-'}</td>
                  <td>${p.Desc || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">D. KONDISI SIARAN/PRODUKSI</h3>
          </div>
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
              ${item.kondisiSiaran.length === 0 ? `
                <tr>
                  <td colspan="4" class="no-data">Tidak ada data kondisi siaran</td>
                </tr>
              ` : item.kondisiSiaran.map((k: any, i: number) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td>${k.Aspek || '-'}</td>
                  <td>${k.Status || '-'}</td>
                  <td>${k.Desc || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">E. GANGGUAN/KENDALA TEKNIS</h3>
          </div>
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
              ${item.gangguanTeknis.length === 0 ? `
                <tr>
                  <td colspan="6" class="no-data">Tidak ada data gangguan teknis</td>
                </tr>
              ` : item.gangguanTeknis.map((g: any, i: number) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td>${(g.Time || '').substring(0, 5) || '-'}</td>
                  <td>${g.Peralatan || '-'}</td>
                  <td>${g.JenisGanguan || '-'}</td>
                  <td>${g.TindakanPerbaikan || '-'}</td>
                  <td>${g.Status || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">F. TINDAKAN KOORDINASI</h3>
          </div>
          <div class="print-textarea">${(l.TindakanKoordinasi || '-').replace(/\n/g, '<br>')}</div>
        </div>

        <div class="section-wrapper">
          <div class="section-title-wrapper">
            <h3 class="section-title">G. CATATAN KHUSUS</h3>
          </div>
          <div class="print-textarea">${(l.CatatanKhusus || '-').replace(/\n/g, '<br>')}</div>
        </div>
      </body>
      </html>
    `;
  };

  const handleEditSubmit = async (formData: any) => {
    try {
      // Show loading state
      const loadingAlert = document.createElement('div');
      loadingAlert.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
      loadingAlert.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <div class="flex items-center">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span class="text-gray-700">Sedang memperbarui laporan...</span>
          </div>
        </div>
      `;
      document.body.appendChild(loadingAlert);
      
      // Call API to update laporan
      const response = await fetch(`/api/laporan/${selectedLaporanId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      // Remove loading
      document.body.removeChild(loadingAlert);
      
      if (result.success) {
        alert('Laporan berhasil diperbarui!');
        handleCloseEditModal();
        // Refresh data without full page reload
        window.location.reload();
      } else {
        throw new Error(result.message || 'Failed to update laporan');
      }
      
    } catch (error) {
      console.error('Error updating laporan:', error);
      alert('Gagal memperbarui laporan, silakan coba lagi');
    }
  };

  const getActionButtons = (laporan: LaporanHarian) => {
    if (laporan.Id === -1) return null;

    const isLevel1 = userLevelId === 1;
    const laporanIsPending = isPending(laporan.StatusId || 0);
    const laporanIsApproved = isApproved(laporan.StatusId || 0);
    const laporanIsEditable = isEditable(laporan.StatusId || 0);

    // Level 1 Admin logic
    if (isLevel1) {
      if (laporanIsPending) {
        // Level 1 + Pending = Approve, Reject, Detail
        return (
          <div className="flex gap-1 justify-center">
            <button
              onClick={() => handleApprove(laporan.Id)}
              className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(laporan.Id)}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
            >
              Reject
            </button>
            <button
              onClick={() => handleDetail(laporan.Id)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Detail
            </button>
          </div>
        );
      } else {
        // Level 1 + Not Pending = Detail only
        return (
          <div className="flex justify-center">
            <button
              onClick={() => handleDetail(laporan.Id)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Detail
            </button>
          </div>
        );
      }
    }

    // Non-Level 1 User logic
    if (!isLevel1) {
      if (laporanIsEditable) {
        // Not Level 1 + Editable (Draft, Pending, Revision, Rejected) = Edit only
        return (
          <div className="flex justify-center">
            <button
              onClick={() => handleEdit(laporan.Id)}
              className="px-3 py-1.5 text-xs font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors duration-200"
            >
              Edit
            </button>
          </div>
        );
      } else {
        // Not Level 1 + Not Editable (Approved, Processing, Completed, Cancelled, Expired) = Detail only
        return (
          <div className="flex justify-center">
            <button
              onClick={() => handleDetail(laporan.Id)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Detail
            </button>
          </div>
        );
      }
    }

    return null;
  };

  // Add placeholder rows to maintain consistent table height
  const getDisplayData = () => {
    const maxRows = 5;
    const displayData = [...data];
    const remainingRows = maxRows - data.length;
    
    // Add placeholder rows if data is less than maxRows
    for (let i = 0; i < remainingRows; i++) {
      displayData.push({
        Id: -1, // Negative ID to identify placeholder
        Date: '',
        Start: '',
        Stop: '',
        KegiatanId: 0,
        JenisKegiatanId: 0,
        Location: '',
        TechnicalDirector: '',
        ShiftId: 0,
        Ringkasan: '',
        TindakanKoordinasi: '',
        CatatanKhusus: '',
        StatusId: 0,
        Feedback: '',
        CreateBy: '',
        ApproveBy: '',
        CreatedDate: '',
        ApproveDate: '',
        Kegiatan_Id: 0,
        Kegiatan: '',
        Kegiatan_Desc: '',
        JenisKegiatan_Id: 0,
        Jenis: '',
        JenisKegiatan_Desc: '',
        ShiftKerja_Id: 0,
        Shift: '',
        ShiftKerja_Desc: '',
        StatusLaporan_Id: 0,
        Status: '',
        StatusLaporan_Desc: '',
      } as LaporanHarian);
    }
    
    return displayData;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6 w-full max-w-[90vw] lg:max-w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Data Laporan Harian
            </h3>
            <div className="flex gap-2">
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
                <Button
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
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  {isPrintingApproved ? 'Memproses...' : 'Cetak per Rentang Tanggal'}
                </Button>
              </div>
              <Button
                onClick={handleAddLaporan}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Tambah Laporan
              </Button>
            </div>
          </div>
          
          <div className="text-center text-gray-500 py-8">
            <p>Belum ada data laporan harian.</p>
            <p className="text-sm mt-2">Klik "Tambah Laporan" untuk membuat laporan pertama.</p>
          </div>
        </div>
        
        {/* Modal Tambah Laporan */}
        {showModal && (
          <TambahLaporanForm
            onClose={handleCloseModal}
            onSubmit={handleSubmitLaporan}
            onAjukan={handleSubmitLaporan}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6 w-full max-w-[90vw] lg:max-w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Data Laporan Harian
            </h3>
            <div className="flex gap-2">
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
                <Button
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
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  {isPrintingApproved ? 'Memproses...' : 'Cetak per Rentang Tanggal'}
                </Button>
              </div>
              <Button
                onClick={handleAddLaporan}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Tambah Laporan
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
          <div className="min-h-[400px]">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Waktu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                    Kegiatan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                    Jenis Kegiatan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Lokasi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Shift
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                    Technical Director
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 transition-all duration-300 ease-in-out">
                {getDisplayData().map((laporan, index) => {
                  const isPlaceholder = laporan.Id === -1;
                  return (
                    <tr 
                      key={laporan.Id === -1 ? `placeholder-${index}` : laporan.Id} 
                      className={`transition-all duration-300 ease-in-out ${
                        isPlaceholder ? 'opacity-0' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[100px]">
                        {isPlaceholder ? '-' : formatDate(laporan.Date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[120px]">
                        {isPlaceholder ? '-' : `${formatTime(laporan.Start)} - ${formatTime(laporan.Stop)}`}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[150px]">
                        {isPlaceholder ? (
                          '-'
                        ) : (
                          <div>
                            <div className="font-medium">{laporan.Kegiatan}</div>
                            <div className="text-gray-500 text-xs">{laporan.Kegiatan_Desc}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[150px]">
                        {isPlaceholder ? (
                          '-'
                        ) : (
                          <div>
                            <div className="font-medium">{laporan.Jenis}</div>
                            <div className="text-gray-500 text-xs">{laporan.JenisKegiatan_Desc}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[120px]">
                        {isPlaceholder ? '-' : laporan.Location}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[120px]">
                        {isPlaceholder ? (
                          '-'
                        ) : (
                          <div>
                            <div className="font-medium">{laporan.Shift}</div>
                            <div className="text-gray-500 text-xs">{laporan.ShiftKerja_Desc}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap w-[100px]">
                        {isPlaceholder ? (
                          '-'
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(laporan.StatusId || 0)}`}>
                            {getStatusName(laporan.StatusId || 0)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[150px]">
                        {isPlaceholder ? '-' : laporan.TechnicalDirector}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm w-[200px]">
                        {isPlaceholder ? '-' : getActionButtons(laporan)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalRecords={pagination.totalRecords}
        hasNext={pagination.hasNext}
        hasPrev={pagination.hasPrev}
        onPageChange={onPageChange}
      />
      
      {/* Modal Tambah Laporan */}
      {showModal && (
        <TambahLaporanForm
          onClose={handleCloseModal}
          onSubmit={handleSubmitLaporan}
          onAjukan={handleSubmitLaporan}
        />
      )}

      {/* Modal Detail Laporan */}
      {showDetailModal && selectedLaporanId && (
        <DetailLaporanForm
          laporanId={selectedLaporanId}
          onClose={handleCloseDetailModal}
        />
      )}

      {/* Modal Edit Laporan */}
      {showEditModal && selectedLaporanId && (
        <EditLaporanForm
          laporanId={selectedLaporanId}
          onClose={handleCloseEditModal}
          onSubmit={handleEditSubmit}
        />
      )}

      {/* Modal Approve Feedback */}
      <FeedbackModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onSubmit={handleApproveSubmit}
        title="Setujui Laporan"
        message="Apakah Anda yakin ingin menyetujui laporan ini? Berikan feedback untuk pembuat laporan."
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
        message="Apakah Anda yakin ingin menolak laporan ini? Berikan feedback untuk pembuat laporan."
        submitButtonText="Reject"
        submitButtonColor="bg-red-600 text-white"
        placeholder="Masukkan alasan penolakan atau catatan perbaikan..."
        isLoading={isProcessingFeedback}
      />
    </div>
  );
}
