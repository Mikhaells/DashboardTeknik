'use client';

import { useState, useEffect } from 'react';
import LaporanTeknikalDirektorDataTable from './LaporanTeknikalDirektorDataTable';
import { LaporanTeknikalDirektor } from '@/types/laporan-teknikal-direktor';
import { LaporanTeknikalDirektorStats } from '@/lib/laporan-teknikal-direktor';
import { LaporanTeknikalDirektorStatsWidget } from './LaporanTeknikalDirektorStatsWidget';

interface LaporanTeknikalDirektorWrapperProps {
  userLevelId?: number;
  username?: string;
  stats: LaporanTeknikalDirektorStats;
}

export default function LaporanTeknikalDirektorWrapper({ userLevelId = 2, username = '', stats }: LaporanTeknikalDirektorWrapperProps) {
  const [data, setData] = useState<LaporanTeknikalDirektor[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLaporan();
  }, [userLevelId, username, statusFilter]);

  const fetchLaporan = async (page: number = 1) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/laporan-teknikal-direktor?page=${page}&limit=7&userLevel=${userLevelId}&username=${encodeURIComponent(username)}&search=${encodeURIComponent(searchTerm)}&statusFilter=${statusFilter}`);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setPagination(result.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 0,
          hasNext: false,
          hasPrev: false,
        });
      } else {
        setError(result.message || 'Gagal mengambil data laporan');
      }
    } catch (error) {
      console.error('Error fetching laporan:', error);
      setError('Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchLaporan(page);
  };

  const handleSearch = () => {
    fetchLaporan(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchLaporan()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LaporanTeknikalDirektorStatsWidget
        stats={stats}
        activeFilter={statusFilter}
        onFilterChange={(filter) => {
          setStatusFilter(filter);
          setSearchTerm('');
        }}
      />
      <LaporanTeknikalDirektorDataTable
        data={data}
        pagination={pagination}
        onPageChange={handlePageChange}
        userLevelId={userLevelId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
        activeFilter={statusFilter}
      />
    </div>
  );
}
