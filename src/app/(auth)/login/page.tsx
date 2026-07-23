import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';

/**
 * Login page for Dashboard Teknik TVRI
 * 
 * This page handles user authentication and provides:
 * - Login form with validation
 * - Error handling
 * - Redirect after successful login
 * - Responsive design
 * 
 * The page is protected by middleware which will:
 * - Redirect authenticated users to dashboard
 * - Allow unauthenticated users to access login
 */

export const metadata: Metadata = {
  title: 'Login - Dashboard Teknik TVRI',
  description: 'Halaman login untuk mengakses Dashboard Teknik TVRI',
  robots: 'noindex, nofollow',
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="block h-64 animate-pulse rounded-lg bg-gray-100" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
