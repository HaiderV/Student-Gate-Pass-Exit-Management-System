import { CheckCircle2, Clock, LogOut } from 'lucide-react';
import type { GatePass } from '@/types';
import InfoRow from '@/components/common/InfoRow';
import StatusBadge from '@/components/common/StatusBadge';

interface GatePassCardProps {
  pass: GatePass;
  /** When provided and the pass is ACTIVE, a "Mark as Exited" action is shown. */
  onMarkExit?: (pass: GatePass) => void;
  className?: string;
}

export default function GatePassCard({ pass, onMarkExit, className = '' }: GatePassCardProps) {
  const isDegree = pass.studentType === 'degree';
  const contextLine = isDegree
    ? `${pass.course ?? '—'} · ${pass.year ?? '—'} · Sec ${pass.section}`
    : `${pass.className ?? '—'} · Section ${pass.section}`;
  const identifier = isDegree ? (pass.registrationNumber ?? '—') : String(pass.uniqueNumber ?? '—');

  return (
    <article
      className={`flex h-full flex-col rounded-xl border border-white/[0.07] bg-navy-800/70 p-5 shadow-card transition hover:border-white/[0.12] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-bold text-white">{pass.studentName}</h3>
          <p className="mt-1 font-mono text-xs text-slate-400">
            {isDegree ? 'Reg No' : 'Unique No'}: {identifier}
          </p>
        </div>
        <StatusBadge status={pass.status} />
      </div>

      <div className="mb-5 mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
        <InfoRow label="Reason" value={pass.reason} />
        <InfoRow label="Class teacher" value={pass.teacher} />
        <InfoRow label="Expected exit" value={pass.expectedExit} />
        <InfoRow label={isDegree ? 'Course' : 'Class'} value={contextLine} />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3.5">
        <span className="font-mono text-[11px] text-slate-500">{pass.passId}</span>
        {pass.status === 'ACTIVE' && onMarkExit ? (
          <button type="button" className="btn-primary px-3.5 py-2 text-xs" onClick={() => onMarkExit(pass)}>
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Mark as Exited
          </button>
        ) : null}
        {pass.status === 'USED' && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300/90">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Exit recorded{pass.exitTime ? ` at ${pass.exitTime}` : ''}
          </span>
        )}
        {pass.status === 'EXPIRED' && (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-300/80">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Pass window elapsed
          </span>
        )}
        {pass.status === 'CANCELLED' && <span className="text-xs text-slate-500">Cancelled at reception</span>}
      </div>
    </article>
  );
}
