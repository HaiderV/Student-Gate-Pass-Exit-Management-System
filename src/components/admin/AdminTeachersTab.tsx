import { useEffect, useState, type FormEvent } from 'react';
import { Award, Edit, Plus, RefreshCw, Trash2 } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Card from '@/components/common/Card';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { createTeacher, deleteTeacher, getTeachers, updateTeacher } from '@/lib/api';
import type { Teacher } from '@/types';

export default function AdminTeachersTab() {
  const toast = useToast();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'DEGREE' | 'JUNIOR'>('ALL');
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [teachingLevel, setTeachingLevel] = useState<'JUNIOR' | 'DEGREE'>('DEGREE');

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await getTeachers(levelFilter === 'ALL' ? undefined : levelFilter);
      setTeachers(data);
    } catch (err: any) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [levelFilter]);

  const openCreateModal = () => {
    setName('');
    setDepartment('Computer Applications');
    setTeachingLevel('DEGREE');
    setShowCreateModal(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setDepartment(teacher.department || '');
    setTeachingLevel(teacher.teaching_level === 'JUNIOR' ? 'JUNIOR' : 'DEGREE');
  };

  const handleSaveTeacher = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Validation Error', 'Teacher name is required.');
      return;
    }

    setIsProcessing(true);
    try {
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, {
          name: name.trim(),
          department: department.trim() || undefined,
          teaching_level: teachingLevel,
        });
        toast.success('Teacher Updated', `${name} updated successfully.`);
        setEditingTeacher(null);
      } else {
        await createTeacher({
          name: name.trim(),
          department: department.trim() || undefined,
          teaching_level: teachingLevel,
        });
        toast.success('Teacher Created', `${name} added to faculty directory.`);
        setShowCreateModal(false);
      }
      fetchTeachers();
    } catch (err: any) {
      console.error('Save teacher error:', err);
      toast.error('Operation Failed', err.message || 'Could not save teacher record.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deletingTeacher) return;
    setIsProcessing(true);
    try {
      await deleteTeacher(deletingTeacher.id);
      toast.success('Teacher Deleted', `${deletingTeacher.name} was removed.`);
      setDeletingTeacher(null);
      fetchTeachers();
    } catch (err: any) {
      console.error('Delete teacher error:', err);
      toast.error('Deletion Blocked', err.message || 'Cannot delete this teacher because related gatepasses exist.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {(['ALL', 'DEGREE', 'JUNIOR'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                levelFilter === lvl
                  ? 'bg-blue-600 text-white'
                  : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {lvl === 'ALL' ? 'All Faculty' : `${lvl} Teachers`}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Teacher</span>
        </button>
      </div>

      {/* Teachers List */}
      <Card
        title="Faculty & Teachers Directory"
        description="Teachers authorized to sign early-exit leave permission letters for students."
        icon={Award}
        action={
          <button
            type="button"
            onClick={fetchTeachers}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading faculty directory...</div>
        ) : teachers.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No teachers found for this level. Click "Add New Teacher" to register staff.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse">
              <thead>
                <tr>
                  <th scope="col" className="th">Teacher Name</th>
                  <th scope="col" className="th">Department</th>
                  <th scope="col" className="th">Teaching Level</th>
                  <th scope="col" className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="transition hover:bg-white/[0.02]">
                    <td className="td font-medium text-white">{t.name}</td>
                    <td className="td text-slate-300">{t.department || 'General'}</td>
                    <td className="td">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          t.teaching_level === 'DEGREE'
                            ? 'bg-blue-500/15 text-blue-300 border border-blue-400/30'
                            : 'bg-sky-500/15 text-sky-300 border border-sky-400/30'
                        }`}
                      >
                        {t.teaching_level}
                      </span>
                    </td>
                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                          title="Edit Teacher"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTeacher(t)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                          title="Delete Teacher"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={showCreateModal || !!editingTeacher}
        onClose={() => { setShowCreateModal(false); setEditingTeacher(null); }}
        title={editingTeacher ? `Edit ${editingTeacher.name}` : 'Add New Faculty / Teacher'}
        subtitle="Teachers authorized to sign student early-exit permission letters"
      >
            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div>
                <label className="label">Teacher Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prof. Ajith Rajendra"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. BCA / Computer Science / Physics"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Teaching Level</label>
                <select
                  value={teachingLevel}
                  onChange={(e) => setTeachingLevel(e.target.value as 'JUNIOR' | 'DEGREE')}
                  className="input"
                >
                  <option value="DEGREE">DEGREE (Undergraduate)</option>
                  <option value="JUNIOR">JUNIOR (11th &amp; 12th)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowCreateModal(false); setEditingTeacher(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isProcessing} className="btn-primary">
                  {isProcessing ? 'Saving...' : editingTeacher ? 'Update Teacher' : 'Create Teacher'}
                </button>
              </div>
            </form>
      </Modal>

      {/* Delete Confirmation */}
      {deletingTeacher && (
        <ConfirmDialog
          open
          title={`Delete ${deletingTeacher.name}?`}
          description="Are you sure you want to delete this teacher? Note: Deletion is blocked if related gatepasses reference this teacher."
          confirmLabel={isProcessing ? 'Deleting...' : 'Delete Teacher'}
          onCancel={() => setDeletingTeacher(null)}
          onConfirm={handleDeleteTeacher}
        />
      )}
    </div>
  );
}
