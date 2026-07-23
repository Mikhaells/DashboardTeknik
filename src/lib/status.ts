// Status mapping constants for LaporanHarian
export const STATUS_MAP = {
  1: 'Draft',
  2: 'Pending', 
  3: 'Review',
  4: 'Revision',
  5: 'Approved',
  6: 'Rejected',
  7: 'Processing',
  8: 'Completed',
  9: 'Cancelled',
  10: 'Expired'
} as const;

export const STATUS_DESCRIPTIONS = {
  1: 'Laporan masih dalam konsep, belum diajukan',
  2: 'Telah diajukan, menunggu persetujuan',
  3: 'Sedang direview/diperiksa',
  4: 'Perlu perbaikan/revisi',
  5: 'Laporan telah disetujui',
  6: 'Laporan ditolak',
  7: 'Laporan sedang diproses (setelah approve)',
  8: 'Laporan telah selesai diproses',
  9: 'Laporan dibatalkan oleh pengaju',
  10: 'Melewati batas waktu respons'
} as const;

export const STATUS_COLORS = {
  1: 'bg-gray-100 text-gray-800',      // Draft
  2: 'bg-yellow-100 text-yellow-800',  // Pending
  3: 'bg-blue-100 text-blue-800',      // Review
  4: 'bg-orange-100 text-orange-800',  // Revision
  5: 'bg-green-100 text-green-800',    // Approved
  6: 'bg-red-100 text-red-800',        // Rejected
  7: 'bg-indigo-100 text-indigo-800',  // Processing
  8: 'bg-emerald-100 text-emerald-800', // Completed
  9: 'bg-slate-100 text-slate-800',    // Cancelled
  10: 'bg-purple-100 text-purple-800'  // Expired
} as const;

// Helper functions
export const getStatusName = (statusId: number): string => {
  return STATUS_MAP[statusId as keyof typeof STATUS_MAP] || 'Unknown';
};

export const getStatusDescription = (statusId: number): string => {
  return STATUS_DESCRIPTIONS[statusId as keyof typeof STATUS_DESCRIPTIONS] || '';
};

export const getStatusColor = (statusId: number): string => {
  return STATUS_COLORS[statusId as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
};

// Status categories for business logic
export const PENDING_STATUSES = [2, 3, 4]; // Pending, Review, Revision (can be approved/rejected)
export const APPROVED_STATUSES = [5, 7, 8]; // Approved, Processing, Completed
export const REJECTED_STATUSES = [6]; // Rejected
export const FINAL_STATUSES = [5, 6, 8, 9, 10]; // Approved, Rejected, Completed, Cancelled, Expired
export const ADMIN_EDITABLE_STATUSES = []; // Admin cannot edit any status
export const MANAGER_EDITABLE_STATUSES = [1, 2, 6]; // Draft, Pending, Rejected (manager can edit)
export const DRAFT_STATUSES = [1]; // Draft (not submitted for approval yet)

export const isPending = (statusId: number): boolean => {
  return PENDING_STATUSES.includes(statusId);
};

export const isApproved = (statusId: number): boolean => {
  return APPROVED_STATUSES.includes(statusId);
};

export const isRejected = (statusId: number): boolean => {
  return REJECTED_STATUSES.includes(statusId);
};

export const isEditable = (statusId: number): boolean => {
  return MANAGER_EDITABLE_STATUSES.includes(statusId); // Only manager can edit
};

export const isAdminEditable = (statusId: number): boolean => {
  return false; // Admin cannot edit any status
};

export const isManagerEditable = (statusId: number): boolean => {
  return MANAGER_EDITABLE_STATUSES.includes(statusId);
};

export const isFinal = (statusId: number): boolean => {
  return FINAL_STATUSES.includes(statusId);
};

export const isDraft = (statusId: number): boolean => {
  return DRAFT_STATUSES.includes(statusId);
};
