'use client';

import React, { useState, useEffect } from 'react';
import { LaporanIT } from '@/types/laporan-it';
import { getStatusColor, getStatusName, isPending, isApproved, isRejected, isEditable } from '@/lib/status';
import Pagination from '@/components/dashboard/Pagination';
import FeedbackModal from '@/components/dashboard/FeedbackModal';
import { Button } from '@/components/ui/Button';
import TambahLaporanITForm from './TambahLaporanITForm';

interface LaporanITDataTableProps {
  data: LaporanIT[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange: (page: number) => Promise<void>;
  userLevelId?: number;
}

export default function LaporanITDataTable({ 
  data, 
  pagination, 
  onPageChange,
  userLevelId = 2 
}: LaporanITDataTableProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLaporanId, setSelectedLaporanId] = useState<number | null>(null);
  const [isProcessingFeedback, setIsProcessingFeedback] = useState(false);

  const handlePageChange = async (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      await onPageChange(page);
    }
  };

  const handleApprove = (id: number) => {
    setSelectedLaporanId(id);
    setShowApproveModal(true);
  };

  const handleReject = (id: number) => {
    setSelectedLaporanId(id);
    setShowRejectModal(true);
  };

  const handleEdit = (laporanId: number) => {
    setSelectedLaporanId(laporanId);
    setShowEditModal(true);
  };

  const handleDetail = (laporanId: number) => {
    setSelectedLaporanId(laporanId);
    setShowDetailModal(true);
  };

  const handleAddLaporan = () => {
    setShowModal(true);
  };

  const handleLaporanSubmit = async (data: any) => {
    try {
      // Data sudah tersimpan lengkap oleh form component
      // Tidak perlu double submit, hanya refresh data table
      console.log('Laporan IT berhasil disimpan:', data);
      
      // Refresh data table untuk menampilkan data terbaru
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    }
  };

  const handleApproveSubmit = async (feedback: string) => {
    if (!selectedLaporanId) return;
    
    try {
      setIsProcessingFeedback(true);
      
      const response = await fetch(`/api/laporan-it/${selectedLaporanId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Laporan IT berhasil di-approve!');
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
      
      const response = await fetch(`/api/laporan-it/${selectedLaporanId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Laporan IT berhasil di-reject!');
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

  const getActionButtons = (laporan: LaporanIT) => {
    if (laporan.Id === -1) return null;

    const isLevel1 = userLevelId === 1;
    const laporanIsPending = isPending(laporan.StatusId || 0);
    const laporanIsApproved = isApproved(laporan.StatusId || 0);
    const laporanIsRejected = isRejected(laporan.StatusId || 0);
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

  
  if (data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6 w-full max-w-[90vw] lg:max-w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Data Laporan IT
            </h3>
            {userLevelId !== 1 && (
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
            )}
          </div>
          
          <div className="text-center text-gray-500 py-8">
            <p>Belum ada data laporan IT.</p>
            <p className="text-sm mt-2">Klik "Tambah Laporan" untuk membuat laporan pertama.</p>
          </div>
        </div>
        
        {/* Modal Tambah Laporan */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <TambahLaporanITForm
                onClose={() => setShowModal(false)}
                onSubmit={() => setShowModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6 w-full max-w-[90vw] lg:max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Data Laporan IT
          </h3>
          {userLevelId !== 1 && (
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
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ringkasan Kegiatan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Real data */}
                {data.map((laporan) => (
                  <tr key={laporan.Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {laporan.Id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {laporan.Nama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {laporan.EventDate ? new Date(laporan.EventDate).toLocaleDateString('id-ID') : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {laporan.RingkasanKegiatan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {laporan.StatusId > 0 ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(laporan.StatusId)}`}>
                          {getStatusName(laporan.StatusId)}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {getActionButtons(laporan)}
                    </td>
                  </tr>
                ))}
                
                {/* Dummy rows to maintain table height */}
                {Array.from({ length: Math.max(0, 5 - data.length) }).map((_, index) => (
                  <tr key={`dummy-${index}-${pagination.currentPage}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate"></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        -
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6">
          {loading && (
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Modal Approve Feedback */}
      <FeedbackModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onSubmit={handleApproveSubmit}
        title="Setujui Laporan IT"
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
        title="Tolak Laporan IT"
        message="Apakah Anda yakin ingin menolak laporan ini? Berikan feedback untuk pembuat laporan."
        submitButtonText="Reject"
        submitButtonColor="bg-red-600 text-white"
        placeholder="Masukkan alasan penolakan atau catatan perbaikan..."
        isLoading={isProcessingFeedback}
      />

      {/* Modal Tambah Laporan */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <TambahLaporanITForm
              onClose={() => setShowModal(false)}
              onSubmit={handleLaporanSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
