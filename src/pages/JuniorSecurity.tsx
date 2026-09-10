import { useState } from 'react';
import { ClipboardList, ShieldCheck } from 'lucide-react';
import type { GatePass } from '@/types';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/common/Card';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import InfoRow from '@/components/common/InfoRow';
import GatePassCard from '@/components/security/GatePassCard';
import JuniorRegistration from '@/components/security/JuniorRegistration';
import JuniorExit from '@/components/security/JuniorExit';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { nowTime12 } from '@/lib/format';
import { sortPassesNewestFirst } from '@/lib/students';

/**
 * Junior Security portal — a single page with three sections:
 * 1. Register Junior Student (assign numeric unique number)
 * 2. Record Junior Exit (normal exit by unique number)
 * 3. Active Junior Gate Passes (created by Reception — verify & mark exit)
 */
export default function JuniorSecurity() {
  const { state, markGatePassExited } = useApp();
  const toast = useToast();
  const [dialogPass, setDialogPass] = useState<GatePass | null>(null);

  const activePasses = sortPassesNewestFirst(
    state.gatePasses.filter((p) => p.studentType === 'junior' && p.status === 'ACTIVE'),
  );

  const handleConfirmExit = () => {
    if (!dialogPass) return;
    markGatePassExited(dialogPass.id);
    const time = nowTime12();
    setDialogPass(null);
    toast.success('Exit recorded successfully', `${dialogPass.studentName} · ${dialogPass.passId} · ${time}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Security Portal"
        eyebrowIcon={ShieldCheck}
        title="Junior Security"
        description="Register junior students, record normal exits and verify early-exit gate passes created by Reception."
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <JuniorRegistration />
          <JuniorExit />
        </div>

        <Card
          title="Active Junior Gate Passes"
          description="Early-exit gate passes are created at Reception after the teacher's permission is verified. Verify the details and mark the exit."
          icon={ClipboardList}
          action={
            <span className="chip">
              {activePasses.length} active
            </span>
          }
        >
          {activePasses.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No Active Junior Gate Passes"
              description="All junior gate passes have been used or there are currently none. Passes created at Reception will appear here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {activePasses.map((pass) => (
                <GatePassCard key={pass.id} pass={pass} onMarkExit={setDialogPass} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {dialogPass && (
        <ConfirmDialog
          open
          title={`Mark ${dialogPass.studentName} as exited?`}
          confirmLabel="Confirm Exit"
          onCancel={() => setDialogPass(null)}
          onConfirm={handleConfirmExit}
        >
          <InfoRow layout="inline" label="Unique Number" value={String(dialogPass.uniqueNumber ?? '—')} mono />
          <InfoRow layout="inline" label="Gate Pass" value={dialogPass.reason} />
          <InfoRow layout="inline" label="Expected Exit" value={dialogPass.expectedExit} />
        </ConfirmDialog>
      )}
    </>
  );
}
