import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-navy-850/40 text-center ${
        compact ? 'p-6' : 'p-8 sm:p-10'
      }`}
    >
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-slate-400 ring-1 ring-white/10"
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className={`mt-4 font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-400 sm:text-[13px]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
