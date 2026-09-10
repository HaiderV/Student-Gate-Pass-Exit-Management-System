import { ClipboardList } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import TodayChip from '@/components/common/TodayChip';
import GatePassForm from '@/components/reception/GatePassForm';
import GatePassList from '@/components/reception/GatePassList';
import ReceptionSidePanel from '@/components/reception/ReceptionSidePanel';
import { useApp } from '@/context/AppContext';

/** Junior Reception portal — verify permission and create junior early-exit gate passes. */
export default function JuniorReception() {
  const { state } = useApp();

  return (
    <>
      <PageHeader
        eyebrow="Reception Portal"
        eyebrowIcon={ClipboardList}
        title="Junior Reception"
        description="Verify the junior student's permission and create early-exit gate passes used by Junior Security."
        actions={<TodayChip />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <GatePassForm variant="junior" />
        </div>
        <div className="lg:col-span-2">
          <ReceptionSidePanel variant="junior" />
        </div>
      </div>

      <div className="mt-6">
        <GatePassList
          passes={state.gatePasses.filter((p) => p.studentType === 'junior')}
          emptyTitle="No Junior Gate Passes Yet"
          emptyDescription="Gate passes you create will be listed here and become visible to Junior Security instantly."
        />
      </div>
    </>
  );
}
