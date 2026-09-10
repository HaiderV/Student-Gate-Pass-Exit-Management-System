import { useMemo } from 'react';
import {
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  RotateCcw,
  Users,
} from 'lucide-react';
import type { GatePassStatus } from '@/types';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/common/Card';
import EmptyState from '@/components/common/EmptyState';
import StatCard from '@/components/common/StatCard';
import StatusBadge from '@/components/common/StatusBadge';
import TypeBadge from '@/components/common/TypeBadge';
import TodayChip from '@/components/common/TodayChip';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { todayISO } from '@/lib/format';

const STATUS_CHIPS: { status: GatePassStatus; bar: string }[] = [
  { status: 'ACTIVE', bar: 'bg-blue-500' },
  { status: 'USED', bar: 'bg-emerald-500' },
  { status: 'EXPIRED', bar: 'bg-amber-500' },
  { status: 'CANCELLED', bar: 'bg-rose-500' },
];

export default function AdminDashboard() {
  const { state, resetDemoData } = useApp();
  const toast = useToast();
  const today = todayISO();

  const exitsToday = state.exitRecords.filter((r) => r.date === today);
  const degreeExitsToday = exitsToday.filter((r) => r.studentType === 'degree').length;
  const juniorExitsToday = exitsToday.filter((r) => r.studentType === 'junior').length;

  const statusCounts = useMemo(() => {
    const counts: Record<GatePassStatus, number> = { ACTIVE: 0, USED: 0, EXPIRED: 0, CANCELLED: 0 };
    for (const pass of state.gatePasses) counts[pass.status] += 1;
    return counts;
  }, [state.gatePasses]);

  const maxTypeExits = Math.max(degreeExitsToday, juniorExitsToday, 1);
  const maxStatus = Math.max(...STATUS_CHIPS.map((s) => statusCounts[s.status]), 1);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        eyebrowIcon={LayoutDashboard}
        title="Admin Dashboard"
        description="Overview of gate passes, student exits and portal activity across the campus."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="btn-ghost px-3.5 py-2 text-xs"
              onClick={() => {
                resetDemoData();
                toast.info('Demo data reset', 'All portals now show fresh sample data.');
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset Demo Data
            </button>
            <TodayChip />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-6">
        <StatCard
          icon={Users}
          label="Junior Students"
          value={state.juniorStudents.length}
          hint="11th & 12th · unique numbers"
          tone="sky"
        />
        <StatCard
          icon={GraduationCap}
          label="Degree Students"
          value={state.degreeStudents.length}
          hint="Undergraduate programmes"
          tone="blue"
        />
        <StatCard
          icon={LogOut}
          label="Today's Exits"
          value={exitsToday.length}
          hint={`${degreeExitsToday} degree · ${juniorExitsToday} junior`}
          tone="emerald"
        />
        <StatCard
          icon={ClipboardList}
          label="Active Gate Passes"
          value={statusCounts.ACTIVE}
          hint="Awaiting verification at the gate"
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card
          className="lg:col-span-3"
          title="Recent Activity"
          description="Live feed of gate passes, exits and registrations across portals."
          icon={ClipboardList}
          action={<span className="chip">{state.activities.length} events</span>}
        >
          {state.activities.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No Activity Yet"
              description="Actions from the reception and security portals will appear here."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr>
                      <th scope="col" className="th">Student</th>
                      <th scope="col" className="th">Type</th>
                      <th scope="col" className="th">Action</th>
                      <th scope="col" className="th">Time</th>
                      <th scope="col" className="th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.activities.map((activity) => (
                      <tr key={activity.id} className="transition hover:bg-white/[0.02]">
                        <td className="td font-medium text-white">{activity.studentName}</td>
                        <td className="td">
                          <TypeBadge type={activity.type} />
                        </td>
                        <td className="td text-slate-300">{activity.action}</td>
                        <td className="td text-slate-300">{activity.time}</td>
                        <td className="td">
                          <StatusBadge status={activity.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {state.activities.map((activity) => (
                  <article key={activity.id} className="rounded-lg border border-white/[0.06] bg-navy-850/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-white">{activity.studentName}</h3>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {activity.action} · {activity.time}
                        </p>
                      </div>
                      <StatusBadge status={activity.status} />
                    </div>
                    <div className="mt-2.5">
                      <TypeBadge type={activity.type} />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Exits Today" description="Split by student category." icon={LogOut}>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">Degree</span>
                  <span className="tabular-nums text-slate-400">{degreeExitsToday}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(degreeExitsToday / maxTypeExits) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">Junior</span>
                  <span className="tabular-nums text-slate-400">{juniorExitsToday}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-sky-400 transition-all"
                    style={{ width: `${(juniorExitsToday / maxTypeExits) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="mt-4 border-t border-white/[0.05] pt-3.5 text-xs text-slate-500">
              {exitsToday.length} {exitsToday.length === 1 ? 'exit' : 'exits'} recorded at the gate today.
            </p>
          </Card>

          <Card title="Gate Passes by Status" description="All passes across both portals." icon={ClipboardList}>
            <dl className="grid grid-cols-2 gap-3">
              {STATUS_CHIPS.map(({ status, bar }) => (
                <div key={status} className="rounded-lg border border-white/[0.07] bg-navy-850/70 px-3.5 py-3">
                  <dd className="font-display text-xl font-extrabold tabular-nums text-white">{statusCounts[status]}</dd>
                  <dt className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${bar}`} />
                    {status}
                  </dt>
                </div>
              ))}
            </dl>
            <div className="mt-4 border-t border-white/[0.05] pt-3.5">
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="flex h-full">
                  {STATUS_CHIPS.map(({ status, bar }) => (
                    <div
                      key={status}
                      className={bar}
                      style={{ width: `${(statusCounts[status] / maxStatus) * 100}%` }}
                      title={`${status}: ${statusCounts[status]}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
