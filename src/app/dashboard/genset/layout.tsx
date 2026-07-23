import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laporan Pemeriksaan Genset - Dashboard Teknik TVRI',
  description: 'Dashboard laporan pemeriksaan genset untuk sistem manajemen teknik TVRI',
};

export default function GensetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout inherits from the parent dashboard layout
  // The sidebar and header are handled by the parent layout
  return children;
}
