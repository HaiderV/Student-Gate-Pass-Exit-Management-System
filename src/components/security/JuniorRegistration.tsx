import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, CheckCircle2, UserPlus, X } from 'lucide-react';
import type { JuniorStudent } from '@/types';
import Card from '@/components/common/Card';
import { useToast } from '@/context/ToastContext';
import { assignJuniorUniqueNumber } from '@/lib/api';

export default function JuniorRegistration({ onAssigned }: { onAssigned?: () => void }) {
  const toast = useToast();

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [assignedData, setAssignedData] = useState<{
    uniqueNumber: number;
    student: JuniorStudent;
  } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reg = registrationNumber.trim();
    if (!reg) {
      toast.error('Missing Registration Number', 'Please enter the junior student registration number.');
      return;
    }

    setLoading(true);
    try {
      const res = await assignJuniorUniqueNumber(reg);
      const uNum =
        typeof res.uniqueNumber === 'number'
          ? res.uniqueNumber
          : (res.uniqueNumber as any)?.unique_number ?? 0;

      setAssignedData({
        uniqueNumber: uNum,
        student: res.student,
      });

      toast.success(res.message || 'Unique number assigned', `Student: ${res.student.name} · Number: ${uNum}`);
      setRegistrationNumber('');
      onAssigned?.();
    } catch (err: any) {
      console.error('Assign unique number error:', err);
      toast.error('Assignment Error', err.message || 'Failed to assign unique number');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCard = () => {
    setAssignedData(null);
  };

  return (
    <Card
      title="Assign Junior Unique Number"
      description="Enter the junior student's registration number to generate or retrieve their assigned unique number."
      icon={UserPlus}
    >
      <AnimatePresence mode="wait">
        {assignedData ? (
          <motion.div
            key="assigned-result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative rounded-xl border border-emerald-400/30 bg-emerald-500/[0.08] p-5 shadow-lg"
          >
            {/* Cross Button to return to previous UI */}
            <button
              type="button"
              aria-label="Close assigned number view"
              onClick={handleCloseCard}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">Unique Number Assigned</p>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-navy-900/80 p-5 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Assigned Number
              </p>
              <p className="mt-1 font-display text-6xl font-black tabular-nums text-sky-300">
                {assignedData.uniqueNumber}
              </p>
              <p className="mt-3 text-base font-bold text-white">
                {assignedData.student.name}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-400">
                Reg No: {assignedData.student.registration_number}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className="chip text-xs">
                  Class: {assignedData.student.class_name || assignedData.student.className || '—'}
                </span>
                <span className="chip text-xs">
                  Sec: {assignedData.student.section || '—'}
                </span>
                {assignedData.student.department && (
                  <span className="chip text-xs">
                    Dept: {assignedData.student.department}
                  </span>
                )}
                {assignedData.student.board && (
                  <span className="chip text-xs">
                    Board: {assignedData.student.board}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                The student can now use this number for gate exit.
              </p>
              <button
                type="button"
                onClick={handleCloseCard}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                Done (Close)
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="jr-reg-assign" className="label">
                Registration number
              </label>
              <div className="flex gap-2">
                <input
                  id="jr-reg-assign"
                  type="text"
                  autoComplete="off"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. JUN2026001 or 25BCA076"
                  className="input font-mono flex-1 uppercase"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary shrink-0"
                >
                  <BadgeCheck className="h-4 w-4" aria-hidden />
                  {loading ? 'Assigning...' : 'Create / Assign'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                System will find the student, check existing assignment, or generate the next available number.
              </p>
            </div>
          </form>
        )}
      </AnimatePresence>
    </Card>
  );
}
