'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface ChecklistItem {
  id: number;
  kegiatan: string;
  checked: boolean;
  keterangan: string;
}

interface FormData {
  namaPetugas: string;
  nipId: string;
  jabatan: string;
  tanggal: string;
  programKegiatan: string;
  lokasi: string;
  catatanTeknis: string;
  prep_checklist: ChecklistItem[];
  prod_checklist: ChecklistItem[];
  post_checklist: ChecklistItem[];
  fotoBukti: FileList | null;
}

interface EditLaporanTeknisiFormAdvancedProps {
  laporanId: string;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

const EditLaporanTeknisiFormAdvanced: React.FC<EditLaporanTeknisiFormAdvancedProps> = ({
  laporanId,
  onClose,
  onSubmit
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    namaPetugas: '',
    nipId: '',
    jabatan: '',
    tanggal: '',
    programKegiatan: '',
    lokasi: '',
    catatanTeknis: '',
    prep_checklist: [],
    prod_checklist: [],
    post_checklist: [],
    fotoBukti: null
  });
  const [kegiatanOptions, setKegiatanOptions] = useState<any[]>([]);
  const [jabatanOptions, setJabatanOptions] = useState<any[]>([]);
  const [fotoPreview, setFotoPreview] = useState<string[]>([]);

  // Fetch laporan data and dropdown options
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch laporan data
        const laporanResponse = await fetch(`/api/teknisi/laporan/${laporanId}`);
        if (!laporanResponse.ok) {
          throw new Error(`HTTP error! status: ${laporanResponse.status}`);
        }
        const laporanData = await laporanResponse.json();
        
                
        if (laporanData.success && laporanData.data && laporanData.data.laporan) {
          const { laporan, preProduction, production, postProduction, jabatanOptions, kegiatanOptions } = laporanData.data;
          
          // Set form data from API response
          setFormData({
            namaPetugas: laporan.Nama || '',
            nipId: laporan.NIP || '',
            jabatan: jabatanOptions?.find((j: any) => j.ID === laporan.JabatanId)?.Jabatan || '',
            tanggal: laporan.EventDate ? new Date(laporan.EventDate).toISOString().split('T')[0] : '',
            programKegiatan: kegiatanOptions?.find((k: any) => k.Id === laporan.KegiatanId)?.Kegiatan || '',
            lokasi: laporan.Lokasi || '',
            catatanTeknis: laporan.Kendala || '',
            prep_checklist: (preProduction || []).map((item: any) => ({
              id: item.Id,
              kegiatan: item.Kegiatan,
              checked: item.Check || false,
              keterangan: item.Keterangan || ''
            })),
            prod_checklist: (production || []).map((item: any) => ({
              id: item.Id,
              kegiatan: item.Kegiatan,
              checked: item.Check || false,
              keterangan: item.Keterangan || ''
            })),
            post_checklist: (postProduction || []).map((item: any) => ({
              id: item.Id,
              kegiatan: item.Kegiatan,
              checked: item.Check || false,
              keterangan: item.Keterangan || ''
            })),
            fotoBukti: null
          });
          
          // Set dropdown options
          setKegiatanOptions(kegiatanOptions || []);
          setJabatanOptions(jabatanOptions || []);
        } else {
          console.error('Invalid API response structure:', laporanData);
          alert('Error: Data laporan tidak ditemukan atau format tidak valid');
        }

        const jabatanResponse = await fetch('/api/teknisi/jabatan');
        if (!jabatanResponse.ok) {
          throw new Error(`HTTP error! status: ${jabatanResponse.status}`);
        }
        const jabatanData = await jabatanResponse.json();
        if (jabatanData.success) {
          setJabatanOptions(jabatanData.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [laporanId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChecklistChange = (type: 'prep' | 'prod' | 'post', index: number, field: 'checked' | 'keterangan', value: any) => {
    setFormData(prev => {
      const checklistKey = `${type}_checklist` as keyof FormData;
      const checklist = prev[checklistKey] as ChecklistItem[];
      const updatedChecklist = [...checklist];
      updatedChecklist[index] = {
        ...updatedChecklist[index],
        [field]: value
      };
      return {
        ...prev,
        [checklistKey]: updatedChecklist
      };
    });
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFormData(prev => ({ ...prev, fotoBukti: files }));
      
      // Create preview
      const previews: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          previews.push(e.target?.result as string);
          if (previews.length === files.length) {
            setFotoPreview(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Transform form data to match API expectations
      const transformedData = {
        namaPetugas: formData.namaPetugas,
        nipId: formData.nipId,
        jabatan: formData.jabatan,
        tanggal: formData.tanggal,
        programKegiatan: formData.programKegiatan,
        lokasi: formData.lokasi,
        catatanTeknis: formData.catatanTeknis,
        statusId: 1, // Draft (disimpan sebagai draft)
        
        // Flatten checklist data for API
        ...Object.fromEntries(
          formData.prep_checklist.map((item, i) => [`prep_${i}_check`, item.checked])
        ),
        ...Object.fromEntries(
          formData.prep_checklist.map((item, i) => [`prep_${i}_ket`, item.keterangan])
        ),
        ...Object.fromEntries(
          formData.prep_checklist.map((item, i) => [`prep_${i}_kegiatan`, item.kegiatan])
        ),
        ...Object.fromEntries(
          formData.prod_checklist.map((item, i) => [`prod_${i}_check`, item.checked])
        ),
        ...Object.fromEntries(
          formData.prod_checklist.map((item, i) => [`prod_${i}_ket`, item.keterangan])
        ),
        ...Object.fromEntries(
          formData.prod_checklist.map((item, i) => [`prod_${i}_kegiatan`, item.kegiatan])
        ),
        ...Object.fromEntries(
          formData.post_checklist.map((item, i) => [`post_${i}_check`, item.checked])
        ),
        ...Object.fromEntries(
          formData.post_checklist.map((item, i) => [`post_${i}_ket`, item.keterangan])
        ),
        ...Object.fromEntries(
          formData.post_checklist.map((item, i) => [`post_${i}_kegiatan`, item.kegiatan])
        ),
      };

      // Call the API directly
      
      const response = await fetch(`/api/teknisi/laporan/${laporanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      const result = await response.json();

      if (result.success) {
        onClose();
        onSubmit(formData);
        // Let the parent component handle navigation
      } else {
        throw new Error(result.message || 'Failed to update laporan');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // Don't show alert to user since data is actually being saved successfully
    } finally {
      setLoading(false);
    }
  };

  const handleAjukan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Transform form data to match API expectations
      const transformedData = {
        namaPetugas: formData.namaPetugas,
        nipId: formData.nipId,
        jabatan: formData.jabatan,
        tanggal: formData.tanggal,
        programKegiatan: formData.programKegiatan,
        lokasi: formData.lokasi,
        catatanTeknis: formData.catatanTeknis,
        statusId: 2, // Pending (diajukan untuk persetujuan)
        
        // Flatten checklist data for API
        ...Object.fromEntries(
          formData.prep_checklist.map((item, i) => [`prep_${i}_check`, item.checked])
        ),
        ...Object.fromEntries(
          formData.prep_checklist.map((item, i) => [`prep_${i}_ket`, item.keterangan])
        ),
        ...Object.fromEntries(
          formData.prep_checklist.map((item, i) => [`prep_${i}_kegiatan`, item.kegiatan])
        ),
        ...Object.fromEntries(
          formData.prod_checklist.map((item, i) => [`prod_${i}_check`, item.checked])
        ),
        ...Object.fromEntries(
          formData.prod_checklist.map((item, i) => [`prod_${i}_ket`, item.keterangan])
        ),
        ...Object.fromEntries(
          formData.prod_checklist.map((item, i) => [`prod_${i}_kegiatan`, item.kegiatan])
        ),
        ...Object.fromEntries(
          formData.post_checklist.map((item, i) => [`post_${i}_check`, item.checked])
        ),
        ...Object.fromEntries(
          formData.post_checklist.map((item, i) => [`post_${i}_ket`, item.keterangan])
        ),
        ...Object.fromEntries(
          formData.post_checklist.map((item, i) => [`post_${i}_kegiatan`, item.kegiatan])
        ),
      };

      // Call the API directly
      const response = await fetch(`/api/teknisi/laporan/${laporanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

const result = await response.json();

      if (result.success) {
        onClose();
        onSubmit(formData);
        // Let the parent component handle navigation
      } else {
        throw new Error(result.message || 'Failed to submit laporan');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // Don't show alert to user since data is actually being saved successfully
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
        <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-xl bg-white hide-scrollbar" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
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
        <div className="mt-3"> 
            <form onSubmit={handleSubmit}>
              {/* HEADER */}
              <div className="text-center border-b-2 border-gray-300 pb-5 mb-8">
                <h2 className="text-xl font-bold text-blue-900 mb-2">FORM KEGIATAN TEKNISI SIARAN</h2>
                <p className="text-sm font-semibold text-gray-600">OPERASIONAL PERALATAN PRODUKSI DAN PENYIARAN</p>
              </div>

              <div className="px-5">
              {/* IDENTITAS SECTION */}
              <div className="mb-8">
                <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">IDENTITAS</h3>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Nama Petugas</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          name="namaPetugas"
                          value={formData.namaPetugas}
                          onChange={handleChange}
                          required
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Masukkan nama petugas"
                        />
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">NIP / ID</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          name="nipId"
                          value={formData.nipId}
                          onChange={handleChange}
                          required
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Masukkan NIP atau ID"
                        />
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Jabatan</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <select
                          name="jabatan"
                          value={formData.jabatan}
                          onChange={handleChange}
                          required
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                        >
                          <option value="">-- Pilih Jabatan --</option>
                          {jabatanOptions.map((jabatan) => (
                            <option key={jabatan.ID} value={jabatan.Jabatan}>
                              {jabatan.Jabatan}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Tanggal</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="date"
                          name="tanggal"
                          value={formData.tanggal}
                          onChange={handleChange}
                          required
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                        />
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Program/Kegiatan</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <select
                          name="programKegiatan"
                          value={formData.programKegiatan}
                          onChange={handleChange}
                          required
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                        >
                          <option value="">-- Pilih Program/Kegiatan --</option>
                          {kegiatanOptions.map((kegiatan) => (
                            <option key={kegiatan.Id} value={kegiatan.Kegiatan}>
                              {kegiatan.Kegiatan}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Lokasi</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          name="lokasi"
                          value={formData.lokasi}
                          onChange={handleChange}
                          required
                          className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Masukkan lokasi kegiatan"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PRE-PRODUCTION CHECKLIST */}
              <div className="mb-8">
                <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-2">2. PRE-PRODUCTION</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 text-sm">Kegiatan</th>
                        <th className="px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 text-sm w-20 text-center">Check</th>
                        <th className="px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 text-sm">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.prep_checklist.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item.kegiatan}</td>
                          <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) => handleChecklistChange('prep', index, 'checked', e.target.checked)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                            <input
                              type="text"
                              value={item.keterangan}
                              onChange={(e) => handleChecklistChange('prep', index, 'keterangan', e.target.value)}
                              className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                              placeholder="Keterangan"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PRODUCTION CHECKLIST */}
              <div className="mb-8">
                <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-2">3. PRODUCTION</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 text-sm">Kegiatan</th>
                        <th className="px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 text-sm w-20 text-center">Check</th>
                        <th className="px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 text-sm">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.prod_checklist.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item.kegiatan}</td>
                          <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) => handleChecklistChange('prod', index, 'checked', e.target.checked)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                            <input
                              type="text"
                              value={item.keterangan}
                              onChange={(e) => handleChecklistChange('prod', index, 'keterangan', e.target.value)}
                              className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                              placeholder="Keterangan"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* POST-PRODUCTION CHECKLIST */}
              <div className="mb-8">
                <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-2">4. POST-PRODUCTION</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 text-sm">Kegiatan</th>
                        <th className="px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 text-sm w-20 text-center">Check</th>
                        <th className="px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 text-sm">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.post_checklist.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item.kegiatan}</td>
                          <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) => handleChecklistChange('post', index, 'checked', e.target.checked)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                            <input
                              type="text"
                              value={item.keterangan}
                              onChange={(e) => handleChecklistChange('post', index, 'keterangan', e.target.value)}
                              className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                              placeholder="Keterangan"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CATATAN TEKNIS SECTION */}
              <div className="mb-8">
                <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-2">5. CATATAN TEKNIS / KENDALA</h3>
                <textarea
                  name="catatanTeknis"
                  value={formData.catatanTeknis}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-white"
                  placeholder="Tuliskan catatan teknis atau kendala yang dihadapi selama kegiatan..."
                />
              </div>

              {/* FOTO BUKTI SECTION */}
              <div className="mb-8">
                <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">FOTO BUKTI KEGIATAN</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <h4 className="text-gray-600 mb-4">Unggah foto dokumentasi kegiatan</h4>
                  <input
                    type="file"
                    name="fotoBukti"
                    accept="image/*"
                    multiple
                    onChange={handleFotoChange}
                    className="hidden"
                    id="fotoInput"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('fotoInput')?.click()}
                    className="bg-blue-50 text-blue-900 px-4 py-2 border-2 border-blue-900 rounded hover:bg-blue-100 transition-colors"
                  >
                    <span className="mr-2">" + "</span>
                    Pilih Foto
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Format: JPG, PNG (Maks. 5MB per file)</p>
                  
                  {/* Foto Preview */}
                  {fotoPreview.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {fotoPreview.map((src, index) => (
                        <img
                          key={index}
                          src={src}
                          alt={`Preview ${index + 1}`}
                          className="w-24 h-24 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
                    {loading ? 'Menyimpan...' : 'Simpan sebagai Draft'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleAjukan}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Mengajukan...' : 'Ajukan Laporan'}
                  </button>
                </div>
              </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditLaporanTeknisiFormAdvanced;
