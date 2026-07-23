'use client';

import { use } from 'react';
import DetailLaporanMaintenanceForm from '@/components/dashboard/laporan-maintenance/DetailLaporanMaintenanceForm';

export default function DetailLaporanMaintenancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <DetailLaporanMaintenanceForm
      laporanId={parseInt(id)}
      onClose={() => window.history.back()}
      onSuccess={() => { window.location.href = '/dashboard/laporan-maintenance'; }}
    />
  );
}
