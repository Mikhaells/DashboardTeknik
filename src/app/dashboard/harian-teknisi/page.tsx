import { getCurrentUser } from '@/lib/session';
import { getLaporanHarianTeknisiStats } from '@/lib/laporan-harian-teknisi';
import LaporanHarianTeknisiWrapper from '@/components/dashboard/harian-teknisi/LaporanHarianTeknisiWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laporan Harian Teknisi - Dashboard Teknik TVRI',
  description: 'Dashboard laporan harian teknisi untuk sistem manajemen teknik TVRI',
};

export default async function LaporanHarianTeknisiPage() {
  const user = await getCurrentUser();

  const laporanStats = await getLaporanHarianTeknisiStats(user?.levelId, user?.username);

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Laporan Harian Teknisi
          </h2>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Kelola laporan harian teknisi dengan sistem tracking yang komprehensif.
            </p>
          </div>
        </div>
      </div>

      <LaporanHarianTeknisiWrapper userLevelId={user?.levelId} username={user?.username || ''} stats={laporanStats} />
    </div>
  );
}
