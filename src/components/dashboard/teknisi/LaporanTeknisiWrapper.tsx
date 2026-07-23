'use client';

import { useState, useEffect } from 'react';
import LaporanTeknisiDataTable from './LaporanTeknisiDataTable';
import { LaporanTeknisi } from '@/types/laporan-teknisi';

interface LaporanTeknisiWrapperProps {
  initialData: LaporanTeknisi[];
  initialPagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  userLevelId?: number;
  username?: string;
}

export default function LaporanTeknisiWrapper({
  initialData,
  initialPagination,
  userLevelId = 2,
  username,
}: LaporanTeknisiWrapperProps) {
  const [currentPage, setCurrentPage] = useState(initialPagination.currentPage);
  const [data, setData] = useState<LaporanTeknisi[]>(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);

  const handlePageChange = async (page: number) => {
    if (page === currentPage || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/teknisi/laporan?page=${page}&limit=5&userLevel=${userLevelId}&username=${encodeURIComponent(username || '')}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setPagination(result.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching paginated data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LaporanTeknisiDataTable
      data={data}
      pagination={pagination}
      onPageChange={handlePageChange}
      userLevelId={userLevelId}
    />
  );
}
