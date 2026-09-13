import { useEffect, useState } from 'react';
import { ClipboardList, LogOut, SearchX, ShieldCheck } from 'lucide-react';
import type { BackendGatePass, GatePass, JuniorStudent } from '@/types';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/common/Card';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import InfoRow from '@/components/common/InfoRow';
import SearchBar from '@/components/common/SearchBar';
import StudentInfoCard from '@/components/common/StudentInfoCard';
import GatePassCard from '@/components/security/GatePassCard';
import RecentGatePasses from '@/components/security/RecentGatePasses';
import JuniorRegistration from '@/components/security/JuniorRegistration';
import JuniorExit from '@/components/security/JuniorExit';
import { useToast } from '@/context/ToastContext';
import {
  getJuniorGatepasses,
  getJuniorGatepassesByRegistration,
  recordJuniorExitByRegistration,
  searchJuniorStudents,
} from '@/lib/api';

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
    registrationNumber: student?.registration_number || '',
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

export default function JuniorSecurity() {
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passes, setPasses] = useState<GatePass[]>([]);
  
  const [searchedStudent, setSearchedStudent] = useState<JuniorStudent | null>(null);
  const [searchedGatepass, setSearchedGatepass] = useState<GatePass | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [noPassFound, setNoPassFound] = useState(false);

  const [dialogPass, setDialogPass] = useState<GatePass | null>(null);
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const data = await getJuniorGatepasses();
      setPasses(data.map(mapBackendJuniorToGatePass));
    } catch (err: any) {
      console.error('Failed to fetch junior passes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const activePasses = passes.filter((p) => p.status === 'ACTIVE');

  const handleSearch = async () => {
    const reg = query.trim().toUpperCase();
    if (!reg) return;

    setSearching(true);
    setNotFound(false);
    setNoPassFound(false);
    setSearchedStudent(null);
    setSearchedGatepass(null);

    try {
      // 1. Search student
      const students = await searchJuniorStudents(reg);
      const matchedStudent = students.find(
        (s) => (s.registration_number || s.registrationNumber || '').toUpperCase() === reg
      ) || students[0];

      if (!matchedStudent) {
        // Also check if any active gatepass matches
        const resPasses = await getJuniorGatepassesByRegistration(reg);
        const activePass = resPasses.find((p) => p.status === 'ACTIVE');
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

        setNotFound(true);
        return;
      }

      setSearchedStudent(matchedStudent);

      // 2. Search strictly active gatepass for this student
      const regToLookup = matchedStudent.registration_number || matchedStudent.registrationNumber || reg;
      const resPasses = await getJuniorGatepassesByRegistration(regToLookup);
      const activeOne = resPasses.find((p) => p.status === 'ACTIVE');
      if (activeOne) {
        setSearchedGatepass(mapBackendJuniorToGatePass(activeOne));
      } else {
        setSearchedGatepass(null);
        setNoPassFound(true);
      }
    } catch (err: any) {
      console.error('Junior search error:', err);
      toast.error('Search error', err.message || 'Failed to search junior gatepass');
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmExit = async () => {
    if (!dialogPass) return;
    setIsSubmittingExit(true);

    try {
      const reg = dialogPass.registrationNumber || searchedStudent?.registration_number || searchedStudent?.registrationNumber;
      if (!reg) {
        throw new Error('Registration number not found for this gatepass');
      }
      const res = await recordJuniorExitByRegistration(reg);
      toast.success('Exit recorded successfully', `${res.student.name} marked EXITED`);
      setDialogPass(null);

      if (searchedGatepass && searchedGatepass.id === dialogPass.id) {
        setSearchedGatepass({
          ...searchedGatepass,
          status: 'EXITED',
          exitTime: new Date().toISOString(),
        });
      }

      fetchPasses();
    } catch (err: any) {
      console.error('Junior exit error:', err);
      toast.error('Exit Error', err.message || 'Failed to record exit');
    } finally {
      setIsSubmittingExit(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Security Portal"
        eyebrowIcon={ShieldCheck}
        title="Junior Security"
        description="Search junior gate passes, register students, and record unique number & early exits."
      />

      <div className="space-y-6">
        {/* Search Junior Gate Pass Card (matches Degree Security) */}
        <Card
          title="Search Junior Gate Pass"
          description="Enter the junior student's registration number to search their active gate pass and mark early exit."
          icon={LogOut}
        >
          <SearchBar
            label="Registration Number"
            placeholder="e.g. JUN2026001 or 25BCA076"
            value={query}
            uppercase
            onChange={(val) => {
              setQuery(val);
              if (!val.trim()) {
                setSearchedStudent(null);
                setSearchedGatepass(null);
                setNotFound(false);
                setNoPassFound(false);
              }
            }}
            onSubmit={handleSearch}
            hint="Enter junior registration number and press enter or click search."
          />

          <div className="mt-5">
            {searching && (
              <div className="py-6 text-center text-sm text-slate-400">Searching records...</div>
            )}

            {notFound && !searching && (
              <EmptyState
                compact
                icon={SearchX}
                title="Student Not Found"
                description={`No student or gatepass was found matching "${query}". Verify the registration number and try again.`}
              />
            )}

            {searchedStudent && !searching && (
              <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
                <StudentInfoCard
                  name={searchedStudent.name}
                  identifierLabel="Reg No"
                  identifier={searchedStudent.registration_number || searchedStudent.registrationNumber || query}
                  chips={[
                    searchedStudent.class_name || searchedStudent.className || '11th',
                    `Section: ${searchedStudent.section || '—'}`,
                    searchedStudent.department ? `Dept: ${searchedStudent.department}` : '',
                    searchedStudent.board ? `Board: ${searchedStudent.board}` : '',
                  ].filter(Boolean)}
                />

                {searchedGatepass ? (
                  <GatePassCard
                    pass={searchedGatepass}
                    onMarkExit={searchedGatepass.status === 'ACTIVE' ? setDialogPass : undefined}
                  />
                ) : noPassFound ? (
                  <EmptyState
                    compact
                    icon={LogOut}
                    title="No Gate Pass Found"
                    description="This student has no active or recent early exit gate pass. An approved pass from Reception is required for early departure."
                  />
                ) : null}
              </div>
            )}
          </div>
        </Card>

        {/* Unique Number Assignment and Exit */}
        <div className="grid gap-6 lg:grid-cols-2">
          <JuniorRegistration onAssigned={fetchPasses} />
          <JuniorExit onExitRecorded={fetchPasses} />
        </div>

        {/* Active Junior Gate Passes Card */}
        <Card
          title="Active Junior Gate Passes"
          description="Early-exit gate passes created at Reception. Verify the details and mark exit directly."
          icon={ClipboardList}
          action={
            <span className="chip">
              {activePasses.length} active
            </span>
          }
        >
          {loading && passes.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading active passes...</div>
          ) : activePasses.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No Active Junior Gate Passes"
              description="Passes created at Reception will appear here as soon as they are issued."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {activePasses.map((pass) => (
                <GatePassCard key={pass.id} pass={pass} onMarkExit={setDialogPass} />
              ))}
            </div>
          )}
        </Card>

        {/* Recent Junior Gate Passes */}
        <RecentGatePasses
          passes={passes}
          loading={loading}
          onRefresh={fetchPasses}
          onMarkExit={setDialogPass}
        />
      </div>

      {dialogPass && (
        <ConfirmDialog
          open
          title={`Mark ${dialogPass.studentName} as exited?`}
          confirmLabel={isSubmittingExit ? 'Marking Exit...' : 'Confirm Exit'}
          onCancel={() => setDialogPass(null)}
          onConfirm={handleConfirmExit}
        >
          <InfoRow layout="inline" label="Student" value={dialogPass.studentName} />
          <InfoRow layout="inline" label="Registration No" value={dialogPass.registrationNumber || '—'} mono />
          <InfoRow layout="inline" label="Reason" value={dialogPass.reason} />
          <InfoRow layout="inline" label="Teacher" value={dialogPass.teacher} />
        </ConfirmDialog>
      )}
    </>
  );
}
