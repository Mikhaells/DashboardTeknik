'use client';

import TambahLaporanMaintenanceForm from '@/components/dashboard/laporan-maintenance/TambahLaporanMaintenanceForm';

export default function CreateLaporanMaintenancePage() {
  return (
    <TambahLaporanMaintenanceForm
      onClose={() => window.history.back()}
      onSuccess={() => { window.location.href = '/dashboard/laporan-maintenance'; }}
    />
  );
}
