import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  description: string;
  /** Optional right-aligned actions (e.g. date chip). */
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, eyebrowIcon: Icon, title, description, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-300/90">
          {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-[15px]">{description}</p>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </motion.div>
  );
}
