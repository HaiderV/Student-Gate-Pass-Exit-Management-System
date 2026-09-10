import { useMemo, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import type { GatePass, JuniorClass, StudentType } from '@/types';
import { REASON_OPTIONS, SECTION_OPTIONS, YEAR_OPTIONS } from '@/types';
import Card from '@/components/common/Card';
import StatusBadge from '@/components/common/StatusBadge';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { timeAfterMinutes, to12Hour } from '@/lib/format';
import { findDegreeStudent, findJuniorStudent } from '@/lib/students';

interface FormState {
  registrationNumber: string;
  uniqueNumber: string;
  studentName: string;
  course: string;
  year: string;
  className: JuniorClass;
  section: string;
  reason: string;
  expectedExit: string;
  teacher: string;
}

const initialForm = (): FormState => ({
  registrationNumber: '',
  uniqueNumber: '',
  studentName: '',
  course: '',
  year: '1st Year',
  className: '11th',
  section: 'A',
  reason: 'Medical',
  expectedExit: timeAfterMinutes(45),
  teacher: '',
});

interface GatePassFormProps {
  variant: StudentType;
}

const COPY: Record<StudentType, { title: string; description: string }> = {
  degree: {
    title: 'Create Gate Pass',
    description:
      "Verify the student's physical permission letter signed by the class teacher, then create the digital gate pass.",
  },
  junior: {
    title: 'Create Gate Pass',
    description:
      "Verify the junior student's physical permission, then create the early-exit gate pass for security.",
  },
};

/**
 * Reusable gate pass creation form used by both reception portals.
 * The only difference is the student context (degree vs junior).
 */
export default function GatePassForm({ variant }: GatePassFormProps) {
  const { state, createGatePass } = useApp();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(initialForm);
  const [proofName, setProofName] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [matched, setMatched] = useState(false);
  const [createdPass, setCreatedPass] = useState<GatePass | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const copy = COPY[variant];
  const isDegree = variant === 'degree';

  const lookupHint = useMemo(() => {
    if (isDegree) {
      const known = form.registrationNumber.trim()
        ? findDegreeStudent(state.degreeStudents, state.gatePasses, form.registrationNumber)
        : null;
      return known
        ? 'Matched from student records — details filled automatically.'
        : form.registrationNumber.trim()
          ? 'Not in records — fill the student details manually.'
          : 'Enter the registration number to auto-fill student details.';
    }
    const known = form.uniqueNumber.trim()
      ? findJuniorStudent(state.juniorStudents, state.gatePasses, form.uniqueNumber)
      : null;
    return known
      ? 'Matched from junior records — details filled automatically.'
      : form.uniqueNumber.trim()
        ? 'Not in records — fill the student details manually.'
        : 'Enter the unique number to auto-fill student details.';
  }, [form.registrationNumber, form.uniqueNumber, isDegree, state.degreeStudents, state.gatePasses, state.juniorStudents]);

  /** Prefill student details when the identifier matches known records. */
  const handleLookup = () => {
    if (isDegree) {
      const found = findDegreeStudent(state.degreeStudents, state.gatePasses, form.registrationNumber);
      if (found) {
        setForm((prev) => ({
          ...prev,
          studentName: found.name,
          course: found.course,
          year: found.year,
          section: found.section,
        }));
        setMatched(true);
        return;
      }
    } else {
      const found = findJuniorStudent(state.juniorStudents, state.gatePasses, form.uniqueNumber);
      if (found) {
        setForm((prev) => ({
          ...prev,
          studentName: found.name,
          className: (found.className === '12th' ? '12th' : '11th') as JuniorClass,
          section: found.section,
        }));
        setMatched(true);
        return;
      }
    }
    setMatched(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (isDegree) {
      if (!form.registrationNumber.trim()) nextErrors.registrationNumber = 'Registration number is required';
      if (!form.studentName.trim()) nextErrors.studentName = 'Student name is required';
      if (!form.course.trim()) nextErrors.course = 'Course is required';
    } else {
      if (!form.uniqueNumber.trim()) nextErrors.uniqueNumber = 'Unique number is required';
      if (!form.studentName.trim()) nextErrors.studentName = 'Student name is required';
    }
    if (!form.reason) nextErrors.reason = 'Select a reason';
    if (!form.expectedExit) nextErrors.expectedExit = 'Set the expected exit time';
    if (!form.teacher.trim()) nextErrors.teacher = "Class teacher's name is required";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error('Missing information', 'Complete the highlighted fields before creating the pass.');
      return;
    }
    setErrors({});

    const pass = createGatePass({
      studentType: variant,
      studentName: form.studentName.trim(),
      section: form.section,
      reason: form.reason,
      teacher: form.teacher.trim(),
      expectedExit: to12Hour(form.expectedExit),
      teacherProof: proofName ?? undefined,
      registrationNumber: isDegree ? form.registrationNumber.trim().toUpperCase() : undefined,
      course: isDegree ? form.course.trim() : undefined,
      year: isDegree ? form.year : undefined,
      uniqueNumber: isDegree ? undefined : Number(form.uniqueNumber),
      className: isDegree ? undefined : form.className,
    });

    setCreatedPass(pass);
    setForm(initialForm());
    setProofName(null);
    setMatched(false);
    toast.success('Gate pass created successfully', `${pass.passId} · ${pass.studentName}`);
  };

  return (
    <Card title={copy.title} description={copy.description} icon={ClipboardList}>
      <AnimatePresence>
        {createdPass && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="status"
            className="mb-6 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.07] p-5"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">Gate Pass Created</p>
                <p className="mt-0.5 text-xs text-slate-300 sm:text-sm">
                  The pass is now visible to Security for verification.
                </p>
                <dl className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/[0.08] bg-navy-900/60 px-3.5 py-2.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Gate Pass ID</dt>
                    <dd className="mt-0.5 font-mono text-[13px] font-semibold text-white">{createdPass.passId}</dd>
                  </div>
                  <div className="rounded-lg border border-white/[0.08] bg-navy-900/60 px-3.5 py-2.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Student</dt>
                    <dd className="mt-0.5 truncate text-[13px] font-medium text-slate-100">{createdPass.studentName}</dd>
                  </div>
                  <div className="rounded-lg border border-white/[0.08] bg-navy-900/60 px-3.5 py-2.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</dt>
                    <dd className="mt-0.5">
                      <StatusBadge status={createdPass.status} />
                    </dd>
                  </div>
                </dl>
                <button type="button" className="btn-secondary mt-4" onClick={() => setCreatedPass(null)}>
                  Create Another Pass
                </button>
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setCreatedPass(null)}
                className="rounded-md p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate>
        {/* --- Student information --- */}
        <section aria-labelledby="student-info-heading">
          <h3 id="student-info-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
            <UserRound className="h-4 w-4 text-blue-300" aria-hidden />
            Student Information
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {isDegree ? (
              <div>
                <label htmlFor="gp-reg" className="label">
                  Registration number
                </label>
                <input
                  id="gp-reg"
                  type="text"
                  autoComplete="off"
                  value={form.registrationNumber}
                  onChange={(e) => {
                    setField('registrationNumber', e.target.value);
                    setMatched(false);
                  }}
                  onBlur={handleLookup}
                  placeholder="e.g. 23BCA1045"
                  aria-invalid={Boolean(errors.registrationNumber)}
                  className={`input font-mono ${errors.registrationNumber ? 'input-error' : ''}`}
                />
                {errors.registrationNumber && (
                  <p className="mt-1.5 text-xs text-rose-400">{errors.registrationNumber}</p>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="gp-uniq" className="label">
                  Unique number
                </label>
                <input
                  id="gp-uniq"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.uniqueNumber}
                  onChange={(e) => {
                    setField('uniqueNumber', e.target.value.replace(/\D/g, ''));
                    setMatched(false);
                  }}
                  onBlur={handleLookup}
                  placeholder="e.g. 23"
                  aria-invalid={Boolean(errors.uniqueNumber)}
                  className={`input font-mono ${errors.uniqueNumber ? 'input-error' : ''}`}
                />
                {errors.uniqueNumber && <p className="mt-1.5 text-xs text-rose-400">{errors.uniqueNumber}</p>}
              </div>
            )}

            <div>
              <label htmlFor="gp-name" className="label">
                Student name
              </label>
              <input
                id="gp-name"
                type="text"
                autoComplete="off"
                value={form.studentName}
                onChange={(e) => setField('studentName', e.target.value)}
                placeholder="Full name"
                aria-invalid={Boolean(errors.studentName)}
                className={`input ${errors.studentName ? 'input-error' : ''}`}
              />
              {errors.studentName && <p className="mt-1.5 text-xs text-rose-400">{errors.studentName}</p>}
            </div>

            {isDegree ? (
              <>
                <div>
                  <label htmlFor="gp-course" className="label">
                    Course
                  </label>
                  <input
                    id="gp-course"
                    type="text"
                    autoComplete="off"
                    value={form.course}
                    onChange={(e) => setField('course', e.target.value)}
                    placeholder="e.g. BCA"
                    aria-invalid={Boolean(errors.course)}
                    className={`input ${errors.course ? 'input-error' : ''}`}
                  />
                  {errors.course && <p className="mt-1.5 text-xs text-rose-400">{errors.course}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="gp-year" className="label">
                      Year
                    </label>
                    <select
                      id="gp-year"
                      value={form.year}
                      onChange={(e) => setField('year', e.target.value)}
                      className="input"
                    >
                      {YEAR_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="gp-section" className="label">
                      Section
                    </label>
                    <select
                      id="gp-section"
                      value={form.section}
                      onChange={(e) => setField('section', e.target.value)}
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
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="gp-class" className="label">
                    Class
                  </label>
                  <select
                    id="gp-class"
                    value={form.className}
                    onChange={(e) => setField('className', e.target.value as JuniorClass)}
                    className="input"
                  >
                    <option value="11th">11th</option>
                    <option value="12th">12th</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gp-section" className="label">
                    Section
                  </label>
                  <select
                    id="gp-section"
                    value={form.section}
                    onChange={(e) => setField('section', e.target.value)}
                    className="input"
                  >
                    {SECTION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        Section {option}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          <p
            className={`mt-2.5 flex items-center gap-1.5 text-xs ${
              matched ? 'text-emerald-300/90' : 'text-slate-500'
            }`}
          >
            {matched && <BadgeCheck className="h-3.5 w-3.5" aria-hidden />}
            {lookupHint}
          </p>
        </section>

        {/* --- Gate pass information --- */}
        <section aria-labelledby="pass-info-heading" className="mt-7 border-t border-white/[0.05] pt-6">
          <h3 id="pass-info-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
            <ClipboardList className="h-4 w-4 text-blue-300" aria-hidden />
            Gate Pass Information
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gp-reason" className="label">
                Reason for leaving
              </label>
              <select
                id="gp-reason"
                value={form.reason}
                onChange={(e) => setField('reason', e.target.value)}
                aria-invalid={Boolean(errors.reason)}
                className={`input ${errors.reason ? 'input-error' : ''}`}
              >
                {REASON_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.reason && <p className="mt-1.5 text-xs text-rose-400">{errors.reason}</p>}
            </div>
            <div>
              <label htmlFor="gp-exit" className="label">
                Expected exit time
              </label>
              <input
                id="gp-exit"
                type="time"
                value={form.expectedExit}
                onChange={(e) => setField('expectedExit', e.target.value)}
                aria-invalid={Boolean(errors.expectedExit)}
                className={`input ${errors.expectedExit ? 'input-error' : ''}`}
              />
              {errors.expectedExit && <p className="mt-1.5 text-xs text-rose-400">{errors.expectedExit}</p>}
            </div>
          </div>
        </section>

        {/* --- Teacher verification --- */}
        <section aria-labelledby="teacher-heading" className="mt-7 border-t border-white/[0.05] pt-6">
          <h3 id="teacher-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
            <BadgeCheck className="h-4 w-4 text-blue-300" aria-hidden />
            Teacher Verification
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            The college's physical permission process stays the same — verify the signed letter from the class
            teacher before issuing the pass. No online teacher approval is required.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gp-teacher" className="label">
                Class teacher
              </label>
              <input
                id="gp-teacher"
                type="text"
                autoComplete="off"
                value={form.teacher}
                onChange={(e) => setField('teacher', e.target.value)}
                placeholder="e.g. Prof. Anil Kumar"
                aria-invalid={Boolean(errors.teacher)}
                className={`input ${errors.teacher ? 'input-error' : ''}`}
              />
              {errors.teacher && <p className="mt-1.5 text-xs text-rose-400">{errors.teacher}</p>}
            </div>
            <div>
              <span className="label">Teacher proof</span>
              <input
                ref={fileRef}
                id="gp-proof"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(e) => setProofName(e.target.files?.[0]?.name ?? null)}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" aria-hidden />
                  Choose File
                </button>
                {proofName ? (
                  <span className="chip max-w-full border-emerald-400/25 bg-emerald-500/[0.07] text-emerald-200">
                    <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="max-w-[180px] truncate">{proofName}</span>
                    <button
                      type="button"
                      aria-label="Remove selected file"
                      className="rounded p-0.5 transition hover:text-white"
                      onClick={() => {
                        setProofName(null);
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Signed permission letter (PDF or image)</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-col gap-3 border-t border-white/[0.05] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">The pass becomes visible to Security immediately.</p>
          <button type="submit" className="btn-primary w-full sm:w-auto">
            <ClipboardList className="h-4 w-4" aria-hidden />
            Create Gate Pass
          </button>
        </div>
      </form>
    </Card>
  );
}
