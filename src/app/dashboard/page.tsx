import { getCurrentUser } from '@/lib/session';
import { getLaporanStats, getLaporanHarian } from '@/lib/dashboard';
import LaporanStatsWidget from '@/components/dashboard/harian/LaporanStatsWidget';
import DashboardWrapper from '@/components/dashboard/harian/DashboardWrapper';
import { Metadata } from 'next';

/**
 * Dashboard page for authenticated users
 * 
 * This page is protected by layout and server-side session validation
 * Provides:
 * - Dashboard widgets and features
 * - Laporan statistics
 * - Laporan data table
 */

export const metadata: Metadata = {
  title: 'Laporan Harian - Dashboard Teknik TVRI',
  description: 'Dashboard laporan harian untuk sistem manajemen teknik TVRI',
};

export default async function DashboardPage() {
  // Get user info from layout (no need to redirect here)
  const user = await getCurrentUser();
  const userRole = user?.level || 'Unknown';

  // Fetch dashboard data
  const laporanStats = await getLaporanStats(user?.levelId, user?.username);
  const laporanResult = await getLaporanHarian(1, 5, user?.levelId, user?.username);

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

      {/* Laporan Statistics Widget */}
      <div className="mt-6">
        <LaporanStatsWidget stats={laporanStats} />
      </div>

      {/* Laporan Data Table */}
      <div className="mt-8">
        <DashboardWrapper
          initialData={laporanResult.data}
          initialPagination={laporanResult.pagination}
          userLevelId={user?.levelId}
          username={user?.username}
        />
      </div>
    </div>
  );
}
