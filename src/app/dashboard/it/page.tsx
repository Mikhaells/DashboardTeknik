import { getCurrentUser } from '@/lib/session';
import { getLaporanITStats, getLaporanIT } from '@/lib/laporan-it';
import { LaporanITStatsWidget } from '@/components/dashboard/it/LaporanITStatsWidget';
import LaporanITWrapper from '@/components/dashboard/it/LaporanITWrapper';
import { Metadata } from 'next';

/**
 * Dashboard Laporan IT page for authenticated users
 * 
 * This page displays laporan IT data with:
 * - Statistics widget
 * - Data table with pagination
 * - CRUD operations based on user role
 */

export const metadata: Metadata = {
  title: 'Laporan IT - Dashboard Teknik TVRI',
  description: 'Dashboard laporan IT untuk sistem manajemen teknik TVRI',
};

export default async function LaporanITPage() {
  // Get user info
  const user = await getCurrentUser();
  const userRole = user?.level || 'Unknown';

  // Fetch dashboard data
  const laporanStats = await getLaporanITStats(user?.levelId, user?.username);
  const laporanResult = await getLaporanIT(1, 5, user?.levelId, user?.username);

  return (
    <div>
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Selamat Datang, {user?.fullname}!
          </h2>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Anda login sebagai <span className="font-medium">{userRole}</span> 
              {' '}dengan username <span className="font-medium">{user?.username}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Laporan IT Statistics Widget */}
      <div className="mt-6">
        <LaporanITStatsWidget stats={laporanStats} />
      </div>

      {/* Laporan IT Data Table */}
      <div className="mt-8">
        <LaporanITWrapper
          initialData={laporanResult.data}
          initialPagination={{
            currentPage: laporanResult.pagination.currentPage,
            totalPages: laporanResult.pagination.totalPages,
            totalRecords: laporanResult.pagination.totalRecords,
            hasNext: laporanResult.pagination.currentPage < laporanResult.pagination.totalPages,
            hasPrev: laporanResult.pagination.currentPage > 1
          }}
          userLevelId={user?.levelId}
          username={user?.username}
        />
      </div>
    </div>
  );
}
