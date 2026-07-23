'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface DetailLaporanGensetFormProps {
  laporanId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DetailLaporanGensetForm({ laporanId, onClose, onSuccess }: DetailLaporanGensetFormProps) {
  const [formData, setFormData] = useState({
    TanggalPemeriksaan: '',
    JamOperasi: '',
    Operator: '',
    CatatandanTemuan: '',
    Feedback: '',
    ApprovedBy: '',
    ApprovedDate: '',
    StatusLaporanId: 0,
    // Checklist items
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
  const [isPrinting, setIsPrinting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ filename: string; url: string }[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchUploadedImages = async (id: number) => {
    try {
      setImagesLoading(true);
      const response = await fetch(`/api/laporan-genset/${id}/images`);
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

  // Function to fetch laporan data from database
  const fetchLaporanData = async () => {
    if (!laporanId) return;
    
    try {
      setFetchingData(true);
      setError(null);
      
      const response = await fetch(`/api/laporan-genset/${laporanId}`);
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

  // Generate print HTML function
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
        <title>Detail Laporan Genset - ${formData.TanggalPemeriksaan || 'Laporan'}</title>
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
          
          /* Page break controls - INI YANG PENTING! */
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
          <!-- HEADER - selalu di halaman pertama -->
          <div class="header">
            <h2>DETAIL LAPORAN PEMERIKSAAN GENSET</h2>
            <p>LAPORAN PEMERIKSAAN HARIAN GENSET</p>
          </div>
          
          <!-- A. INFORMASI PEMERIKSAAN -->
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
                <td>Jam Operasi</td>
                <td>${formData.JamOperasi || '-'}</td>
              </tr>
              <tr>
                <td>Operator</td>
                <td>${formData.Operator || '-'}</td>
              </tr>
            </table>
          </div>
          
          <!-- B. SISTEM MESIN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">B. SISTEM MESIN</h3>
            </div>
            <div class="checkbox-item ${formData.LevelOliMesinNormal ? 'checked' : ''}">
              <input type="checkbox" ${formData.LevelOliMesinNormal ? 'checked' : ''} readonly>
              <span>Level oli mesin dalam batas normal</span>
            </div>
            <div class="checkbox-item ${formData.TidakAdaKebocoranOli ? 'checked' : ''}">
              <input type="checkbox" ${formData.TidakAdaKebocoranOli ? 'checked' : ''} readonly>
              <span>Tidak ada kebocoran oli</span>
            </div>
            <div class="checkbox-item ${formData.SuaraMesinNormal ? 'checked' : ''}">
              <input type="checkbox" ${formData.SuaraMesinNormal ? 'checked' : ''} readonly>
              <span>Suara mesin normal (tidak kasar / knocking)</span>
            </div>
            <div class="checkbox-item ${formData.GetaranMesinNormal ? 'checked' : ''}">
              <input type="checkbox" ${formData.GetaranMesinNormal ? 'checked' : ''} readonly>
              <span>Getaran mesin normal</span>
            </div>
            <div class="checkbox-item ${formData.WarnaAsapNormal ? 'checked' : ''}">
              <input type="checkbox" ${formData.WarnaAsapNormal ? 'checked' : ''} readonly>
              <span>Warna asap (normal: tidak hitam/putih pekat)</span>
            </div>
          </div>
          
          <!-- C. SISTEM PENDINGIN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">C. SISTEM PENDINGIN</h3>
            </div>
            <div class="checkbox-item ${formData.LevelCoolantCukup ? 'checked' : ''}">
              <input type="checkbox" ${formData.LevelCoolantCukup ? 'checked' : ''} readonly>
              <span>Level coolant / air radiator cukup</span>
            </div>
            <div class="checkbox-item ${formData.TidakAdaKebocoranRadiator ? 'checked' : ''}">
              <input type="checkbox" ${formData.TidakAdaKebocoranRadiator ? 'checked' : ''} readonly>
              <span>Tidak ada kebocoran radiator / selang</span>
            </div>
            <div class="checkbox-item ${formData.KipasRadiatorNormal ? 'checked' : ''}">
              <input type="checkbox" ${formData.KipasRadiatorNormal ? 'checked' : ''} readonly>
              <span>Kipas radiator berfungsi normal</span>
            </div>
            <div class="checkbox-item ${formData.TemperaturMesinNormal ? 'checked' : ''}">
              <input type="checkbox" ${formData.TemperaturMesinNormal ? 'checked' : ''} readonly>
              <span>Temperatur mesin normal</span>
            </div>
          </div>
          
          <!-- D. SISTEM BAHAN BAKAR -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">D. SISTEM BAHAN BAKAR</h3>
            </div>
            <div class="checkbox-item ${formData.LevelSolarCukup ? 'checked' : ''}">
              <input type="checkbox" ${formData.LevelSolarCukup ? 'checked' : ''} readonly>
              <span>Level Solar mencukupi</span>
            </div>
            <div class="checkbox-item ${formData.TidakAdaKebocoranPipa ? 'checked' : ''}">
              <input type="checkbox" ${formData.TidakAdaKebocoranPipa ? 'checked' : ''} readonly>
              <span>Tidak ada kebocoran pada pipa / tangki</span>
            </div>
            <div class="checkbox-item ${formData.FilterSolarBaik ? 'checked' : ''}">
              <input type="checkbox" ${formData.FilterSolarBaik ? 'checked' : ''} readonly>
              <span>Filter solar dalam kondisi baik</span>
            </div>
          </div>
          
          <!-- E. SISTEM KELISTRIKAN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">E. SISTEM KELISTRIKAN</h3>
            </div>
            <div class="checkbox-item ${formData.TeganganBateraiNormal ? 'checked' : ''}">
              <input type="checkbox" ${formData.TeganganBateraiNormal ? 'checked' : ''} readonly>
              <span>Tegangan baterai normal</span>
            </div>
            <div class="checkbox-item ${formData.TerminalBateraiBersih ? 'checked' : ''}">
              <input type="checkbox" ${formData.TerminalBateraiBersih ? 'checked' : ''} readonly>
              <span>Terminal baterai bersih dan kencang</span>
            </div>
            <div class="checkbox-item ${formData.PanelKontrolNormal ? 'checked' : ''}">
              <input type="checkbox" ${formData.PanelKontrolNormal ? 'checked' : ''} readonly>
              <span>Panel kontrol normal</span>
            </div>
            <div class="checkbox-item ${formData.TidakAdaAlarmFault ? 'checked' : ''}">
              <input type="checkbox" ${formData.TidakAdaAlarmFault ? 'checked' : ''} readonly>
              <span>Tidak ada alarm / fault</span>
            </div>
          </div>
          
          <!-- F. OUTPUT LISTRIK -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">F. OUTPUT LISTRIK</h3>
            </div>
            <div class="checkbox-item ${formData.TeganganOutputStabil ? 'checked' : ''}">
              <input type="checkbox" ${formData.TeganganOutputStabil ? 'checked' : ''} readonly>
              <span>Tegangan output stabil (380 - 400 v)</span>
            </div>
            <div class="checkbox-item ${formData.FrekuensiStabil ? 'checked' : ''}">
              <input type="checkbox" ${formData.FrekuensiStabil ? 'checked' : ''} readonly>
              <span>Frekuensi stabil (50 Hz)</span>
            </div>
            <div class="checkbox-item ${formData.ArusBebanAman ? 'checked' : ''}">
              <input type="checkbox" ${formData.ArusBebanAman ? 'checked' : ''} readonly>
              <span>Arus beban dalam batas aman</span>
            </div>
            <div class="checkbox-item ${formData.FaktorDayaNormal ? 'checked' : ''}">
              <input type="checkbox" ${formData.FaktorDayaNormal ? 'checked' : ''} readonly>
              <span>Faktor daya normal</span>
            </div>
          </div>
          
          <!-- G. PEMERIKSAAN MINGGUAN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">G. PEMERIKSAAN MINGGUAN</h3>
            </div>
            <div class="checkbox-item ${formData.TestRunTanpaBeban ? 'checked' : ''}">
              <input type="checkbox" ${formData.TestRunTanpaBeban ? 'checked' : ''} readonly>
              <span>Test run tanpa beban (15 menit)</span>
            </div>
            <div class="checkbox-item ${formData.TestRunDenganBeban ? 'checked' : ''}">
              <input type="checkbox" ${formData.TestRunDenganBeban ? 'checked' : ''} readonly>
              <span>Test run dengan beban (jika memungkinkan)</span>
            </div>
            <div class="checkbox-item ${formData.PemeriksaanKondisiBelt ? 'checked' : ''}">
              <input type="checkbox" ${formData.PemeriksaanKondisiBelt ? 'checked' : ''} readonly>
              <span>Pemeriksaan kondisi belt</span>
            </div>
            <div class="checkbox-item ${formData.PembersihanAreaGenset ? 'checked' : ''}">
              <input type="checkbox" ${formData.PembersihanAreaGenset ? 'checked' : ''} readonly>
              <span>Pembersihan area genset</span>
            </div>
          </div>
          
          <!-- H. PEMERIKSAAN BULANAN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">H. PEMERIKSAAN BULANAN</h3>
            </div>
            <div class="checkbox-item ${formData.PengecekanOliMesin ? 'checked' : ''}">
              <input type="checkbox" ${formData.PengecekanOliMesin ? 'checked' : ''} readonly>
              <span>Pengecekan oli mesin</span>
            </div>
            <div class="checkbox-item ${formData.PemeriksaanFilterOli ? 'checked' : ''}">
              <input type="checkbox" ${formData.PemeriksaanFilterOli ? 'checked' : ''} readonly>
              <span>Pemeriksaan filter oli</span>
            </div>
            <div class="checkbox-item ${formData.PemeriksaanFilterUdara ? 'checked' : ''}">
              <input type="checkbox" ${formData.PemeriksaanFilterUdara ? 'checked' : ''} readonly>
              <span>Pemeriksaan filter udara</span>
            </div>
            <div class="checkbox-item ${formData.PemeriksaanFilterBahanBakar ? 'checked' : ''}">
              <input type="checkbox" ${formData.PemeriksaanFilterBahanBakar ? 'checked' : ''} readonly>
              <span>Pemeriksaan filter bahan bakar</span>
            </div>
          </div>
          
          <!-- I. PEMERIKSAAN SISTEM KONTROL & PROTEKSI -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">I. PEMERIKSAAN SISTEM KONTROL & PROTEKSI</h3>
            </div>
            <div class="checkbox-item ${formData.OverloadProtectionBerfungsi ? 'checked' : ''}">
              <input type="checkbox" ${formData.OverloadProtectionBerfungsi ? 'checked' : ''} readonly>
              <span>Overload protection berfungsi</span>
            </div>
            <div class="checkbox-item ${formData.OverUnderVoltageProtection ? 'checked' : ''}">
              <input type="checkbox" ${formData.OverUnderVoltageProtection ? 'checked' : ''} readonly>
              <span>Over/Under voltage protection</span>
            </div>
            <div class="checkbox-item ${formData.OverTemperatureShutdown ? 'checked' : ''}">
              <input type="checkbox" ${formData.OverTemperatureShutdown ? 'checked' : ''} readonly>
              <span>Over temperature shutdown</span>
            </div>
            <div class="checkbox-item ${formData.LowOilPressureShutdown ? 'checked' : ''}">
              <input type="checkbox" ${formData.LowOilPressureShutdown ? 'checked' : ''} readonly>
              <span>Low oil pressure shutdown</span>
            </div>
            <div class="checkbox-item ${formData.EmergencyStopBerfungsi ? 'checked' : ''}">
              <input type="checkbox" ${formData.EmergencyStopBerfungsi ? 'checked' : ''} readonly>
              <span>Emergency stop berfungsi</span>
            </div>
          </div>
          
          <!-- J. PEMERIKSAAN ATS / AMF -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">J. PEMERIKSAAN ATS / AMF</h3>
            </div>
            <div class="checkbox-item ${formData.ATSBerpindahOtomatis ? 'checked' : ''}">
              <input type="checkbox" ${formData.ATSBerpindahOtomatis ? 'checked' : ''} readonly>
              <span>ATS berpindah otomatis saat PLN padam</span>
            </div>
            <div class="checkbox-item ${formData.ATSKembaliNormal ? 'checked' : ''}">
              <input type="checkbox" ${formData.ATSKembaliNormal ? 'checked' : ''} readonly>
              <span>ATS kembali normal saat PLN hidup</span>
            </div>
            <div class="checkbox-item ${formData.WaktuTransferSesuaiStandar ? 'checked' : ''}">
              <input type="checkbox" ${formData.WaktuTransferSesuaiStandar ? 'checked' : ''} readonly>
              <span>Waktu transfer sesuai standar</span>
            </div>
          </div>
          
          <!-- K. KEBERSIHAN & KEAMANAN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">K. KEBERSIHAN & KEAMANAN</h3>
            </div>
            <div class="checkbox-item ${formData.AreaGensetBersih ? 'checked' : ''}">
              <input type="checkbox" ${formData.AreaGensetBersih ? 'checked' : ''} readonly>
              <span>Area genset bersih dari debu dan oli</span>
            </div>
            <div class="checkbox-item ${formData.VentilasiRuanganBaik ? 'checked' : ''}">
              <input type="checkbox" ${formData.VentilasiRuanganBaik ? 'checked' : ''} readonly>
              <span>Ventilasi ruangan baik</span>
            </div>
            <div class="checkbox-item ${formData.TidakAdaMaterialMudahTerbakar ? 'checked' : ''}">
              <input type="checkbox" ${formData.TidakAdaMaterialMudahTerbakar ? 'checked' : ''} readonly>
              <span>Tidak ada material mudah terbakar di sekitar genset</span>
            </div>
            <div class="checkbox-item ${formData.APARTersediaDanSiapPakai ? 'checked' : ''}">
              <input type="checkbox" ${formData.APARTersediaDanSiapPakai ? 'checked' : ''} readonly>
              <span>APAR tersedia dan siap pakai</span>
            </div>
          </div>
          
          <!-- L. CATATAN DAN TEMUAN -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">L. CATATAN DAN TEMUAN</h3>
            </div>
            <div class="print-textarea">${(formData.CatatandanTemuan || '-').replace(/\n/g, '<br>')}</div>
          </div>

          ${uploadedImages.length > 0 ? `
          <!-- M. ATTACHMENT -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">M. ATTACHMENT</h3>
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
          <!-- N. FEEDBACK -->
          <div class="section-wrapper">
            <div class="section-title-wrapper">
              <h3 class="section-title">N. FEEDBACK</h3>
            </div>
            <div class="print-textarea" style="background-color: #f9fafb; border-left: 4px solid #ef4444; padding: 8px; margin: 4px 0;">${(formData.Feedback || '-').replace(/\n/g, '<br>')}</div>
            <table class="label-table" style="margin-top: 10px;">
              <tr>
                <td>Approve By</td>
                <td>${formData.ApprovedBy || '-'}</td>
              </tr>
              <tr>
                <td>Approve Date</td>
                <td>${formData.ApprovedDate ? new Date(formData.ApprovedDate).toLocaleDateString('id-ID', {
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

  // Function to populate form data from JSON response
  const populateFormData = (data: any) => {
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
      ApprovedBy: data.ApprovedBy || "",
      ApprovedDate: data.ApprovedDate || "",
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

  // Fetch data when component mounts or laporanId changes
  useEffect(() => {
    if (laporanId) {
      fetchLaporanData();
    }
  }, [laporanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/laporan-genset/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Gagal menambah laporan');
      }
    } catch (error) {
      console.error('Error creating laporan:', error);
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
          className="no-print absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-gray-50"
                      required
                      readOnly
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
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-gray-50"
                      required
                      readOnly
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
                      className="w-full px-2 py-1 text-sm border-none outline-none focus:outline-2 focus:outline-blue-500 placeholder-gray-600 text-gray-900 bg-gray-50"
                      required
                      readOnly
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-2 focus:outline-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900 bg-gray-50"
              required
              readOnly
            />
          </div>

          {/* M. ATTACHMENT */}
          {uploadedImages.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold bg-green-50 text-green-900 px-4 py-2 rounded mb-4">M. ATTACHMENT</h3>
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

          {/* N. FEEDBACK (Hanya tampil jika status 5 atau 6) */}
          {(formData.StatusLaporanId === 5 || formData.StatusLaporanId === 6) && (
            <div className="mb-8">
            <h3 className="text-sm font-bold bg-red-50 text-red-900 px-4 py-2 rounded mb-4">M. FEEDBACK</h3>
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
              <span>Approve By: {formData.ApprovedBy || '-'}</span>
              <span>Approve Date: {formData.ApprovedDate ? new Date(formData.ApprovedDate).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }) : '-'}</span>
            </div>
          </div>
          )}
          
          {/* SUBMIT BUTTON */}
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
