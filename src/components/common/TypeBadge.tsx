import type { StudentType } from '@/types';

interface TypeBadgeProps {
  type: StudentType;
  className?: string;
}

const STYLES: Record<StudentType, { label: string; className: string }> = {
  degree: { label: 'Degree', className: 'border-blue-400/25 bg-blue-500/10 text-blue-300' },
  junior: { label: 'Junior', className: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-300' },
};

export default function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  const style = STYLES[type];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${style.className} ${className}`}
    >
      {style.label}
    </span>
  );
}
