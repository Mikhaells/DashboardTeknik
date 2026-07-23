import { getCurrentUser } from '@/lib/session';
import { getLaporanMaintenanceStats } from '@/lib/laporan-maintenance';
import LaporanMaintenanceWrapper from '@/components/dashboard/laporan-maintenance/LaporanMaintenanceWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laporan Maintenance - Dashboard Teknik TVRI',
  description: 'Dashboard laporan maintenance untuk sistem manajemen teknik TVRI',
};

export default async function LaporanMaintenancePage() {
  const user = await getCurrentUser();
  const laporanStats = await getLaporanMaintenanceStats(user?.levelId, user?.username);

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Laporan Maintenance
          </h2>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Kelola laporan maintenance peralatan dengan sistem tracking yang komprehensif.
            </p>
          </div>
        </div>
      </div>

      <LaporanMaintenanceWrapper
        userLevelId={user?.levelId}
        username={user?.username}
        stats={laporanStats}
      />
    </div>
  );
}
