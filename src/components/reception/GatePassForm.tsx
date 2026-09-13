import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Search,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import type { DegreeStudent, GatePass, JuniorStudent, StudentType, Teacher } from '@/types';
import { REASON_OPTIONS } from '@/types';
import Card from '@/components/common/Card';
import StatusBadge from '@/components/common/StatusBadge';
import { useToast } from '@/context/ToastContext';
import {
  createDegreeGatepass,
  createJuniorGatepass,
  getDegreeStudents,
  getJuniorStudents,
  getTeachers,
  searchDegreeStudents,
  searchJuniorStudents,
} from '@/lib/api';

interface GatePassFormProps {
  variant: StudentType;
  onPassCreated?: () => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function GatePassForm({ variant, onPassCreated }: GatePassFormProps) {
  const toast = useToast();
  const isDegree = variant === 'degree';

  // State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Student search / select
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [studentSearchResults, setStudentSearchResults] = useState<(DegreeStudent | JuniorStudent)[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<DegreeStudent | JuniorStudent | null>(null);

  // Form Fields
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [reason, setReason] = useState<string>(REASON_OPTIONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdPass, setCreatedPass] = useState<GatePass | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch teachers for current variant
  useEffect(() => {
    let active = true;
    async function loadTeachers() {
      setLoadingTeachers(true);
      try {
        const data = await getTeachers(isDegree ? 'DEGREE' : 'JUNIOR');
        if (active) {
          setTeachers(data);
          if (data.length > 0) {
            setSelectedTeacherId(data[0].id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load teachers:', err);
      } finally {
        if (active) setLoadingTeachers(false);
      }
    }
    loadTeachers();
    return () => {
      active = false;
    };
  }, [isDegree]);

  // Load initial students preview
  useEffect(() => {
    let active = true;
    async function loadInitialStudents() {
      try {
        const data = isDegree ? await getDegreeStudents() : await getJuniorStudents();
        if (active && data.length > 0 && !selectedStudent) {
          setStudentSearchResults(data.slice(0, 5));
        }
      } catch (err) {
        // ignore
      }
    }
    loadInitialStudents();
    return () => {
      active = false;
    };
  }, [isDegree]);

  // Handle student search
  const handleStudentSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setStudentSearchResults([]);
      return;
    }
    setSearchingStudents(true);
    try {
      const results = isDegree ? await searchDegreeStudents(q) : await searchJuniorStudents(q);
      setStudentSearchResults(results);
      if (results.length === 1) {
        setSelectedStudent(results[0]);
      }
    } catch (err: any) {
      console.error('Student search error:', err);
    } finally {
      setSearchingStudents(false);
    }
  };

  // Handle file selection with <= 5MB validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFileError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (selected.size / (1024 * 1024)).toFixed(2);
      setFileError(`File is ${sizeMB}MB. Must be under 5MB.`);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast.error('File too large', `Selected file exceeds 5MB limit (${sizeMB}MB).`);
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error('Missing Student', 'Please select a student for this gate pass.');
      return;
    }

    if (!selectedTeacherId) {
      toast.error('Missing Teacher', 'Please select a class teacher.');
      return;
    }

    const finalReason = reason === 'Other' ? customReason.trim() || 'Other' : reason;
    if (!finalReason) {
      toast.error('Missing Reason', 'Please specify a reason for leaving.');
      return;
    }

    if (!file) {
      toast.error('Missing Permission Letter', 'Please upload a signed leave letter (PDF or Image under 5MB).');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('student_id', selectedStudent.id);
      formData.append('teacher_id', selectedTeacherId);
      formData.append('reason', finalReason);
      formData.append('signed_letter', file);

      const res = isDegree ? await createDegreeGatepass(formData) : await createJuniorGatepass(formData);

      const passData = res.gatepass;
      const teacherObj = teachers.find((t) => t.id === selectedTeacherId);

      const created: GatePass = {
        id: passData.id,
        passId: `GP-${passData.id.slice(0, 8).toUpperCase()}`,
        studentType: variant,
        studentName: selectedStudent.name,
        section: selectedStudent.section,
        reason: finalReason,
        teacher: teacherObj?.name || 'Class Teacher',
        expectedExit: '4:00 PM',
        status: passData.status,
        date: new Date().toISOString().slice(0, 10),
        createdAt: passData.created_at || new Date().toISOString(),
        signedLetterUrl: passData.signed_letter_url,
        registrationNumber: selectedStudent.registration_number || selectedStudent.registrationNumber,
        course: (selectedStudent as any).course,
        className: (selectedStudent as any).class_name || (selectedStudent as any).className,
      };

      setCreatedPass(created);
      toast.success(res.message || 'Gate pass created successfully', `${created.passId} · ${created.studentName}`);

      // Reset form fields
      setSelectedStudent(null);
      setSearchQuery('');
      setFile(null);
      setFileError(null);
      if (fileRef.current) fileRef.current.value = '';
      setReason(REASON_OPTIONS[0]);
      setCustomReason('');

      onPassCreated?.();
    } catch (err: any) {
      console.error('Failed to create gatepass:', err);
      toast.error('Creation Failed', err.message || 'Failed to create gatepass');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title={`Create ${isDegree ? 'Degree' : 'Junior'} Gate Pass`}
      description={`Verify the student's physical leave letter, attach the document (under 5MB), and issue the gate pass.`}
      icon={ClipboardList}
    >
      <AnimatePresence>
        {createdPass && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.07] p-5"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">Gate Pass Created</p>
                <p className="mt-0.5 text-xs text-slate-300">
                  This pass is now active and immediately visible to Security at the gate.
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
                className="rounded-md p-1 text-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate>
        {/* --- 1. Student Selection --- */}
        <section aria-labelledby="student-select-heading">
          <h3 id="student-select-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
            <UserRound className="h-4 w-4 text-blue-300" />
            1. Select Student
          </h3>

          {selectedStudent ? (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-sky-400" />
                  <p className="font-bold text-white">{selectedStudent.name}</p>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-300">
                  Reg No: {selectedStudent.registration_number || selectedStudent.registrationNumber} ·{' '}
                  {isDegree
                    ? `${(selectedStudent as DegreeStudent).course} · ${(selectedStudent as DegreeStudent).year} · Sec ${selectedStudent.section}`
                    : `${(selectedStudent as JuniorStudent).class_name || (selectedStudent as JuniorStudent).className} · Sec ${selectedStudent.section}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                Change Student
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleStudentSearch())}
                    placeholder={`Search ${isDegree ? 'degree' : 'junior'} student by name or reg number...`}
                    className="input pr-10 font-mono uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleStudentSearch}
                  disabled={searchingStudents}
                  className="btn-secondary shrink-0"
                >
                  <Search className="h-4 w-4" />
                  {searchingStudents ? 'Searching...' : 'Search'}
                </button>
              </div>

              {studentSearchResults.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-navy-900/80 p-2 max-h-48 overflow-y-auto space-y-1">
                  <p className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase">
                    Select a matching student:
                  </p>
                  {studentSearchResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStudent(s)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <span className="font-medium text-white">{s.name}</span>
                        <span className="ml-2 font-mono text-slate-400">({s.registration_number || s.registrationNumber})</span>
                      </div>
                      <span className="text-slate-400">
                        {isDegree
                          ? `${(s as DegreeStudent).course} · ${(s as DegreeStudent).year}`
                          : `${(s as JuniorStudent).class_name || (s as JuniorStudent).className} (${s.section})`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* --- 2. Teacher Selection --- */}
        <section aria-labelledby="teacher-select-heading" className="mt-6 border-t border-white/[0.05] pt-5">
          <h3 id="teacher-select-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
            <BadgeCheck className="h-4 w-4 text-blue-300" />
            2. Class Teacher
          </h3>
          <div className="mt-3">
            {loadingTeachers ? (
              <p className="text-xs text-slate-400">Loading {isDegree ? 'Degree' : 'Junior'} teachers...</p>
            ) : teachers.length === 0 ? (
              <p className="text-xs text-rose-400">No {isDegree ? 'Degree' : 'Junior'} teachers registered yet in Admin.</p>
            ) : (
              <div>
                <label htmlFor="gp-teacher-select" className="label">
                  Assigned Teacher (Signed Permission)
                </label>
                <select
                  id="gp-teacher-select"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="input"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.department ? `(${t.department})` : ''} - {t.teaching_level}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* --- 3. Reason & Upload --- */}
        <section aria-labelledby="pass-details-heading" className="mt-6 border-t border-white/[0.05] pt-5">
          <h3 id="pass-details-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
            <ClipboardList className="h-4 w-4 text-blue-300" />
            3. Reason & Signed Letter (under 5MB)
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gp-reason-select" className="label">
                Reason for Early Exit
              </label>
              <select
                id="gp-reason-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input"
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {reason === 'Other' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Specify custom reason..."
                  className="input mt-2"
                />
              )}
            </div>

            <div>
              <label className="label">Signed Letter / Proof (PDF or Image &lt; 5MB)</label>
              <input
                ref={fileRef}
                id="gp-file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="sr-only"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </button>
                {file ? (
                  <span className="chip max-w-full border-emerald-400/25 bg-emerald-500/[0.07] text-emerald-200">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="max-w-[180px] truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      aria-label="Remove file"
                      className="rounded p-0.5 hover:text-white"
                      onClick={() => {
                        setFile(null);
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">PDF, JPG, PNG under 5MB</span>
                )}
              </div>
              {fileError && <p className="mt-1.5 text-xs text-rose-400">{fileError}</p>}
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-col gap-3 border-t border-white/[0.05] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Pass is created with ACTIVE status and becomes available at Security immediately.
          </p>
          <button
            type="submit"
            disabled={submitting || !selectedStudent || !file}
            className="btn-primary w-full sm:w-auto"
          >
            <ClipboardList className="h-4 w-4" />
            {submitting ? 'Creating Gate Pass...' : 'Create Gate Pass'}
          </button>
        </div>
      </form>
    </Card>
  );
}
