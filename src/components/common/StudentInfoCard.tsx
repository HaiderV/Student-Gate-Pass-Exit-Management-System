import type { ReactNode } from 'react';
import { initialsOf } from '@/lib/format';

interface StudentInfoCardProps {
  name: string;
  identifierLabel: string;
  identifier: string;
  chips: string[];
  /** Optional footer content (e.g. action button or note). */
  footer?: ReactNode;
}

export default function StudentInfoCard({
  name,
  identifierLabel,
  identifier,
  chips,
  footer,
}: StudentInfoCardProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-white/[0.07] bg-navy-850/70 p-5">
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 font-display text-sm font-bold text-blue-300 ring-1 ring-blue-400/25"
        >
          {initialsOf(name)}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-bold text-white">{name}</h3>
          <p className="mt-0.5 font-mono text-[13px] text-slate-400">
            <span className="text-slate-500">{identifierLabel}: </span>
            {identifier}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span key={chip} className="chip">
            {chip}
          </span>
        ))}
      </div>
      {footer && <div className="mt-auto pt-4">{footer}</div>}
    </div>
  );
}
