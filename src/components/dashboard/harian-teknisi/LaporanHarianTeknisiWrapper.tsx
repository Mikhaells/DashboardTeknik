'use client';

import { useState, useEffect } from 'react';
import LaporanHarianTeknisiDataTable from './LaporanHarianTeknisiDataTable';
import { LaporanHarianTeknisi, LaporanHarianTeknisiStats } from '@/lib/laporan-harian-teknisi';
import { LaporanHarianTeknisiStatsWidget } from './LaporanHarianTeknisiStatsWidget';

interface LaporanHarianTeknisiWrapperProps {
  userLevelId?: number;
  username?: string;
  stats: LaporanHarianTeknisiStats;
}

export default function LaporanHarianTeknisiWrapper({ userLevelId = 2, username = '', stats }: LaporanHarianTeknisiWrapperProps) {
  const [data, setData] = useState<LaporanHarianTeknisi[]>([]);
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
      
      const response = await fetch(`/api/laporan-harian-teknisi?page=${page}&limit=7&userLevel=${userLevelId}&username=${encodeURIComponent(username)}&search=${encodeURIComponent(searchTerm)}&statusFilter=${statusFilter}`);
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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LaporanHarianTeknisiStatsWidget
        stats={stats}
        activeFilter={statusFilter}
        onFilterChange={(filter) => {
          setStatusFilter(filter);
          setSearchTerm('');
        }}
      />
      <LaporanHarianTeknisiDataTable
        data={data}
        pagination={pagination}
        onPageChange={handlePageChange}
        userLevelId={userLevelId}
        username={username}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
        activeFilter={statusFilter}
      />
    </div>
  );
}
