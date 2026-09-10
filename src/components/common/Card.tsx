import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface CardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  /** Optional element rendered on the right side of the header. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function Card({
  title,
  description,
  icon: Icon,
  action,
  children,
  className = '',
  bodyClassName = 'p-5 sm:p-6',
}: CardProps) {
  return (
    <section
      className={`rounded-xl border border-white/[0.07] bg-navy-800/60 shadow-card backdrop-blur-[2px] ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.05] px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-start gap-3.5">
            {Icon && (
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300 ring-1 ring-blue-400/20">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
            )}
            <div>
              <h2 className="font-display text-base font-bold text-white sm:text-lg">{title}</h2>
              {description && <p className="mt-0.5 max-w-xl text-xs text-slate-400 sm:text-[13px]">{description}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
