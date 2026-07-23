import { getCurrentUser } from '@/lib/session';
import { getLaporanGensetStats } from '@/lib/laporan-genset';
import LaporanGensetWrapper from '@/components/dashboard/genset/LaporanGensetWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laporan Pemeriksaan Genset - Dashboard Teknik TVRI',
  description: 'Dashboard laporan pemeriksaan genset untuk sistem manajemen teknik TVRI',
};

export default async function LaporanGensetPage() {
  const user = await getCurrentUser();

  const laporanStats = await getLaporanGensetStats(user?.levelId, user?.username);

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Laporan Pemeriksaan Genset
          </h2>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Kelola laporan pemeriksaan genset harian dengan sistem tracking yang komprehensif.
            </p>
          </div>
        </div>
      </div>

      <LaporanGensetWrapper userLevelId={user?.levelId} username={user?.username || ''} stats={laporanStats} />
    </div>
  );
}
