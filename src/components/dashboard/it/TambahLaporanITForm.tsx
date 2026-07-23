'use client';

import React, { useState, useEffect } from 'react';

interface TambahLaporanITFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface FormData {
  // A. IDENTITAS LAPORAN
  tanggal: string;
  namaPetugas: string;
  nipId: string;
  jabatan: string;
  shift: string;
  
  // B. RINGKASAN KEGIATAN HARIAN
  ringkasan: string;
  
  // C. MONITORING SISTEM & INFRASTRUKTUR
  server_db_status: string;
  server_db_ket: string;
  server_app_status: string;
  server_app_ket: string;
  network_status: string;
  network_ket: string;
  internet_status: string;
  internet_ket: string;
  backup_status: string;
  backup_ket: string;
  security_status: string;
  security_ket: string;
  
    
  // D. MAINTENANCE & SYSTEM UPDATE
  patch_waktu: string;
  patch_hasil: string;
  patch_ket: string;
  db_maint_waktu: string;
  db_maint_hasil: string;
  db_maint_ket: string;
  net_maint_waktu: string;
  net_maint_hasil: string;
  net_maint_ket: string;
  hw_waktu: string;
  hw_hasil: string;
  hw_ket: string;
  
  // E. SECURITY AUDIT & MONITORING
  fw_log_status: string;
  fw_log_findings: string;
  fw_log_action: string;
  av_status: string;
  av_findings: string;
  av_action: string;
  user_access_status: string;
  user_access_findings: string;
  user_access_action: string;
  
  // F. INCIDENT REPORT
  incident: string;
  
  // G. PLANNED ACTIVITIES
  planned: string;
  
  }

export default function TambahLaporanITForm({ onClose, onSubmit }: TambahLaporanITFormProps) {
  const [jabatanOptions, setJabatanOptions] = useState<Array<{ID: number, Jabatan: string, Desc: string}>>([]);
  const [shiftOptions, setShiftOptions] = useState<Array<{Id: number, Shift: string, Desc: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingDropdown, setIsLoadingDropdown] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    // A. IDENTITAS LAPORAN
    tanggal: new Date().toISOString().split('T')[0],
    namaPetugas: '',
    nipId: '',
    jabatan: '',
    shift: '',
    
    // B. RINGKASAN KEGIATAN HARIAN
    ringkasan: '',
    
    // C. MONITORING SISTEM & INFRASTRUKTUR
    server_db_status: '',
    server_db_ket: '',
    server_app_status: '',
    server_app_ket: '',
    network_status: '',
    network_ket: '',
    internet_status: '',
    internet_ket: '',
    backup_status: '',
    backup_ket: '',
    security_status: '',
    security_ket: '',
    
        
    // D. MAINTENANCE & SYSTEM UPDATE
    patch_waktu: '',
    patch_hasil: '',
    patch_ket: '',
    db_maint_waktu: '',
    db_maint_hasil: '',
    db_maint_ket: '',
    net_maint_waktu: '',
    net_maint_hasil: '',
    net_maint_ket: '',
    hw_waktu: '',
    hw_hasil: '',
    hw_ket: '',
    
    // E. SECURITY AUDIT & MONITORING
    fw_log_status: '',
    fw_log_findings: '',
    fw_log_action: '',
    av_status: '',
    av_findings: '',
    av_action: '',
    user_access_status: '',
    user_access_findings: '',
    user_access_action: '',
    
    // F. INCIDENT REPORT
    incident: '',
    
    // G. PLANNED ACTIVITIES
    planned: '',
    
    });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setIsLoadingDropdown(true);
      
      // Fetch all dropdown data in parallel
      const [jabatanResponse, shiftKerjaResponse] = await Promise.all([
        fetch('/api/teknisi/jabatan'),
        fetch('/api/dropdown/shift-kerja')
      ]);

      // Parse responses
      const [jabatanData, shiftKerjaData] = await Promise.all([
        jabatanResponse.json(),
        shiftKerjaResponse.json()
      ]);

      // Set dropdown data
      setJabatanOptions(jabatanData.success ? jabatanData.data : []);
      setShiftOptions(shiftKerjaData.success ? shiftKerjaData.data : []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      // Set empty arrays on error to prevent undefined errors
      setJabatanOptions([]);
      setShiftOptions([]);
    } finally {
      setIsLoadingDropdown(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value || '')
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.namaPetugas || !formData.nipId || !formData.jabatan || !formData.tanggal) {
        alert('Mohon lengkapi semua field wajib (Nama Petugas, NIP, Jabatan, Tanggal)');
        return;
      }

      // Call API to save data
      const response = await fetch('/api/laporan-it/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onClose();
        alert('Laporan IT berhasil disimpan!');
        
        // Data sudah tersimpan lengkap ke 4 tables, tidak perlu double submit
        // Parent component hanya perlu refresh data table
      } else {
        throw new Error(result.message || 'Gagal menyimpan laporan');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Gagal menyimpan laporan: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
            <h2 className="text-xl font-bold text-blue-900 mb-2">FORM LAPORAN KINERJA IT</h2>
            <p className="text-sm font-semibold text-gray-600">DIVISI TEKNOLOGI INFORMASI</p>
          </div>

          <div className="px-5">
          {/* A. IDENTITAS LAPORAN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">A. IDENTITAS LAPORAN</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Hari / Tanggal</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input
                      type="date"
                      name="tanggal"
                      value={formData.tanggal}
                      onChange={handleChange}
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Nama Petugas IT</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input
                      type="text"
                      name="namaPetugas"
                      value={formData.namaPetugas}
                      onChange={handleChange}
                      placeholder="Masukkan nama petugas IT"
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
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
                      placeholder="Masukkan NIP atau ID"
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
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
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      disabled={isLoadingDropdown}
                    >
                      <option value="">-- Pilih Jabatan --</option>
                      {isLoadingDropdown ? (
                        <option value="" disabled>Loading...</option>
                      ) : (
                        jabatanOptions.map((item) => (
                          <option key={item.ID} value={item.ID}>
                            {item.Jabatan} - {item.Desc}
                          </option>
                        ))
                      )}
                    </select>
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Shift</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <select
                      name="shift"
                      value={formData.shift}
                      onChange={handleChange}
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      disabled={isLoadingDropdown}
                    >
                      <option value="">-- Pilih Shift --</option>
                      {isLoadingDropdown ? (
                        <option value="" disabled>Loading...</option>
                      ) : (
                        shiftOptions.map((item) => (
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

          {/* B. RINGKASAN KEGIATAN HARIAN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">B. RINGKASAN KEGIATAN HARIAN</h3>
            <textarea
              name="ringkasan"
              value={formData.ringkasan}
              onChange={handleChange}
              rows={4}
              placeholder="Uraikan secara ringkas kegiatan IT yang dilaksanakan pada hari ini..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-white"
            />
          </div>

          {/* C. MONITORING SISTEM & INFRASTRUKTUR */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">C. MONITORING SISTEM & INFRASTRUKTUR</h3>
            <div className="overflow-x-auto mb-3 hide-scrollbar">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">No</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Sistem</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Status</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">1</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">Server Database</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="server_db_status" value={formData.server_db_status} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Normal">Normal</option>
                        <option value="Warning">Warning</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="server_db_ket" value={formData.server_db_ket} onChange={handleChange} placeholder="Keterangan" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">2</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">Server Application</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="server_app_status" value={formData.server_app_status} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Normal">Normal</option>
                        <option value="Warning">Warning</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="server_app_ket" value={formData.server_app_ket} onChange={handleChange} placeholder="Keterangan" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">2</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">Network Infrastructure</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="network_status" value={formData.network_status} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Normal">Normal</option>
                        <option value="Warning">Warning</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="network_ket" value={formData.network_ket} onChange={handleChange} placeholder="Keterangan" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">3</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">Internet Connection</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="internet_status" value={formData.internet_status} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Normal">Normal</option>
                        <option value="Warning">Warning</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="internet_ket" value={formData.internet_ket} onChange={handleChange} placeholder="Keterangan" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">5</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">Backup System</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="backup_status" value={formData.backup_status} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                        <option value="Partial">Partial</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="backup_ket" value={formData.backup_ket} onChange={handleChange} placeholder="Keterangan" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">6</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">Security System</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="security_status" value={formData.security_status} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Secure">Secure</option>
                        <option value="Warning">Warning</option>
                        <option value="Breached">Breached</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="security_ket" value={formData.security_ket} onChange={handleChange} placeholder="Keterangan" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          
          {/* D. MAINTENANCE & SYSTEM UPDATE */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">D. MAINTENANCE & SYSTEM UPDATE</h3>
            <div className="overflow-x-auto mb-3 hide-scrollbar">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">No</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Kegiatan Maintenance</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Waktu</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Hasil</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">1</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">System Patch Update</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="time" name="patch_waktu" value={formData.patch_waktu} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="patch_hasil" value={formData.patch_hasil} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                        <option value="Partial">Partial</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="patch_ket" value={formData.patch_ket} onChange={handleChange} placeholder="Keterangan" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">2</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">Database Maintenance</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="time" name="db_maint_waktu" value={formData.db_maint_waktu} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="db_maint_hasil" value={formData.db_maint_hasil} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                        <option value="Partial">Partial</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="db_maint_ket" value={formData.db_maint_ket} onChange={handleChange} placeholder="Keterangan" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">3</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">Network Maintenance</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="time" name="net_maint_waktu" value={formData.net_maint_waktu} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="net_maint_hasil" value={formData.net_maint_hasil} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                        <option value="Partial">Partial</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="net_maint_ket" value={formData.net_maint_ket} onChange={handleChange} placeholder="Keterangan" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">4</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">Hardware Check</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="time" name="hw_waktu" value={formData.hw_waktu} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="hw_hasil" value={formData.hw_hasil} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Normal">Normal</option>
                        <option value="Warning">Warning</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="hw_ket" value={formData.hw_ket} onChange={handleChange} placeholder="Keterangan" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* E. SECURITY AUDIT & MONITORING */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">E. SECURITY AUDIT & MONITORING</h3>
            <div className="overflow-x-auto mb-3 hide-scrollbar">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">No</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Security Check</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Status</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Findings</th>
                    <th className="bg-blue-50 text-blue-900 font-semibold px-3 py-2 border border-gray-300">Action Taken</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">1</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">Firewall Log Review</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="fw_log_status" value={formData.fw_log_status} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Clear">Clear</option>
                        <option value="Suspicious">Suspicious</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="fw_log_findings" value={formData.fw_log_findings} onChange={handleChange} placeholder="Findings" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="fw_log_action" value={formData.fw_log_action} onChange={handleChange} placeholder="Action Taken" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">2</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">Antivirus Update</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="av_status" value={formData.av_status} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Updated">Updated</option>
                        <option value="Outdated">Outdated</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="av_findings" value={formData.av_findings} onChange={handleChange} placeholder="Findings" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="av_action" value={formData.av_action} onChange={handleChange} placeholder="Action Taken" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                  <tr className="border border-gray-300">
                    <td className="text-center px-3 py-2 border border-gray-300 bg-white text-gray-900">3</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm">User Access Review</td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <select name="user_access_status" value={formData.user_access_status} onChange={handleChange} className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900">
                        <option value="">--</option>
                        <option value="Compliant">Compliant</option>
                        <option value="Violation">Violation</option>
                        <option value="Updated">Updated</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="user_access_findings" value={formData.user_access_findings} onChange={handleChange} placeholder="Findings" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                    <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                      <input type="text" name="user_access_action" value={formData.user_access_action} onChange={handleChange} placeholder="Action Taken" className="w-full px-2 py-1 text-xs border-none outline-none focus:outline-1 focus:outline-blue-500 placeholder-gray-600 text-gray-900" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* F. INCIDENT REPORT */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">F. INCIDENT REPORT (JIKA ADA)</h3>
            <textarea
              name="incident"
              value={formData.incident}
              onChange={handleChange}
              rows={4}
              placeholder="Jelaskan insiden keamanan atau sistem yang terjadi hari ini (jika ada)..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-white"
            />
          </div>

          {/* G. PLANNED ACTIVITIES */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">G. PLANNED ACTIVITIES FOR NEXT SHIFT</h3>
            <textarea
              name="planned"
              value={formData.planned}
              onChange={handleChange}
              rows={4}
              placeholder="Rencanakan kegiatan IT untuk shift berikutnya..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-white"
            />
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
                {loading ? 'Menyimpan...' : '💾 Simpan Laporan IT'}
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
