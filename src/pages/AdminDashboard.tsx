import { useState } from 'react';
import {
  Award,
  Calendar,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import TodayChip from '@/components/common/TodayChip';
import AdminOverviewTab from '@/components/admin/AdminOverviewTab';
import AdminStudentsTab from '@/components/admin/AdminStudentsTab';
import AdminTeachersTab from '@/components/admin/AdminTeachersTab';
import AdminGatepassesTab from '@/components/admin/AdminGatepassesTab';
import AdminCalendarTab from '@/components/admin/AdminCalendarTab';
import AdminAuditLogsTab from '@/components/admin/AdminAuditLogsTab';

type AdminTab = 'overview' | 'students' | 'teachers' | 'gatepasses' | 'calendar' | 'audit';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'teachers', label: 'Teachers', icon: Award },
    { id: 'gatepasses', label: 'Gatepasses', icon: ClipboardList },
    { id: 'calendar', label: 'Calendar & Reports', icon: Calendar },
    { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Administration Portal"
        eyebrowIcon={LayoutDashboard}
        title="Admin Control Center"
        description="Comprehensive management of students, faculty, gatepasses, calendar activity, and audit logs."
        actions={<TodayChip />}
      />

      {/* Tabs Navigation Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'border border-white/10 bg-navy-850/50 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Render */}
      <div>
        {activeTab === 'overview' && <AdminOverviewTab />}
        {activeTab === 'students' && <AdminStudentsTab />}
        {activeTab === 'teachers' && <AdminTeachersTab />}
        {activeTab === 'gatepasses' && <AdminGatepassesTab />}
        {activeTab === 'calendar' && <AdminCalendarTab />}
        {activeTab === 'audit' && <AdminAuditLogsTab />}
      </div>
    </>
  );
}
