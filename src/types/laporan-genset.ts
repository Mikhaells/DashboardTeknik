export interface LaporanGenset {
  Id: number;
  TanggalPemeriksaan: string;
  JamOperasi: string;
  Operator: string;
  CatatandanTemuan: string;
  Feedback?: string;
  CreatedBy: string;
  CreatedDate: string;
  ApprovedBy: string | null;
  ApprovedDate: string | null;
  StatusLaporanId: number;
  StatusLaporan?: string;
}

export interface CreateLaporanGensetRequest {
  TanggalPemeriksaan: string;
  JamOperasi: string;
  Operator: string;
  CatatandanTemuan: string;
}

export interface UpdateLaporanGensetRequest {
  TanggalPemeriksaan: string;
  JamOperasi: string;
  Operator: string;
  CatatandanTemuan: string;
}

export interface LaporanGensetResponse {
  success: boolean;
  message: string;
  data?: LaporanGenset[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LaporanGensetDetailResponse {
  success: boolean;
  message: string;
  data?: LaporanGenset;
}

export interface FeedbackRequest {
  Catatan: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}
