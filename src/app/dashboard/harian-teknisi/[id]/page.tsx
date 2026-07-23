'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import DetailLaporanHarianTeknisiForm from '@/components/dashboard/harian-teknisi/DetailLaporanHarianTeknisiForm';

export default function DetailLaporanHarianTeknisiPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Unwrap params Promise with React.use
  const { id } = use(params);

  const handleClose = () => {
    router.push('/dashboard/harian-teknisi');
  };

  return (
    <DetailLaporanHarianTeknisiForm 
      laporanId={id}
      onClose={handleClose}
    />
  );
}
