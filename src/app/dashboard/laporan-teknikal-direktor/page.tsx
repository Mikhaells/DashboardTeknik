import { getCurrentUser } from '@/lib/session';
import { getLaporanTeknikalDirektorStats } from '@/lib/laporan-teknikal-direktor';
import LaporanTeknikalDirektorWrapper from '@/components/dashboard/laporan-teknikal-direktor/LaporanTeknikalDirektorWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laporan Teknikal Direktor - Dashboard Teknik TVRI',
  description: 'Dashboard laporan teknikal direktor untuk sistem manajemen teknik TVRI',
};

export default async function LaporanTeknikalDirektorPage() {
  const user = await getCurrentUser();
  const laporanStats = await getLaporanTeknikalDirektorStats(user?.levelId, user?.username);

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Laporan Teknikal Direktor
          </h2>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Kelola laporan teknikal direktor produksi dengan sistem tracking yang komprehensif.
            </p>
          </div>
        </div>
      </div>

      <LaporanTeknikalDirektorWrapper
        userLevelId={user?.levelId}
        username={user?.username}
        stats={laporanStats}
      />
    </div>
  );
}
