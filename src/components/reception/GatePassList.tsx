import { useMemo, useState } from 'react';
import { ExternalLink, FileText, History, RefreshCw } from 'lucide-react';
import type { GatePass, GatePassStatus } from '@/types';
import Card from '@/components/common/Card';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { sortPassesNewestFirst } from '@/lib/students';

type StatusFilter = 'ALL' | GatePassStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXITED', label: 'Exited' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

interface GatePassListProps {
  passes: GatePass[];
  emptyTitle: string;
  emptyDescription: string;
  loading?: boolean;
  onRefresh?: () => void;
}

/** Reception history of created gate passes with status filter. */
export default function GatePassList({
  passes,
  emptyTitle,
  emptyDescription,
  loading = false,
  onRefresh,
}: GatePassListProps) {
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const sorted = useMemo(() => sortPassesNewestFirst(passes), [passes]);
  const visible = useMemo(
    () => (filter === 'ALL' ? sorted : sorted.filter((p) => p.status === filter)),
    [sorted, filter],
  );

  const countFor = (status: StatusFilter) =>
    status === 'ALL' ? sorted.length : sorted.filter((p) => p.status === status).length;

  return (
    <Card
      title="Gate Pass History"
      description="Recently created passes for this portal, newest first."
      icon={History}
      action={
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
              title="Refresh passes"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <span className="chip">
            {sorted.length} {sorted.length === 1 ? 'pass' : 'passes'}
          </span>
        </div>
      }
    >
      <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = countFor(f.value);
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${
                active
                  ? 'border-blue-400/40 bg-blue-500/15 text-blue-200'
                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 tabular-nums ${active ? 'text-blue-300' : 'text-slate-500'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {loading && sorted.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading passes from database...</div>
        ) : visible.length === 0 ? (
          <EmptyState
            compact
            icon={History}
            title={filter === 'ALL' ? emptyTitle : `No ${filter.toLowerCase()} passes`}
            description={filter === 'ALL' ? emptyDescription : 'Try a different status filter above.'}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr>
                    <th scope="col" className="th">Pass ID</th>
                    <th scope="col" className="th">Student</th>
                    <th scope="col" className="th">Course / Class</th>
                    <th scope="col" className="th">Reason</th>
                    <th scope="col" className="th">Leave Letter</th>
                    <th scope="col" className="th">Teacher</th>
                    <th scope="col" className="th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((pass) => (
                    <tr key={pass.id} className="transition hover:bg-white/[0.02]">
                      <td className="td font-mono text-[13px] text-slate-300">{pass.passId}</td>
                      <td className="td">
                        <span className="block font-medium text-white">{pass.studentName}</span>
                        <span className="mt-0.5 block font-mono text-xs text-slate-400">
                          {pass.studentType === 'degree'
                            ? pass.registrationNumber ?? '—'
                            : (pass.uniqueNumber ? `Unique #${pass.uniqueNumber}` : pass.registrationNumber ?? '—')}
                        </span>
                      </td>
                      <td className="td text-slate-300">
                        {pass.studentType === 'degree'
                          ? `${pass.course ?? '—'} · ${pass.year ?? '—'} · ${pass.section}`
                          : `${pass.className ?? '—'} · ${pass.section}`}
                      </td>
                      <td className="td text-slate-300">{pass.reason}</td>
                      <td className="td">
                        {pass.signedLetterUrl ? (
                          <a
                            href={pass.signedLetterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>PDF</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                      <td className="td text-slate-300">{pass.teacher}</td>
                      <td className="td">
                        <StatusBadge status={pass.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {visible.map((pass) => (
                <article key={pass.id} className="rounded-lg border border-white/[0.06] bg-navy-850/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-slate-400">{pass.passId}</span>
                    <StatusBadge status={pass.status} />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-white">{pass.studentName}</h3>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">
                    {pass.studentType === 'degree'
                      ? pass.registrationNumber ?? '—'
                      : (pass.uniqueNumber ? `Unique #${pass.uniqueNumber}` : pass.registrationNumber ?? '—')}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Reason</dt>
                      <dd className="mt-0.5 font-medium text-slate-200">{pass.reason}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Teacher</dt>
                      <dd className="mt-0.5 font-medium text-slate-200">{pass.teacher}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Class</dt>
                      <dd className="mt-0.5 font-medium text-slate-200">
                        {pass.studentType === 'degree'
                          ? `${pass.course ?? '—'} · ${pass.year ?? '—'} · ${pass.section}`
                          : `${pass.className ?? '—'} · ${pass.section}`}
                      </dd>
                    </div>
                    {pass.signedLetterUrl && (
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Leave Letter</dt>
                        <dd className="mt-0.5">
                          <a
                            href={pass.signedLetterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-sky-400 hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            View Letter
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
