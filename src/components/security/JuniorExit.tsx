import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Hash, LogOut, Search, SearchX } from 'lucide-react';
import type { BackendGatePass, GatePass, JuniorStudent } from '@/types';
import Card from '@/components/common/Card';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import InfoRow from '@/components/common/InfoRow';
import StudentInfoCard from '@/components/common/StudentInfoCard';
import GatePassCard from '@/components/security/GatePassCard';
import { useToast } from '@/context/ToastContext';
import {
  getJuniorGatepassesByRegistration,
  recordJuniorExit,
  recordJuniorExitByRegistration,
  searchJuniorStudents,
} from '@/lib/api';

interface JuniorExitProps {
  onExitRecorded?: () => void;
}

function mapBackendJuniorToGatePass(bgp: BackendGatePass): GatePass {
  const student = bgp.student as JuniorStudent | undefined;
  const teacher = bgp.teacher;
  const createdAtDate = bgp.created_at ? new Date(bgp.created_at) : new Date();

  return {
    id: bgp.id,
    passId: `GP-${bgp.id.slice(0, 8).toUpperCase()}`,
    studentType: 'junior',
    studentId: bgp.student_id,
    teacherId: bgp.teacher_id,
    studentName: student?.name || 'Junior Student',
    registrationNumber: student?.registration_number || student?.registrationNumber || '',
    className: student?.class_name || student?.className || '11th',
    section: student?.section || '',
    reason: bgp.reason,
    teacher: teacher?.name || 'Class Teacher',
    expectedExit: bgp.expires_at ? new Date(bgp.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '4:00 PM',
    status: bgp.status,
    date: createdAtDate.toISOString().slice(0, 10),
    createdAt: bgp.created_at,
    signedLetterUrl: bgp.signed_letter_url,
    exitTime: bgp.exit_time || undefined,
  };
}

export default function JuniorExit({ onExitRecorded }: JuniorExitProps) {
  const toast = useToast();

  // Mode: 'unique-number' or 'registration'
  const [mode, setMode] = useState<'unique-number' | 'registration'>('unique-number');

  // Quick Unique Number Exit state
  const [uniqueInput, setUniqueInput] = useState('');
  const [recordingUniqueExit, setRecordingUniqueExit] = useState(false);
  const [lastUniqueExit, setLastUniqueExit] = useState<{
    studentName: string;
    uniqueNumber: number;
    time: string;
  } | null>(null);

  // Search by Reg Number state
  const [regInput, setRegInput] = useState('');
  const [searchingReg, setSearchingReg] = useState(false);
  const [searchedStudent, setSearchedStudent] = useState<JuniorStudent | null>(null);
  const [searchedGatepass, setSearchedGatepass] = useState<GatePass | null>(null);
  const [regNotFound, setRegNotFound] = useState(false);
  const [regNoPass, setRegNoPass] = useState(false);

  // Confirm dialog
  const [dialogPass, setDialogPass] = useState<GatePass | null>(null);
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);

  // Handle Quick Unique Number Exit (Type & Enter)
  const handleUniqueExitSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const val = uniqueInput.trim();
    if (!val || isNaN(Number(val)) || Number(val) <= 0) {
      toast.error('Invalid Unique Number', 'Please enter a valid positive unique number.');
      return;
    }

    setRecordingUniqueExit(true);
    setLastUniqueExit(null);

    try {
      const num = Number(val);
      const res = await recordJuniorExit(num);
      const exitTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setLastUniqueExit({
        studentName: res.student.name,
        uniqueNumber: num,
        time: exitTimeStr,
      });

      toast.success(
        'Junior Exit Recorded',
        `${res.student.name} (Unique #${num}) marked EXITED at ${exitTimeStr}`
      );

      setUniqueInput('');
      onExitRecorded?.();
    } catch (err: any) {
      console.error('Junior exit by unique number error:', err);
      // Pop error message as required
      toast.error('Exit Failed', err.message || 'Could not record exit for this unique number');
    } finally {
      setRecordingUniqueExit(false);
    }
  };

  // Handle Search by Reg Number
  const handleRegSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const reg = regInput.trim().toUpperCase();
    if (!reg) return;

    setSearchingReg(true);
    setRegNotFound(false);
    setRegNoPass(false);
    setSearchedStudent(null);
    setSearchedGatepass(null);

    try {
      const students = await searchJuniorStudents(reg);
      const matched = students.find((s) => (s.registration_number || s.registrationNumber || '').toUpperCase() === reg) || students[0];

      if (!matched) {
        // Also check if any active gatepass matches
        const passes = await getJuniorGatepassesByRegistration(reg);
        const activePass = passes.find((p) => p.status === 'ACTIVE');
        if (activePass) {
          const pass = mapBackendJuniorToGatePass(activePass);
          const studentObj = activePass.student as JuniorStudent;
          setSearchedStudent(studentObj || {
            id: activePass.student_id,
            name: pass.studentName,
            registration_number: reg,
            class_name: pass.className || '11th',
            section: pass.section || 'A',
          });
          setSearchedGatepass(pass);
          return;
        }

        setRegNotFound(true);
        return;
      }

      setSearchedStudent(matched);

      // Look up strictly active gatepass for this student
      const regToLookup = matched.registration_number || matched.registrationNumber || reg;
      const passes = await getJuniorGatepassesByRegistration(regToLookup);
      const activeOne = passes.find((p) => p.status === 'ACTIVE');
      if (activeOne) {
        setSearchedGatepass(mapBackendJuniorToGatePass(activeOne));
      } else {
        setSearchedGatepass(null);
        setRegNoPass(true);
      }
    } catch (err: any) {
      console.error('Junior reg search error:', err);
      toast.error('Search error', err.message || 'Failed to search junior student gatepass');
      setRegNotFound(true);
    } finally {
      setSearchingReg(false);
    }
  };

  // Mark Exit for Searched Gatepass
  const handleConfirmExit = async () => {
    if (!dialogPass) return;
    setIsSubmittingExit(true);

    try {
      const reg = dialogPass.registrationNumber || searchedStudent?.registration_number || searchedStudent?.registrationNumber;
      if (!reg) throw new Error('Registration number is required');

      const res = await recordJuniorExitByRegistration(reg);
      toast.success(
        'Exit Recorded Successfully',
        `${res.student.name} marked EXITED`
      );

      setDialogPass(null);
      if (searchedGatepass && searchedGatepass.id === dialogPass.id) {
        setSearchedGatepass({
          ...searchedGatepass,
          status: 'EXITED',
          exitTime: new Date().toISOString(),
        });
      }
      onExitRecorded?.();
    } catch (err: any) {
      console.error('Junior reg exit error:', err);
      toast.error('Exit Error', err.message || 'Failed to record exit');
    } finally {
      setIsSubmittingExit(false);
    }
  };

  return (
    <Card
      title="Record Junior Exit"
      description="Record student exits quickly by Unique Number or search by Registration Number to verify active gate pass."
      icon={LogOut}
      action={
        <div className="flex rounded-lg border border-white/10 bg-navy-900/60 p-0.5">
          <button
            type="button"
            onClick={() => setMode('unique-number')}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              mode === 'unique-number'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Unique #
          </button>
          <button
            type="button"
            onClick={() => setMode('registration')}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              mode === 'registration'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Reg No
          </button>
        </div>
      }
    >
      {mode === 'unique-number' ? (
        <div>
          <form onSubmit={handleUniqueExitSubmit} noValidate>
            <label htmlFor="jr-unique-exit" className="label">
              Unique Number (Type & Press Enter)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="jr-unique-exit"
                  type="number"
                  min="1"
                  autoComplete="off"
                  value={uniqueInput}
                  onChange={(e) => setUniqueInput(e.target.value)}
                  placeholder="e.g. 1"
                  className="input pl-10 font-mono text-lg font-semibold"
                />
              </div>
              <button
                type="submit"
                disabled={recordingUniqueExit}
                className="btn-primary shrink-0"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {recordingUniqueExit ? 'Recording...' : 'Mark Exit'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Security guard just writes the unique number and presses Enter to record the exit.
            </p>
          </form>

          <AnimatePresence>
            {lastUniqueExit && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] p-4"
              >
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-semibold">Exit Recorded Successfully</p>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  <strong className="text-white">{lastUniqueExit.studentName}</strong> (Unique #{lastUniqueExit.uniqueNumber}) exited at {lastUniqueExit.time}.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div>
          <form onSubmit={handleRegSearch} noValidate>
            <label htmlFor="jr-reg-search" className="label">
              Registration Number
            </label>
            <div className="flex gap-2">
              <input
                id="jr-reg-search"
                type="text"
                autoComplete="off"
                value={regInput}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setRegInput(val);
                  if (!val.trim()) {
                    setSearchedStudent(null);
                    setSearchedGatepass(null);
                    setRegNotFound(false);
                    setRegNoPass(false);
                  }
                }}
                placeholder="e.g. JUN2026001 or 25BCA076"
                className="input font-mono flex-1 uppercase"
              />
              <button
                type="submit"
                disabled={searchingReg}
                className="btn-primary shrink-0"
              >
                <Search className="h-4 w-4" aria-hidden />
                {searchingReg ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          <div className="mt-5">
            {searchingReg && (
              <div className="py-6 text-center text-sm text-slate-400">Searching records...</div>
            )}

            {regNotFound && !searchingReg && (
              <EmptyState
                compact
                icon={SearchX}
                title="Junior Student Not Found"
                description={`No student or gatepass found matching "${regInput}". Check the registration number and try again.`}
              />
            )}

            {searchedStudent && !searchingReg && (
              <div className="space-y-4">
                <StudentInfoCard
                  name={searchedStudent.name}
                  identifierLabel="Reg No"
                  identifier={searchedStudent.registration_number || searchedStudent.registrationNumber || '—'}
                  chips={[
                    `Class: ${searchedStudent.class_name || searchedStudent.className || '—'}`,
                    `Section: ${searchedStudent.section || '—'}`,
                    searchedStudent.department ? `Dept: ${searchedStudent.department}` : '',
                  ].filter(Boolean)}
                />

                {searchedGatepass ? (
                  <GatePassCard pass={searchedGatepass} onMarkExit={setDialogPass} />
                ) : regNoPass ? (
                  <EmptyState
                    compact
                    icon={LogOut}
                    title="No Active Gate Pass"
                    description="This junior student has no active gate pass created at Reception."
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {dialogPass && (
        <ConfirmDialog
          open
          title={`Mark ${dialogPass.studentName} as exited?`}
          confirmLabel={isSubmittingExit ? 'Marking Exit...' : 'Confirm Exit'}
          onCancel={() => setDialogPass(null)}
          onConfirm={handleConfirmExit}
        >
          <InfoRow layout="inline" label="Student" value={dialogPass.studentName} />
          <InfoRow layout="inline" label="Registration No" value={dialogPass.registrationNumber || searchedStudent?.registration_number || searchedStudent?.registrationNumber || '—'} mono />
          <InfoRow layout="inline" label="Gate Pass Reason" value={dialogPass.reason} />
          <InfoRow layout="inline" label="Teacher" value={dialogPass.teacher} />
        </ConfirmDialog>
      )}
    </Card>
  );
}
