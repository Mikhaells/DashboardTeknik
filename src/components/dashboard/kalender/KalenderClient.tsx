'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { KalenderKegiatan, getStatusLabel, getStatusColor, getBadgeColor, STATUS_PENDING, STATUS_APPROVED } from '@/types/kalender';

interface KalenderClientProps {
  initialData: KalenderKegiatan[];
  initialPendingData: KalenderKegiatan[];
  username: string;
  levelId: number;
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const IS_ADMIN = 1;

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isToday(year: number, month: number, day: number): boolean {
  const today = new Date();
  return today.getFullYear() === year &&
    today.getMonth() === month - 1 &&
    today.getDate() === day;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

interface TooltipState {
  x: number;
  y: number;
  events: KalenderKegiatan[];
  date: string;
}

export default function KalenderClient({ initialData, initialPendingData, username, levelId }: KalenderClientProps) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [events, setEvents] = useState<Record<string, KalenderKegiatan[]>>({});
  const [pendingEvents, setPendingEvents] = useState<KalenderKegiatan[]>(initialPendingData);
  const [loading, setLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [editingEvent, setEditingEvent] = useState<KalenderKegiatan | null>(null);
  const [formJam, setFormJam] = useState('');
  const [formKegiatan, setFormKegiatan] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formGambar, setFormGambar] = useState<File | null>(null);
  const [formGambarPreview, setFormGambarPreview] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailEvent, setDetailEvent] = useState<KalenderKegiatan | null>(null);

  const groupEventsByDate = useCallback((data: KalenderKegiatan[]) => {
    const grouped: Record<string, KalenderKegiatan[]> = {};
    const sorted = [...data].sort((a, b) => {
      const dateA = a.Tanggal.split('T')[0];
      const dateB = b.Tanggal.split('T')[0];
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.Jam || '').localeCompare(b.Jam || '');
    });
    sorted.forEach(item => {
      const dateStr = item.Tanggal.split('T')[0];
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(item);
    });
    return grouped;
  }, []);

  useEffect(() => {
    setEvents(groupEventsByDate(initialData));
  }, [initialData, groupEventsByDate]);

  const fetchEvents = useCallback(async (month: number, year: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/kalender?month=${month}&year=${year}`);
      const result = await response.json();
      if (result.success && result.data) {
        setEvents(groupEventsByDate(result.data));
      } else {
        setError(result.message || 'Gagal memuat data');
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  }, [groupEventsByDate]);

  const fetchPending = useCallback(async () => {
    try {
      setPendingLoading(true);
      const response = await fetch('/api/kalender?filter=pending');
      const result = await response.json();
      if (result.success && result.data) {
        setPendingEvents(result.data);
      }
    } catch {
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  useEffect(() => {
    fetchEvents(currentMonth, currentYear);
  }, [currentMonth, currentYear, fetchEvents]);

  const handleMouseEnter = (e: React.MouseEvent, dateKey: string, dayEvents: KalenderKegiatan[]) => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
      events: dayEvents,
      date: dateKey,
    });
  };

  const handleMouseLeave = () => {
    tooltipTimeout.current = setTimeout(() => {
      setTooltip(null);
    }, 200);
  };

  const handleTooltipMouseEnter = () => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
  };

  const handleTooltipMouseLeave = () => {
    setTooltip(null);
  };

  const openAddModal = (dateKey: string) => {
    setModalDate(dateKey);
    setEditingEvent(null);
    setFormJam(getCurrentTime());
    setFormKegiatan('');
    setFormDeskripsi('');
    setFormGambar(null);
    setFormGambarPreview(null);
    setShowModal(true);
    setTooltip(null);
  };

  const openEditModal = (event: KalenderKegiatan) => {
    setEditingEvent(event);
    setModalDate(event.Tanggal.split('T')[0]);
    setFormJam(event.Jam || '');
    setFormKegiatan(event.Kegiatan);
    setFormDeskripsi(event.Deskripsi || '');
    setFormGambar(null);
    setFormGambarPreview(event.Gambar || null);
    setShowModal(true);
    setShowDetailModal(false);
  };

  const openDetailModal = (event: KalenderKegiatan) => {
    setDetailEvent(event);
    setShowDetailModal(true);
    setTooltip(null);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKegiatan.trim() || !formJam.trim()) return;

    setFormLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('Jam', formJam);
      formData.append('Kegiatan', formKegiatan);
      formData.append('Deskripsi', formDeskripsi);
      if (formGambar) {
        formData.append('Gambar', formGambar);
      }
      if (formGambarPreview === null && editingEvent?.Gambar) {
        formData.append('HapusGambar', '1');
      }

      if (editingEvent) {
        formData.append('Tanggal', modalDate);
        const response = await fetch(`/api/kalender/${editingEvent.Id}`, {
          method: 'PUT',
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          await fetchEvents(currentMonth, currentYear);
          await fetchPending();
          setShowModal(false);
        } else {
          setError(result.message || 'Gagal mengupdate');
        }
      } else {
        formData.append('Tanggal', modalDate);
        const response = await fetch('/api/kalender', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          await fetchEvents(currentMonth, currentYear);
          await fetchPending();
          setShowModal(false);
        } else {
          setError(result.message || 'Gagal menambah');
        }
      }
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Hapus kegiatan ini?')) return;
    try {
      const response = await fetch(`/api/kalender/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        await fetchEvents(currentMonth, currentYear);
        await fetchPending();
        setShowDetailModal(false);
      } else {
        setError(result.message || 'Gagal menghapus');
      }
    } catch {
      setError('Terjadi kesalahan');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`/api/kalender/${id}/approve`, { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        await fetchEvents(currentMonth, currentYear);
        await fetchPending();
        setShowDetailModal(false);
      } else {
        setError(result.message || 'Gagal menyetujui');
      }
    } catch {
      setError('Terjadi kesalahan');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`/api/kalender/${id}/reject`, { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        await fetchEvents(currentMonth, currentYear);
        await fetchPending();
        setShowDetailModal(false);
      } else {
        setError(result.message || 'Gagal menolak');
      }
    } catch {
      setError('Terjadi kesalahan');
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const daysInPrevMonth = getDaysInMonth(currentMonth === 1 ? 12 : currentMonth - 1, currentMonth === 1 ? currentYear - 1 : currentYear);

  const calendarDays: { day: number; month: 'prev' | 'current' | 'next'; dateKey: string }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const m = currentMonth === 1 ? 12 : currentMonth - 1;
    const y = currentMonth === 1 ? currentYear - 1 : currentYear;
    calendarDays.push({ day, month: 'prev', dateKey: formatDateKey(y, m, day) });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, month: 'current', dateKey: formatDateKey(currentYear, currentMonth, day) });
  }

  const remaining = 42 - calendarDays.length;
  for (let day = 1; day <= remaining; day++) {
    const m = currentMonth === 12 ? 1 : currentMonth + 1;
    const y = currentMonth === 12 ? currentYear + 1 : currentYear;
    calendarDays.push({ day, month: 'next', dateKey: formatDateKey(y, m, day) });
  }

  const totalEvents = Object.values(events).reduce((sum, arr) => sum + arr.length, 0);
  const approvedCount = Object.values(events).reduce((sum, arr) => sum + arr.filter(e => e.StatusId === STATUS_APPROVED).length, 0);
  const pendingCount = Object.values(events).reduce((sum, arr) => sum + arr.filter(e => e.StatusId === STATUS_PENDING).length, 0);

  return (
    <div className="space-y-6">
      {/* Admin: Pending Approval Section */}
      {levelId === IS_ADMIN && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Kegiatan Menunggu Persetujuan
                  </h3>
                  <p className="text-sm text-gray-500">
                    {pendingEvents.length} kegiatan perlu ditinjau
                  </p>
                </div>
              </div>
              {pendingLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent"></div>
              )}
            </div>

            {pendingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-500">Tidak ada kegiatan yang menunggu persetujuan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 -mb-5">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jam</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kegiatan</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Deskripsi</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Diajukan</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pendingEvents.map((evt) => (
                      <tr key={evt.Id} className="hover:bg-amber-50/50 transition-colors duration-150">
                        <td className="px-6 py-3.5 text-sm text-gray-900 whitespace-nowrap font-medium">
                          {formatDateShort(evt.Tanggal)}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-gray-900 whitespace-nowrap font-mono">
                          {evt.Jam || '-'}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${getBadgeColor(evt.StatusId)}`}></span>
                            {evt.Kegiatan}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-gray-500 max-w-[200px] truncate hidden md:table-cell">
                          {evt.Deskripsi || <span className="italic text-gray-300">-</span>}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-gray-500 hidden sm:table-cell">{evt.CreatedBy}</td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprove(evt.Id)}
                              className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 hover:text-emerald-800 transition-all duration-200 shadow-sm hover:shadow"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleReject(evt.Id)}
                              className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 hover:text-red-700 transition-all duration-200 shadow-sm hover:shadow"
                            >
                              Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
        <div className="px-6 py-5">
          {error && (
            <div className="mb-5 p-4 bg-red-50/80 border border-red-100 rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                {MONTHS[currentMonth - 1]}
                <span className="text-gray-400 font-medium ml-1.5">{currentYear}</span>
              </h3>
            </div>

            <button
              onClick={nextMonth}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-5 px-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              <span>{totalEvents} kegiatan</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{approvedCount} disetujui</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              <span>{pendingCount} pending</span>
            </div>
            {loading && (
              <div className="ml-auto">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Day names header */}
          <div className="grid grid-cols-7 mb-3 px-1">
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-1.5">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden">
            {calendarDays.map(({ day, month, dateKey }, idx) => {
              const dayEvents = events[dateKey] || [];
              const isCurrentMonth = month === 'current';
              const today = isCurrentMonth && isToday(currentYear, currentMonth, day);
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={idx}
                  className={`relative min-h-[90px] max-h-[155px] overflow-y-auto transition-all duration-150 cursor-pointer group scrollbar-thin ${
                    isCurrentMonth ? 'bg-white hover:bg-blue-50/40' : 'bg-gray-50/50'
                  } ${today ? 'bg-blue-50/70' : ''}`}
                  onMouseEnter={(e) => {
                    if (dayEvents.length > 0) {
                      handleMouseEnter(e, dateKey, dayEvents);
                    }
                  }}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => isCurrentMonth && openAddModal(dateKey)}
                >
                  {/* Day number - sticky */}
                  <div className="sticky top-0 z-10 px-1.5 pt-1.5 pb-1 bg-inherit">
                    <div className={`text-xs font-bold leading-tight ${
                      today
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white w-7 h-7 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200'
                        : isCurrentMonth
                          ? hasEvents ? 'text-gray-900' : 'text-gray-600'
                          : 'text-gray-300'
                    }`}
                    >
                      {today ? (
                        <span className="flex items-center justify-center w-7 h-7">{day}</span>
                      ) : (
                        <span className="block px-1">{day}</span>
                      )}
                    </div>
                  </div>

                  {/* All event pills - scrollable */}
                  {hasEvents && isCurrentMonth && (
                    <div className="px-1 pb-1 space-y-px">
                      {dayEvents.map((evt) => (
                        <div
                          key={evt.Id}
                          className={`group/event text-[10px] leading-tight rounded-md px-1.5 py-0.5 truncate cursor-pointer transition-all duration-150 hover:shadow-sm ${getStatusColor(evt.StatusId)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailModal(evt);
                          }}
                        >
                          {evt.Jam && <span className="font-mono font-semibold opacity-75">{evt.Jam} </span>}
                          <span className="font-medium">{evt.Kegiatan}</span>
                        </div>
                      ))}
                      {dayEvents.length >= 8 && (
                        <div className="text-[10px] text-blue-500 pl-1.5 font-semibold">
                          {dayEvents.length} kegiatan
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty day add indicator */}
                  {isCurrentMonth && !hasEvents && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-[10px] font-medium text-blue-400 bg-blue-50/80 px-2 py-0.5 rounded-full">
                        + Tambah
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="fixed z-50 animate-in fade-in zoom-in-95"
              style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}
              onMouseEnter={handleTooltipMouseEnter}
              onMouseLeave={handleTooltipMouseLeave}
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[220px] max-w-[320px]">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatDateDisplay(tooltip.date)}
                  </span>
                  <span className="ml-auto text-xs text-gray-400 font-medium bg-gray-50 rounded-full px-2 py-0.5">
                    {tooltip.events.length} kegiatan
                  </span>
                </div>
                <div className="space-y-2">
                  {tooltip.events.map((evt) => (
                    <div
                      key={evt.Id}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => openDetailModal(evt)}
                    >
                      <span className={`inline-block w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 shadow-sm ${getBadgeColor(evt.StatusId)}`}></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {evt.Jam && (
                            <span className="text-xs font-mono font-medium text-gray-500">{evt.Jam}</span>
                          )}
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${getStatusColor(evt.StatusId)}`}>
                            {getStatusLabel(evt.StatusId)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{evt.Kegiatan}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-50 text-center">
                  <span className="text-[11px] text-blue-500 font-medium">Klik untuk detail</span>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-gray-500 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm"></div>
              <span className="font-medium">Hari ini</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-amber-400 shadow-sm"></div>
              <span className="font-medium">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm"></div>
              <span className="font-medium">Disetujui</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-red-500 shadow-sm"></div>
              <span className="font-medium">Ditolak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${editingEvent ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                  <svg className={`w-5 h-5 ${editingEvent ? 'text-blue-600' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {editingEvent ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    )}
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingEvent ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
                  </h3>
                  <p className="text-sm text-gray-500">{formatDateDisplay(modalDate)}</p>
                </div>
              </div>
              {editingEvent && (
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(editingEvent.StatusId)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getBadgeColor(editingEvent.StatusId)}`}></span>
                    {getStatusLabel(editingEvent.StatusId)}
                  </span>
                </div>
              )}
            </div>
            <form onSubmit={handleSubmitForm}>
              <div className="px-6 py-5 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jam <span className="text-red-400">*</span></label>
                  <input
                    type="time"
                    value={formJam}
                    onChange={(e) => setFormJam(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                    required
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kegiatan <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formKegiatan}
                    onChange={(e) => setFormKegiatan(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400 bg-gray-50/50"
                    placeholder="Nama kegiatan"
                    required
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                  <textarea
                    value={formDeskripsi}
                    onChange={(e) => setFormDeskripsi(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400 bg-gray-50/50"
                    placeholder="Deskripsi kegiatan (opsional)"
                    rows={3}
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gambar</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormGambar(file);
                        if (file) {
                          setFormGambarPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200 cursor-pointer"
                      disabled={formLoading}
                    />
                    {formGambarPreview && (
                      <div className="relative inline-block">
                        <img
                          src={formGambarPreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-xl border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormGambar(null);
                            setFormGambarPreview(null);
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                          disabled={formLoading}
                        >
                          &times;
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400">Format: JPG, PNG, GIF, WebP. Maks 2MB.</p>
                  </div>
                </div>
                {!editingEvent && (
                  <div className="flex items-center gap-2.5 p-3 bg-amber-50/80 border border-amber-100 rounded-xl">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-amber-700">
                      Kegiatan akan diajukan untuk persetujuan admin.
                    </p>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                  disabled={formLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  disabled={formLoading || !formKegiatan.trim() || !formJam.trim()}
                >
                  {formLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                      Menyimpan...
                    </span>
                  ) : editingEvent ? 'Simpan Perubahan' : 'Ajukan Kegiatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${
                    detailEvent.StatusId === STATUS_APPROVED ? 'bg-emerald-50' :
                    detailEvent.StatusId === STATUS_PENDING ? 'bg-amber-50' : 'bg-red-50'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      detailEvent.StatusId === STATUS_APPROVED ? 'text-emerald-600' :
                      detailEvent.StatusId === STATUS_PENDING ? 'text-amber-600' : 'text-red-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {detailEvent.Kegiatan}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {detailEvent.Jam && (
                        <span className="text-sm font-mono font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                          {detailEvent.Jam}
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusColor(detailEvent.StatusId)}`}>
                        {getStatusLabel(detailEvent.StatusId)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1.5">
                      <svg className="w-3.5 h-3.5 inline mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDateDisplay(detailEvent.Tanggal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Deskripsi</label>
                <p className="mt-1.5 text-sm text-gray-700 leading-relaxed">
                  {detailEvent.Deskripsi || (
                    <span className="italic text-gray-400">Tidak ada deskripsi</span>
                  )}
                </p>
              </div>
              {detailEvent.Gambar && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gambar</label>
                  <div className="mt-1.5">
                    <img
                      src={detailEvent.Gambar}
                      alt="Gambar kegiatan"
                      className="w-full max-h-48 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(detailEvent.Gambar!, '_blank')}
                    />
                  </div>
                </div>
              )}
              <div className="bg-gray-50/80 rounded-xl p-4 space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Informasi</label>
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Dibuat oleh <strong>{detailEvent.CreatedBy}</strong></span>
                </div>
                {detailEvent.ApprovedBy && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {detailEvent.StatusId === STATUS_APPROVED ? 'Disetujui' : 'Ditolak'} oleh{' '}
                      <strong>{detailEvent.ApprovedBy}</strong>
                      {detailEvent.ApprovedDate && (
                        <span className="text-gray-400">
                          {' '}pada {formatDateDisplay(detailEvent.ApprovedDate.split('T')[0])}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 flex-wrap">
              {levelId === IS_ADMIN && detailEvent.StatusId === STATUS_PENDING && (
                <>
                  <button
                    onClick={() => handleApprove(detailEvent.Id)}
                    className="px-5 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200 shadow-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Setujui
                    </span>
                  </button>
                  <button
                    onClick={() => handleReject(detailEvent.Id)}
                    className="px-5 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all duration-200 shadow-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Tolak
                    </span>
                  </button>
                </>
              )}
              {detailEvent.StatusId === STATUS_PENDING && detailEvent.CreatedBy === username && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(detailEvent);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 shadow-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </span>
                </button>
              )}
              {detailEvent.StatusId === STATUS_PENDING && detailEvent.CreatedBy === username && (
                <button
                  onClick={() => handleDeleteEvent(detailEvent.Id)}
                  className="px-5 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all duration-200 shadow-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
