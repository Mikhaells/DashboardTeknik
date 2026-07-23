// Interface untuk data LaporanTeknisi
export interface LaporanTeknisi {
  Id: number;
  Nama: string;
  NIP: string;
  JabatanId: number;
  EventDate: string;
  KegiatanId: number;
  Lokasi: string;
  Kendala: string;
  Path: string;
  CreatedBy: string;
  CreateDate: string;
  StatusId: number;
  ApprovedBy: string;
  ApprovedDate: string;
  // Joined data from Jabatan
  Jabatan_ID: number;
  Jabatan: string;
  Jabatan_Desc: string;
  // Joined data from Kegiatan
  Kegiatan_Id: number;
  Kegiatan: string;
  Kegiatan_Desc: string;
  // Joined data from StatusLaporan
  StatusLaporan_Id: number;
  Status: string;
  StatusLaporan_Desc: string;
  // Checklist data
  preProduction?: ChecklistItem[];
  production?: ChecklistItem[];
  postProduction?: ChecklistItem[];
  statusOptions?: {Id: number; Status: string; Desc: string}[];
}

// Interface untuk statistik LaporanTeknisi
export interface LaporanTeknisiStats {
  TotalLaporan: number;
  LaporanDisetujui: number;
  LaporanDitolak: number;
  LaporanPending: number;
}

// Interface untuk pagination result
export interface LaporanTeknisiResult {
  data: LaporanTeknisi[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interface untuk data Laporan (form processing)
export interface LaporanData {
  nama: string;
  nip: string;
  jabatan: string;
  jabatanId: number;
  tanggal: string;
  kegiatan: string;
  kegiatanId: number;
  lokasi: string;
  createBy: string;
  preProduction: ChecklistItem[];
  production: ChecklistItem[];
  postProduction: ChecklistItem[];
  catatanTeknis: string | null;
}

// Interface untuk checklist items
export interface ChecklistItem {
  Id: number;
  Kegiatan: string;
  Check: boolean;
  Keterangan: string | null;
}
