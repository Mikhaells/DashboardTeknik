'use client';

import { useState, useEffect } from 'react';
import { LaporanTeknisi } from '@/types/laporan-teknisi';
import { getStatusName, getStatusColor, isPending, isApproved, isRejected, isEditable } from '@/lib/status';
import Pagination from '../Pagination';
import { Button } from '@/components/ui/Button';
import DetailLaporanTeknisiForm from './DetailLaporanTeknisiForm';
import EditLaporanTeknisiFormAdvanced from './EditLaporanTeknisiFormAdvanced';
import FeedbackModal from '../FeedbackModal';
import TambahLaporanTeknisiFormAdvanced from './TambahLaporanTeknisiFormAdvanced';

interface LaporanTeknisiDataTableProps {
  data: LaporanTeknisi[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange: (page: number) => void;
  userLevelId?: number;
}

export default function LaporanTeknisiDataTable({ data, pagination, onPageChange, userLevelId = 2 }: LaporanTeknisiDataTableProps) {
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
    document.body.style.overflow = '';
    setShowModal(false);
  };

  const handleSubmitLaporan = async (formData: any) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Laporan Technical Director berhasil disimpan!');
      window.location.reload();
    } catch (error) {
      console.error('Error saving laporan:', error);
      alert('Gagal menyimpan laporan, silakan coba lagi');
    }
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
      
      const response = await fetch(`/api/teknisi/laporan/${selectedLaporanId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Laporan Technical Director berhasil di-approve!');
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
      
      const response = await fetch(`/api/teknisi/laporan/${selectedLaporanId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Laporan Technical Director berhasil di-reject!');
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
    document.body.style.overflow = '';
    setShowDetailModal(false);
    setSelectedLaporanId(null);
    window.location.reload();
  };

  const handleCloseEditModal = () => {
    document.body.style.overflow = '';
    setShowEditModal(false);
    setSelectedLaporanId(null);
  };

  const handleEditSubmit = async (formData: any) => {
    // This function is called by the EditLaporanTeknisiFormAdvanced component
    // The form handles its own API submission, so we just need to refresh the data
    window.location.reload();
  };

  const getActionButtons = (laporan: LaporanTeknisi) => {
    if (laporan.Id === -1) return null;

    const isLevel1 = userLevelId === 1;
    const laporanIsPending = isPending(laporan.StatusId || 0);
    const laporanIsEditable = isEditable(laporan.StatusId || 0);

    if (isLevel1) {
      if (laporanIsPending) {
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

    if (!isLevel1) {
      if (laporanIsEditable) {
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

  const getDisplayData = () => {
    const maxRows = 5;
    const displayData = [...data];
    const remainingRows = maxRows - data.length;
    
    for (let i = 0; i < remainingRows; i++) {
      displayData.push({
        Id: -1,
        Nama: '',
        NIP: '',
        JabatanId: 0,
        EventDate: '',
        KegiatanId: 0,
        Lokasi: '',
        Kendala: '',
        Path: '',
        CreatedBy: '',
        CreatedDate: '',
        StatusId: 0,
        ApprovedBy: '',
        ApprovedDate: '',
        CreateDate: '',
        Jabatan_ID: 0,
        Jabatan: '',
        Jabatan_Desc: '',
        Kegiatan_Id: 0,
        Kegiatan: '',
        Kegiatan_Desc: '',
        StatusLaporan_Id: 0,
        Status: '',
        StatusLaporan_Desc: '',
      } as LaporanTeknisi);
    }
    
    return displayData;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6 w-full max-w-[90vw] lg:max-w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Data Laporan Technical Director
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
            <p>Belum ada data laporan technical director.</p>
            <p className="text-sm mt-2">Klik "Tambah Laporan" untuk membuat laporan pertama.</p>
          </div>
        </div>
        
        {/* Modal Tambah Laporan */}
        {showModal && (
          <TambahLaporanTeknisiFormAdvanced
            onClose={handleCloseModal}
            onSubmit={handleSubmitLaporan}
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
            Data Laporan Technical Director
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                    NIP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Jabatan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Kegiatan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Lokasi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                    Kendala
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                    Create Date
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[120px]">
                        {isPlaceholder ? '-' : formatDate(laporan.EventDate)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[150px]">
                        {isPlaceholder ? '-' : laporan.Nama}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[100px]">
                        {isPlaceholder ? '-' : laporan.NIP}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[120px]">
                        {isPlaceholder ? (
                          '-'
                        ) : (
                          <div>
                            <div className="font-medium">{laporan.Jabatan}</div>
                            <div className="text-gray-500 text-xs">{laporan.Jabatan_Desc}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[120px]">
                        {isPlaceholder ? (
                          '-'
                        ) : (
                          <div>
                            <div className="font-medium">{laporan.Kegiatan}</div>
                            <div className="text-gray-500 text-xs">{laporan.Kegiatan_Desc}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[120px]">
                        {isPlaceholder ? '-' : laporan.Lokasi}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 w-[150px]">
                        {isPlaceholder ? '-' : (
                          <div className="max-w-xs truncate" title={laporan.Kendala}>
                            {laporan.Kendala}
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-[100px]">
                        {isPlaceholder ? '-' : formatDate(laporan.CreateDate)}
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
        <TambahLaporanTeknisiFormAdvanced
          onClose={handleCloseModal}
          onSubmit={handleSubmitLaporan}
        />
      )}

      {/* Modal Detail Laporan */}
      {showDetailModal && selectedLaporanId && (
        <DetailLaporanTeknisiForm
          laporanId={selectedLaporanId}
          onClose={handleCloseDetailModal}
        />
      )}

      {/* Modal Edit Laporan */}
      {showEditModal && selectedLaporanId && (
        <EditLaporanTeknisiFormAdvanced
          laporanId={selectedLaporanId.toString()}
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
        message="Apakah Anda yakin ingin menyetujui laporan technical director ini? Berikan feedback untuk pembuat laporan."
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
        message="Apakah Anda yakin ingin menolak laporan technical director ini? Berikan feedback untuk pembuat laporan."
        submitButtonText="Reject"
        submitButtonColor="bg-red-600 text-white"
        placeholder="Masukkan alasan penolakan atau catatan perbaikan..."
        isLoading={isProcessingFeedback}
      />
    </div>
  );
}
