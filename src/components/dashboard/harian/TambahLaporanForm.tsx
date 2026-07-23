'use client';

import { useState, useEffect } from 'react';
import { Kegiatan, JenisKegiatan, ShiftKerja } from '@/lib/dashboard';

interface TambahLaporanFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  onAjukan: (data: any) => void;
}

export default function TambahLaporanForm({ onClose, onSubmit, onAjukan }: TambahLaporanFormProps) {
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
    
    // E. TINDAKAN & KOORDINASI
    tindakan: '',
    
    // E. CATATAN KHUSUS / REKOMENDASI
    catatan: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Fetch dropdown data on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setIsLoadingDropdown(true);
        
        // Fetch all dropdown data in parallel
        const [kegiatanResponse, jenisKegiatanResponse, shiftKerjaResponse] = await Promise.all([
          fetch('/api/dropdown/kegiatan'),
          fetch('/api/dropdown/jenis-kegiatan'),
          fetch('/api/dropdown/shift-kerja')
        ]);

        // Parse responses
        const [kegiatanData, jenisKegiatanData, shiftKerjaData] = await Promise.all([
          kegiatanResponse.json(),
          jenisKegiatanResponse.json(),
          shiftKerjaResponse.json()
        ]);

        // Set dropdown data
        setDropdownData({
          kegiatan: kegiatanData.success ? kegiatanData.data : [],
          jenisKegiatan: jenisKegiatanData.success ? jenisKegiatanData.data : [],
          shiftKerja: shiftKerjaData.success ? shiftKerjaData.data : []
        });
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      } finally {
        setIsLoadingDropdown(false);
      }
    };

    fetchDropdownData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Get current user from session
      const userResponse = await fetch('/api/auth/me');
      const userResult = await userResponse.json();
      const currentUser = userResult.success ? userResult.user.username : 'Unknown User';
      
      const submitData = {
        // Convert dropdown values to IDs for database
        Date: formData.tanggal,
        Start: formData.waktuMulai,
        Stop: formData.waktuSelesai,
        KegiatanId: parseInt(formData.namaProgram), // Convert to ID
        JenisKegiatanId: parseInt(formData.jenisProduksi), // Convert to ID
        Location: formData.lokasi,
        TechnicalDirector: formData.technicalDirector,
        ShiftId: parseInt(formData.shift), // Convert to ID
        Ringkasan: formData.ringkasan,
        TindakanKoordinasi: formData.tindakan,
        CatatanKhusus: formData.catatan,
        StatusId: 1, // Draft (disimpan sebagai draft)
        CreateBy: currentUser, // Use actual logged-in user
        
        // Kondisi Siaran fields
        video_quality: formData.video_quality,
        video_ket: formData.video_ket,
        audio_quality: formData.audio_quality,
        audio_ket: formData.audio_ket,
        sinkron: formData.sinkron,
        sinkron_ket: formData.sinkron_ket,
        stabilitas: formData.stabilitas,
        stabilitas_ket: formData.stabilitas_ket,
        gangguan_siaran: formData.gangguan_siaran,
        gangguan_siaran_ket: formData.gangguan_ket,
        
        // Dynamic tables
        peralatan: formData.peralatan,
        gangguan: formData.gangguan
      };
      
      const response = await fetch('/api/laporan/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      
      if (result.success) {
        await onSubmit(formData);
        onClose();
      } else {
        throw new Error(result.message || 'Failed to save laporan');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Gagal menyimpan laporan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAjukan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Get current user from session
      const userResponse = await fetch('/api/auth/me');
      const userResult = await userResponse.json();
      const currentUser = userResult.success ? userResult.user.username : 'Unknown User';
      
      const submitData = {
        // Convert dropdown values to IDs for database
        Date: formData.tanggal,
        Start: formData.waktuMulai,
        Stop: formData.waktuSelesai,
        KegiatanId: parseInt(formData.namaProgram), // Convert to ID
        JenisKegiatanId: parseInt(formData.jenisProduksi), // Convert to ID
        Location: formData.lokasi,
        TechnicalDirector: formData.technicalDirector,
        ShiftId: parseInt(formData.shift), // Convert to ID
        Ringkasan: formData.ringkasan,
        TindakanKoordinasi: formData.tindakan,
        CatatanKhusus: formData.catatan,
        StatusId: 2, // Pending (diajukan untuk persetujuan)
        CreateBy: currentUser, // Use actual logged-in user
        
        // Kondisi Siaran fields
        video_quality: formData.video_quality,
        video_ket: formData.video_ket,
        audio_quality: formData.audio_quality,
        audio_ket: formData.audio_ket,
        sinkron: formData.sinkron,
        sinkron_ket: formData.sinkron_ket,
        stabilitas: formData.stabilitas,
        stabilitas_ket: formData.stabilitas_ket,
        gangguan_siaran: formData.gangguan_siaran,
        gangguan_siaran_ket: formData.gangguan_ket,
        
        // Dynamic tables
        peralatan: formData.peralatan,
        gangguan: formData.gangguan
      };
      
      const response = await fetch('/api/laporan/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      
      if (result.success) {
        await onAjukan(formData);
        onClose();
      } else {
        throw new Error(result.message || 'Failed to ajukan laporan');
      }
    } catch (error) {
      console.error('Error submitting ajukan:', error);
      alert('Gagal mengajukan laporan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          onClick={onClose}
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
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Jenis Produksi / Kegiatan</td>
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
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Lokasi Produksi / Studio</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <input 
                      type="text" 
                      name="lokasi" 
                      value={formData.lokasi}
                      onChange={(e) => handleInputChange('lokasi', e.target.value)}
                      placeholder="Masukkan lokasi"
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
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
                      placeholder="Nama Technical Director"
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      required
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Shift</td>
                  <td className="px-3 py-2 border border-gray-300">
                    <select 
                      name="shift" 
                      value={formData.shift}
                      onChange={(e) => handleInputChange('shift', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      required
                      disabled={isLoadingDropdown}
                    >
                      <option value="">-- Pilih Shift --</option>
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
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-2">B. RINGKASAN KEGIATAN</h3>
            <p className="text-xs text-gray-600 mb-3">Uraikan secara singkat kegiatan produksi dan/atau penyiaran yang dilaksanakan pada hari ini:</p>
            <textarea 
              name="ringkasan" 
              value={formData.ringkasan}
              onChange={(e) => handleInputChange('ringkasan', e.target.value)}
              rows={4}
              placeholder="Masukkan ringkasan kegiatan..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-white"
              required
            />
          </div>

          {/* C. PERALATAN & SISTEM */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">C. PERALATAN & SISTEM YANG DIGUNAKAN</h3>
            <div className="overflow-x-auto mb-3">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">No</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Peralatan / Sistem</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Kondisi</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Keterangan</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.peralatan.map((item, index) => (
                    <tr key={item.id} className="border border-gray-300">
                      <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">{index + 1}</td>
                      <td className="px-3 py-2 border border-gray-300">
                        <input 
                          type="text" 
                          placeholder="Masukkan nama peralatan"
                          value={item.nama}
                          onChange={(e) => updatePeralatan(item.id, 'nama', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300">
                        <select 
                          value={item.kondisi}
                          onChange={(e) => updatePeralatan(item.id, 'kondisi', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                        >
                          <option value="Baik">Baik</option>
                          <option value="Gangguan">Gangguan</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 border border-gray-300">
                        <input 
                          type="text" 
                          placeholder="Keterangan"
                          value={item.keterangan}
                          onChange={(e) => updatePeralatan(item.id, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                        />
                      </td>
                      <td className="text-center px-3 py-2 border border-gray-300">
                        <button 
                          type="button" 
                          onClick={() => removePeralatanRow(item.id)}
                          disabled={formData.peralatan.length === 1}
                          className={`px-2 py-1 text-xs rounded-md shadow-sm transition-all duration-200 ${formData.peralatan.length === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md active:scale-95'}`}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              type="button" 
              onClick={addPeralatanRow}
              className="bg-blue-900 text-white px-4 py-2 text-xs rounded hover:bg-blue-800"
            >
              + Tambah Peralatan
            </button>
          </div>

          
          {/* D. GANGGUAN/KENDALA TEKNIS */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-2">D. GANGGUAN / KENDALA TEKNIS</h3>
            <p className="text-xs text-gray-600 mb-3">Jelaskan apabila terdapat gangguan teknis selama produksi/penyiaran:</p>
            <div className="overflow-x-auto mb-3">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Waktu</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Peralatan / Sistem</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Jenis Gangguan</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Tindakan Perbaikan</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Status</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Aksi</th>
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
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300">
                        <input 
                          type="text" 
                          placeholder="Peralatan"
                          value={item.peralatan}
                          onChange={(e) => updateGangguan(item.id, 'peralatan', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300">
                        <input 
                          type="text" 
                          placeholder="Jenis gangguan"
                          value={item.jenis}
                          onChange={(e) => updateGangguan(item.id, 'jenis', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300">
                        <input 
                          type="text" 
                          placeholder="Tindakan"
                          value={item.tindakan}
                          onChange={(e) => updateGangguan(item.id, 'tindakan', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                        />
                      </td>
                      <td className="px-3 py-2 border border-gray-300">
                        <select 
                          value={item.status}
                          onChange={(e) => updateGangguan(item.id, 'status', e.target.value)}
                          className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                        >
                          <option value="Selesai">Selesai</option>
                          <option value="Lanjutan">Lanjutan</option>
                        </select>
                      </td>
                      <td className="text-center px-3 py-2 border border-gray-300">
                        <button 
                          type="button" 
                          onClick={() => removeGangguanRow(item.id)}
                          disabled={formData.gangguan.length === 1}
                          className={`px-2 py-1 text-xs rounded-md shadow-sm transition-all duration-200 ${formData.gangguan.length === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md active:scale-95'}`}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              type="button" 
              onClick={addGangguanRow}
              className="bg-blue-900 text-white px-4 py-2 text-xs rounded hover:bg-blue-800"
            >
              + Tambah Gangguan
            </button>
          </div>

          {/* F. TINDAKAN & KOORDINASI */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-2">F. TINDAKAN & KOORDINASI</h3>
            <p className="text-xs text-gray-600 mb-3">Uraikan tindakan teknis, koordinasi dengan tim produksi, engineering, IT, atau pihak terkait:</p>
            <textarea 
              name="tindakan" 
              value={formData.tindakan}
              onChange={(e) => handleInputChange('tindakan', e.target.value)}
              rows={4}
              placeholder="Masukkan tindakan koordinasi yang telah dilakukan..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-white"
            />
          </div>

          {/* E. CATATAN KHUSUS / REKOMENDASI */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-2">E. CATATAN KHUSUS / REKOMENDASI</h3>
            <p className="text-xs text-gray-600 mb-3">(Preventive maintenance, peningkatan kualitas siaran, penggantian alat, dll)</p>
            <textarea 
              name="catatan" 
              value={formData.catatan}
              onChange={(e) => handleInputChange('catatan', e.target.value)}
              rows={4}
              placeholder="Masukkan catatan khusus / rekomendasi..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-white"
            />
          </div>

          
          {/* SUBMIT BUTTON */}
          <div className="text-center mb-8">
            <div className="flex justify-center gap-4">
              <button 
                type="button" 
                onClick={onClose}
                disabled={isSubmitting}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan sebagai Draft'}
              </button>
              <button 
                type="button" 
                onClick={handleAjukan}
                disabled={isSubmitting}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Mengajukan...' : 'Ajukan Laporan'}
              </button>
            </div>
          </div>

          {/* CATATAN */}
          <div className="border-t-2 border-gray-300 pt-5 text-xs text-gray-600">
            <p><strong>Catatan:</strong> Form ini digunakan sebagai laporan rutin harian Technical Director Produksi dan Penyiaran.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
