import { getCurrentUser } from '@/lib/session';
import { getLaporanTeknisiStats, getLaporanTeknisi } from '@/lib/laporan-teknisi';
import { LaporanTeknisiStatsWidget } from '@/components/dashboard/teknisi/LaporanTeknisiStatsWidget';
import LaporanTeknisiWrapper from '@/components/dashboard/teknisi/LaporanTeknisiWrapper';
import { Metadata } from 'next';

/**
 * Dashboard Laporan Technical Director page for authenticated users
 * 
 * This page displays laporan technical director data with:
 * - Statistics widget
 * - Data table with pagination
 * - CRUD operations based on user role
 */

export const metadata: Metadata = {
  title: 'Laporan Technical Director - Dashboard Teknik TVRI',
  description: 'Dashboard laporan technical director untuk sistem manajemen teknik TVRI',
};

export default async function LaporanTeknisiPage() {
  // Get user info
  const user = await getCurrentUser();
  const userRole = user?.level || 'Unknown';

  // Fetch dashboard data
  const laporanStats = await getLaporanTeknisiStats(user?.levelId, user?.username);
  const laporanResult = await getLaporanTeknisi(1, 5, user?.levelId, user?.username);

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

      {/* Laporan Technical Director Statistics Widget */}
      <div className="mt-6">
        <LaporanTeknisiStatsWidget stats={laporanStats} />
      </div>

      {/* Laporan Technical Director Data Table */}
      <div className="mt-8">
        <LaporanTeknisiWrapper
          initialData={laporanResult.data}
          initialPagination={laporanResult.pagination}
          userLevelId={user?.levelId}
          username={user?.username}
        />
      </div>
    </div>
  );
}
