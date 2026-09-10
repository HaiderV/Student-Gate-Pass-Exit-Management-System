import { ClipboardList } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import TodayChip from '@/components/common/TodayChip';
import GatePassForm from '@/components/reception/GatePassForm';
import GatePassList from '@/components/reception/GatePassList';
import ReceptionSidePanel from '@/components/reception/ReceptionSidePanel';
import { useApp } from '@/context/AppContext';

/** Degree Reception portal — verify teacher permission and create degree gate passes. */
export default function DegreeReception() {
  const { state } = useApp();

  return (
    <>
      <PageHeader
        eyebrow="Reception Portal"
        eyebrowIcon={ClipboardList}
        title="Degree Reception"
        description="Verify the teacher's physical permission and create digital gate passes for degree students."
        actions={<TodayChip />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <GatePassForm variant="degree" />
        </div>
        <div className="lg:col-span-2">
          <ReceptionSidePanel variant="degree" />
        </div>
      </div>

      <div className="mt-6">
        <GatePassList
          passes={state.gatePasses.filter((p) => p.studentType === 'degree')}
          emptyTitle="No Degree Gate Passes Yet"
          emptyDescription="Gate passes you create will be listed here and become visible to Degree Security instantly."
        />
      </div>
    </>
  );
}
