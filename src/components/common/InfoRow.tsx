interface InfoRowProps {
  label: string;
  value: string;
  /** stacked: label above value (used in cards) — inline: label left, value right (used in dialogs). */
  layout?: 'stacked' | 'inline';
  mono?: boolean;
  className?: string;
}

export default function InfoRow({ label, value, layout = 'stacked', mono = false, className = '' }: InfoRowProps) {
  if (layout === 'inline') {
    return (
      <div
        className={`flex items-center justify-between gap-4 rounded-lg border border-white/[0.06] bg-navy-900/60 px-3.5 py-2.5 ${className}`}
      >
        <span className="shrink-0 text-xs text-slate-400">{label}</span>
        <span
          className={`truncate text-right text-sm font-medium text-slate-100 ${mono ? 'font-mono text-[13px]' : ''}`}
          title={value}
        >
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-1 truncate text-sm font-medium text-slate-200 ${mono ? 'font-mono text-[13px]' : ''}`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
