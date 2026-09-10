import { useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, CheckCircle2, UserPlus } from 'lucide-react';
import type { JuniorClass, JuniorStudent } from '@/types';
import { SECTION_OPTIONS } from '@/types';
import Card from '@/components/common/Card';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { nextAvailableNumber } from '@/lib/students';

const CLASS_OPTIONS: JuniorClass[] = ['11th', '12th'];

/** Section 1 of the Junior Security page — assign a short numeric unique number. */
export default function JuniorRegistration() {
  const { state, registerJuniorStudent } = useApp();
  const toast = useToast();

  const [name, setName] = useState('');
  const [className, setClassName] = useState<JuniorClass>('11th');
  const [section, setSection] = useState<string>('A');
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [registered, setRegistered] = useState<JuniorStudent | null>(null);

  const nextNumber = useMemo(
    () => nextAvailableNumber(state.juniorStudents),
    [state.juniorStudents],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: { name?: string } = {};
    if (name.trim().length < 3) {
      nextErrors.name = "Enter the student's full name";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    const student = registerJuniorStudent({ name: name.trim(), className, section });
    setRegistered(student);
    setName('');
    toast.success('Student registered successfully', `Unique Number: ${student.uniqueNumber}`);
  };

  return (
    <Card
      title="Register Junior Student"
      description="Assign a short numeric unique number to a junior student (11th / 12th). Numbers are generated automatically."
      icon={UserPlus}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="jr-name" className="label">
              Student name
            </label>
            <input
              id="jr-name"
              type="text"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ann Mary Joseph"
              aria-invalid={Boolean(errors.name)}
              className={`input ${errors.name ? 'input-error' : ''}`}
            />
            {errors.name && <p className="mt-1.5 text-xs text-rose-400">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="jr-class" className="label">
              Class
            </label>
            <select
              id="jr-class"
              value={className}
              onChange={(e) => setClassName(e.target.value as JuniorClass)}
              className="input"
            >
              {CLASS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="jr-section" className="label">
              Section
            </label>
            <select
              id="jr-section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="input"
            >
              {SECTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Section {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary mt-5 w-full sm:w-auto">
          <BadgeCheck className="h-4 w-4" aria-hidden />
          Generate Unique Number
        </button>
        <p className="mt-2.5 text-xs text-slate-500">
          Next available number:{' '}
          <span className="font-mono font-semibold text-slate-300">{nextNumber}</span> — generated
          automatically, no manual numbering.
        </p>
      </form>

      {registered && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.07] p-5"
          role="status"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <CheckCircle2 className="h-[18px] w-[18px]" aria-hidden />
            Student registered successfully
          </p>
          <div className="mt-4 rounded-lg border border-white/10 bg-navy-900/70 px-4 py-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Unique Number
            </p>
            <p className="mt-1 font-display text-6xl font-extrabold tabular-nums text-sky-300">
              {registered.uniqueNumber}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-200">
              {registered.name} · {registered.className} · Section {registered.section}
            </p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Share this number with the student — it is what they will use at the gate for exit
            verification.
          </p>
        </motion.div>
      )}
    </Card>
  );
}
