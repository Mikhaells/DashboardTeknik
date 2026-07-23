export interface KalenderKegiatan {
  Id: number;
  Tanggal: string;
  Jam: string | null;
  Kegiatan: string;
  Deskripsi: string | null;
  Gambar: string | null;
  StatusId: number;
  CreatedBy: string;
  CreatedDate: string;
  ApprovedBy: string | null;
  ApprovedDate: string | null;
}

export interface KalenderCreateRequest {
  Tanggal: string;
  Jam: string;
  Kegiatan: string;
  Deskripsi?: string;
  Gambar?: string;
}

export interface KalenderUpdateRequest {
  Jam?: string;
  Kegiatan?: string;
  Deskripsi?: string;
  Gambar?: string;
}

export interface KalenderResponse {
  success: boolean;
  message: string;
  data?: KalenderKegiatan[];
}

export interface KalenderSingleResponse {
  success: boolean;
  message: string;
  data?: KalenderKegiatan;
}

export const STATUS_PENDING = 2;
export const STATUS_APPROVED = 5;
export const STATUS_REJECTED = 6;

export function getStatusLabel(statusId: number): string {
  switch (statusId) {
    case STATUS_PENDING: return 'Pending';
    case STATUS_APPROVED: return 'Disetujui';
    case STATUS_REJECTED: return 'Ditolak';
    default: return 'Unknown';
  }
}

export function getStatusColor(statusId: number): string {
  switch (statusId) {
    case STATUS_PENDING: return 'bg-yellow-100 text-yellow-800';
    case STATUS_APPROVED: return 'bg-green-100 text-green-800';
    case STATUS_REJECTED: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getBadgeColor(statusId: number): string {
  switch (statusId) {
    case STATUS_PENDING: return 'bg-yellow-400';
    case STATUS_APPROVED: return 'bg-green-500';
    case STATUS_REJECTED: return 'bg-red-500';
    default: return 'bg-blue-400';
  }
}
