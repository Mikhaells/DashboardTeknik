'use client';

import { useState, useEffect } from 'react';
import LaporanDataTable from './LaporanDataTable';
import { LaporanHarian } from '@/lib/dashboard';

interface DashboardWrapperProps {
  initialData: LaporanHarian[];
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

export default function DashboardWrapper({
  initialData,
  initialPagination,
  userLevelId = 2,
  username,
}: DashboardWrapperProps) {
  const [currentPage, setCurrentPage] = useState(initialPagination.currentPage);
  const [data, setData] = useState<LaporanHarian[]>(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);

  const handlePageChange = async (page: number) => {
    if (page === currentPage || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/laporan?page=${page}&limit=5&userLevel=${userLevelId}&username=${encodeURIComponent(username || '')}`);
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
    <LaporanDataTable
      data={data}
      pagination={pagination}
      onPageChange={handlePageChange}
      userLevelId={userLevelId}
    />
  );
}
