'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TambahLaporanHarianTeknisiForm from '@/components/dashboard/harian-teknisi/TambahLaporanHarianTeknisiForm';

export default function CreateLaporanHarianTeknisiPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/dashboard/harian-teknisi');
  };

  const handleSuccess = () => {
    router.push('/dashboard/harian-teknisi');
  };

  return (
    <TambahLaporanHarianTeknisiForm
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  );
}
