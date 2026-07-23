'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface DetailItem {
  Kegiatan: string;
  Check: boolean;
  Desc: string;
}

const KEGIATAN_LIST = [
  'Kondisi Fisik Kamera',
  'Lensa Kamera',
  'Tripod',
  'Kabel SDI/HDMI',
  'Audio Mixer',
  'Mikrofon',
  'Speaker Monitor',
  'AC Studio',
  'Interkom',
  'Lighting Studio',
  'Dimmer Lighting',
  'Monitor Preview',
  'Teleprompter',
];

interface DetailLaporanMaintenanceFormProps {
  laporanId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DetailLaporanMaintenanceForm({ laporanId, onClose, onSuccess }: DetailLaporanMaintenanceFormProps) {
  const [formData, setFormData] = useState({
    TanggalPemeriksaan: '',
    Petugas: '',
    CatatanTemuan: '',
    Feedback: '',
    ApproveBy: '',
    ApproveDate: '',
    StatusLaporanId: 0,
  });

  const [detailItems, setDetailItems] = useState<DetailItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ filename: string; url: string }[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchUploadedImages = async (id: number) => {
    try {
      setImagesLoading(true);
      const response = await fetch(`/api/laporan-maintenance/${id}/images`);
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

  const fetchLaporanData = async () => {
    if (!laporanId) return;

    try {
      setFetchingData(true);
      setError(null);

      const response = await fetch(`/api/laporan-maintenance/${laporanId}`);
      const result = await response.json();

      if (result.success) {
        populateFormData(result.data);
        await fetchUploadedImages(laporanId);
      } else {
        setError(result.message || 'Failed to fetch laporan data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setFetchingData(false);
    }
  };

  const generatePrintHtml = async () => {
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
        <title>Detail Laporan Maintenance - ${formData.TanggalPemeriksaan || 'Laporan'}</title>
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

          .print-container {
            max-width: 100%;
            margin: 0 auto;
          }

          .section-wrapper {
            margin-bottom: 25px;
          }

          .section-title-wrapper {
            page-break-after: avoid;
            break-after: avoid;
          }

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
          <div class="header">
            <h2>DETAIL LAPORAN PEMERIKSAAN MAINTENANCE</h2>
            <p>LAPORAN PEMERIKSAAN MAINTENANCE PERALATAN</p>
          </div>

          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">A. INFORMASI PEMERIKSAAN</h3>
            </div>
            <table class="label-table">
              <tr>
                <td>Tanggal Pemeriksaan</td>
                <td>${formData.TanggalPemeriksaan || '-'}</td>
              </tr>
              <tr>
                <td>Petugas</td>
                <td>${formData.Petugas || '-'}</td>
              </tr>
            </table>
          </div>

           <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">B. KEGIATAN PEMERIKSAAN</h3>
            </div>
            <table class="label-table" style="margin-top: 10px;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="border: 1px solid #000; padding: 8px 10px; font-size: 10pt; font-weight: 600; text-align: center; width: 40px;">No</th>
                  <th style="border: 1px solid #000; padding: 8px 10px; font-size: 10pt; font-weight: 600; text-align: left;">Kegiatan</th>
                  <th style="border: 1px solid #000; padding: 8px 10px; font-size: 10pt; font-weight: 600; text-align: center; width: 60px;">Check</th>
                  <th style="border: 1px solid #000; padding: 8px 10px; font-size: 10pt; font-weight: 600; text-align: left;">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                ${detailItems.map((item, index) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px 10px; font-size: 10pt; text-align: center;">${index + 1}</td>
                  <td style="border: 1px solid #000; padding: 8px 10px; font-size: 10pt;">${item.Kegiatan}</td>
                  <td style="border: 1px solid #000; padding: 8px 10px; font-size: 10pt; text-align: center;">
                    <input type="checkbox" ${item.Check ? 'checked' : ''} readonly style="accent-color: #000;">
                  </td>
                  <td style="border: 1px solid #000; padding: 8px 10px; font-size: 10pt;">${item.Desc || '-'}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">C. CATATAN DAN TEMUAN</h3>
            </div>
            <div class="print-textarea">${(formData.CatatanTemuan || '-').replace(/\n/g, '<br>')}</div>
          </div>

          ${uploadedImages.length > 0 ? `
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">D. ATTACHMENT</h3>
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

          ${(formData.StatusLaporanId === 5 || formData.StatusLaporanId === 6) ? `
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">E. FEEDBACK</h3>
            </div>
            <div class="print-textarea" style="background-color: #f9fafb; border-left: 4px solid #ef4444; padding: 8px; margin: 4px 0;">${(formData.Feedback || '-').replace(/\n/g, '<br>')}</div>
            <table class="label-table" style="margin-top: 10px;">
              <tr>
                <td>Approve By</td>
                <td>${formData.ApproveBy || '-'}</td>
              </tr>
              <tr>
                <td>Approve Date</td>
                <td>${formData.ApproveDate ? new Date(formData.ApproveDate).toLocaleDateString('id-ID', {
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

  const handlePrint = async () => {
    if (isPrinting) return;

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

      const closePrintWindow = () => {
        if (printWindow && !printWindow.closed) {
          printWindow.close();
        }
        setIsPrinting(false);
      };

      printWindow.onload = () => {
        printWindow.print();

        printWindow.onafterprint = closePrintWindow;

        setTimeout(closePrintWindow, 1000);

        printWindow.onblur = () => {
          setTimeout(closePrintWindow, 500);
        };
      };

      setTimeout(closePrintWindow, 3000);

    } catch (error) {
      console.error('Print error:', error);
      alert('Gagal mencetak, silakan coba lagi');
      setIsPrinting(false);
    }
  };

  const populateFormData = (data: any) => {
    const newFormData = {
      TanggalPemeriksaan: data.TanggalPemeriksaan || "",
      Petugas: data.Petugas || "",
      CatatanTemuan: data.CatatanTemuan || "",
      Feedback: data.Feedback || "",
      ApproveBy: data.ApproveBy || "",
      ApproveDate: data.ApproveDate || "",
      StatusLaporanId: data.StatusLaporanId || 0,
    };

    setFormData(newFormData);

    if (data.LaporanMaintenance_Detail && data.LaporanMaintenance_Detail.length > 0) {
      setDetailItems(data.LaporanMaintenance_Detail);
    } else {
      setDetailItems(KEGIATAN_LIST.map(k => ({ Kegiatan: k, Check: false, Desc: '' })));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (laporanId) {
      fetchLaporanData();
    }
  }, [laporanId]);

  if (fetchingData) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Mengambil data laporan...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && fetchingData === false && !formData.TanggalPemeriksaan) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={fetchLaporanData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Coba Lagi
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .hide-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .hide-scrollbar::-moz-scrollbar {
          display: none !important;
        }
        .hide-scrollbar::-ms-scrollbar {
          display: none !important;
        }
        .hide-scrollbar {
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch;
        }

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
        <button
          type="button"
          onClick={onClose}
          className="no-print absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          disabled={loading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <form>
          <div className="text-center border-b-2 border-gray-300 pb-5 mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-2">FORM LAPORAN PEMERIKSAAN MAINTENANCE</h2>
          </div>

          <div className="px-5">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l1.293 1.293a1 1 0 101.414 1.414L10 11.414 10l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293 1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* A. INFORMASI PEMERIKSAAN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">A. INFORMASI PEMERIKSAAN</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Tanggal Pemeriksaan</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input
                      type="date"
                      name="TanggalPemeriksaan"
                      value={formData.TanggalPemeriksaan}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-gray-50"
                      required
                      readOnly
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Petugas</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input
                      type="text"
                      name="Petugas"
                      value={formData.Petugas}
                      onChange={handleInputChange}
                      placeholder="Nama petugas"
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-gray-50"
                      required
                      readOnly
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* B. KEGIATAN PEMERIKSAAN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">B. KEGIATAN PEMERIKSAAN</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-3 py-2 text-center text-blue-900 font-semibold w-12">No</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-blue-900 font-semibold">Kegiatan</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-blue-900 font-semibold w-20">Check</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-blue-900 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {detailItems.map((item, index) => (
                    <tr key={index} className="border border-gray-300 hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 text-center text-gray-700">{index + 1}</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-800 font-medium">{item.Kegiatan}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.Check}
                          disabled
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-700">{item.Desc || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

            {/* C. CATATAN DAN TEMUAN */}
            <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">C. CATATAN DAN TEMUAN</h3>
            <textarea
              name="CatatanTemuan"
              value={formData.CatatanTemuan}
              onChange={handleInputChange}
              rows={4}
              placeholder="Catatan dan temuan pemeriksaan maintenance"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-gray-50"
              required
              readOnly
            />
          </div>

          {/* D. ATTACHMENT */}
          {uploadedImages.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold bg-green-50 text-green-900 px-4 py-2 rounded mb-4">D. ATTACHMENT</h3>
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

          {/* E. FEEDBACK (Hanya tampil jika status 5 atau 6) */}
          {(formData.StatusLaporanId === 5 || formData.StatusLaporanId === 6) && (
            <div className="mb-8">
            <h3 className="text-sm font-bold bg-red-50 text-red-900 px-4 py-2 rounded mb-4">E. FEEDBACK</h3>
            <textarea
              name="Feedback"
              value={formData.Feedback}
              onChange={handleInputChange}
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

          <div className="text-center mb-8">
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={onClose}
                className="no-print bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                disabled={loading}
              >
                Batal
              </button>
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
            </div>
          </div>
          </div>
        </form>
      </div>
    </div>

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
