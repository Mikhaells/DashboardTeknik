'use client';

import React from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  title: string;
  message: string;
  submitButtonText: string;
  submitButtonColor: string;
  placeholder: string;
  isLoading?: boolean;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  submitButtonText,
  submitButtonColor,
  placeholder,
  isLoading = false
}: FeedbackModalProps) {
  const [feedback, setFeedback] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setFeedback('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      onSubmit(feedback.trim());
    }
  };

  const handleClose = () => {
    setFeedback('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <style jsx>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        div::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        div {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
      <div 
        className="relative top-20 mx-auto p-5 w-full max-w-md shadow-lg rounded-xl" 
        style={{ 
          backgroundColor: '#ffffff',
          border: 'none',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          disabled={isLoading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        <div 
          className="mt-3 rounded-lg p-4" 
          style={{ 
            backgroundColor: '#ffffff',
            border: 'none'
          }}
        >
          {/* Header */}
          <div className="flex items-center mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${submitButtonColor.replace('text-white', 'bg-opacity-10').replace('bg-', 'text-').replace('600', '600')} ${submitButtonColor.replace('text-white', 'bg-opacity-20')}`}>
              <svg className={`w-6 h-6 ${submitButtonColor.replace('bg-', 'text-').replace('600', '600')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {submitButtonText === 'Approve' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 
                className={`text-lg font-semibold ${submitButtonColor.replace('bg-', 'text-').replace('600', '600')} px-2 py-1 rounded`}
                style={{ 
                  backgroundColor: '#ffffff', 
                  color: submitButtonColor.includes('green') ? '#16a34a' : '#dc2626',
                  border: 'none',
                  display: 'inline-block'
                }}
              >
                {title}
              </h3>
              <p 
                className="text-sm text-gray-600 mt-1 px-2 py-1 rounded"
                style={{ 
                  backgroundColor: '#ffffff',
                  border: 'none'
                }}
              >
                {message}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label 
                className="block text-sm font-medium text-gray-700 mb-2 px-2 py-1 rounded"
                style={{ 
                  backgroundColor: '#ffffff',
                  border: 'none',
                  display: 'inline-block'
                }}
              >
                Feedback <span className="text-red-500">*</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                style={{ 
                  backgroundColor: '#ffffff', 
                  opacity: 1,
                  color: '#000000',
                  border: '2px solid #d1d5db'
                }}
                disabled={isLoading}
                required
              />
              <p 
                className="text-xs text-gray-500 mt-1 px-2 py-1 rounded"
                style={{ 
                  backgroundColor: '#ffffff',
                  border: 'none'
                }}
              >
                Feedback akan disimpan dan dapat dilihat oleh pembuat laporan
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                style={{ backgroundColor: '#f3f4f6', border: 'none' }}
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200 ${submitButtonColor} hover:opacity-90 disabled:opacity-50`}
                style={{ 
                  backgroundColor: submitButtonColor.includes('green') ? '#16a34a' : '#dc2626',
                  border: 'none'
                }}
                disabled={!feedback.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  submitButtonText
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
