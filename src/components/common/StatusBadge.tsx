import type { ActivityStatus, GatePassStatus } from '@/types';

type BadgeStatus = GatePassStatus | ActivityStatus;

const STYLES: Record<string, { label: string; className: string; dot: string; pulse?: boolean }> = {
  ACTIVE: {
    label: 'Active',
    className: 'border-blue-400/25 bg-blue-500/10 text-blue-300',
    dot: 'bg-blue-400',
    pulse: true,
  },
  EXITED: {
    label: 'Exited',
    className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  USED: {
    label: 'Used',
    className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'border-amber-400/25 bg-amber-500/10 text-amber-300',
    dot: 'bg-amber-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'border-rose-400/25 bg-rose-500/10 text-rose-300',
    dot: 'bg-rose-400',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  REGISTERED: {
    label: 'Registered',
    className: 'border-sky-400/25 bg-sky-500/10 text-sky-300',
    dot: 'bg-sky-400',
  },
};

interface StatusBadgeProps {
  status: BadgeStatus | string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const style = STYLES[status] || STYLES.ACTIVE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${style.className} ${className}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${style.dot} ${style.pulse ? 'animate-pulse' : ''}`}
      />
      {style.label}
    </span>
  );
}
