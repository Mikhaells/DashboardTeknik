import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

/**
 * Root page - redirects based on authentication status
 * 
 * This page serves as the entry point and redirects users to:
 * - /dashboard if authenticated
 * - /login if not authenticated
 * 
 * The middleware will handle the actual redirection logic
 */

export const metadata: Metadata = {
  title: 'Dashboard Teknik TVRI',
  description: 'Sistem Manajemen Teknik TVRI',
};

export default async function RootPage() {
  // Check authentication status
  const user = await getCurrentUser();
  
  if (user) {
    // User is authenticated, redirect to dashboard
    redirect('/dashboard/harian-teknisi');
  } else {
    // User is not authenticated, redirect to login
    redirect('/login');
  }
}
