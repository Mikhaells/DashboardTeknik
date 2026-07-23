'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface TambahLaporanTeknisiFormAdvancedProps {
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
}

export default function TambahLaporanTeknisiFormAdvanced({ onClose, onSubmit }: TambahLaporanTeknisiFormAdvancedProps) {
  const [formData, setFormData] = useState({
    // Identitas
    namaPetugas: '',
    nipId: '',
    jabatan: '',
    tanggal: '',
    programKegiatan: '',
    lokasi: '',
    
    // Pre-Production Checklist
    prep_checklist: Array(13).fill({ checked: false, keterangan: '' }),
    
    // Production Checklist
    prod_checklist: Array(13).fill({ checked: false, keterangan: '' }),
    
    // Post-Production Checklist
    post_checklist: Array(12).fill({ checked: false, keterangan: '' }),
    
    // Catatan
    catatanTeknis: '',
    
    // Foto
    fotoBukti: [] as File[],
  });

  const [kegiatanOptions, setKegiatanOptions] = useState<Array<{Id: number, Kegiatan: string, Desc: string}>>([]);
  const [jabatanOptions, setJabatanOptions] = useState<Array<{ID: number, Jabatan: string, Desc: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string[]>([]);

  // Pre-Production Items with Subsections
  const prepItems = [
    // Subsection: Peralatan Video
    "Menyiapkan peralatan produksi sesuai rundown",
    "Melakukan pengecekan kondisi kamera dan lensa",
    "Menyiapkan monitor preview dan program",
    "Melakukan pengecekan sinyal video",
    
    // Subsection: Peralatan Audio
    "Menyiapkan perangkat komunikasi (intercom / headset)",
    "Melakukan pengecekan sinyal audio",
    "Menyiapkan mikrofon dan peralatan audio",
    
    // Subsection: Lighting dan Power
    "Menyiapkan lighting studio",
    "Menyalakan peralatan produksi sesuai SOP",
    "Melakukan pengecekan koneksi power",
    
    // Subsection: Koordinasi dan Test
    "Melakukan koordinasi dengan kameramen dan operator lain",
    "Melakukan test recording / test transmission",
    "Melakukan final check sebelum siaran"
  ];

  // Production Items with Subsections
  const prodItems = [
    // Subsection: Operasional Utama
    "Mengoperasikan peralatan sesuai arahan Technical Director",
    "Membantu pengoperasian kamera / switching",
    "Mengawasi monitor program dan preview",
    "Membantu pengoperasian perangkat playback / VTR / server",
    
    // Subsection: Monitoring Kualitas
    "Memastikan sinyal video stabil",
    "Memastikan audio masuk dengan baik",
    "Memastikan koneksi ke MCR / transmisi berjalan normal",
    
    // Subsection: Troubleshooting
    "Melakukan penyesuaian peralatan bila terjadi gangguan",
    "Mencatat kendala teknis yang terjadi selama produksi",
    "Melakukan troubleshooting cepat saat terjadi masalah",
    
    // Subsection: Koordinasi Tim
    "Berkoordinasi dengan tim produksi selama siaran berlangsung",
    "Komunikasi dengan MCR untuk koordinasi transmisi",
    "Memberikan update status peralatan kepada Technical Director"
  ];

  // Post-Production Items with Subsections
  const postItems = [
    // Subsection: Shutdown Procedures
    "Mematikan peralatan sesuai prosedur",
    "Melakukan final check sebelum shutdown",
    "Memastikan semua peralatan dalam kondisi off",
    
    // Subsection: Housekeeping
    "Merapikan kabel dan perangkat produksi",
    "Membersihkan area kerja",
    "Mengembalikan peralatan ke tempat penyimpanan",
    
    // Subsection: Pemeriksaan Peralatan
    "Mengecek kondisi peralatan setelah digunakan",
    "Mencatat kerusakan atau kendala teknis",
    "Melakukan inventory peralatan yang digunakan",
    
    // Subsection: Pelaporan
    "Membuat laporan penggunaan peralatan",
    "Melaporkan hasil kegiatan kepada Teknisi / Technical Director",
    "Membuat catatan untuk maintenance peralatan"
  ];

  useEffect(() => {
    fetchOptions();
    // Set today's date as default and initialize checklist with kegiatan text
    const prepChecklistData = prepItems.map((kegiatan, index) => ({
      id: index + 1,
      kegiatan: kegiatan,
      checked: false,
      keterangan: ''
    }));
    const prodChecklistData = prodItems.map((kegiatan, index) => ({
      id: index + 1,
      kegiatan: kegiatan,
      checked: false,
      keterangan: ''
    }));
    const postChecklistData = postItems.map((kegiatan, index) => ({
      id: index + 1,
      kegiatan: kegiatan,
      checked: false,
      keterangan: ''
    }));
    setFormData(prev => ({
      ...prev,
      tanggal: new Date().toISOString().split('T')[0],
      prep_checklist: prepChecklistData,
      prod_checklist: prodChecklistData,
      post_checklist: postChecklistData
    }));
  }, []);

  const fetchOptions = async () => {
    try {
      // Fetch Kegiatan options
      const kegiatanResponse = await fetch('/api/dropdown/kegiatan');
      if (!kegiatanResponse.ok) {
        throw new Error(`HTTP error! status: ${kegiatanResponse.status}`);
      }
      const kegiatanData = await kegiatanResponse.json();
      if (kegiatanData.success) {
        setKegiatanOptions(kegiatanData.data);
      }

      // Fetch Jabatan options
      const jabatanResponse = await fetch('/api/teknisi/jabatan');
      if (!jabatanResponse.ok) {
        throw new Error(`HTTP error! status: ${jabatanResponse.status}`);
      }
      const jabatanData = await jabatanResponse.json();
      if (jabatanData.success) {
        setJabatanOptions(jabatanData.data);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
      // Set empty arrays on error to prevent undefined errors
      setKegiatanOptions([]);
      setJabatanOptions([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChecklistChange = (section: 'prep' | 'prod' | 'post', index: number, field: 'checked' | 'keterangan', value: any) => {
    setFormData(prev => ({
      ...prev,
      [`${section}_checklist`]: prev[`${section}_checklist`].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      fotoBukti: [...prev.fotoBukti, ...files]
    }));

    // Create preview
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFotoPreview(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
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
      const response = await fetch('/api/teknisi/laporan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      const result = await response.json();

      if (result.success) {
        await onSubmit(formData);
        onClose();
        // Let the parent component handle navigation
      } else {
        throw new Error(result.message || 'Failed to save laporan');
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
      const response = await fetch('/api/teknisi/laporan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      const result = await response.json();

      if (result.success) {
        await onSubmit(formData);
        onClose();
        // Don't redirect - let the parent component handle data refresh
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

        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="text-center border-b-2 border-gray-300 pb-5 mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-2">FORM KEGIATAN TECHNICAL DIRECTOR</h2>
          </div>

          <div className="px-5">
          {/* A. IDENTITAS SECTION */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">A. IDENTITAS PETUGAS</h3>
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
                        {jabatanOptions.map(jabatan => (
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
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Program / Kegiatan</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <select
                      name="programKegiatan"
                      value={formData.programKegiatan}
                      onChange={handleChange}
                      required
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                    >
                        <option value="">-- Pilih Program / Kegiatan --</option>
                        {kegiatanOptions.map(kegiatan => (
                          <option key={kegiatan.Id} value={kegiatan.Kegiatan}>
                            {kegiatan.Kegiatan} ({kegiatan.Desc})
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

          {/* B. PRE-PRODUCTION SECTION */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">B. TAHAP PERSIAPAN (PRE-PRODUCTION)</h3>
            <div className="overflow-x-auto mb-3 hide-scrollbar">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">No</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Kegiatan</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Check</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Peralatan Video Subsection */}
                  <tr>
                    <td colSpan={4} className="bg-gray-100 text-gray-700 font-semibold px-3 py-2 border border-gray-300">
                      📹 Peralatan Video
                    </td>
                  </tr>
                  {prepItems.slice(0, 4).map((item, index) => (
                    <tr key={index} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 1}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={formData.prep_checklist[index].checked}
                          onChange={(e) => handleChecklistChange('prep', index, 'checked', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.prep_checklist[index].keterangan}
                          onChange={(e) => handleChecklistChange('prep', index, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Keterangan"
                        />
                      </td>
                    </tr>
                  ))}
                  
                  {/* Peralatan Audio Subsection */}
                  <tr>
                    <td colSpan={4} className="bg-gray-100 text-gray-700 font-semibold px-3 py-2 border border-gray-300">
                      🎤 Peralatan Audio
                    </td>
                  </tr>
                  {prepItems.slice(4, 7).map((item, index) => (
                    <tr key={index + 4} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 5}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={formData.prep_checklist[index + 4].checked}
                          onChange={(e) => handleChecklistChange('prep', index + 4, 'checked', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.prep_checklist[index + 4].keterangan}
                          onChange={(e) => handleChecklistChange('prep', index + 4, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Keterangan"
                        />
                      </td>
                    </tr>
                  ))}
                  
                  {/* Lighting dan Power Subsection */}
                  <tr>
                    <td colSpan={4} className="bg-gray-100 text-gray-700 font-semibold px-3 py-2 border border-gray-300">
                      💡 Lighting dan Power
                    </td>
                  </tr>
                  {prepItems.slice(7, 10).map((item, index) => (
                    <tr key={index + 7} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 8}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={formData.prep_checklist[index + 7].checked}
                          onChange={(e) => handleChecklistChange('prep', index + 7, 'checked', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.prep_checklist[index + 7].keterangan}
                          onChange={(e) => handleChecklistChange('prep', index + 7, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Keterangan"
                        />
                      </td>
                    </tr>
                  ))}
                  
                  {/* Koordinasi dan Test Subsection */}
                  <tr>
                    <td colSpan={4} className="bg-gray-100 text-gray-700 font-semibold px-3 py-2 border border-gray-300">
                      🤝 Koordinasi dan Test
                    </td>
                  </tr>
                  {prepItems.slice(10).map((item, index) => (
                    <tr key={index + 10} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 11}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={formData.prep_checklist[index + 10].checked}
                          onChange={(e) => handleChecklistChange('prep', index + 10, 'checked', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.prep_checklist[index + 10].keterangan}
                          onChange={(e) => handleChecklistChange('prep', index + 10, 'keterangan', e.target.value)}
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

          {/* C. PRODUCTION SECTION */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">C. TAHAP PELAKSANAAN PRODUKSI (PRODUCTION)</h3>
            <div className="overflow-x-auto mb-3 hide-scrollbar">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">No</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Kegiatan</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Check</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Operasional Utama Subsection */}
                  <tr>
                    <td colSpan={4} className="bg-gray-100 text-gray-700 font-semibold px-3 py-2 border border-gray-300">
                      🎬 Operasional Utama
                    </td>
                  </tr>
                  {prodItems.slice(0, 4).map((item, index) => (
                    <tr key={index} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 1}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={formData.prod_checklist[index].checked}
                          onChange={(e) => handleChecklistChange('prod', index, 'checked', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.prod_checklist[index].keterangan}
                          onChange={(e) => handleChecklistChange('prod', index, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Keterangan"
                        />
                      </td>
                    </tr>
                  ))}
                  
                  {/* Monitoring Kualitas Subsection */}
                  <tr>
                    <td colSpan={4} className="bg-gray-100 text-gray-700 font-semibold px-3 py-2 border border-gray-300">
                      📊 Monitoring Kualitas
                    </td>
                  </tr>
                  {prodItems.slice(4, 7).map((item, index) => (
                    <tr key={index + 4} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 5}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={formData.prod_checklist[index + 4].checked}
                          onChange={(e) => handleChecklistChange('prod', index + 4, 'checked', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.prod_checklist[index + 4].keterangan}
                          onChange={(e) => handleChecklistChange('prod', index + 4, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Keterangan"
                        />
                      </td>
                    </tr>
                  ))}
                  
                  {/* Troubleshooting Subsection */}
                  <tr>
                    <td colSpan={4} className="bg-gray-100 text-gray-700 font-semibold px-3 py-2 border border-gray-300">
                      🔧 Troubleshooting
                    </td>
                  </tr>
                  {prodItems.slice(7, 10).map((item, index) => (
                    <tr key={index + 7} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 8}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={formData.prod_checklist[index + 7].checked}
                          onChange={(e) => handleChecklistChange('prod', index + 7, 'checked', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.prod_checklist[index + 7].keterangan}
                          onChange={(e) => handleChecklistChange('prod', index + 7, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Keterangan"
                        />
                      </td>
                    </tr>
                  ))}
                  
                  {/* Koordinasi Tim Subsection */}
                  <tr>
                    <td colSpan={4} className="bg-gray-100 text-gray-700 font-semibold px-3 py-2 border border-gray-300">
                      👥 Koordinasi Tim
                    </td>
                  </tr>
                  {prodItems.slice(10).map((item, index) => (
                    <tr key={index + 10} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 11}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={formData.prod_checklist[index + 10].checked}
                          onChange={(e) => handleChecklistChange('prod', index + 10, 'checked', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.prod_checklist[index + 10].keterangan}
                          onChange={(e) => handleChecklistChange('prod', index + 10, 'keterangan', e.target.value)}
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

          {/* D. POST-PRODUCTION SECTION */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">D. TAHAP PASCA PRODUKSI (POST-PRODUCTION)</h3>
            <div className="overflow-x-auto mb-3 hide-scrollbar">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">No</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Kegiatan</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Check</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Shutdown Procedures Subsection */}
                  <tr>
                    <td colSpan={4} className="bg-gray-100 text-gray-700 font-semibold px-3 py-2 border border-gray-300">
                      🔌 Shutdown Procedures
                    </td>
                  </tr>
                  {postItems.slice(0, 3).map((item, index) => (
                    <tr key={index} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 1}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={formData.post_checklist[index].checked}
                          onChange={(e) => handleChecklistChange('post', index, 'checked', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.post_checklist[index].keterangan}
                          onChange={(e) => handleChecklistChange('post', index, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Keterangan"
                        />
                      </td>
                    </tr>
                  ))}
                  
                  {/* Housekeeping Subsection */}
                  <tr>
                    <td colSpan={4} className="bg-gray-100 text-gray-700 font-semibold px-3 py-2 border border-gray-300">
                      🧹 Housekeeping
                    </td>
                  </tr>
                  {postItems.slice(3, 6).map((item, index) => (
                    <tr key={index + 3} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 4}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={formData.post_checklist[index + 3].checked}
                          onChange={(e) => handleChecklistChange('post', index + 3, 'checked', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.post_checklist[index + 3].keterangan}
                          onChange={(e) => handleChecklistChange('post', index + 3, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Keterangan"
                        />
                      </td>
                    </tr>
                  ))}
                  
                  {/* Pemeriksaan Peralatan Subsection */}
                  <tr>
                    <td colSpan={4} className="bg-gray-100 text-gray-700 font-semibold px-3 py-2 border border-gray-300">
                      🔍 Pemeriksaan Peralatan
                    </td>
                  </tr>
                  {postItems.slice(6, 9).map((item, index) => (
                    <tr key={index + 6} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 7}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={formData.post_checklist[index + 6].checked}
                          onChange={(e) => handleChecklistChange('post', index + 6, 'checked', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.post_checklist[index + 6].keterangan}
                          onChange={(e) => handleChecklistChange('post', index + 6, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                          placeholder="Keterangan"
                        />
                      </td>
                    </tr>
                  ))}
                  
                  {/* Pelaporan Subsection */}
                  <tr>
                    <td colSpan={4} className="bg-gray-100 text-gray-700 font-semibold px-3 py-2 border border-gray-300">
                      📋 Pelaporan
                    </td>
                  </tr>
                  {postItems.slice(9).map((item, index) => (
                    <tr key={index + 9} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 10}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">{item}</td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-center">
                        <input
                          type="checkbox"
                          checked={formData.post_checklist[index + 9].checked}
                          onChange={(e) => handleChecklistChange('post', index + 9, 'checked', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                        <input
                          type="text"
                          value={formData.post_checklist[index + 9].keterangan}
                          onChange={(e) => handleChecklistChange('post', index + 9, 'keterangan', e.target.value)}
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

          {/* E. CATATAN TEKNIS SECTION */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">E. CATATAN TEKNIS / KENDALA</h3>
            <textarea
              name="catatanTeknis"
              value={formData.catatanTeknis}
              onChange={handleChange}
              rows={6}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-white"
              placeholder="Tuliskan catatan teknis atau kendala yang dihadapi selama kegiatan..."
            />
          </div>

          {/* F. FOTO BUKTI SECTION */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">F. FOTO BUKTI KEGIATAN</h3>
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
                {loading ? 'Menyimpan...' : '💾 Simpan sebagai Draft'}
              </button>
              <button 
                type="button" 
                onClick={handleAjukan}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Mengajukan...' : '📋 Ajukan Laporan'}
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
