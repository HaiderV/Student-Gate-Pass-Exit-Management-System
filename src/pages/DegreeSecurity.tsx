import { LogOut, SearchX, ShieldCheck } from 'lucide-react';
import type { GatePass } from '@/types';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/common/Card';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import InfoRow from '@/components/common/InfoRow';
import SearchBar from '@/components/common/SearchBar';
import StudentInfoCard from '@/components/common/StudentInfoCard';
import GatePassCard from '@/components/security/GatePassCard';
import RecentGatePasses from '@/components/security/RecentGatePasses';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { nowTime12 } from '@/lib/format';
import { findDegreeStudent, sortPassesNewestFirst } from '@/lib/students';
import { useState } from 'react';

/**
 * Degree Security portal.
 * Flow: search registration number -> verify active gate pass -> mark exited.
 * Security never creates gate passes — reception does.
 */
export default function DegreeSecurity() {
  const { state, markGatePassExited } = useApp();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [searchedReg, setSearchedReg] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [dialogPass, setDialogPass] = useState<GatePass | null>(null);

  const searchedStudent = searchedReg ? findDegreeStudent(state.degreeStudents, state.gatePasses, searchedReg) : null;

  const activePass =
    searchedReg
      ? state.gatePasses.find(
          (p) =>
            p.studentType === 'degree' &&
            p.registrationNumber?.toUpperCase() === searchedReg &&
            p.status === 'ACTIVE',
        )
      : undefined;

  const latestUsedPass = searchedReg
    ? sortPassesNewestFirst(
        state.gatePasses.filter(
          (p) =>
            p.studentType === 'degree' &&
            p.registrationNumber?.toUpperCase() === searchedReg &&
            p.status === 'USED',
        ),
      )[0]
    : undefined;

  const handleSearch = () => {
    const normalized = query.trim().toUpperCase();
    const found = findDegreeStudent(state.degreeStudents, state.gatePasses, normalized);
    setSearchedReg(normalized || null);
    setNotFound(found === null);
  };

  const handleConfirmExit = () => {
    if (!dialogPass) return;
    markGatePassExited(dialogPass.id);
    const time = nowTime12();
    setDialogPass(null);
    toast.success('Exit recorded successfully', `${dialogPass.studentName} · ${dialogPass.passId} · ${time}`);
  };

  const confirmDialog = dialogPass && (
    <ConfirmDialog
      open
      title={`Mark ${dialogPass.studentName} as exited?`}
      confirmLabel="Confirm Exit"
      onCancel={() => setDialogPass(null)}
      onConfirm={handleConfirmExit}
    >
      <InfoRow layout="inline" label="Registration No" value={dialogPass.registrationNumber ?? '—'} mono />
      <InfoRow layout="inline" label="Gate Pass" value={dialogPass.reason} />
      <InfoRow layout="inline" label="Expected Exit" value={dialogPass.expectedExit} />
    </ConfirmDialog>
  );

  return (
    <>
      <PageHeader
        eyebrow="Security Portal"
        eyebrowIcon={ShieldCheck}
        title="Degree Security"
        description="Verify active gate passes and record student exits."
      />

      <div className="space-y-6">
        <Card
          title="Search by Registration Number"
          description="Search the student, check their active gate pass, then mark the exit."
          icon={LogOut}
        >
          <SearchBar
            label="Registration Number"
            placeholder="e.g. 23BCA1045"
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            hint="Gate passes created at Reception appear here instantly — no login needed."
          />

          <div className="mt-5">
            {notFound && (
              <EmptyState
                compact
                icon={SearchX}
                title="Student Not Found"
                description="No student was found with this registration number. Check the number and try again."
              />
            )}

            {searchedStudent && (
              <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
                <StudentInfoCard
                  name={searchedStudent.name}
                  identifierLabel="Reg No"
                  identifier={searchedStudent.registrationNumber}
                  chips={[searchedStudent.course, searchedStudent.year, `Section: ${searchedStudent.section}`]}
                />
                {activePass ? (
                  <GatePassCard pass={activePass} onMarkExit={setDialogPass} />
                ) : latestUsedPass ? (
                  <div className="space-y-3">
                    <GatePassCard pass={latestUsedPass} />
                    <p className="text-xs text-slate-500">
                      This pass was already used — the exit was recorded at {latestUsedPass.exitTime ?? 'the gate'}.
                    </p>
                  </div>
                ) : (
                  <EmptyState
                    compact
                    icon={LogOut}
                    title="No Active Gate Pass"
                    description="This student does not have an active gate pass. Early exit requires a gate pass created at Reception."
                  />
                )}
              </div>
            )}

            {!searchedStudent && !notFound && (
              <EmptyState
                compact
                icon={LogOut}
                title="Search a Registration Number"
                description="Enter a student's registration number above to view their active gate pass and record the exit."
              />
            )}
          </div>
        </Card>

        <RecentGatePasses
          passes={sortPassesNewestFirst(
            state.gatePasses.filter((p) => p.studentType === 'degree'),
          )}
          onMarkExit={setDialogPass}
        />
      </div>

      {confirmDialog}
    </>
  );
}
