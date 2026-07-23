'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface EditLaporanGensetFormAdvancedProps {
  laporanId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditLaporanGensetFormAdvanced({ laporanId, onClose, onSuccess }: EditLaporanGensetFormAdvancedProps) {
  const [formData, setFormData] = useState({
    TanggalPemeriksaan: '',
    JamOperasi: '',
    Operator: '',
    CatatandanTemuan: '',
    Feedback: '',
    StatusLaporanId: 0,
    // Checklist items - semua default false
    // SISTEM MESIN
    LevelOliMesinNormal: false,
    TidakAdaKebocoranOli: false,
    SuaraMesinNormal: false,
    GetaranMesinNormal: false,
    WarnaAsapNormal: false,
    
    // SISTEM PENDINGIN
    LevelCoolantCukup: false,
    TidakAdaKebocoranRadiator: false,
    KipasRadiatorNormal: false,
    TemperaturMesinNormal: false,
    
    // SISTEM BAHAN BAKAR
    LevelSolarCukup: false,
    TidakAdaKebocoranPipa: false,
    FilterSolarBaik: false,
    
    // SISTEM KELISTRIKAN
    TeganganBateraiNormal: false,
    TerminalBateraiBersih: false,
    PanelKontrolNormal: false,
    TidakAdaAlarmFault: false,
    
    // OUTPUT LISTRIK
    TeganganOutputStabil: false,
    FrekuensiStabil: false,
    ArusBebanAman: false,
    FaktorDayaNormal: false,
    
    // PEMERIKSAAN MINGGUAN
    TestRunTanpaBeban: false,
    TestRunDenganBeban: false,
    PemeriksaanKondisiBelt: false,
    PembersihanAreaGenset: false,
    
    // PEMERIKSAAN BULANAN
    PengecekanOliMesin: false,
    PemeriksaanFilterOli: false,
    PemeriksaanFilterUdara: false,
    PemeriksaanFilterBahanBakar: false,
    
    // PEMERIKSAAN SISTEM KONTROL & PROTEKSI
    OverloadProtectionBerfungsi: false,
    OverUnderVoltageProtection: false,
    OverTemperatureShutdown: false,
    LowOilPressureShutdown: false,
    EmergencyStopBerfungsi: false,
    
    // PEMERIKSAAN ATS / AMF
    ATSBerpindahOtomatis: false,
    ATSKembaliNormal: false,
    WaktuTransferSesuaiStandar: false,
    
    // KEBERSIHAN & KEAMANAN
    AreaGensetBersih: false,
    VentilasiRuanganBaik: false,
    TidakAdaMaterialMudahTerbakar: false,
    APARTersediaDanSiapPakai: false,
  });

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{ filename: string; url: string }[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // Function to fetch laporan data from database
  const fetchLaporanData = async () => {
    try {
      setFetchingData(true);
      setError(null);
      
      const response = await fetch(`/api/laporan-genset/${laporanId}`);
      const result = await response.json();
      
      if (result.success) {
        populateFormData(result.data);
      } else {
        setError(result.message || 'Failed to fetch laporan data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setFetchingData(false);
    }
  };

  // Function to populate form data from JSON response
  const populateFormData = (data: any) => {
    console.log('=== POPULATE FORM DATA CALLED ===');
    console.log('API Data received:', JSON.stringify(data, null, 2));
    
    // Helper function to find checklist value
    const findChecklistValue = (checklistArray: any[], tindakan: string) => {
      const item = checklistArray?.find(item => item.Tindakan === tindakan);
      return item?.Check || false;
    };

    const newFormData = {
      // INFORMASI DASAR
      TanggalPemeriksaan: data.TanggalPemeriksaan || "",
      JamOperasi: data.JamOperasi || "",
      Operator: data.Operator || "",
      CatatandanTemuan: data.CatatandanTemuan || "",
      Feedback: data.Feedback || "",
      StatusLaporanId: data.StatusLaporanId || 0,
      
      // SISTEM MESIN
      LevelOliMesinNormal: findChecklistValue(data.PemeriksaanGenset_SistemMesin, "Level Oli Mesin Normal"),
      TidakAdaKebocoranOli: findChecklistValue(data.PemeriksaanGenset_SistemMesin, "Tidak Ada Kebocoran Oli"),
      SuaraMesinNormal: findChecklistValue(data.PemeriksaanGenset_SistemMesin, "Suara Mesin Normal"),
      GetaranMesinNormal: findChecklistValue(data.PemeriksaanGenset_SistemMesin, "Getaran Mesin Normal"),
      WarnaAsapNormal: findChecklistValue(data.PemeriksaanGenset_SistemMesin, "Warna Asap Normal"),
      
      // SISTEM PENDINGIN
      LevelCoolantCukup: findChecklistValue(data.PemeriksaanGenset_SistemPendingin, "Level Coolant Cukup"),
      TidakAdaKebocoranRadiator: findChecklistValue(data.PemeriksaanGenset_SistemPendingin, "Tidak Ada Kebocoran Radiator"),
      KipasRadiatorNormal: findChecklistValue(data.PemeriksaanGenset_SistemPendingin, "Kipas Radiator Normal"),
      TemperaturMesinNormal: findChecklistValue(data.PemeriksaanGenset_SistemPendingin, "Temperatur Mesin Normal"),
      
      // SISTEM BAHAN BAKAR
      LevelSolarCukup: findChecklistValue(data.PemeriksaanGenset_SistemBahanBakar, "Level Solar Cukup"),
      TidakAdaKebocoranPipa: findChecklistValue(data.PemeriksaanGenset_SistemBahanBakar, "Tidak Ada Kebocoran Pipa"),
      FilterSolarBaik: findChecklistValue(data.PemeriksaanGenset_SistemBahanBakar, "Filter Solar Baik"),
      
      // SISTEM KELISTRIKAN
      TeganganBateraiNormal: findChecklistValue(data.PemeriksaanGenset_SistemKelistrikan, "Tegangan Baterai Normal"),
      TerminalBateraiBersih: findChecklistValue(data.PemeriksaanGenset_SistemKelistrikan, "Terminal Baterai Bersih"),
      PanelKontrolNormal: findChecklistValue(data.PemeriksaanGenset_SistemKelistrikan, "Panel Kontrol Normal"),
      TidakAdaAlarmFault: findChecklistValue(data.PemeriksaanGenset_SistemKelistrikan, "Tidak Ada Alarm Fault"),
      
      // OUTPUT LISTRIK
      TeganganOutputStabil: findChecklistValue(data.PemeriksaanGenset_OutputListrik, "Tegangan Output Stabil"),
      FrekuensiStabil: findChecklistValue(data.PemeriksaanGenset_OutputListrik, "Frekuensi Stabil"),
      ArusBebanAman: findChecklistValue(data.PemeriksaanGenset_OutputListrik, "Arus Beban Aman"),
      FaktorDayaNormal: findChecklistValue(data.PemeriksaanGenset_OutputListrik, "Faktor Daya Normal"),
      
      // PEMERIKSAAN MINGGUAN
      TestRunTanpaBeban: findChecklistValue(data.PemeriksaanGenset_Mingguan, "Test Run Tanpa Beban"),
      TestRunDenganBeban: findChecklistValue(data.PemeriksaanGenset_Mingguan, "Test Run Dengan Beban"),
      PemeriksaanKondisiBelt: findChecklistValue(data.PemeriksaanGenset_Mingguan, "Pemeriksaan Kondisi Belt"),
      PembersihanAreaGenset: findChecklistValue(data.PemeriksaanGenset_Mingguan, "Pembersihan Area Genset"),
      
      // PEMERIKSAAN BULANAN
      PengecekanOliMesin: findChecklistValue(data.PemeriksaanGenset_Bulanan, "Pengecekan Oli Mesin"),
      PemeriksaanFilterOli: findChecklistValue(data.PemeriksaanGenset_Bulanan, "Pemeriksaan Filter Oli"),
      PemeriksaanFilterUdara: findChecklistValue(data.PemeriksaanGenset_Bulanan, "Pemeriksaan Filter Udara"),
      PemeriksaanFilterBahanBakar: findChecklistValue(data.PemeriksaanGenset_Bulanan, "Pemeriksaan Filter Bahan Bakar"),
      
      // PEMERIKSAAN SISTEM KONTROL & PROTEKSI
      OverloadProtectionBerfungsi: findChecklistValue(data.PemeriksaanGenset_SistemKontrol_Proteksi, "Overload Protection Berfungsi"),
      OverUnderVoltageProtection: findChecklistValue(data.PemeriksaanGenset_SistemKontrol_Proteksi, "Over/Under Voltage Protection"),
      OverTemperatureShutdown: findChecklistValue(data.PemeriksaanGenset_SistemKontrol_Proteksi, "Over Temperature Shutdown"),
      LowOilPressureShutdown: findChecklistValue(data.PemeriksaanGenset_SistemKontrol_Proteksi, "Low Oil Pressure Shutdown"),
      EmergencyStopBerfungsi: findChecklistValue(data.PemeriksaanGenset_SistemKontrol_Proteksi, "Emergency Stop Berfungsi"),
      
      // PEMERIKSAAN ATS / AMF
      ATSBerpindahOtomatis: findChecklistValue(data.PemeriksaanGenset_ATS_AMF, "ATS Berpindah Otomatis"),
      ATSKembaliNormal: findChecklistValue(data.PemeriksaanGenset_ATS_AMF, "ATS Kembali Normal"),
      WaktuTransferSesuaiStandar: findChecklistValue(data.PemeriksaanGenset_ATS_AMF, "Waktu Transfer Sesuai Standar"),
      
      // KEBERSIHAN & KEAMANAN
      AreaGensetBersih: findChecklistValue(data.PemeriksaanGenset_Kebersihan_Keamanan, "Area Genset Bersih"),
      VentilasiRuanganBaik: findChecklistValue(data.PemeriksaanGenset_Kebersihan_Keamanan, "Ventilasi Ruangan Baik"),
      TidakAdaMaterialMudahTerbakar: findChecklistValue(data.PemeriksaanGenset_Kebersihan_Keamanan, "Tidak Ada Material Mudah Terbakar"),
      APARTersediaDanSiapPakai: findChecklistValue(data.PemeriksaanGenset_Kebersihan_Keamanan, "APAR Tersedia Dan Siap Pakai")
    };

    console.log('=== FORM DATA AFTER POPULATE ===');
    console.log('New formData:', JSON.stringify(newFormData, null, 2));
    
    setFormData(newFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const fetchImages = async () => {
    try {
      const response = await fetch(`/api/laporan-genset/${laporanId}/images`);
      const result = await response.json();
      if (result.success && result.data?.images) {
        setUploadedImages(result.data.images);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    }
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

  // Fetch data when component mounts or laporanId changes
  useEffect(() => {
    if (laporanId) {
      fetchLaporanData();
      fetchImages();
    }
  }, [laporanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('data', JSON.stringify({
        // INFORMASI DASAR
        TanggalPemeriksaan: formData.TanggalPemeriksaan,
        JamOperasi: formData.JamOperasi,
        Operator: formData.Operator,
        CatatandanTemuan: formData.CatatandanTemuan,
        
        // SISTEM MESIN
        PemeriksaanGenset_SistemMesin: [
          { "Tindakan": "Level Oli Mesin Normal", "Check": formData.LevelOliMesinNormal },
          { "Tindakan": "Tidak Ada Kebocoran Oli", "Check": formData.TidakAdaKebocoranOli },
          { "Tindakan": "Suara Mesin Normal", "Check": formData.SuaraMesinNormal },
          { "Tindakan": "Getaran Mesin Normal", "Check": formData.GetaranMesinNormal },
          { "Tindakan": "Warna Asap Normal", "Check": formData.WarnaAsapNormal }
        ],
        
        // SISTEM PENDINGIN
        PemeriksaanGenset_SistemPendingin: [
          { "Tindakan": "Level Coolant Cukup", "Check": formData.LevelCoolantCukup },
          { "Tindakan": "Tidak Ada Kebocoran Radiator", "Check": formData.TidakAdaKebocoranRadiator },
          { "Tindakan": "Kipas Radiator Normal", "Check": formData.KipasRadiatorNormal },
          { "Tindakan": "Temperatur Mesin Normal", "Check": formData.TemperaturMesinNormal }
        ],
        
        // SISTEM BAHAN BAKAR
        PemeriksaanGenset_SistemBahanBakar: [
          { "Tindakan": "Level Solar Cukup", "Check": formData.LevelSolarCukup },
          { "Tindakan": "Tidak Ada Kebocoran Pipa", "Check": formData.TidakAdaKebocoranPipa },
          { "Tindakan": "Filter Solar Baik", "Check": formData.FilterSolarBaik }
        ],
        
        // SISTEM KELISTRIKAN
        PemeriksaanGenset_SistemKelistrikan: [
          { "Tindakan": "Tegangan Baterai Normal", "Check": formData.TeganganBateraiNormal },
          { "Tindakan": "Terminal Baterai Bersih", "Check": formData.TerminalBateraiBersih },
          { "Tindakan": "Panel Kontrol Normal", "Check": formData.PanelKontrolNormal },
          { "Tindakan": "Tidak Ada Alarm Fault", "Check": formData.TidakAdaAlarmFault }
        ],
        
        // OUTPUT LISTRIK
        PemeriksaanGenset_OutputListrik: [
          { "Tindakan": "Tegangan Output Stabil", "Check": formData.TeganganOutputStabil },
          { "Tindakan": "Frekuensi Stabil", "Check": formData.FrekuensiStabil },
          { "Tindakan": "Arus Beban Aman", "Check": formData.ArusBebanAman },
          { "Tindakan": "Faktor Daya Normal", "Check": formData.FaktorDayaNormal }
        ],
        
        // PEMERIKSAAN MINGGUAN
        PemeriksaanGenset_Mingguan: [
          { "Tindakan": "Test Run Tanpa Beban", "Check": formData.TestRunTanpaBeban },
          { "Tindakan": "Test Run Dengan Beban", "Check": formData.TestRunDenganBeban },
          { "Tindakan": "Pemeriksaan Kondisi Belt", "Check": formData.PemeriksaanKondisiBelt },
          { "Tindakan": "Pembersihan Area Genset", "Check": formData.PembersihanAreaGenset }
        ],
        
        // PEMERIKSAAN BULANAN
        PemeriksaanGenset_Bulanan: [
          { "Tindakan": "Pengecekan Oli Mesin", "Check": formData.PengecekanOliMesin },
          { "Tindakan": "Pemeriksaan Filter Oli", "Check": formData.PemeriksaanFilterOli },
          { "Tindakan": "Pemeriksaan Filter Udara", "Check": formData.PemeriksaanFilterUdara },
          { "Tindakan": "Pemeriksaan Filter Bahan Bakar", "Check": formData.PemeriksaanFilterBahanBakar }
        ],
        
        // SISTEM KONTROL & PROTEKSI
        PemeriksaanGenset_SistemKontrol_Proteksi: [
          { "Tindakan": "Overload Protection Berfungsi", "Check": formData.OverloadProtectionBerfungsi },
          { "Tindakan": "Over/Under Voltage Protection", "Check": formData.OverUnderVoltageProtection },
          { "Tindakan": "Over Temperature Shutdown", "Check": formData.OverTemperatureShutdown },
          { "Tindakan": "Low Oil Pressure Shutdown", "Check": formData.LowOilPressureShutdown },
          { "Tindakan": "Emergency Stop Berfungsi", "Check": formData.EmergencyStopBerfungsi }
        ],
        
        // ATS / AMF
        PemeriksaanGenset_ATS_AMF: [
          { "Tindakan": "ATS Berpindah Otomatis", "Check": formData.ATSBerpindahOtomatis },
          { "Tindakan": "ATS Kembali Normal", "Check": formData.ATSKembaliNormal },
          { "Tindakan": "Waktu Transfer Sesuai Standar", "Check": formData.WaktuTransferSesuaiStandar }
        ],
        
        // KEBERSIHAN & KEAMANAN
        PemeriksaanGenset_Kebersihan_Keamanan: [
          { "Tindakan": "Area Genset Bersih", "Check": formData.AreaGensetBersih },
          { "Tindakan": "Ventilasi Ruangan Baik", "Check": formData.VentilasiRuanganBaik },
          { "Tindakan": "Tidak Ada Material Mudah Terbakar", "Check": formData.TidakAdaMaterialMudahTerbakar },
          { "Tindakan": "APAR Tersedia Dan Siap Pakai", "Check": formData.APARTersediaDanSiapPakai }
        ]
      }));
      
      formDataToSend.append('imagesToDelete', JSON.stringify(imagesToDelete));
      
      selectedImages.forEach((file, index) => {
        formDataToSend.append(`image_${index}`, file);
      });

      const response = await fetch(`/api/laporan-genset/${laporanId}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
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

  // Show loading spinner while fetching data
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

  // Show error if data fetching failed
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
            <h2 className="text-xl font-bold text-blue-900 mb-2">FORM LAPORAN PEMERIKSAAN GENSET</h2>
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
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      required
                      disabled={loading}
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Jam Operasi</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input
                      type="time"
                      name="JamOperasi"
                      value={formData.JamOperasi}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      required
                      disabled={loading}
                    />
                  </td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="font-semibold w-1/3 bg-blue-50 text-blue-900 px-3 py-2 border border-gray-300">Operator</td>
                  <td className="px-3 py-2 border border-gray-300 bg-white text-gray-900">
                    <input
                      type="text"
                      name="Operator"
                      value={formData.Operator}
                      onChange={handleInputChange}
                      placeholder="Nama operator"
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900"
                      required
                      disabled={loading}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* B. SISTEM MESIN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">B. SISTEM MESIN</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="LevelOliMesinNormal"
                      checked={formData.LevelOliMesinNormal}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Level oli mesin dalam batas normal</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="TidakAdaKebocoranOli"
                      checked={formData.TidakAdaKebocoranOli}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Tidak ada kebocoran oli</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="SuaraMesinNormal"
                      checked={formData.SuaraMesinNormal}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Suara mesin normal (tidak kasar / knocking)</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="GetaranMesinNormal"
                      checked={formData.GetaranMesinNormal}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Getaran mesin normal</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="WarnaAsapNormal"
                      checked={formData.WarnaAsapNormal}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Warna asap (normal: tidak hitam/putih pekat)</span>
                  </label>
                </div>
              </div>
            </div>

          {/* C. SISTEM PENDINGIN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">C. SISTEM PENDINGIN</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="LevelCoolantCukup"
                      checked={formData.LevelCoolantCukup}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Level coolant / air radiator cukup</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="TidakAdaKebocoranRadiator"
                      checked={formData.TidakAdaKebocoranRadiator}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Tidak ada kebocoran radiator / selang</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="KipasRadiatorNormal"
                      checked={formData.KipasRadiatorNormal}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Kipas radiator berfungsi normal</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="TemperaturMesinNormal"
                      checked={formData.TemperaturMesinNormal}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Temperatur mesin normal</span>
                  </label>
                </div>
              </div>
            </div>

          {/* D. SISTEM BAHAN BAKAR */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">D. SISTEM BAHAN BAKAR</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="LevelSolarCukup"
                      checked={formData.LevelSolarCukup}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Level Solar mencukupi</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="TidakAdaKebocoranPipa"
                      checked={formData.TidakAdaKebocoranPipa}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Tidak ada kebocoran pada pipa / tangki</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="FilterSolarBaik"
                      checked={formData.FilterSolarBaik}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Filter solar dalam kondisi baik</span>
                  </label>
                </div>
              </div>
            </div>

          {/* E. SISTEM KELISTRIKAN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">E. SISTEM KELISTRIKAN</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="TeganganBateraiNormal"
                      checked={formData.TeganganBateraiNormal}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Tegangan baterai normal</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="TerminalBateraiBersih"
                      checked={formData.TerminalBateraiBersih}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Terminal baterai bersih dan kencang</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="PanelKontrolNormal"
                      checked={formData.PanelKontrolNormal}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Panel kontrol normal</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="TidakAdaAlarmFault"
                      checked={formData.TidakAdaAlarmFault}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Tidak ada alarm / fault</span>
                  </label>
                </div>
              </div>
            </div>

          {/* F. OUTPUT LISTRIK */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">F. OUTPUT LISTRIK</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="TeganganOutputStabil"
                      checked={formData.TeganganOutputStabil}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Tegangan output stabil (380 - 400 v)</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="FrekuensiStabil"
                      checked={formData.FrekuensiStabil}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Frekuensi stabil (50 Hz)</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ArusBebanAman"
                      checked={formData.ArusBebanAman}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Arus beban dalam batas aman</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="FaktorDayaNormal"
                      checked={formData.FaktorDayaNormal}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Faktor daya normal</span>
                  </label>
                </div>
              </div>
            </div>

          {/* G. PEMERIKSAAN MINGGUAN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">G. PEMERIKSAAN MINGGUAN (WEEKLY CHECK)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="TestRunTanpaBeban"
                      checked={formData.TestRunTanpaBeban}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Test run tanpa beban (15 menit)</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="TestRunDenganBeban"
                      checked={formData.TestRunDenganBeban}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Test run dengan beban (jika memungkinkan)</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="PemeriksaanKondisiBelt"
                      checked={formData.PemeriksaanKondisiBelt}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Pemeriksaan kondisi belt</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="PembersihanAreaGenset"
                      checked={formData.PembersihanAreaGenset}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Pembersihan area genset</span>
                  </label>
                </div>
              </div>
            </div>

          {/* H. PEMERIKSAAN BULANAN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">H. PEMERIKSAAN BULANAN (MOUNTHLY CHECK)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="PengecekanOliMesin"
                      checked={formData.PengecekanOliMesin}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Pengecekan oli mesin</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="PemeriksaanFilterOli"
                      checked={formData.PemeriksaanFilterOli}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Pemeriksaan filter oli</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="PemeriksaanFilterUdara"
                      checked={formData.PemeriksaanFilterUdara}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Pemeriksaan filter udara</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="PemeriksaanFilterBahanBakar"
                      checked={formData.PemeriksaanFilterBahanBakar}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Pemeriksaan filter bahan bakar</span>
                  </label>
                </div>
              </div>
            </div>

          {/* I. PEMERIKSAAN SISTEM KONTROL & PROTEKSI */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">I. PEMERIKSAAN SISTEM KONTROL & PROTEKSI</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="OverloadProtectionBerfungsi"
                      checked={formData.OverloadProtectionBerfungsi}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Overload protection berfungsi</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="OverUnderVoltageProtection"
                      checked={formData.OverUnderVoltageProtection}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Over/Under voltage protection</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="OverTemperatureShutdown"
                      checked={formData.OverTemperatureShutdown}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Over temperature shutdown</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="LowOilPressureShutdown"
                      checked={formData.LowOilPressureShutdown}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Low oil pressure shutdown</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="EmergencyStopBerfungsi"
                      checked={formData.EmergencyStopBerfungsi}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Emergency stop berfungsi</span>
                  </label>
                </div>
              </div>
            </div>

          {/* J. PEMERIKSAAN ATS / AMF */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">J. PEMERIKSAAN ATS / AMF (JIKA TERPASANG)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ATSBerpindahOtomatis"
                      checked={formData.ATSBerpindahOtomatis}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">ATS berpindah otomatis saat PLN padam</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ATSKembaliNormal"
                      checked={formData.ATSKembaliNormal}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">ATS kembali normal saat PLN hidup</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="WaktuTransferSesuaiStandar"
                      checked={formData.WaktuTransferSesuaiStandar}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Waktu transfer sesuai standar</span>
                  </label>
                </div>
              </div>
            </div>

          {/* K. KEBERSIHAN & KEAMANAN */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">K. KEBERSIHAN & KEAMANAN</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="AreaGensetBersih"
                      checked={formData.AreaGensetBersih}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Area genset bersih dari debu dan oli</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="VentilasiRuanganBaik"
                      checked={formData.VentilasiRuanganBaik}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Ventilasi ruangan baik</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="TidakAdaMaterialMudahTerbakar"
                      checked={formData.TidakAdaMaterialMudahTerbakar}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Tidak ada material mudah terbakar di sekitar genset</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="APARTersediaDanSiapPakai"
                      checked={formData.APARTersediaDanSiapPakai}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">APAR tersedia dan siap pakai</span>
                  </label>
                </div>
              </div>
            </div>

            {/* L. CATATAN DAN TEMUAN */}
            <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">L. CATATAN DAN TEMUAN</h3>
            <textarea
              name="CatatandanTemuan"
              value={formData.CatatandanTemuan}
              onChange={handleInputChange}
              rows={4}
              placeholder="Catatan dan temuan pemeriksaan genset"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-white"
              required
              disabled={loading}
            />
          </div>

          {/* M. ATTACHMENT */}
          <div className="mb-8">
            <h3 className="text-sm font-bold bg-blue-50 text-blue-900 px-4 py-2 rounded mb-4">M. ATTACHMENT</h3>
            <div className="ml-6 space-y-4">
              {uploadedImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gambar yang sudah diupload ({uploadedImages.length})</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((img, index) => (
                      <div key={img.filename} className="relative group">
                        <img
                          src={img.url}
                          alt={`Gambar ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(img.filename)}
                          disabled={loading}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <p className="text-xs text-gray-600 mt-1 truncate">{img.filename}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tambah Gambar Baru</label>
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

              {previewImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Baru ({previewImages.length})</label>
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
                          onClick={() => handleRemoveNewImage(index)}
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

          {/* N. FEEDBACK (Hanya tampil jika status 5 atau 6) */}
          {(formData.StatusLaporanId === 5 || formData.StatusLaporanId === 6) && (
            <div className="mb-8">
            <h3 className="text-sm font-bold bg-red-50 text-red-900 px-4 py-2 rounded mb-4">N. FEEDBACK ADMIN</h3>
            <textarea
              name="Feedback"
              value={formData.Feedback}
              onChange={handleInputChange}
              rows={4}
              placeholder="Feedback dari admin saat approve/reject"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-gray-100"
              readOnly
              disabled={loading}
            />
          </div>
          )}
          
          {/* SUBMIT BUTTON */}
          <div className="text-center mb-8">
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                disabled={loading}
              >
                Batal
              </button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
