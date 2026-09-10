import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ClipboardList, LogOut, SearchX, TriangleAlert } from 'lucide-react';
import Card from '@/components/common/Card';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import InfoRow from '@/components/common/InfoRow';
import SearchBar from '@/components/common/SearchBar';
import StudentInfoCard from '@/components/common/StudentInfoCard';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { nowTime12 } from '@/lib/format';
import { findJuniorStudent, type JuniorStudentProfile } from '@/lib/students';

/**
 * Section 2 of the Junior Security page — search by unique number and
 * record a normal exit (juniors have no IN/OUT tracking, exit only).
 */
export default function JuniorExit() {
  const { state, recordJuniorExit } = useApp();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [student, setStudent] = useState<JuniorStudentProfile | null>(null);
  const [exitedAt, setExitedAt] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const activePassForStudent = student
    ? state.gatePasses.find(
        (p) => p.studentType === 'junior' && p.uniqueNumber === student.uniqueNumber && p.status === 'ACTIVE',
      )
    : undefined;

  const handleSearch = () => {
    const found = findJuniorStudent(state.juniorStudents, state.gatePasses, query);
    setSearched(true);
    setNotFound(found === null);
    setStudent(found);
    setExitedAt(null);
  };

  const handleConfirmExit = () => {
    if (!student) return;
    recordJuniorExit(student.id);
    const time = nowTime12();
    setExitedAt(time);
    setDialogOpen(false);
    toast.success('Exit recorded successfully', `${student.name} · ${time}`);
  };

  const dialog = (
    <ConfirmDialog
      open={dialogOpen}
      title={student ? `Mark ${student.name} as exited?` : 'Mark student as exited?'}
      description="Junior exits are recorded once — there is no return tracking."
      confirmLabel="Confirm Exit"
      onCancel={() => setDialogOpen(false)}
      onConfirm={handleConfirmExit}
    >
      {student && (
        <>
          <InfoRow layout="inline" label="Unique Number" value={String(student.uniqueNumber)} mono />
          {activePassForStudent && (
            <>
              <InfoRow layout="inline" label="Gate Pass" value={activePassForStudent.reason} />
              <InfoRow layout="inline" label="Expected Exit" value={activePassForStudent.expectedExit} />
            </>
          )}
        </>
      )}
    </ConfirmDialog>
  );

  return (
    <Card
      title="Record Junior Exit"
      description="Enter the student's unique number at the gate to record their exit."
      icon={LogOut}
    >
      <SearchBar
        label="Unique Number"
        placeholder="e.g. 23"
        value={query}
        onChange={(value) => {
          setQuery(value);
          setExitedAt(null);
        }}
        onSubmit={handleSearch}
        numeric
        hint="Short numeric number issued when the student was registered."
      />

      <div className="mt-5">
        {notFound && (
          <EmptyState
            compact
            icon={SearchX}
            title="Student Not Found"
            description="No junior student was found with this unique number. Check the number and try again."
          />
        )}

        {student && (
          <AnimatePresence mode="wait">
            {exitedAt ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.07] p-5"
                role="status"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <CheckCircle2 className="h-[18px] w-[18px]" aria-hidden />
                  Exit Recorded
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  <span className="font-medium text-white">{student.name}</span> left the campus at{' '}
                  <span className="font-semibold text-white">{exitedAt}</span>.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="found"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-3.5"
              >
                <StudentInfoCard
                  name={student.name}
                  identifierLabel="Unique No"
                  identifier={String(student.uniqueNumber)}
                  chips={[`Class: ${student.className}`, `Section: ${student.section}`]}
                />
                {activePassForStudent && (
                  <p className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-500/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-amber-200/90">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    This student also has an active early-exit gate pass ({activePassForStudent.reason},
                    expected {activePassForStudent.expectedExit}) listed below.
                  </p>
                )}
                <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
                  <LogOut className="h-4 w-4" aria-hidden />
                  Mark as Exited
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {!searched && (
          <EmptyState
            compact
            icon={ClipboardList}
            title="Search a Unique Number"
            description="Enter the junior student's unique number above to view their details and record the exit."
          />
        )}
      </div>

      {dialog}
    </Card>
  );
}
