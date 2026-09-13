import { useEffect, useState } from 'react';
import {
  Filter,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import Card from '@/components/common/Card';
import { getAdminAuditLogs } from '@/lib/api';
import type { AuditLog } from '@/types';

export default function AdminAuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [actionQuery, setActionQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAdminAuditLogs({
        actor_type: actorFilter === 'ALL' ? undefined : actorFilter,
        action: actionQuery.trim() ? actionQuery.trim() : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setLogs(data);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actorFilter]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleResetFilter = () => {
    setActorFilter('ALL');
    setActionQuery('');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-6">
      <Card
        title="System Security & Operations Audit Trail"
        description="Immutable audit logging of every gatepass creation, security exit verification, student registration, and admin change."
        icon={ShieldCheck}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-white"
              title="Refresh Logs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span className="chip">{logs.length} records</span>
          </div>
        }
      >
        {/* Filters bar */}
        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-end gap-3 mb-5">
          <div>
            <label className="label">Actor</label>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="input text-xs"
            >
              <option value="ALL">All Actors</option>
              <option value="RECEPTION">RECEPTION</option>
              <option value="SECURITY">SECURITY</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </div>

          <div>
            <label className="label">Action Search</label>
            <input
              type="text"
              value={actionQuery}
              onChange={(e) => setActionQuery(e.target.value)}
              placeholder="e.g. EXIT, CREATE_GATEPASS"
              className="input font-mono text-xs"
            />
          </div>

          <div>
            <label className="label">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input font-mono text-xs"
            />
          </div>

          <div>
            <label className="label">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input font-mono text-xs"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Apply Filters</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="btn-secondary text-xs"
            >
              Reset
            </button>
          </div>
        </form>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No audit records match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse">
              <thead>
                <tr>
                  <th scope="col" className="th">Timestamp</th>
                  <th scope="col" className="th">Actor</th>
                  <th scope="col" className="th">Action</th>
                  <th scope="col" className="th">Description</th>
                  <th scope="col" className="th">Entity</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-white/[0.02]">
                    <td className="td font-mono text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="td">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          log.actor_type === 'SECURITY'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : log.actor_type === 'RECEPTION'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                            : log.actor_type === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                            : 'bg-slate-500/20 text-slate-300 border border-slate-400/30'
                        }`}
                      >
                        {log.actor_type}
                      </span>
                    </td>
                    <td className="td font-mono text-xs font-semibold text-sky-300">
                      {log.action}
                    </td>
                    <td className="td text-slate-200">{log.description}</td>
                    <td className="td font-mono text-[11px] text-slate-400">
                      {log.entity_type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
