import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional subtitle rendered under the title */
  subtitle?: string;
  /** Max-width tailwind class, default "max-w-md" */
  maxWidth?: string;
  children: ReactNode;
}

/**
 * Polished modal overlay:
 * - z-[200] — always above navbar, footer, confirm-dialogs
 * - Locks body scroll while open
 * - Animated backdrop + card
 * - Accessible (Escape closes)
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-md',
  children,
}: ModalProps) {
  // Lock body scroll and listen for Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        /* ── Backdrop ── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          {/* dark vignette layer */}
          <div className="absolute inset-0 bg-[#030c1a]/80" />

          {/* ── Card ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 w-full ${maxWidth} rounded-2xl border border-white/[0.12] bg-[#0b1829] p-6 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)] max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* gradient top-bar accent */}
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-white leading-tight">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
