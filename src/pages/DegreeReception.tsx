import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import type { BackendGatePass, DegreeStudent, GatePass } from '@/types';
import PageHeader from '@/components/layout/PageHeader';
import TodayChip from '@/components/common/TodayChip';
import GatePassForm from '@/components/reception/GatePassForm';
import GatePassList from '@/components/reception/GatePassList';
import ReceptionSidePanel from '@/components/reception/ReceptionSidePanel';
import { getDegreeGatepasses } from '@/lib/api';

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
    registrationNumber: student?.registration_number || '',
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

/** Degree Reception portal — verify teacher permission and create degree gate passes. */
export default function DegreeReception() {
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const data = await getDegreeGatepasses();
      setPasses(data.map(mapBackendToGatePass));
    } catch (err) {
      console.error('Failed to fetch degree gatepasses:', err);
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
        title="Degree Reception"
        description="Verify the teacher's physical permission and create digital gate passes for degree students."
        actions={<TodayChip />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <GatePassForm variant="degree" onPassCreated={fetchPasses} />
        </div>
        <div className="lg:col-span-2">
          <ReceptionSidePanel variant="degree" passes={passes} />
        </div>
      </div>

      <div className="mt-6">
        <GatePassList
          passes={passes}
          loading={loading}
          onRefresh={fetchPasses}
          emptyTitle="No Degree Gate Passes Yet"
          emptyDescription="Gate passes you create will be listed here and become visible to Degree Security instantly."
        />
      </div>
    </>
  );
}
