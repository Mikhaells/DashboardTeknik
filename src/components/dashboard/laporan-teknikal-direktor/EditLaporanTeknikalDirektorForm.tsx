'use client';

import { useState, useEffect } from 'react';

interface DetailItem {
  AlatProduksi: number;
  Check: boolean;
  Keterangan: string;
}

const ALAT_PRODUKSI_LIST = [
  { id: 1, nama: 'Switcher Video' },
  { id: 2, nama: 'Multiview Monitor' },
  { id: 3, nama: 'Camera' },
  { id: 4, nama: 'Audio Monitoring' },
  { id: 5, nama: 'Intercom' },
  { id: 6, nama: 'Playback / VT' },
  { id: 7, nama: 'Graphics / CG' },
  { id: 8, nama: 'Recording System' },
  { id: 9, nama: 'Streaming Encoder' },
  { id: 10, nama: 'Jaringan Internet' },
];

interface EditLaporanTeknikalDirektorFormProps {
  laporanId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditLaporanTeknikalDirektorForm({ laporanId, onClose, onSuccess }: EditLaporanTeknikalDirektorFormProps) {
  const [formData, setFormData] = useState({
    NamaProgram: '',
    JenisProduksi: '',
    TanggalProduksi: '',
    LokasiProduksi: '',
    NamaTechnicalDirector: '',
    NamaPDU: '',
    JumlahKamera: '',
    FormatVideo: '',
    ResolusiOutput: '',
    AudioOutput: '',
    MediaRecording: '',
    JalurDistribusi: '',
    KendalaTindakan: '',
  });

  const [detailItems, setDetailItems] = useState<DetailItem[]>(
    ALAT_PRODUKSI_LIST.map(a => ({ AlatProduksi: a.id, Check: false, Keterangan: '' }))
  );

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{ filename: string; url: string }[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const fetchLaporanData = async () => {
    try {
      setFetchingData(true);
      const response = await fetch(`/api/laporan-teknikal-direktor/${laporanId}`);
      const result = await response.json();

      if (result.success) {
        populateFormData(result.data);
      } else {
        setError(result.message || 'Gagal mengambil data laporan');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchImages = async () => {
    try {
      const response = await fetch(`/api/laporan-teknikal-direktor/${laporanId}/images`);
      const result = await response.json();
      if (result.success && result.data?.images) {
        setUploadedImages(result.data.images);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  };

  const getAlatNama = (id: number) => {
    return ALAT_PRODUKSI_LIST.find(a => a.id === id)?.nama || `Alat #${id}`;
  };

  const populateFormData = (data: any) => {
    setFormData({
      NamaProgram: data.NamaProgram || '',
      JenisProduksi: data.JenisProduksi || '',
      TanggalProduksi: data.TanggalProduksi || '',
      LokasiProduksi: data.LokasiProduksi || '',
      NamaTechnicalDirector: data.NamaTechnicalDirector || '',
      NamaPDU: data.NamaPDU || '',
      JumlahKamera: data.JumlahKamera || 0,
      FormatVideo: data.FormatVideo || '',
      ResolusiOutput: data.ResolusiOutput || '',
      AudioOutput: data.AudioOutput || '',
      MediaRecording: data.MediaRecording || '',
      JalurDistribusi: data.JalurDistribusi || '',
      KendalaTindakan: data.KendalaTindakan || '',
    });

    if (data.LaporanTeknikalDirektor_Detail && data.LaporanTeknikalDirektor_Detail.length > 0) {
      setDetailItems(data.LaporanTeknikalDirektor_Detail);
    } else {
      setDetailItems(ALAT_PRODUKSI_LIST.map(a => ({ AlatProduksi: a.id, Check: false, Keterangan: '' })));
    }
  };

  useEffect(() => {
    if (laporanId) {
      fetchLaporanData();
      fetchImages();
    }
  }, [laporanId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'JumlahKamera' ? parseInt(value) || 0 : value }));
  };

  const handleDetailCheckChange = (index: number, checked: boolean) => {
    setDetailItems(prev => prev.map((item, i) =>
      i === index ? { ...item, Check: checked } : item
    ));
  };

  const handleDetailDescChange = (index: number, value: string) => {
    setDetailItems(prev => prev.map((item, i) =>
      i === index ? { ...item, Keterangan: value } : item
    ));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles: File[] = [];
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} bukan file gambar`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} terlalu besar (max 5MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);

      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });

      setError('');
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = (filename: string) => {
    setUploadedImages(prev => prev.filter(img => img.filename !== filename));
    setImagesToDelete(prev => [...prev, filename]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append('data', JSON.stringify({
        ...formData,
        LaporanTeknikalDirektor_Detail: detailItems,
      }));

      formDataToSend.append('imagesToDelete', JSON.stringify(imagesToDelete));

      selectedImages.forEach((file, index) => {
        formDataToSend.append(`image_${index}`, file);
      });

      const response = await fetch(`/api/laporan-teknikal-direktor/${laporanId}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Gagal mengupdate laporan');
      }
    } catch (error) {
      console.error('Error updating laporan:', error);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Mengambil data laporan...</p>
        </div>
      </div>
    );
  }

  if (error && fetchingData === false && !formData.TanggalProduksi) {
    return (
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
      `}</style>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-xl bg-white hide-scrollbar" style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
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

        <form onSubmit={handleSubmit}>
          <div className="text-center border-b-2 border-gray-300 pb-5 mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-2">EDIT LAPORAN TEKNIKAL DIREKTOR</h2>
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

          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">A. INFORMASI PRODUKSI</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Nama Program</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input type="text" name="NamaProgram" value={formData.NamaProgram} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900" required disabled={loading} />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Jenis Produksi</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <select name="JenisProduksi" value={formData.JenisProduksi} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 text-gray-900 bg-white" required disabled={loading}>
                      <option value="">Pilih Jenis Produksi</option>
                      <option value="Live">Live</option>
                      <option value="Tapping">Tapping</option>
                    </select>
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Tanggal Produksi</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input type="date" name="TanggalProduksi" value={formData.TanggalProduksi} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900" required disabled={loading} />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Lokasi Produksi</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input type="text" name="LokasiProduksi" value={formData.LokasiProduksi} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900" required disabled={loading} />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Nama Technical Director</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input type="text" name="NamaTechnicalDirector" value={formData.NamaTechnicalDirector} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900" required disabled={loading} />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Nama PDU</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input type="text" name="NamaPDU" value={formData.NamaPDU} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900" required disabled={loading} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">B. SPESIFIKASI TEKNIS</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Jumlah Kamera</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input type="number" name="JumlahKamera" value={formData.JumlahKamera} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900" placeholder="Jumlah kamera" min="0" required disabled={loading} />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Format Video</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input type="text" name="FormatVideo" value={formData.FormatVideo} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900" placeholder="Format video" required disabled={loading} />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Resolusi Output</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input type="text" name="ResolusiOutput" value={formData.ResolusiOutput} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900" placeholder="Resolusi output" required disabled={loading} />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Audio Output</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input type="text" name="AudioOutput" value={formData.AudioOutput} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900" placeholder="Audio output" required disabled={loading} />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Media Recording</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input type="text" name="MediaRecording" value={formData.MediaRecording} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900" placeholder="Media recording" required disabled={loading} />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Jalur Distribusi</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input type="text" name="JalurDistribusi" value={formData.JalurDistribusi} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900" placeholder="Jalur distribusi" required disabled={loading} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">C. ALAT PRODUKSI</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-3 py-2 text-center text-blue-900 font-semibold w-12">No</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-blue-900 font-semibold">Alat Produksi</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-blue-900 font-semibold w-20">Check</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-blue-900 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {detailItems.map((item, index) => (
                    <tr key={index} className="border border-gray-300 hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 text-center text-gray-700">{index + 1}</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-800 font-medium">{getAlatNama(item.AlatProduksi)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <input type="checkbox" checked={item.Check} onChange={(e) => handleDetailCheckChange(index, e.target.checked)} disabled={loading} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <textarea value={item.Keterangan} onChange={(e) => handleDetailDescChange(index, e.target.value)} placeholder="Keterangan..." rows={2} disabled={loading} className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-400 text-gray-900 bg-transparent resize-y" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">D. KENDALA & TINDAKAN</h3>
            <textarea name="KendalaTindakan" value={formData.KendalaTindakan} onChange={handleInputChange} rows={4} placeholder="Kendala dan tindakan yang dilakukan selama produksi" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-white" disabled={loading} />
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">E. ATTACHMENT</h3>
            <div className="ml-6 space-y-4">
              {uploadedImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Existing</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img src={image.url} alt={image.filename} className="w-full h-32 object-cover rounded-lg border border-gray-300" />
                        <button type="button" onClick={() => handleDeleteExistingImage(image.filename)} disabled={loading} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <p className="text-xs text-gray-600 mt-1 truncate">{image.filename}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tambah Gambar Baru</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input type="file" multiple accept="image/*" onChange={handleImageSelect} disabled={loading} className="hidden" id="edit-image-input" />
                  <label htmlFor="edit-image-input" className="cursor-pointer block">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-sm text-gray-600">Klik atau drag gambar ke sini</p>
                    <p className="text-xs text-gray-500 mt-1">Max 5MB per gambar</p>
                  </label>
                </div>
              </div>

              {previewImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Baru ({previewImages.length})</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previewImages.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-300" />
                        <button type="button" onClick={() => handleRemoveNewImage(index)} disabled={loading} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <p className="text-xs text-gray-600 mt-1 truncate">New Image {index + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="flex justify-center gap-4">
              <button type="button" onClick={onClose} disabled={loading} className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                Batal
              </button>
              <button type="submit" disabled={loading} className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
          </div>
        </form>
      </div>
      </div>
    </>
  );
}
