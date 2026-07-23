'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoginFormData, LoginResponse } from '@/types/auth';

// Zod schema for form validation
const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username wajib diisi')
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(3, 'Password minimal 3 karakter')
    .max(100, 'Password maksimal 100 karakter'),
});

/**
 * LoginForm component
 * Handles user authentication with form validation and API integration
 * 
 * Features:
 * - Form validation using Zod
 * - Loading states
 * - Error handling
 * - Automatic redirect on success
 * - TODO: Add "Remember me" functionality
 * - TODO: Add password visibility toggle
 */

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result: LoginResponse = await response.json();

      if (result.success && result.user) {
        const returnUrl = searchParams?.get('returnUrl');
        const redirectTo =
          returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
            ? returnUrl
            : '/dashboard/harian-teknisi';
        router.push(redirectTo);
        router.refresh(); // Refresh to update server components
      } else {
        // Login failed, show error message
        setSubmitError(result.message || 'Login gagal. Silakan coba lagi.');
        reset(); // Clear form on error
      }
    } catch (error) {
      console.error('Login error:', error);
      setSubmitError('Terjadi kesalahan. Silakan coba lagi nanti.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <img 
            src="/TVRILogo2019.svg.webp" 
            alt="TVRI Logo" 
            className="h-16 w-auto mb-2"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Teknik</h1>
        <p className="text-gray-600">
          Masuk dengan akun Anda 
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="username"
          type="text"
          label="Username"
          placeholder="Masukkan username"
          fullWidth
          error={errors.username?.message}
          disabled={isLoading}
          {...register('username')}
          autoComplete="username"
        />

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Masukkan password"
            fullWidth
            error={errors.password?.message}
            disabled={isLoading}
            {...register('password')}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              // Eye slash icon (hide password)
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              // Eye icon (show password)
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {submitError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800 font-medium">{submitError}</p>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Sedang masuk...' : 'Masuk'}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Belum punya akun? Hubungi administrator
        </p>
      </div>

          </div>
  );
}

export default LoginForm;
