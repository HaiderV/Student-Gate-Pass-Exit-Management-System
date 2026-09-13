import { CalendarDays, ClipboardCheck, DoorOpen, ShieldCheck } from 'lucide-react';
import Card from '@/components/common/Card';
import { todayLabel } from '@/lib/format';
import type { GatePass, StudentType } from '@/types';

const STEPS: Record<StudentType, { title: string; description: string }[]> = {
  degree: [
    {
      title: 'Student brings permission',
      description: 'The student arrives with a physical permission letter signed by their degree class teacher.',
    },
    {
      title: 'Reception verifies & creates',
      description: 'Verify the signed letter, attach the PDF/image (< 5MB), and issue the digital gate pass.',
    },
    {
      title: 'Security verifies at the gate',
      description: 'The watchman searches the registration number and marks the exit on student departure.',
    },
  ],
  junior: [
    {
      title: 'Permission is verified',
      description: 'The junior student brings a physical permission letter signed by their junior teacher.',
    },
    {
      title: 'Reception creates the pass',
      description: 'Reception attaches the document (< 5MB) and creates the digital early-exit pass.',
    },
    {
      title: 'Security marks the exit',
      description: 'Security records the exit at the gate by Unique Number or Registration Number.',
    },
  ],
};

interface ReceptionSidePanelProps {
  variant: StudentType;
  passes?: GatePass[];
}

/** Side panel shown next to the gate pass form on both reception portals. */
export default function ReceptionSidePanel({ variant, passes = [] }: ReceptionSidePanelProps) {
  const steps = STEPS[variant];

  const totalCount = passes.length;
  const activeNow = passes.filter((p) => p.status === 'ACTIVE').length;
  const exitedCount = passes.filter((p) => p.status === 'EXITED' || p.status === 'USED').length;

  const stats = [
    { label: 'Total passes', value: totalCount, icon: ClipboardCheck },
    { label: 'Active now', value: activeNow, icon: ShieldCheck },
    { label: 'Exits marked', value: exitedCount, icon: DoorOpen },
  ];

  return (
    <div className="space-y-6">
      <Card title="How it works" description="The physical permission process stays unchanged." icon={ClipboardCheck}>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3.5">
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 font-display text-xs font-bold text-blue-300 ring-1 ring-blue-400/25"
              >
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Today at reception" icon={CalendarDays}>
        <dl className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/[0.07] bg-navy-850/70 px-3 py-3.5 text-center">
              <dd className="font-display text-2xl font-extrabold tabular-nums text-white">{stat.value}</dd>
              <dt className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
        <p className="mt-4 border-t border-white/[0.05] pt-3.5 text-xs text-slate-500">{todayLabel()}</p>
      </Card>
    </div>
  );
}
