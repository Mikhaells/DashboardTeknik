'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface TambahLaporanHarianTeknisiFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TambahLaporanHarianTeknisiForm({ onClose, onSuccess }: TambahLaporanHarianTeknisiFormProps) {
  const [formData, setFormData] = useState<{
    // A. Informasi Laporan
    Operator: string;
    TanggalPengoperasian: string;
    JamOperasional: string;
    ProfesiId: string;
    Sistem: string;
    LokasiProduksi: string;
    
    // B. PRA PRODUKSI
    PraProduksi: { NamaKegiatan: string; checked: boolean }[];
    
    // C. PRODUKSI
    Produksi: { NamaKegiatan: string; checked: boolean }[];
    
    // D. PASCA PRODUKSI
    PascaProduksi: { NamaKegiatan: string; checked: boolean }[];
    
    // E. CATATAN & EVALUASI
    CatatanEvaluasi: string;
  }>({
    // A. Informasi Laporan
    Operator: '',
    TanggalPengoperasian: new Date().toISOString().split('T')[0],
    JamOperasional: new Date().toTimeString().slice(0, 5),
    ProfesiId: '',
    Sistem: '',
    LokasiProduksi: '',
    
    // B. PRA PRODUKSI
    PraProduksi: [],
    
    // C. PRODUKSI
    Produksi: [],
    
    // D. PASCA PRODUKSI
    PascaProduksi: [],
    
    // E. CATATAN & EVALUASI
    CatatanEvaluasi: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProduksiSections, setShowProduksiSections] = useState(false);
  const [profesiOptions, setProfesiOptions] = useState<{ value: number; label: string }[]>([]);
  const [kegiatanOptions, setKegiatanOptions] = useState<{ [key: string]: any[] }>({});
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // Fetch current user session
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const result = await response.json();
        if (result.success && result.user) {
          setFormData(prev => ({ ...prev, Operator: result.user.username }));
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };
    fetchUser();
  }, []);

  // Fetch profesi data from API
  useEffect(() => {
    const fetchProfesi = async () => {
      try {
        const response = await fetch('/api/laporan-harian-teknisi/profesi');
        const result = await response.json();
        
        if (result.success && result.data) {
          const options = result.data.map((item: any) => ({
            value: item.Id,
            label: item.Profesi
          }));
          setProfesiOptions(options);
        }
      } catch (error) {
        console.error('Error fetching profesi:', error);
      }
    };

    fetchProfesi();
  }, []);

  
  const sistemOptions = [
    { value: 'ENG (ELECTRONIC NEWS GATHERING)', label: 'ENG (ELECTRONIC NEWS GATHERING)' },
    { value: 'EFP (ELECTRONIC FIELD PRODUCTION)', label: 'EFP (ELECTRONIC FIELD PRODUCTION)' },
  ];

  const lokasiOptions = [
    { value: 'STUDIO', label: 'STUDIO' },
    { value: 'LUAR STUDIO', label: 'LUAR STUDIO' },
  ];

  
  const handleInputChange = async (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Jika profesi dipilih, fetch kegiatan dan tampilkan sections B-D
    if (name === 'ProfesiId' && value) {
      try {
        const response = await fetch(`/api/laporan-harian-teknisi/kegiatan?profesiId=${value}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setKegiatanOptions(result.data);
          
          // Initialize all activities with checked = false
          const initializeActivities = (activities: any[]) => 
            activities.map(item => ({
              NamaKegiatan: item.NamaKegiatan,
              checked: false
            }));
          
          setFormData(prev => ({
            ...prev,
            PraProduksi: initializeActivities(result.data['PRA PRODUKSI'] || []),
            Produksi: initializeActivities(result.data['PRODUKSI'] || []),
            PascaProduksi: initializeActivities(result.data['PASCA PRODUKSI'] || [])
          }));
        } else {
          console.error('Error fetching kegiatan:', result.message);
          setKegiatanOptions({});
        }
      } catch (error) {
        console.error('Error fetching kegiatan:', error);
        setKegiatanOptions({});
      }
      
      setShowProduksiSections(true);
    } else if (name === 'ProfesiId' && !value) {
      // Reset jika profesi dikosongkan
      setKegiatanOptions({});
      setFormData(prev => ({
        ...prev,
        PraProduksi: [],
        Produksi: [],
        PascaProduksi: []
      }));
      setShowProduksiSections(false);
    }
  };

  const handleCheckboxChange = (section: 'PraProduksi' | 'Produksi' | 'PascaProduksi', item: string, checked: boolean) => {
    setFormData(prev => {
      const currentSection = prev[section] as any[];
      const existingItem = currentSection.find((i: any) => i.NamaKegiatan === item || i === item);
      
      if (existingItem) {
        // Update existing item
        return {
          ...prev,
          [section]: currentSection.map((i: any) => 
            i.NamaKegiatan === item || i === item 
              ? { ...i, checked } 
              : i
          )
        };
      } else {
        // Add new item
        return {
          ...prev,
          [section]: [...currentSection, { NamaKegiatan: item, checked }]
        };
      }
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types and sizes
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
      
      // Create preview URLs
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
      
      // Clear error
      setError('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add form data as JSON string
      formDataToSend.append('data', JSON.stringify(formData));
      
      // Add images
      selectedImages.forEach((file, index) => {
        formDataToSend.append(`image_${index}`, file);
      });

      const response = await fetch('/api/laporan-harian-teknisi/create', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        onSuccess();
      } else {
        const result = await response.json();
        setError(result.message || 'Gagal menyimpan laporan');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Terjadi kesalahan saat menyimpan laporan');
    } finally {
      setLoading(false);
    }
  };

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
        .hide-scrollbar::-ms-scrollbar {
          display: none !important;
        }
        /* Smooth scrolling */
        .hide-scrollbar {
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-xl bg-white hide-scrollbar" style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
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

          <form onSubmit={handleSubmit}>
            {/* HEADER */}
            <div className="text-center border-b-2 border-gray-300 pb-5 mb-8">
              <h2 className="text-xl font-bold text-blue-900 mb-2">FORM LAPORAN HARIAN TEKNISI</h2>
            </div>

            <div className="px-5">
              {/* Error Display */}
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

              {/* A. INFORMASI LAPORAN */}
              <div className="mb-8">
                <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">A. INFORMASI LAPORAN</h3>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Nama Operator</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          name="Operator"
                          value={formData.Operator}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Masukkan nama operator"
                          required
                          disabled={loading}
                        />
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Tanggal Pengoperasian</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="date"
                          name="TanggalPengoperasian"
                          value={formData.TanggalPengoperasian}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          required
                          disabled={loading}
                        />
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Jam Operasional</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="time"
                          name="JamOperasional"
                          value={formData.JamOperasional}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          required
                          disabled={loading}
                        />
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Profesi</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <select
                          name="ProfesiId"
                          value={formData.ProfesiId}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          required
                          disabled={loading}
                        >
                          <option value="">Pilih Profesi</option>
                          {profesiOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Sistem</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <select
                          name="Sistem"
                          value={formData.Sistem}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          required
                          disabled={loading}
                        >
                          <option value="">Pilih Sistem</option>
                          {sistemOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Lokasi Produksi</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <select
                          name="LokasiProduksi"
                          value={formData.LokasiProduksi}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          required
                          disabled={loading}
                        >
                          <option value="">Pilih Lokasi</option>
                          {lokasiOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sections B-D hanya tampil jika profesi dipilih */}
              {showProduksiSections && (
                <>
                  {/* B. PRA PRODUKSI */}
                  {kegiatanOptions['PRA PRODUKSI'] && kegiatanOptions['PRA PRODUKSI'].length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">B. PRA PRODUKSI</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <div className="space-y-3">
                          {kegiatanOptions['PRA PRODUKSI']
                            .sort((a: any, b: any) => a.Id - b.Id) // Sort by Id
                            .map((item: any, index: number) => {
                              const formDataItem = formData.PraProduksi.find((i: any) => i.NamaKegiatan === item.NamaKegiatan);
                              return (
                                <label key={item.Id || index} className="flex items-center space-x-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formDataItem?.checked || false}
                                    onChange={(e) => handleCheckboxChange('PraProduksi', item.NamaKegiatan, e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm text-gray-700">{item.NamaKegiatan}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* C. PRODUKSI */}
                  {kegiatanOptions['PRODUKSI'] && kegiatanOptions['PRODUKSI'].length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">C. PRODUKSI</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <div className="space-y-3">
                          {kegiatanOptions['PRODUKSI']
                            .sort((a: any, b: any) => a.Id - b.Id) // Sort by Id
                            .map((item: any, index: number) => {
                              const formDataItem = formData.Produksi.find((i: any) => i.NamaKegiatan === item.NamaKegiatan);
                              return (
                                <label key={item.Id || index} className="flex items-center space-x-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formDataItem?.checked || false}
                                    onChange={(e) => handleCheckboxChange('Produksi', item.NamaKegiatan, e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm text-gray-700">{item.NamaKegiatan}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* D. PASCA PRODUKSI */}
                  {kegiatanOptions['PASCA PRODUKSI'] && kegiatanOptions['PASCA PRODUKSI'].length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">D. PASCA PRODUKSI</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <div className="space-y-3">
                          {kegiatanOptions['PASCA PRODUKSI']
                            .sort((a: any, b: any) => a.Id - b.Id) // Sort by Id
                            .map((item: any, index: number) => {
                              const formDataItem = formData.PascaProduksi.find((i: any) => i.NamaKegiatan === item.NamaKegiatan);
                              return (
                                <label key={item.Id || index} className="flex items-center space-x-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formDataItem?.checked || false}
                                    onChange={(e) => handleCheckboxChange('PascaProduksi', item.NamaKegiatan, e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm text-gray-700">{item.NamaKegiatan}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Jika tidak ada kegiatan untuk profesi ini */}
                  {Object.keys(kegiatanOptions).length === 0 && (
                    <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">Tidak ada kegiatan yang tersedia untuk profesi ini.</p>
                    </div>
                  )}

                  {/* E. CATATAN & EVALUASI */}
                  <div className="mb-8">
                    <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">E. CATATAN & EVALUASI</h3>
                    <div className="ml-6 space-y-4">
                      {/* Catatan Text Area */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                        <textarea
                          name="CatatanEvaluasi"
                          value={formData.CatatanEvaluasi}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          rows={4}
                          placeholder="Masukkan catatan dan evaluasi kegiatan harian teknisi..."
                          disabled={loading}
                        />
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tambah Gambar</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageSelect}
                            disabled={loading}
                            className="hidden"
                            id="image-input"
                          />
                          <label htmlFor="image-input" className="cursor-pointer block">
                            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <p className="text-sm text-gray-600">Klik atau drag gambar ke sini</p>
                            <p className="text-xs text-gray-500 mt-1">Max 5MB per gambar</p>
                          </label>
                        </div>
                      </div>

                      {/* Image Preview */}
                      {previewImages.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gambar yang Dipilih ({previewImages.length})</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {previewImages.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  disabled={loading}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                <p className="text-xs text-gray-600 mt-1 truncate">{selectedImages[index]?.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {/* SUBMIT BUTTON */}
              <div className="text-center mb-8">
                <div className="flex justify-center gap-4">
                  <button 
                    type="button" 
                    onClick={onClose}
                    disabled={loading}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Menyimpan...' : '💾 Simpan Laporan'}
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
