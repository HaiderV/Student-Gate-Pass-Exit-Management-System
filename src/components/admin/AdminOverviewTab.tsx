import { useEffect, useState } from 'react';
import {
  Activity,
  Award,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Hash,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Users,
} from 'lucide-react';
import Card from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import StatusBadge from '@/components/common/StatusBadge';
import TypeBadge from '@/components/common/TypeBadge';
import { getAdminActiveGatepasses, getAdminSummary, getAdminToday } from '@/lib/api';
import type { AdminSummaryData, AdminTodayData } from '@/types';

export default function AdminOverviewTab() {
  const [summary, setSummary] = useState<AdminSummaryData | null>(null);
  const [todayData, setTodayData] = useState<AdminTodayData | null>(null);
  const [activePasses, setActivePasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sum, today, active] = await Promise.all([
        getAdminSummary(),
        getAdminToday(),
        getAdminActiveGatepasses(),
      ]);
      setSummary(sum);
      setTodayData(today);
      setActivePasses(active);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top action / Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-sky-400" />
          System Health & Summary
        </h2>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database Stats</span>
        </button>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-6">
        <StatCard
          icon={GraduationCap}
          label="Degree Students"
          value={summary?.students.totalDegreeStudents ?? '...'}
          hint="Total registered degree students"
          tone="blue"
        />
        <StatCard
          icon={Users}
          label="Junior Students"
          value={summary?.students.totalJuniorStudents ?? '...'}
          hint="11th & 12th college students"
          tone="sky"
        />
        <StatCard
          icon={Award}
          label="Faculty / Teachers"
          value={summary?.teachers.totalTeachers ?? '...'}
          hint="Degree & Junior teaching staff"
          tone="amber"
        />
        <StatCard
          icon={Hash}
          label="Active Unique Numbers"
          value={summary?.juniorUniqueNumbers.activeUniqueNumbers ?? '...'}
          hint={`${summary?.juniorUniqueNumbers.totalAssignedUniqueNumbers ?? 0} total assigned`}
          tone="emerald"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-6">
        <StatCard
          icon={ClipboardList}
          label="Total Gate Passes"
          value={summary?.gatepasses.totalGatepasses ?? '...'}
          hint={`${summary?.gatepasses.totalDegreeGatepasses ?? 0} degree · ${summary?.gatepasses.totalJuniorGatepasses ?? 0} junior`}
          tone="blue"
        />
        <StatCard
          icon={Activity}
          label="Active Gate Passes"
          value={summary?.gatepasses.activeGatepasses ?? '...'}
          hint="Currently valid awaiting exit"
          tone="amber"
        />
        <StatCard
          icon={LogOut}
          label="Total Exited Passes"
          value={summary?.gatepasses.exitedGatepasses ?? '...'}
          hint="Successfully verified at security"
          tone="emerald"
        />
        <StatCard
          icon={ShieldAlert}
          label="Cancelled Passes"
          value={summary?.gatepasses.cancelledGatepasses ?? '...'}
          hint="Cancelled at security/reception"
          tone="rose"
        />
      </div>

      {/* Today's Activity & Live Active Passes */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Active Passes Now */}
        <Card
          className="lg:col-span-3"
          title="Active Gatepasses Awaiting Exit"
          description="Live active passes ready to be verified by security guard at the gate."
          icon={ClipboardList}
          action={<span className="chip">{activePasses.length} live</span>}
        >
          {activePasses.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No gate passes are currently active. All issued passes have exited or been cancelled.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] border-collapse">
                <thead>
                  <tr>
                    <th scope="col" className="th">Student</th>
                    <th scope="col" className="th">Type</th>
                    <th scope="col" className="th">Reason</th>
                    <th scope="col" className="th">Teacher</th>
                    <th scope="col" className="th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activePasses.map((pass, i) => (
                    <tr key={pass.gatepassId || i} className="transition hover:bg-white/[0.02]">
                      <td className="td font-medium text-white">
                        {pass.student?.name || 'Student'}
                        <span className="block text-xs font-mono text-slate-400">
                          {pass.student?.registration_number || (pass.uniqueNumber ? `Uniq #${pass.uniqueNumber.unique_number}` : '—')}
                        </span>
                      </td>
                      <td className="td">
                        <TypeBadge type={pass.gatepassType?.toLowerCase() === 'junior' ? 'junior' : 'degree'} />
                      </td>
                      <td className="td text-slate-300">{pass.reason}</td>
                      <td className="td text-slate-300">{pass.teacher?.name || '—'}</td>
                      <td className="td">
                        <StatusBadge status={pass.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Today's Overview & Recent Audit */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="Today's Performance" description={`Overview for ${todayData?.date || 'Today'}`} icon={Activity}>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-navy-850/60 p-3">
                <span className="text-xs font-medium text-slate-300">Created Today</span>
                <span className="font-bold text-white">{todayData?.totalGatepassesCreated ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-navy-850/60 p-3">
                <span className="text-xs font-medium text-slate-300">Degree Passes</span>
                <span className="font-bold text-blue-300">{todayData?.degreeCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-navy-850/60 p-3">
                <span className="text-xs font-medium text-slate-300">Junior Passes</span>
                <span className="font-bold text-sky-300">{todayData?.juniorCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-navy-850/60 p-3">
                <span className="text-xs font-medium text-slate-300">Exits Today</span>
                <span className="font-bold text-emerald-300">{todayData?.exitedGatepasses ?? 0}</span>
              </div>
            </div>
          </Card>

          <Card title="Recent Security & Audit Logs" description="Latest operations on the database" icon={CheckCircle2}>
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {(summary?.recentAuditLogs || []).slice(0, 5).map((log) => (
                <div key={log.id} className="rounded-lg border border-white/[0.05] bg-navy-900/50 p-2.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-sky-300">{log.actor_type}</span>
                    <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="mt-1 text-slate-200">{log.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
