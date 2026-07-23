'use client';

import React, { useState, useEffect } from 'react';
import { LaporanHarianTeknisi } from '@/lib/laporan-harian-teknisi';

interface DetailLaporanHarianTeknisiFormProps {
  laporanId?: string;
  onClose: () => void;
}

export default function DetailLaporanHarianTeknisiForm({ laporanId, onClose }: DetailLaporanHarianTeknisiFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LaporanHarianTeknisi | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ filename: string; url: string }[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchLaporanData = async () => {
      if (!laporanId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/laporan-harian-teknisi/${laporanId}`);
        const result = await response.json();
        
        if (result.success) {
          setFormData(result.data);
          
          // Fetch uploaded images
          await fetchUploadedImages(laporanId);
        } else {
          setError(result.message || 'Gagal mengambil data laporan');
        }
      } catch (error) {
        console.error('Error fetching laporan data:', error);
        setError('Terjadi kesalahan saat mengambil data laporan');
      } finally {
        setLoading(false);
      }
    };

    fetchLaporanData();
  }, [laporanId]);

  const fetchUploadedImages = async (id: string) => {
    try {
      setImagesLoading(true);
      const response = await fetch(`/api/laporan-harian-teknisi/${id}/images`);
      const result = await response.json();
      
      if (result.success && result.data?.images) {
        setUploadedImages(result.data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setImagesLoading(false);
    }
  };

  // Generate print HTML function
  const generatePrintHtml = async () => {
    // Fetch all images and convert to base64 for safe printing
    const imagesWithBase64 = await Promise.all(
      uploadedImages.map(async (image) => {
        try {
          const response = await fetch(image.url);
          const blob = await response.blob();
          const reader = new FileReader();
          
          return new Promise<{ filename: string; url: string; base64: string }>((resolve) => {
            reader.onloadend = () => {
              resolve({
                filename: image.filename,
                url: image.url,
                base64: reader.result as string
              });
            };
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error converting image to base64:', error);
          // Return original URL if conversion fails
          return {
            filename: image.filename,
            url: image.url,
            base64: image.url
          };
        }
      })
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Detail Laporan Harian Teknisi - ${formData?.TanggalPengoperasian || 'Laporan'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 1.5cm;
            background: white;
            color: black;
            font-size: 11pt;
            line-height: 1.4;
            font-weight: 400;
          }
          
          /* Container utama */
          .print-container {
            max-width: 100%;
            margin: 0 auto;
          }
          
          /* Page break controls */
          .section-wrapper {
            margin-bottom: 25px;
          }
          
          .section-title-wrapper {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          /* Header */
          .header {
            text-align: center;
            margin-bottom: 30px;
            page-break-after: avoid;
            break-after: avoid;
          }
          
          .header h2 {
            font-size: 18pt;
            font-weight: 700;
            color: #000;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          
          .header p {
            font-size: 10pt;
            color: #000;
            font-weight: 600;
          }
          
          /* Section titles */
          .section-title {
            font-size: 13pt;
            font-weight: 700;
            color: #000;
            margin-bottom: 12px;
            padding: 8px 12px;
            background-color: #f5f5f5;
            border-left: 4px solid #000;
            page-break-after: avoid;
            break-after: avoid;
          }
          
          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          td {
            border: 1px solid #000;
            padding: 8px 10px;
            font-size: 10pt;
            vertical-align: top;
            color: #000;
          }
          
          .label-table td:first-child {
            font-weight: 600;
            background-color: #f5f5f5;
            width: 30%;
            color: #000;
          }
          
          .label-table td:last-child {
            background-color: #fff;
            color: #000;
          }
          
          /* Textarea style untuk print */
          .print-textarea {
            border: 1px solid #000;
            padding: 8px 10px;
            min-height: 80px;
            font-size: 10pt;
            line-height: 1.4;
            color: #000;
            background-color: #fff;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Checkbox styling */
          .checkbox-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .checkbox-item input[type="checkbox"] {
            margin-right: 8px;
            accent-color: #000;
          }
          
          .checkbox-item.checked input[type="checkbox"] {
            accent-color: #000;
          }
          
          .checkbox-item.checked input[type="checkbox"]:checked {
            background-color: #000;
            border-color: #000;
          }

          /* Image gallery styling for print */
          .image-gallery {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            margin: 10px 0;
          }

          .image-item {
            border: 1px solid #000;
            padding: 10px;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
            background: #fff;
          }

          .image-item img {
            max-width: 100%;
            max-height: 450px;
            height: auto;
            width: auto;
            object-fit: contain;
            margin-bottom: 10px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }

          .image-item p {
            font-size: 9pt;
            margin: 8px 0 0 0;
            word-break: break-word;
            color: #000;
            font-weight: normal;
            display: none;
          }
          
          /* Force colors for print */
          @media print {
            body {
              margin: 1.5cm;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            td {
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .label-table td:last-child {
              background-color: #fff !important;
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .section-title {
              color: #000 !important;
              background-color: #f5f5f5 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
            }
            
            .print-textarea {
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
            }
            
            .checkbox-item {
              color: #000 !important;
              font-family: 'Gotham', 'Helvetica Neue', Arial, sans-serif !important;
            }

            .image-gallery {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 20px !important;
            }

            .image-item {
              border: 1px solid #000 !important;
              padding: 10px !important;
              text-align: center !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              background: white !important;
            }

            .image-item img {
              max-width: 100% !important;
              max-height: 450px !important;
              height: auto !important;
              width: auto !important;
              object-fit: contain !important;
              display: block !important;
              margin: 0 auto 10px !important;
              border: none !important;
            }

            .image-item p {
              font-size: 9pt !important;
              margin: 8px 0 0 0 !important;
              word-break: break-word !important;
              color: #000 !important;
              font-weight: normal !important;
              display: none !important;
            }
          }
          
          @page {
            size: A4;
            margin: 0.5cm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- HEADER -->
          <div class="header">
            <h2>DETAIL LAPORAN HARIAN TEKNISI</h2>
            <p>LAPORAN HARIAN TEKNISI</p>
          </div>
          
          <!-- A. INFORMASI LAPORAN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">A. INFORMASI LAPORAN</h3>
            </div>
            <table class="label-table">
              <tr>
                <td>Operator</td>
                <td>${formData?.Operator || '-'}</td>
              </tr>
              <tr>
                <td>Tanggal Pengoperasian</td>
                <td>${formData?.TanggalPengoperasian || '-'}</td>
              </tr>
              <tr>
                <td>Jam Operasional</td>
                <td>${formData?.JamOperasional || '-'}</td>
              </tr>
              <tr>
                <td>Profesi</td>
                <td>${formData?.Profesi || '-'}</td>
              </tr>
              <tr>
                <td>Sistem</td>
                <td>${formData?.Sistem || '-'}</td>
              </tr>
              <tr>
                <td>Lokasi Produksi</td>
                <td>${formData?.LokasiProduksi || '-'}</td>
              </tr>
            </table>
          </div>
          
          <!-- B. PRA PRODUKSI -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">B. PRA PRODUKSI</h3>
            </div>
            ${formData?.PraProduksi?.map(item => `
              <div class="checkbox-item ${item.checked ? 'checked' : ''}">
                <input type="checkbox" ${item.checked ? 'checked' : ''} readonly>
                <span>${item.NamaKegiatan}</span>
              </div>
            `).join('') || ''}
          </div>
          
          <!-- C. PRODUKSI -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">C. PRODUKSI</h3>
            </div>
            ${formData?.Produksi?.map(item => `
              <div class="checkbox-item ${item.checked ? 'checked' : ''}">
                <input type="checkbox" ${item.checked ? 'checked' : ''} readonly>
                <span>${item.NamaKegiatan}</span>
              </div>
            `).join('') || ''}
          </div>
          
          <!-- D. PASCA PRODUKSI -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">D. PASCA PRODUKSI</h3>
            </div>
            ${formData?.PascaProduksi?.map(item => `
              <div class="checkbox-item ${item.checked ? 'checked' : ''}">
                <input type="checkbox" ${item.checked ? 'checked' : ''} readonly>
                <span>${item.NamaKegiatan}</span>
              </div>
            `).join('') || ''}
          </div>
          
          <!-- E. CATATAN & EVALUASI -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">E. CATATAN & EVALUASI</h3>
            </div>
            <div class="print-textarea">${(formData?.Catatan_Evaluasi || '-').replace(/\n/g, '<br>')}</div>
          </div>
          
          ${uploadedImages.length > 0 ? `
          <!-- F. ATTACHMENT -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">F. ATTACHMENT</h3>
            </div>
            <div class="image-gallery">
              ${imagesWithBase64.map((image, index) => `
                <div class="image-item">
                  <img src="${image.base64}" alt="Attachment ${index + 1}" />
                  <p>${image.filename}</p>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          ${(formData?.StatusLaporanId === 5 || formData?.StatusLaporanId === 6) ? `
          <!-- G. FEEDBACK -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">G. FEEDBACK</h3>
            </div>
            <div class="print-textarea" style="background-color: #f9fafb; border-left: 4px solid #ef4444; padding: 8px; margin: 4px 0;">${(formData?.Feedback || '-').replace(/\n/g, '<br>')}</div>
            <table class="label-table" style="margin-top: 10px;">
              <tr>
                <td>Approve By</td>
                <td>${formData?.ApproveBy || '-'}</td>
              </tr>
              <tr>
                <td>Approve Date</td>
                <td>${formData?.ApproveDate ? new Date(formData.ApproveDate).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }) : '-'}</td>
              </tr>
            </table>
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  };

  // Advanced print function
  const handlePrint = async () => {
    if (isPrinting || !formData) return;
    
    setIsPrinting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const printWindow = window.open('', '_blank', 'width=900,height=700,toolbar=yes,scrollbars=yes,resizable=yes');
      
      if (!printWindow) {
        alert('Mohon izinkan pop-up window untuk mencetak');
        setIsPrinting(false);
        return;
      }
      
      const printHtml = await generatePrintHtml();
      
      printWindow.document.write(printHtml);
      printWindow.document.close();
      
      // Multiple fallback methods to ensure window closes
      const closePrintWindow = () => {
        if (printWindow && !printWindow.closed) {
          printWindow.close();
        }
        setIsPrinting(false);
      };
      
      printWindow.onload = () => {
        // Trigger print dialog
        printWindow.print();
        
        // Method 1: onafterprint event
        printWindow.onafterprint = closePrintWindow;
        
        // Method 2: setTimeout fallback (some browsers don't trigger onafterprint)
        setTimeout(closePrintWindow, 1000);
        
        // Method 3: onblur fallback (when user switches back to main window)
        printWindow.onblur = () => {
          setTimeout(closePrintWindow, 500);
        };
      };
      
      // Method 4: Additional safety timeout
      setTimeout(closePrintWindow, 3000);
      
    } catch (error) {
      console.error('Print error:', error);
      alert('Gagal mencetak, silakan coba lagi');
      setIsPrinting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-xl bg-white">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data laporan...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-xl bg-white">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!formData) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-xl bg-white">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Data laporan tidak ditemukan</p>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .hide-scrollbar {
          -ms-overflow-style: none !important;  /* IE and Edge */
          scrollbar-width: none !important;  /* Firefox */
        }
        /* Hide scrollbar for all browsers */
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .hide-scrollbar::-moz-scrollbar {
          display: none !important;
        }
        /* Smooth scrolling */
        .hide-scrollbar {
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch;
        }

        /* Print styles */
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          .print-area h3 {
            background: white !important;
            color: black !important;
            border: 1px solid black !important;
          }
          .print-area table {
            border: 1px solid black !important;
          }
          .print-area td {
            border: 1px solid black !important;
            background: white !important;
            color: black !important;
          }
          .print-area textarea {
            border: 1px solid black !important;
            background: white !important;
            color: black !important;
          }
          .print-area input[type="checkbox"] {
            border: 1px solid black !important;
          }
          .print-area input[type="date"],
          .print-area input[type="time"],
          .print-area input[type="text"] {
            border: 1px solid black !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
      
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50">
        <div className="print-area relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-xl bg-white hide-scrollbar" style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="text-center border-b-2 border-gray-300 pb-5 mb-8">
            <h2 className="text-xl font-bold text-blue-900">Detail Laporan Harian Teknisi</h2>
          </div>

          {/* Content */}
          <div className="overflow-y-auto hide-scrollbar" style={{ maxHeight: 'calc(95vh - 80px)' }}>
            <div className="p-6">
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* A. Informasi Laporan */}
              <div className="mb-8">
                <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">A. INFORMASI LAPORAN</h3>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Operator</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.Operator || ''}
                          disabled
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-gray-100"
                        />
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Tanggal Pengoperasian</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="date"
                          value={formData.TanggalPengoperasian || ''}
                          disabled
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-gray-100"
                        />
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Jam Operasional</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="time"
                          value={formData.JamOperasional || ''}
                          disabled
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-gray-100"
                        />
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Profesi</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.Profesi || ''}
                          disabled
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-gray-100"
                        />
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Sistem</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.Sistem || ''}
                          disabled
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-gray-100"
                        />
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Lokasi Produksi</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.LokasiProduksi || ''}
                          disabled
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-gray-100"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* B. PRA PRODUKSI */}
              <div className="mb-8">
                <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">B. PRA PRODUKSI</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div className="space-y-3">
                    {formData.PraProduksi?.map((item: any, index: number) => (
                      <label key={index} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          disabled
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {item.NamaKegiatan}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* C. PRODUKSI */}
              <div className="mb-8">
                <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">C. PRODUKSI</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div className="space-y-3">
                    {formData.Produksi?.map((item: any, index: number) => (
                      <label key={index} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          disabled
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {item.NamaKegiatan}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* D. PASCA PRODUKSI */}
              <div className="mb-8">
                <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">D. PASCA PRODUKSI</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div className="space-y-3">
                    {formData.PascaProduksi?.map((item: any, index: number) => (
                      <label key={index} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          disabled
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {item.NamaKegiatan}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* E. CATATAN & EVALUASI */}
              <div className="mb-8">
                <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">E. CATATAN & EVALUASI</h3>
                <div className="ml-6">
                  <textarea
                    value={formData.Catatan_Evaluasi || ''}
                    disabled
                    rows={6}
                    className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-gray-100 resize-none"
                  />
                </div>
              </div>

              {/* F. GAMBAR LAPORAN */}
              {uploadedImages.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold bg-green-50 text-green-900 px-4 py-2 rounded mb-4">F. ATTACHMENT</h3>
                  <div className="ml-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedImage(image.url)}
                          className="relative group cursor-pointer"
                        >
                          <img
                            src={image.url}
                            alt={image.filename}
                            className="w-full h-48 object-contain rounded-lg border-2 border-gray-300 group-hover:border-green-500 transition-all hover:shadow-lg bg-white"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center pointer-events-none">
                            <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 truncate">{image.filename}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* F. FEEDBACK (Hanya tampil jika status 5 atau 6) */}
              {(formData.StatusLaporanId === 5 || formData.StatusLaporanId === 6) && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold bg-red-50 text-red-900 px-4 py-2 rounded mb-4">G. FEEDBACK</h3>
                  <textarea
                    name="Feedback"
                    value={formData.Feedback || ''}
                    rows={4}
                    placeholder="Feedback dari admin saat approve/reject"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-gray-100"
                    readOnly
                  />
                  <div className="mt-2 flex justify-between text-xs text-gray-600">
                    <span>Approve By: {formData.ApproveBy || '-'}</span>
                    <span>Approve Date: {formData.ApproveDate ? new Date(formData.ApproveDate).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                    }) : '-'}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="text-center mb-8">
                <div className="flex justify-center gap-4">
                  <button 
                    type="button" 
                    onClick={handlePrint}
                    disabled={isPrinting}
                    className={`no-print px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2 ${
                      isPrinting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isPrinting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={onClose}
                    disabled={loading}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
