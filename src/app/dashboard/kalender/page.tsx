import { getCurrentUser } from '@/lib/session';
import { getKalenderData, getPendingKalender } from '@/lib/kalender';
import KalenderClient from '@/components/dashboard/kalender/KalenderClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kalender Kegiatan - Dashboard Teknik TVRI',
  description: 'Kalender kegiatan untuk sistem manajemen teknik TVRI',
};

export default async function KalenderPage() {
  const user = await getCurrentUser();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const initialData = await getKalenderData(currentMonth, currentYear);
  const pendingData = await getPendingKalender();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-sm shadow-blue-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Kalender Kegiatan
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Kelola dan pantau jadwal kegiatan harian. Setiap kegiatan harus melalui persetujuan admin terlebih dahulu.
              </p>
            </div>
          </div>
        </div>
      </div>

      <KalenderClient
        initialData={initialData}
        initialPendingData={pendingData}
        username={user?.username || ''}
        levelId={user?.levelId || 2}
      />
    </div>
  );
}
