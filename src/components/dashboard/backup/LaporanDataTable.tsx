'use client';

import { useState, useEffect } from 'react';
import { LaporanHarian } from '@/lib/dashboard';
import { getStatusName, getStatusColor, isPending, isApproved, isRejected, isEditable } from '@/lib/status';
import Pagination from '@/components/dashboard/Pagination';
import { Button } from '@/components/ui/Button';
import TambahLaporanForm from './TambahLaporanForm';
import DetailLaporanForm from './DetailLaporanForm';
import EditLaporanForm from './EditLaporanForm';
import FeedbackModal from '@/components/dashboard/FeedbackModal';

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
