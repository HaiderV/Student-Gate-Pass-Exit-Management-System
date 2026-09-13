import { useEffect, useState } from 'react';
import {
  Ban,
  ClipboardList,
  Edit,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import Modal from '@/components/common/Modal';
import Card from '@/components/common/Card';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import StatusBadge from '@/components/common/StatusBadge';
import TypeBadge from '@/components/common/TypeBadge';
import { useToast } from '@/context/ToastContext';
import {
  cancelDegreeGatepass,
  cancelJuniorGatepass,
  deleteDegreeGatepass,
  deleteJuniorGatepass,
  getDegreeGatepasses,
  getJuniorGatepasses,
  updateDegreeGatepass,
  updateJuniorGatepass,
} from '@/lib/api';
import type { BackendGatePass } from '@/types';

export default function AdminGatepassesTab() {
  const toast = useToast();

  const [degreePasses, setDegreePasses] = useState<BackendGatePass[]>([]);
  const [juniorPasses, setJuniorPasses] = useState<BackendGatePass[]>([]);
  const [loading, setLoading] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'DEGREE' | 'JUNIOR'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXITED' | 'EXPIRED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Actions state
  const [cancellingPass, setCancellingPass] = useState<{ id: string; type: 'degree' | 'junior'; name: string } | null>(null);
  const [deletingPass, setDeletingPass] = useState<{ id: string; type: 'degree' | 'junior'; name: string } | null>(null);
  const [editingPass, setEditingPass] = useState<{ id: string; type: 'degree' | 'junior'; reason: string } | null>(null);
  const [editReason, setEditReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAllPasses = async () => {
    setLoading(true);
    try {
      const [deg, jun] = await Promise.all([
        getDegreeGatepasses(),
        getJuniorGatepasses(),
      ]);
      setDegreePasses(deg);
      setJuniorPasses(jun);
    } catch (err: any) {
      console.error('Failed to load gatepasses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPasses();
  }, []);

  const handleCancelPass = async () => {
    if (!cancellingPass) return;
    setIsProcessing(true);
    try {
      if (cancellingPass.type === 'degree') {
        await cancelDegreeGatepass(cancellingPass.id);
      } else {
        await cancelJuniorGatepass(cancellingPass.id);
      }
      toast.success('Gatepass Cancelled', `Gatepass for ${cancellingPass.name} was marked CANCELLED.`);
      setCancellingPass(null);
      fetchAllPasses();
    } catch (err: any) {
      console.error('Cancel gatepass error:', err);
      toast.error('Cancellation Failed', err.message || 'Could not cancel gatepass');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePass = async () => {
    if (!deletingPass) return;
    setIsProcessing(true);
    try {
      if (deletingPass.type === 'degree') {
        await deleteDegreeGatepass(deletingPass.id);
      } else {
        await deleteJuniorGatepass(deletingPass.id);
      }
      toast.success('Gatepass Deleted', `Gatepass for ${deletingPass.name} was removed.`);
      setDeletingPass(null);
      fetchAllPasses();
    } catch (err: any) {
      console.error('Delete gatepass error:', err);
      toast.error('Deletion Failed', err.message || 'Cannot delete gatepass because related exit/audit logs exist.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEditReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPass) return;
    setIsProcessing(true);
    try {
      if (editingPass.type === 'degree') {
        await updateDegreeGatepass(editingPass.id, { reason: editReason.trim() });
      } else {
        await updateJuniorGatepass(editingPass.id, { reason: editReason.trim() });
      }
      toast.success('Gatepass Updated', 'Reason updated successfully.');
      setEditingPass(null);
      fetchAllPasses();
    } catch (err: any) {
      console.error('Update gatepass error:', err);
      toast.error('Update Failed', err.message || 'Could not update gatepass.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Combine & filter
  const allEnriched = [
    ...degreePasses.map((p) => ({ ...p, passType: 'degree' as const })),
    ...juniorPasses.map((p) => ({ ...p, passType: 'junior' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filtered = allEnriched.filter((p) => {
    if (categoryFilter === 'DEGREE' && p.passType !== 'degree') return false;
    if (categoryFilter === 'JUNIOR' && p.passType !== 'junior') return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const stName = p.student?.name?.toLowerCase() || '';
      const regNo = p.student?.registration_number?.toLowerCase() || '';
      const reason = p.reason?.toLowerCase() || '';
      return stName.includes(q) || regNo.includes(q) || reason.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <Card
        title="All Gatepasses Management"
        description="View, inspect attached leave letters, edit reasons, cancel active passes, or delete records."
        icon={ClipboardList}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchAllPasses}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span className="chip">{filtered.length} passes</span>
          </div>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg border border-white/10 bg-navy-900/60 p-0.5">
              {(['ALL', 'DEGREE', 'JUNIOR'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? 'All Portals' : `${cat} Only`}
                </button>
              ))}
            </div>

            <div className="flex rounded-lg border border-white/10 bg-navy-900/60 p-0.5">
              {(['ALL', 'ACTIVE', 'EXITED', 'EXPIRED', 'CANCELLED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="Search student, reg no, reason..."
                className="input pl-9 text-xs font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {loading && allEnriched.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading all gatepasses...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No gatepasses match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr>
                  <th scope="col" className="th">Pass ID / Date</th>
                  <th scope="col" className="th">Student</th>
                  <th scope="col" className="th">Type</th>
                  <th scope="col" className="th">Reason</th>
                  <th scope="col" className="th">Teacher</th>
                  <th scope="col" className="th">Letter</th>
                  <th scope="col" className="th">Status</th>
                  <th scope="col" className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const studentName = p.student?.name || 'Unknown Student';
                  const regNo = p.student?.registration_number || '—';
                  const teacherName = p.teacher?.name || 'Class Teacher';

                  return (
                    <tr key={p.id} className="transition hover:bg-white/[0.02]">
                      <td className="td font-mono text-xs text-slate-400">
                        <span className="block text-slate-200 font-semibold">GP-{p.id.slice(0, 8).toUpperCase()}</span>
                        <span>{new Date(p.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="td">
                        <span className="block font-medium text-white">{studentName}</span>
                        <span className="font-mono text-xs text-sky-300">{regNo}</span>
                      </td>
                      <td className="td">
                        <TypeBadge type={p.passType} />
                      </td>
                      <td className="td text-slate-300 max-w-[200px] truncate" title={p.reason}>
                        {p.reason}
                      </td>
                      <td className="td text-slate-300">{teacherName}</td>
                      <td className="td">
                        {p.signed_letter_url ? (
                          <a
                            href={p.signed_letter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>PDF</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                      <td className="td">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="td text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() =>
                                setCancellingPass({
                                  id: p.id,
                                  type: p.passType,
                                  name: studentName,
                                })
                              }
                              className="rounded-lg p-1.5 text-amber-400 hover:bg-amber-500/20"
                              title="Cancel Active Pass"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPass({ id: p.id, type: p.passType, reason: p.reason });
                              setEditReason(p.reason);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                            title="Edit Reason"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeletingPass({
                                id: p.id,
                                type: p.passType,
                                name: studentName,
                              })
                            }
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                            title="Delete Pass"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Reason Modal */}
      <Modal
        open={!!editingPass}
        onClose={() => setEditingPass(null)}
        title="Edit Gatepass Reason"
        subtitle="Update the reason for this student's early exit"
      >
            <form onSubmit={handleSaveEditReason} className="space-y-4">
              <div>
                <label className="label">Reason</label>
                <textarea
                  rows={3}
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingPass(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isProcessing} className="btn-primary">
                  {isProcessing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
      </Modal>

      {/* Cancel Confirmation */}
      {cancellingPass && (
        <ConfirmDialog
          open
          title={`Cancel Gatepass for ${cancellingPass.name}?`}
          description="This will set the gatepass status to CANCELLED. The student will no longer be allowed to exit using this pass."
          confirmLabel={isProcessing ? 'Cancelling...' : 'Confirm Cancellation'}
          onCancel={() => setCancellingPass(null)}
          onConfirm={handleCancelPass}
        />
      )}

      {/* Delete Confirmation */}
      {deletingPass && (
        <ConfirmDialog
          open
          title={`Delete Gatepass for ${deletingPass.name}?`}
          description="Are you sure you want to permanently delete this gatepass? Note: If security exit records reference this pass, deletion will be safely rejected by the database."
          confirmLabel={isProcessing ? 'Deleting...' : 'Delete Gatepass'}
          onCancel={() => setDeletingPass(null)}
          onConfirm={handleDeletePass}
        />
      )}
    </div>
  );
}
