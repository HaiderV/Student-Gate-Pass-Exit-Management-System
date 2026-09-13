import { useEffect, useState } from 'react';
import { LogOut, SearchX, ShieldCheck } from 'lucide-react';
import type { BackendGatePass, DegreeStudent, GatePass } from '@/types';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/common/Card';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import InfoRow from '@/components/common/InfoRow';
import SearchBar from '@/components/common/SearchBar';
import StudentInfoCard from '@/components/common/StudentInfoCard';
import GatePassCard from '@/components/security/GatePassCard';
import RecentGatePasses from '@/components/security/RecentGatePasses';
import { useToast } from '@/context/ToastContext';
import {
  getDegreeGatepasses,
  getDegreeGatepassesByRegistration,
  recordDegreeExit,
  searchDegreeStudents,
} from '@/lib/api';

function mapBackendToGatePass(bgp: BackendGatePass): GatePass {
  const student = bgp.student as DegreeStudent | undefined;
  const teacher = bgp.teacher;
  const createdAtDate = bgp.created_at ? new Date(bgp.created_at) : new Date();

  return {
    id: bgp.id,
    passId: `GP-${bgp.id.slice(0, 8).toUpperCase()}`,
    studentType: 'degree',
    studentId: bgp.student_id,
    teacherId: bgp.teacher_id,
    studentName: student?.name || 'Unknown Student',
    registrationNumber: student?.registration_number || student?.registrationNumber || '',
    course: student?.course || '',
    year: student?.year || '',
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

export default function DegreeSecurity() {
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loadingPasses, setLoadingPasses] = useState(false);
  const [recentPasses, setRecentPasses] = useState<GatePass[]>([]);
  
  const [searchedStudent, setSearchedStudent] = useState<DegreeStudent | null>(null);
  const [searchedGatepass, setSearchedGatepass] = useState<GatePass | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [noPassFound, setNoPassFound] = useState(false);

  const [dialogPass, setDialogPass] = useState<GatePass | null>(null);
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);

  const fetchRecent = async () => {
    try {
      setLoadingPasses(true);
      const data = await getDegreeGatepasses();
      setRecentPasses(data.map(mapBackendToGatePass));
    } catch (err: any) {
      console.error('Failed to fetch recent degree passes:', err);
    } finally {
      setLoadingPasses(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

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
      const students = await searchDegreeStudents(reg);
      const matchedStudent = students.find(
        (s) => (s.registration_number || s.registrationNumber || '').toUpperCase() === reg
      ) || students[0];

      if (!matchedStudent) {
        // Also check if any active gatepass matches
        const passes = await getDegreeGatepassesByRegistration(reg);
        const activePass = passes.find((p) => p.status === 'ACTIVE');
        if (activePass) {
          const pass = mapBackendToGatePass(activePass);
          const studentObj = activePass.student as DegreeStudent;
          setSearchedStudent(studentObj || {
            id: activePass.student_id,
            name: pass.studentName,
            registration_number: reg,
            course: pass.course || '—',
            year: pass.year || '—',
            section: pass.section || '—',
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
      const passes = await getDegreeGatepassesByRegistration(regToLookup);
      const activeOne = passes.find((p) => p.status === 'ACTIVE');
      if (activeOne) {
        setSearchedGatepass(mapBackendToGatePass(activeOne));
      } else {
        setSearchedGatepass(null);
        setNoPassFound(true);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      toast.error('Search error', err.message || 'Failed to search student gatepass');
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
      if (!reg) throw new Error('Registration number is required to record exit');

      const result = await recordDegreeExit(reg);
      toast.success('Exit recorded successfully', `${result.student.name} marked EXITED`);
      
      setDialogPass(null);
      // Refresh search result if active
      if (searchedGatepass && searchedGatepass.id === dialogPass.id) {
        setSearchedGatepass({
          ...searchedGatepass,
          status: 'EXITED',
          exitTime: new Date().toISOString(),
        });
      }
      // Refresh recent list
      fetchRecent();
    } catch (err: any) {
      console.error('Exit recording error:', err);
      toast.error('Exit Error', err.message || 'Failed to record exit for this student');
    } finally {
      setIsSubmittingExit(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Security Portal"
        eyebrowIcon={ShieldCheck}
        title="Degree Security"
        description="Search registration number, verify active gate pass, and mark exit directly."
      />

      <div className="space-y-6">
        <Card
          title="Search by Registration Number"
          description="Enter the degree student's registration number to view their active gate pass and mark exit."
          icon={LogOut}
        >
          <SearchBar
            label="Registration Number"
            placeholder="e.g. D2026012"
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
            hint="Enter student registration number and press enter or click search."
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
                  identifier={searchedStudent.registration_number || searchedStudent.registrationNumber || '—'}
                  chips={[
                    searchedStudent.course,
                    searchedStudent.year,
                    `Section: ${searchedStudent.section}`,
                  ]}
                />

                {searchedGatepass ? (
                  <GatePassCard pass={searchedGatepass} onMarkExit={setDialogPass} />
                ) : noPassFound ? (
                  <EmptyState
                    compact
                    icon={LogOut}
                    title="No Active Gate Pass"
                    description="This student does not have any active gate pass. Early exit requires a gate pass created at Reception."
                  />
                ) : null}
              </div>
            )}

            {!searchedStudent && !notFound && !searching && (
              <EmptyState
                compact
                icon={LogOut}
                title="Ready for Student Exit"
                description="Enter a degree student's registration number above to verify gatepass and mark exit."
              />
            )}
          </div>
        </Card>

        {/* Recent Gatepasses list */}
        <RecentGatePasses
          passes={recentPasses}
          loading={loadingPasses}
          onRefresh={fetchRecent}
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
          <InfoRow layout="inline" label="Registration No" value={dialogPass.registrationNumber || searchedStudent?.registration_number || searchedStudent?.registrationNumber || '—'} mono />
          <InfoRow layout="inline" label="Gate Pass Reason" value={dialogPass.reason} />
          <InfoRow layout="inline" label="Class Teacher" value={dialogPass.teacher} />
          <InfoRow layout="inline" label="Status" value={dialogPass.status} />
        </ConfirmDialog>
      )}
    </>
  );
}
