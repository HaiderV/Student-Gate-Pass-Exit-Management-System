import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import type { BackendGatePass, GatePass, JuniorStudent } from '@/types';
import PageHeader from '@/components/layout/PageHeader';
import TodayChip from '@/components/common/TodayChip';
import GatePassForm from '@/components/reception/GatePassForm';
import GatePassList from '@/components/reception/GatePassList';
import ReceptionSidePanel from '@/components/reception/ReceptionSidePanel';
import { getJuniorGatepasses } from '@/lib/api';

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

/** Junior Reception portal — verify teacher permission and create early-exit passes for 11th/12th students. */
export default function JuniorReception() {
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const data = await getJuniorGatepasses();
      setPasses(data.map(mapBackendJuniorToGatePass));
    } catch (err) {
      console.error('Failed to fetch junior gatepasses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Reception Portal"
        eyebrowIcon={ClipboardList}
        title="Junior Reception"
        description="Verify permission and issue early-exit gate passes for junior college students (11th & 12th)."
        actions={<TodayChip />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <GatePassForm variant="junior" onPassCreated={fetchPasses} />
        </div>
        <div className="lg:col-span-2">
          <ReceptionSidePanel variant="junior" passes={passes} />
        </div>
      </div>

      <div className="mt-6">
        <GatePassList
          passes={passes}
          loading={loading}
          onRefresh={fetchPasses}
          emptyTitle="No Junior Gate Passes Yet"
          emptyDescription="Junior gate passes created at Reception will be listed here and become visible to Junior Security."
        />
      </div>
    </>
  );
}
