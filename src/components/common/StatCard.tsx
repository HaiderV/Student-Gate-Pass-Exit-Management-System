import type { LucideIcon } from 'lucide-react';

type StatTone = 'blue' | 'sky' | 'emerald' | 'amber' | 'slate' | 'rose';

const TONES: Record<StatTone, string> = {
  blue: 'bg-blue-500/10 text-blue-300 ring-blue-400/20',
  sky: 'bg-sky-500/10 text-sky-300 ring-sky-400/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-400/20',
  slate: 'bg-slate-500/10 text-slate-300 ring-slate-400/20',
  rose: 'bg-rose-500/10 text-rose-300 ring-rose-400/20',
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatTone;
}

export default function StatCard({ icon: Icon, label, value, hint, tone = 'blue' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-navy-800/60 p-5 shadow-card transition hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-extrabold tabular-nums text-white">{value}</p>
          {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
        </div>
        <span
          aria-hidden
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${TONES[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
