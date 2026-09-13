import { ClipboardList, ExternalLink, FileText, LogOut, RefreshCw } from 'lucide-react';
import type { GatePass } from '@/types';
import Card from '@/components/common/Card';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';

interface RecentGatePassesProps {
  passes: GatePass[];
  loading?: boolean;
  onRefresh?: () => void;
  onMarkExit: (pass: GatePass) => void;
}

/** Recent gate passes for the security portal — table on desktop, cards on mobile. */
export default function RecentGatePasses({
  passes,
  loading = false,
  onRefresh,
  onMarkExit,
}: RecentGatePassesProps) {
  return (
    <Card
      title="Recent Gate Passes"
      description="Gate passes created at reception. Active passes can be marked as exited directly."
      icon={ClipboardList}
      action={
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <span className="chip">
            {passes.length} {passes.length === 1 ? 'pass' : 'passes'}
          </span>
        </div>
      }
    >
      {loading && passes.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading recent gate passes...</div>
      ) : passes.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No Gate Passes Yet"
          description="Gate passes created at reception will appear here as soon as they are issued."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th scope="col" className="th">Student</th>
                  <th scope="col" className="th">Registration / ID</th>
                  <th scope="col" className="th">Course / Class</th>
                  <th scope="col" className="th">Reason</th>
                  <th scope="col" className="th">Letter</th>
                  <th scope="col" className="th">Status</th>
                  <th scope="col" className="th text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {passes.map((pass) => (
                  <tr key={pass.id} className="transition hover:bg-white/[0.02]">
                    <td className="td font-medium text-white">{pass.studentName}</td>
                    <td className="td font-mono text-[13px] text-slate-300">
                      {pass.registrationNumber || (pass.uniqueNumber ? `Uniq #${pass.uniqueNumber}` : '—')}
                    </td>
                    <td className="td text-slate-300">
                      {pass.course || pass.className || '—'}
                      {pass.section ? ` (${pass.section})` : ''}
                    </td>
                    <td className="td text-slate-300">{pass.reason}</td>
                    <td className="td">
                      {pass.signedLetterUrl ? (
                        <a
                          href={pass.signedLetterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>PDF</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="td">
                      <StatusBadge status={pass.status} />
                    </td>
                    <td className="td text-right">
                      {pass.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          className="btn-primary px-3 py-1.5 text-xs"
                          onClick={() => onMarkExit(pass)}
                        >
                          <LogOut className="h-3.5 w-3.5" aria-hidden />
                          Mark Exit
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {pass.exitTime
                            ? `Exited ${new Date(pass.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {passes.map((pass) => (
              <article
                key={pass.id}
                className="rounded-lg border border-white/[0.06] bg-navy-850/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">{pass.studentName}</h3>
                    <p className="mt-0.5 font-mono text-xs text-slate-400">
                      {pass.registrationNumber || (pass.uniqueNumber ? `Uniq #${pass.uniqueNumber}` : '—')}
                    </p>
                  </div>
                  <StatusBadge status={pass.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Course / Class</dt>
                    <dd className="mt-0.5 font-medium text-slate-200">{pass.course || pass.className || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Reason</dt>
                    <dd className="mt-0.5 font-medium text-slate-200">{pass.reason}</dd>
                  </div>
                </dl>
                {pass.status === 'ACTIVE' && (
                  <button
                    type="button"
                    className="btn-primary mt-3.5 w-full py-2 text-xs"
                    onClick={() => onMarkExit(pass)}
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden />
                    Mark Exit
                  </button>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
