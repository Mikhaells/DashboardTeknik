export interface LaporanTeknikalDirektor {
  Id: number;
  NamaProgram: string;
  JenisProduksi: string;
  TanggalProduksi: string;
  LokasiProduksi: string;
  NamaTechnicalDirector: string;
  NamaPDU: string;
  JumlahKamera: number;
  FormatVideo: string;
  ResolusiOutput: string;
  AudioOutput: string;
  MediaRecording: string;
  JalurDistribusi: string;
  KendalaTindakan: string | null;
  CreateBy: string;
  CreateDate: string;
  Feedback: string | null;
  ApproveBy: string | null;
  ApproveDate: string | null;
  StatusLaporanId: number;
  StatusLaporan?: string;
}

export interface LaporanTeknikalDirektorDetailItem {
  AlatProduksi: number;
  Check: boolean;
  Keterangan: string;
}

export interface LaporanTeknikalDirektorResponse {
  success: boolean;
  message: string;
  data?: LaporanTeknikalDirektor[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LaporanTeknikalDirektorDetailResponse {
  success: boolean;
  message: string;
  data?: LaporanTeknikalDirektor;
}

export interface FeedbackRequest {
  Catatan: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}
