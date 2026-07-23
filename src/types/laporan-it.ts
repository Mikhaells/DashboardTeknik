export interface LaporanIT {
  Id: number;
  Nama: string;
  NIP: string;
  JabatanId: number;
  EventDate: Date;
  RingkasanKegiatan: string;
  IncidentReport: string;
  PlannedActivities: string;
  Feedback: string;
  StatusId: number;
  CreateBy: string;
  ApprovedBy: string | null;
  CreateDate: Date;
  ApprovedDate: Date | null;
}

export interface LaporanITStats {
  TotalLaporan: number;
  LaporanDisetujui: number;
  LaporanDitolak: number;
  LaporanPending: number;
}

export interface LaporanITResult {
  data: LaporanIT[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LaporanITFormData {
  Nama: string;
  NIP: string;
  JabatanId: number;
  EventDate: string;
  RingkasanKegiatan: string;
  IncidentReport: string;
  PlannedActivities: string;
  Feedback: string;
}
