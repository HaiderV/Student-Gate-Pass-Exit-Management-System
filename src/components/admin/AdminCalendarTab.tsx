import { useEffect, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import Modal from '@/components/common/Modal';
import Card from '@/components/common/Card';
import TypeBadge from '@/components/common/TypeBadge';
import { getAdminCalendar, getAdminDailyReport, getAdminRangeReport } from '@/lib/api';
import type { CalendarDaySummary } from '@/types';

export default function AdminCalendarTab() {
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);
  const [days, setDays] = useState<CalendarDaySummary[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyReport, setDailyReport] = useState<any | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);

  const [fromRange, setFromRange] = useState(new Date().toISOString().slice(0, 8) + '01');
  const [toRange, setToRange] = useState(new Date().toISOString().slice(0, 10));
  const [rangeReport, setRangeReport] = useState<any | null>(null);
  const [loadingRange, setLoadingRange] = useState(false);

  // Today's ISO date for highlight e.g. "2026-09-13"
  const todayISO = new Date().toISOString().slice(0, 10);

  const fetchCalendar = async () => {
    setLoadingCalendar(true);
    try {
      const res = await getAdminCalendar(selectedMonth);
      setDays(res.days || []);
    } catch (err: any) {
      console.error('Failed to load calendar:', err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(Date.UTC(year, month - 2, 1));
    setSelectedMonth(prevDate.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(Date.UTC(year, month, 1));
    setSelectedMonth(nextDate.toISOString().slice(0, 7));
  };

  const handleDayClick = async (date: string) => {
    setSelectedDate(date);
    setLoadingDaily(true);
    try {
      const res = await getAdminDailyReport(date);
      setDailyReport(res);
    } catch (err: any) {
      console.error('Failed to load daily report:', err);
    } finally {
      setLoadingDaily(false);
    }
  };

  const handleFetchRangeReport = async () => {
    if (!fromRange || !toRange) return;
    setLoadingRange(true);
    try {
      const res = await getAdminRangeReport(fromRange, toRange);
      setRangeReport(res);
    } catch (err: any) {
      console.error('Range report error:', err);
    } finally {
      setLoadingRange(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation Card */}
      <Card
        title="Calendar-wise Activity Summary"
        description="Select any month to inspect daily gatepass events and click a day for the full breakdown."
        icon={CalendarDays}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-sm font-bold text-white px-2">{selectedMonth}</span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={fetchCalendar}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-white ml-2"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingCalendar ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      >
        {loadingCalendar ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading month data...</div>
        ) : days.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No days returned for {selectedMonth}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {days.map((day) => {
              const dayNum = day.date.slice(8);
              const hasActivity = day.total > 0;
              const isToday = day.date === todayISO;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => handleDayClick(day.date)}
                  className={`group relative flex flex-col rounded-xl border p-3 text-left transition ${
                    isToday
                      ? 'border-blue-400 bg-blue-500/20 ring-2 ring-blue-400/60 shadow-[0_0_16px_rgba(59,130,246,0.4)] hover:bg-blue-500/30'
                      : hasActivity
                      ? 'border-blue-500/40 bg-blue-500/[0.08] hover:border-blue-400 hover:bg-blue-500/15'
                      : 'border-white/[0.06] bg-navy-850/40 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`font-mono text-sm font-bold ${isToday ? 'text-blue-200' : 'text-white'}`}>
                      {dayNum}
                    </span>
                    {isToday ? (
                      <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shrink-0">
                        TODAY
                      </span>
                    ) : hasActivity ? (
                      <span className="chip text-[10px] bg-blue-500/20 text-blue-300 border-blue-400/30">
                        {day.total}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Created:</span>
                      <span className="font-semibold text-slate-200">{day.created}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Exited:</span>
                      <span className="font-semibold text-emerald-300">{day.exited}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Cancelled:</span>
                      <span className="font-semibold text-rose-300">{day.cancelled}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Date Range Query Card */}
      <Card
        title="Custom Date-Range Report"
        description="Aggregate activity totals and view event timelines over a custom date range."
        icon={Filter}
      >
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div>
            <label className="label">From Date</label>
            <input
              type="date"
              value={fromRange}
              onChange={(e) => setFromRange(e.target.value)}
              className="input font-mono text-sm"
            />
          </div>
          <div>
            <label className="label">To Date</label>
            <input
              type="date"
              value={toRange}
              onChange={(e) => setToRange(e.target.value)}
              className="input font-mono text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleFetchRangeReport}
            disabled={loadingRange}
            className="btn-primary"
          >
            {loadingRange ? 'Generating Report...' : 'Generate Range Report'}
          </button>
        </div>

        {rangeReport && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-navy-900/60 p-5">
            <h4 className="text-sm font-bold text-white">
              Report for {rangeReport.from} to {rangeReport.to}
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-white/10 bg-navy-850/70 p-3 text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Events</p>
                <p className="font-display text-2xl font-bold text-white mt-1">{rangeReport.summary.total}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-navy-850/70 p-3 text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Created</p>
                <p className="font-display text-2xl font-bold text-blue-300 mt-1">{rangeReport.summary.created}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-navy-850/70 p-3 text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Exited</p>
                <p className="font-display text-2xl font-bold text-emerald-300 mt-1">{rangeReport.summary.exited}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-navy-850/70 p-3 text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Cancelled</p>
                <p className="font-display text-2xl font-bold text-rose-300 mt-1">{rangeReport.summary.cancelled}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-white/10 bg-navy-850/40 p-3">
                <p className="font-bold text-white mb-2">Degree Breakdown</p>
                <p className="text-slate-300">Total: {rangeReport.degree.total}</p>
                <p className="text-slate-300">Exited: {rangeReport.degree.exited}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-navy-850/40 p-3">
                <p className="font-bold text-white mb-2">Junior Breakdown</p>
                <p className="text-slate-300">Total: {rangeReport.junior.total}</p>
                <p className="text-slate-300">Exited: {rangeReport.junior.exited}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Daily Detail Modal */}
      <Modal
        open={!!selectedDate}
        onClose={() => { setSelectedDate(null); setDailyReport(null); }}
        title={`Daily Report — ${selectedDate ?? ''}`}
        subtitle={selectedDate === todayISO ? "Today's activity" : 'Click a day in the calendar grid to inspect it'}
        maxWidth="max-w-2xl"
      >
            {loadingDaily ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading daily details...</div>
            ) : dailyReport ? (
              <div className="space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg border border-white/10 bg-navy-850 p-2.5">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Events</p>
                    <p className="text-xl font-bold text-white mt-0.5">{dailyReport.summary.total}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-navy-850 p-2.5">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Created</p>
                    <p className="text-xl font-bold text-blue-300 mt-0.5">{dailyReport.summary.created}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-navy-850 p-2.5">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Exited</p>
                    <p className="text-xl font-bold text-emerald-300 mt-0.5">{dailyReport.summary.exited}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-navy-850 p-2.5">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Cancelled</p>
                    <p className="text-xl font-bold text-rose-300 mt-0.5">{dailyReport.summary.cancelled}</p>
                  </div>
                </div>

                {/* Individual Events */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">
                    Gatepass Events ({dailyReport.events?.length || 0})
                  </h4>
                  {!dailyReport.events || dailyReport.events.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No gatepass activity on this date.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {dailyReport.events.map((ev: any) => (
                        <div
                          key={ev.id}
                          className="rounded-lg border border-white/[0.06] bg-navy-850/60 p-3 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{ev.student?.name || 'Student'}</span>
                              <TypeBadge
                                type={ev.gatepassType?.toLowerCase() === 'junior' ? 'junior' : 'degree'}
                              />
                              <span className="font-mono text-slate-400">
                                (
                                {ev.student?.registration_number ||
                                  (ev.uniqueNumber ? `Uniq #${ev.uniqueNumber.unique_number}` : '—')}
                                )
                              </span>
                            </div>
                            <p className="mt-1 text-slate-300">
                              Event: <strong className="text-sky-300">{ev.eventType}</strong> · Reason:{' '}
                              {ev.reason || '—'} · Teacher: {ev.teacher?.name || '—'}
                            </p>
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 shrink-0">
                            {new Date(ev.eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audit Logs */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">
                    Security &amp; Reception Audit Logs ({dailyReport.auditLogs?.length || 0})
                  </h4>
                  {!dailyReport.auditLogs || dailyReport.auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No audit records for this date.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {dailyReport.auditLogs.map((log: any) => (
                        <div
                          key={log.id}
                          className="rounded-lg border border-white/[0.06] bg-navy-850/60 p-2.5 text-xs flex items-start justify-between gap-3"
                        >
                          <div>
                            <span className="font-semibold text-sky-300">[{log.actor_type}]</span>{' '}
                            <span className="font-medium text-slate-200">{log.action}:</span>{' '}
                            <span className="text-slate-300">{log.description}</span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 shrink-0">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
      </Modal>
    </div>
  );
}
