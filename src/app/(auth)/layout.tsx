import React from 'react';

/**
 * Layout for authentication routes (login, register, etc.)
 * Provides a modern, professional centered layout for auth pages
 * 
 * Features:
 * - Modern gradient background with animated patterns
 * - Glassmorphism effects
 * - Smooth animations and transitions
 * - Professional TVRI branding
 * - Responsive design
 * - Enhanced typography
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background patterns */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Main content with enhanced glassmorphism */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/95 backdrop-blur-xl py-10 px-8 rounded-2xl shadow-2xl border border-white/30">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
              <div className="relative z-10">
                {children}
              </div>
            </div>
          </div>

          {/* Enhanced footer */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-300">
              <span>© 2026</span>
              <span className="font-semibold text-blue-400">TVRI</span>
              <span>- Televisi Republik Indonesia</span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Kepulauan Riau
            </p>
            <div className="flex items-center justify-center space-x-4 mt-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse animation-delay-200"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-400"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline styles for animations to avoid styled-jsx issues */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .animation-delay-200 {
            animation-delay: 0.2s;
          }
          .animation-delay-400 {
            animation-delay: 0.4s;
          }
          @keyframes tilt {
            0%, 50%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(0.5deg); }
            75% { transform: rotate(-0.5deg); }
          }
          .animate-tilt {
            animation: tilt 4s ease-in-out infinite;
          }
        `
      }} />
    </div>
  );
}
