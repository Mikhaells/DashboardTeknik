'use client';

import { useState, useEffect } from 'react';
import { Kegiatan, JenisKegiatan, ShiftKerja, LaporanHarian } from '@/lib/dashboard';

interface EditLaporanFormProps {
  laporanId: number;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function EditLaporanForm({ laporanId, onClose, onSubmit }: EditLaporanFormProps) {
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Format: YYYY-MM-DD for input type="date"
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (timeString: string) => {
    if (!timeString) return '';
    
    // Handle different time formats
    if (timeString.includes(':')) {
      // If already in HH:MM format, return as is
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        const hours = String(parts[0]).padStart(2, '0');
        const minutes = String(parts[1]).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    }
    
    // Try to parse as time and format
    try {
      const date = new Date(`2000-01-01T${timeString}`);
      if (isNaN(date.getTime())) return '';
      
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (error) {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    // A. IDENTITAS LAPORAN
    tanggal: '',
    waktuMulai: '',
    waktuSelesai: '',
    namaProgram: '',
    jenisProduksi: '',
    lokasi: '',
    technicalDirector: '',
    shift: '',
    
    // B. RINGKASAN KEGIATAN
    ringkasan: '',
    
    // C. PERALATAN & SISTEM
    peralatan: [
      { id: 1, nama: '', kondisi: 'Baik', keterangan: '' }
    ],
    
    // D. KONDISI SIARAN/PRODUKSI
    video_quality: 'Normal',
    video_ket: '',
    audio_quality: 'Normal',
    audio_ket: '',
    sinkron: 'Normal',
    sinkron_ket: '',
    stabilitas: 'Normal',
    stabilitas_ket: '',
    gangguan_siaran: 'Normal',
    gangguan_ket: '',
    
    // E. GANGGUAN/KENDALA TEKNIS
    gangguan: [
      { id: 1, waktu: '', peralatan: '', jenis: '', tindakan: '', status: 'Selesai' }
    ],
    
    // F. TINDAKAN & KOORDINASI
    tindakan: '',
    
    // G. CATATAN KHUSUS / REKOMENDASI
    catatan: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownData, setDropdownData] = useState({
    kegiatan: [] as Kegiatan[],
    jenisKegiatan: [] as JenisKegiatan[],
    shiftKerja: [] as ShiftKerja[]
  });
  const [isLoadingDropdown, setIsLoadingDropdown] = useState(true);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPeralatanRow = () => {
    const newId = Math.max(...formData.peralatan.map(p => p.id)) + 1;
    setFormData(prev => ({
      ...prev,
      peralatan: [...prev.peralatan, { id: newId, nama: '', kondisi: 'Baik', keterangan: '' }]
    }));
  };

  const removePeralatanRow = (id: number) => {
    if (formData.peralatan.length > 1) {
      setFormData(prev => ({
        ...prev,
        peralatan: prev.peralatan.filter(p => p.id !== id)
      }));
    }
  };

  const updatePeralatan = (id: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      peralatan: prev.peralatan.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
  };

  const addGangguanRow = () => {
    const newId = Math.max(...formData.gangguan.map(g => g.id)) + 1;
    setFormData(prev => ({
      ...prev,
      gangguan: [...prev.gangguan, { id: newId, waktu: '', peralatan: '', jenis: '', tindakan: '', status: 'Selesai' }]
    }));
  };

  const removeGangguanRow = (id: number) => {
    if (formData.gangguan.length > 1) {
      setFormData(prev => ({
        ...prev,
        gangguan: prev.gangguan.filter(g => g.id !== id)
      }));
    }
  };

  const updateGangguan = (id: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      gangguan: prev.gangguan.map(g => 
        g.id === id ? { ...g, [field]: value } : g
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmitWithStatus(2); // Default to Pending for form submit
  };

  const handleSubmitWithStatus = async (statusId: number) => {
    setIsSubmitting(true);
    
    try {
      // Add statusId to formData
      const submitData = {
        ...formData,
        statusId: statusId
      };
      
      await onSubmit(submitData);
      // Restore body scroll after successful submission
      document.body.style.overflow = '';
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Lock body scroll when modal opens
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Fetch dropdown data
    const fetchDropdownData = async () => {
      try {
        const [kegiatanRes, jenisRes, shiftRes] = await Promise.all([
          fetch('/api/dropdown/kegiatan'),
          fetch('/api/dropdown/jenis-kegiatan'),
          fetch('/api/dropdown/shift-kerja')
        ]);

        const [kegiatanData, jenisData, shiftData] = await Promise.all([
          kegiatanRes.json(),
          jenisRes.json(),
          shiftRes.json()
        ]);

        if (isMounted) {
          setDropdownData({
            kegiatan: kegiatanData.data || [],
            jenisKegiatan: jenisData.data || [],
            shiftKerja: shiftData.data || []
          });
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      } finally {
        if (isMounted) {
          setIsLoadingDropdown(false);
        }
      }
    };

    // Fetch existing laporan data
    const fetchLaporanData = async () => {
      try {
        const laporanResponse = await fetch(`/api/laporan/${laporanId}/detail`);
        if (!laporanResponse.ok) {
          throw new Error('Failed to fetch laporan data');
        }
        const laporanResult = await laporanResponse.json();
        
        if (laporanResult.success && isMounted) {
          const data = laporanResult.data;
          
          // Fetch related data like DetailLaporanForm
          const [peralatanResponse, kondisiResponse, gangguanResponse] = await Promise.all([
            fetch(`/api/laporan/${laporanId}/peralatan`),
            fetch(`/api/laporan/${laporanId}/kondisi-siaran`),
            fetch(`/api/laporan/${laporanId}/gangguan-teknis`)
          ]);

          const [peralatanResult, kondisiResult, gangguanResult] = await Promise.all([
            peralatanResponse.json(),
            kondisiResponse.json(),
            gangguanResponse.json()
          ]);

          // Process peralatan data
          const peralatanData = peralatanResult.success && peralatanResult.data.length > 0 
            ? peralatanResult.data.map((item: any) => ({
                id: item.Id,
                nama: item.Peralatan || '',
                kondisi: item.Condition || 'Baik',
                keterangan: item.Desc || ''
              }))
            : [{ id: 1, nama: '', kondisi: 'Baik', keterangan: '' }];

          // Process gangguan data
          const gangguanData = gangguanResult.success && gangguanResult.data.length > 0
            ? gangguanResult.data.map((item: any) => ({
                id: item.Id,
                waktu: item.Time || '',
                peralatan: item.Peralatan || '',
                jenis: item.JenisGanguan || '',
                tindakan: item.TindakanPerbaikan || '',
                status: item.Status || 'Selesai'
              }))
            : [{ id: 1, waktu: '', peralatan: '', jenis: '', tindakan: '', status: 'Selesai' }];

          // Process kondisi siaran data
          let kondisiSiaranData = {
            video_quality: 'Normal',
            video_ket: '',
            audio_quality: 'Normal',
            audio_ket: '',
            sinkron: 'Normal',
            sinkron_ket: '',
            stabilitas: 'Normal',
            stabilitas_ket: '',
            gangguan_siaran: 'Normal',
            gangguan_ket: '',
          };

          if (kondisiResult.success && kondisiResult.data.length > 0) {
            kondisiResult.data.forEach((item: any) => {
              switch (item.Aspek) {
                case 'Kualitas Video':
                  kondisiSiaranData.video_quality = item.Status || 'Normal';
                  kondisiSiaranData.video_ket = item.Desc || '';
                  break;
                case 'Kualitas Audio':
                  kondisiSiaranData.audio_quality = item.Status || 'Normal';
                  kondisiSiaranData.audio_ket = item.Desc || '';
                  break;
                case 'Sinkron Audio-Video':
                  kondisiSiaranData.sinkron = item.Status || 'Normal';
                  kondisiSiaranData.sinkron_ket = item.Desc || '';
                  break;
                case 'Stabilitas Sistem':
                  kondisiSiaranData.stabilitas = item.Status || 'Normal';
                  kondisiSiaranData.stabilitas_ket = item.Desc || '';
                  break;
                case 'Gangguan Siaran':
                  kondisiSiaranData.gangguan_siaran = item.Status || 'Normal';
                  kondisiSiaranData.gangguan_ket = item.Desc || '';
                  break;
              }
            });
          }

          // Try different approaches
          let tanggalValue = '';
          let waktuMulaiValue = '';
          let waktuSelesaiValue = '';
          
          // Try direct assignment first
          tanggalValue = data.Date || '';
          waktuMulaiValue = data.Start || '';
          waktuSelesaiValue = data.Stop || '';
          
          // If direct doesn't work, try formatting
          if (tanggalValue && typeof tanggalValue === 'string') {
            const formattedDate = formatDateForInput(tanggalValue);
            if (formattedDate) {
              tanggalValue = formattedDate;
            }
          }
          
          if (waktuMulaiValue && typeof waktuMulaiValue === 'string') {
            const formattedTime = formatTimeForInput(waktuMulaiValue);
            if (formattedTime) {
              waktuMulaiValue = formattedTime;
            }
          }
          
          if (waktuSelesaiValue && typeof waktuSelesaiValue === 'string') {
            const formattedTime = formatTimeForInput(waktuSelesaiValue);
            if (formattedTime) {
              waktuSelesaiValue = formattedTime;
            }
          }

          setFormData({
            tanggal: tanggalValue,
            waktuMulai: waktuMulaiValue,
            waktuSelesai: waktuSelesaiValue,
            namaProgram: data.KegiatanId?.toString() || '',
            jenisProduksi: data.JenisKegiatanId?.toString() || '',
            lokasi: data.Location || '',
            technicalDirector: data.TechnicalDirector || '',
            shift: data.ShiftId?.toString() || '',
            ringkasan: data.Ringkasan || '',
            tindakan: data.TindakanKoordinasi || '',
            catatan: data.CatatanKhusus || '',
            peralatan: peralatanData,
            gangguan: gangguanData,
            ...kondisiSiaranData
          });
        }
      } catch (error) {
        console.error('Error fetching laporan data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDropdownData();
    fetchLaporanData();

    // Cleanup function
    return () => {
      isMounted = false;
      // Restore body scroll
      document.body.style.overflow = originalStyle;
    };
  }, [laporanId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-xl bg-white">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-xl bg-white" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
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
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            // Restore body scroll immediately
            document.body.style.overflow = '';
            // Call onClose
            onClose();
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          disabled={isSubmitting}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <form id="tdForm" onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="text-center border-b-2 border-gray-300 pb-5 mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-2">FORM LAPORAN HARIAN</h2>
            <p className="text-sm font-semibold text-gray-600">TECHNICAL DIRECTOR PRODUKSI & PENYIARAN</p>
          </div>

          {/* A. IDENTITAS LAPORAN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">A. IDENTITAS LAPORAN</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Hari / Tanggal</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <input 
                      type="date" 
                      name="tanggal" 
                      value={formData.tanggal}
                      onChange={(e) => handleInputChange('tanggal', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      required
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Waktu Produksi / Siaran</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <div className="flex gap-2 items-center">
                      <input 
                        type="time" 
                        name="waktuMulai" 
                        value={formData.waktuMulai}
                        onChange={(e) => handleInputChange('waktuMulai', e.target.value)}
                        className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-white"
                        required
                      />
                      <span className="text-gray-900 font-semibold">-</span>
                      <input 
                        type="time" 
                        name="waktuSelesai" 
                        value={formData.waktuSelesai}
                        onChange={(e) => handleInputChange('waktuSelesai', e.target.value)}
                        className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-white"
                        required
                      />
                    </div>
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Nama Program / Kegiatan</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <select 
                      name="namaProgram" 
                      value={formData.namaProgram}
                      onChange={(e) => handleInputChange('namaProgram', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      required
                      disabled={isLoadingDropdown}
                    >
                      <option value="">-- Pilih Program/Kegiatan --</option>
                      {isLoadingDropdown ? (
                        <option value="" disabled>Loading...</option>
                      ) : (
                        dropdownData.kegiatan.map((item) => (
                          <option key={item.Id} value={item.Id}>
                            {item.Kegiatan} - {item.Desc}
                          </option>
                        ))
                      )}
                    </select>
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Jenis Produksi</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <select 
                      name="jenisProduksi" 
                      value={formData.jenisProduksi}
                      onChange={(e) => handleInputChange('jenisProduksi', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      required
                      disabled={isLoadingDropdown}
                    >
                      <option value="">-- Pilih Jenis Produksi --</option>
                      {isLoadingDropdown ? (
                        <option value="" disabled>Loading...</option>
                      ) : (
                        dropdownData.jenisKegiatan.map((item) => (
                          <option key={item.Id} value={item.Id}>
                            {item.Jenis} - {item.Desc}
                          </option>
                        ))
                      )}
                    </select>
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Lokasi</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <input 
                      type="text" 
                      name="lokasi" 
                      value={formData.lokasi}
                      onChange={(e) => handleInputChange('lokasi', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      placeholder="Masukkan lokasi"
                      required
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Technical Director</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <input 
                      type="text" 
                      name="technicalDirector" 
                      value={formData.technicalDirector}
                      onChange={(e) => handleInputChange('technicalDirector', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      placeholder="Masukkan nama Technical Director"
                      required
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Shift Kerja</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <select 
                      name="shift" 
                      value={formData.shift}
                      onChange={(e) => handleInputChange('shift', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      required
                      disabled={isLoadingDropdown}
                    >
                      <option value="">-- Pilih Shift Kerja --</option>
                      {isLoadingDropdown ? (
                        <option value="" disabled>Loading...</option>
                      ) : (
                        dropdownData.shiftKerja.map((item) => (
                          <option key={item.Id} value={item.Id}>
                            {item.Shift} - {item.Desc}
                          </option>
                        ))
                      )}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* B. RINGKASAN KEGIATAN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">B. RINGKASAN KEGIATAN</h3>
            <textarea
              name="ringkasan"
              value={formData.ringkasan}
              onChange={(e) => handleInputChange('ringkasan', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900"
              rows={4}
              placeholder="Masukkan ringkasan kegiatan"
              required
            />
          </div>

          {/* C. PERALATAN & SISTEM */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">C. PERALATAN & SISTEM</h3>
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Nama Peralatan/Sistem</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Kondisi</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Keterangan</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {formData.peralatan.map((item) => (
                  <tr key={item.id} className="border border-gray-300">
                    <td className="px-3 py-2 border border-gray-300">
                      <input
                        type="text"
                        value={item.nama}
                        onChange={(e) => updatePeralatan(item.id, 'nama', e.target.value)}
                        className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-white"
                        placeholder="Nama peralatan/sistem"
                      />
                    </td>
                    <td className="px-3 py-2 border border-gray-300">
                      <select
                        value={item.kondisi}
                        onChange={(e) => updatePeralatan(item.id, 'kondisi', e.target.value)}
                        className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 text-gray-900 bg-white"
                      >
                        <option value="Baik">Baik</option>
                        <option value="Rusak">Rusak</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300">
                      <input
                        type="text"
                        value={item.keterangan}
                        onChange={(e) => updatePeralatan(item.id, 'keterangan', e.target.value)}
                        className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-white"
                        placeholder="Keterangan"
                      />
                    </td>
                    <td className="px-3 py-2 border border-gray-300 text-center">
                      <button
                        type="button"
                        onClick={() => removePeralatanRow(item.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        disabled={formData.peralatan.length === 1}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={addPeralatanRow}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              + Tambah Peralatan
            </button>
          </div>

          {/* D. KONDISI SIARAN / PRODUKSI */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">D. KONDISI SIARAN / PRODUKSI</h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Aspek</th>
                  <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Status</th>
                  <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border border-gray-300">
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">Kualitas Video</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <select 
                      value={formData.video_quality}
                      onChange={(e) => handleInputChange('video_quality', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Terganggu">Terganggu</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 border border-gray-300">
                    <input 
                      type="text" 
                      placeholder="Keterangan"
                      value={formData.video_ket}
                      onChange={(e) => handleInputChange('video_ket', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">Kualitas Audio</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <select 
                      value={formData.audio_quality}
                      onChange={(e) => handleInputChange('audio_quality', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Terganggu">Terganggu</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 border border-gray-300">
                    <input 
                      type="text" 
                      placeholder="Keterangan"
                      value={formData.audio_ket}
                      onChange={(e) => handleInputChange('audio_ket', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">Sinkron Audio-Video</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <select 
                      value={formData.sinkron}
                      onChange={(e) => handleInputChange('sinkron', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Terganggu">Terganggu</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 border border-gray-300">
                    <input 
                      type="text" 
                      placeholder="Keterangan"
                      value={formData.sinkron_ket}
                      onChange={(e) => handleInputChange('sinkron_ket', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">Stabilitas Sistem</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <select 
                      value={formData.stabilitas}
                      onChange={(e) => handleInputChange('stabilitas', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Terganggu">Terganggu</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 border border-gray-300">
                    <input 
                      type="text" 
                      placeholder="Keterangan"
                      value={formData.stabilitas_ket}
                      onChange={(e) => handleInputChange('stabilitas_ket', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">Gangguan Siaran</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <select 
                      value={formData.gangguan_siaran}
                      onChange={(e) => handleInputChange('gangguan_siaran', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Terganggu">Terganggu</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 border border-gray-300">
                    <input 
                      type="text" 
                      placeholder="Keterangan"
                      value={formData.gangguan_ket}
                      onChange={(e) => handleInputChange('gangguan_ket', e.target.value)}
                      className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* E. GANGGUAN/KENDALA TEKNIS */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">E. GANGGUAN/KENDALA TEKNIS</h3>
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Waktu</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Peralatan/Sistem</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Jenis Gangguan</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Tindakan Perbaikan</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {formData.gangguan.map((item) => (
                  <tr key={item.id} className="border border-gray-300">
                    <td className="px-3 py-2 border border-gray-300">
                      <input
                        type="time"
                        value={item.waktu}
                        onChange={(e) => updateGangguan(item.id, 'waktu', e.target.value)}
                        className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-white"
                      />
                    </td>
                    <td className="px-3 py-2 border border-gray-300">
                      <input
                        type="text"
                        value={item.peralatan}
                        onChange={(e) => updateGangguan(item.id, 'peralatan', e.target.value)}
                        className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-white"
                        placeholder="Peralatan/Sistem"
                      />
                    </td>
                    <td className="px-3 py-2 border border-gray-300">
                      <input
                        type="text"
                        value={item.jenis}
                        onChange={(e) => updateGangguan(item.id, 'jenis', e.target.value)}
                        className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-white"
                        placeholder="Jenis gangguan"
                      />
                    </td>
                    <td className="px-3 py-2 border border-gray-300">
                      <input
                        type="text"
                        value={item.tindakan}
                        onChange={(e) => updateGangguan(item.id, 'tindakan', e.target.value)}
                        className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-white"
                        placeholder="Tindakan perbaikan"
                      />
                    </td>
                    <td className="px-3 py-2 border border-gray-300">
                      <select
                        value={item.status}
                        onChange={(e) => updateGangguan(item.id, 'status', e.target.value)}
                        className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 text-gray-900 bg-white"
                      >
                        <option value="Selesai">Selesai</option>
                        <option value="Belum Selesai">Belum Selesai</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 text-center">
                      <button
                        type="button"
                        onClick={() => removeGangguanRow(item.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        disabled={formData.gangguan.length === 1}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={addGangguanRow}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              + Tambah Gangguan
            </button>
          </div>

          {/* F. TINDAKAN & KOORDINASI */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">F. TINDAKAN & KOORDINASI</h3>
            <textarea
              name="tindakan"
              value={formData.tindakan}
              onChange={(e) => handleInputChange('tindakan', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900"
              rows={4}
              placeholder="Masukkan tindakan dan koordinasi yang dilakukan"
              required
            />
          </div>

          {/* G. CATATAN KHUSUS / REKOMENDASI */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">G. CATATAN KHUSUS / REKOMENDASI</h3>
            <textarea
              name="catatan"
              value={formData.catatan}
              onChange={(e) => handleInputChange('catatan', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900"
              rows={4}
              placeholder="Masukkan catatan khusus atau rekomendasi"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                // Restore body scroll immediately
                document.body.style.overflow = '';
                // Call onClose
                onClose();
              }}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitWithStatus(1)} // Draft status
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitWithStatus(2)} // Pending status
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Mengajukan...' : 'Ajukan Laporan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
