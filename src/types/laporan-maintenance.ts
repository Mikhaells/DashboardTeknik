export interface LaporanMaintenance {
  Id: number;
  TanggalPemeriksaan: string;
  CatatanTemuan: string | null;
  CreateBy: string;
  CreateDate: string;
  ApproveBy: string | null;
  ApproveDate: string | null;
  StatusLaporanId: number;
  StatusLaporan?: string;
}

export interface LaporanMaintenanceDetailItem {
  Kegiatan: string;
  Check: boolean;
  Desc: string;
}

export interface LaporanMaintenanceResponse {
  success: boolean;
  message: string;
  data?: LaporanMaintenance[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LaporanMaintenanceDetailResponse {
  success: boolean;
  message: string;
  data?: LaporanMaintenance;
}

export interface FeedbackRequest {
  Catatan: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}
