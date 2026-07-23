'use client';

import { useState, useEffect } from 'react';
import LaporanITDataTable from './LaporanITDataTable';
import { LaporanIT } from '@/types/laporan-it';

interface LaporanITWrapperProps {
  initialData: LaporanIT[];
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

export default function LaporanITWrapper({
  initialData,
  initialPagination,
  userLevelId = 2,
  username,
}: LaporanITWrapperProps) {
  const [currentPage, setCurrentPage] = useState(initialPagination.currentPage);
  const [data, setData] = useState<LaporanIT[]>(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);

  const handlePageChange = async (page: number) => {
    if (page === currentPage || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/laporan-it?page=${page}&limit=5&userLevel=${userLevelId}&username=${encodeURIComponent(username || '')}`);
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
    <LaporanITDataTable
      data={data}
      pagination={pagination}
      onPageChange={handlePageChange}
      userLevelId={userLevelId}
    />
  );
}
