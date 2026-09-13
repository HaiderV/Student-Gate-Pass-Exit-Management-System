import { useEffect, useState, type FormEvent } from 'react';
import {
  Edit,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import Modal from '@/components/common/Modal';
import Card from '@/components/common/Card';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import {
  createDegreeStudent,
  createJuniorStudent,
  deleteDegreeStudent,
  deleteJuniorStudent,
  getDegreeStudents,
  getJuniorStudents,
  searchDegreeStudents,
  searchJuniorStudents,
  updateDegreeStudent,
  updateJuniorStudent,
} from '@/lib/api';
import {
  COURSE_OPTIONS,
  JUNIOR_BOARD_OPTIONS,
  JUNIOR_CLASS_OPTIONS,
  JUNIOR_DEPARTMENT_OPTIONS,
  SECTION_OPTIONS,
  YEAR_OPTIONS,
  type DegreeStudent,
  type JuniorStudent,
} from '@/types';

export default function AdminStudentsTab() {
  const toast = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'degree' | 'junior'>('degree');
  const [degreeStudents, setDegreeStudents] = useState<DegreeStudent[]>([]);
  const [juniorStudents, setJuniorStudents] = useState<JuniorStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<DegreeStudent | JuniorStudent | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<{ id: string; name: string; type: 'degree' | 'junior' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form Fields for Create / Edit
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [course, setCourse] = useState('BCA');
  const [year, setYear] = useState('1st Year');
  const [section, setSection] = useState('A');
  const [department, setDepartment] = useState('Science');
  const [board, setBoard] = useState('CBSE');
  const [className, setClassName] = useState('11th');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'degree') {
        const data = await getDegreeStudents();
        setDegreeStudents(data);
      } else {
        const data = await getJuniorStudents();
        setJuniorStudents(data);
      }
    } catch (err: any) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [activeSubTab]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchStudents();
      return;
    }
    setLoading(true);
    try {
      if (activeSubTab === 'degree') {
        const res = await searchDegreeStudents(searchQuery);
        setDegreeStudents(res);
      } else {
        const res = await searchJuniorStudents(searchQuery);
        setJuniorStudents(res);
      }
    } catch (err: any) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setName('');
    setRegNumber('');
    setCourse('BCA');
    setYear('1st Year');
    setSection('A');
    setDepartment('Science');
    setBoard('CBSE');
    setClassName('11th');
    setShowCreateModal(true);
  };

  const openEditModal = (student: DegreeStudent | JuniorStudent) => {
    setEditingStudent(student);
    setName(student.name);
    setRegNumber(student.registration_number || student.registrationNumber || '');
    setSection(student.section || 'A');
    if ('course' in student && student.course) {
      setCourse(student.course);
      setYear(student.year || '1st Year');
    }
    if ('department' in student) {
      setDepartment(student.department || 'Science');
      setBoard(student.board || 'CBSE');
      setClassName(student.class_name || student.className || '11th');
    }
  };

  const handleSaveStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !regNumber.trim()) {
      toast.error('Validation Error', 'Name and Registration Number are required.');
      return;
    }

    setIsProcessing(true);
    try {
      if (editingStudent) {
        // Edit mode
        if (activeSubTab === 'degree') {
          await updateDegreeStudent(editingStudent.id, {
            name: name.trim(),
            registration_number: regNumber.trim().toUpperCase(),
            course: course.trim(),
            year: year.trim(),
            section: section.trim(),
          });
        } else {
          await updateJuniorStudent(editingStudent.id, {
            name: name.trim(),
            registration_number: regNumber.trim().toUpperCase(),
            department: department.trim(),
            board: board.trim(),
            class_name: className.trim(),
            section: section.trim(),
          });
        }
        toast.success('Student Updated', `${name} has been updated successfully.`);
        setEditingStudent(null);
      } else {
        // Create mode
        if (activeSubTab === 'degree') {
          await createDegreeStudent({
            name: name.trim(),
            registration_number: regNumber.trim().toUpperCase(),
            course: course.trim(),
            year: year.trim(),
            section: section.trim(),
          });
        } else {
          await createJuniorStudent({
            name: name.trim(),
            registration_number: regNumber.trim().toUpperCase(),
            department: department.trim(),
            board: board.trim(),
            class_name: className.trim(),
            section: section.trim(),
          });
        }
        toast.success('Student Created', `${name} added to ${activeSubTab} directory.`);
        setShowCreateModal(false);
      }
      fetchStudents();
    } catch (err: any) {
      console.error('Save student error:', err);
      toast.error('Operation Failed', err.message || 'Could not save student.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setIsProcessing(true);
    try {
      if (deletingStudent.type === 'degree') {
        await deleteDegreeStudent(deletingStudent.id);
      } else {
        await deleteJuniorStudent(deletingStudent.id);
      }
      toast.success('Student Deleted', `${deletingStudent.name} was removed.`);
      setDeletingStudent(null);
      fetchStudents();
    } catch (err: any) {
      console.error('Delete student error:', err);
      toast.error('Deletion Blocked', err.message || 'Cannot delete student because related records or gatepasses exist.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentList = activeSubTab === 'degree' ? degreeStudents : juniorStudents;

  return (
    <div className="space-y-6">
      {/* Header with Sub-tabs and Create Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('degree');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeSubTab === 'degree'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Degree Students ({degreeStudents.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('junior');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeSubTab === 'junior'
                ? 'bg-sky-600 text-white shadow-lg'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            Junior Students ({juniorStudents.length})
          </button>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add New {activeSubTab === 'degree' ? 'Degree' : 'Junior'} Student</span>
        </button>
      </div>

      {/* Search & Actions Bar */}
      <Card
        title={`${activeSubTab === 'degree' ? 'Degree' : 'Junior'} Students Directory`}
        description="Search, view, create, edit, or delete student records in the database."
        icon={activeSubTab === 'degree' ? GraduationCap : Users}
        action={
          <button
            type="button"
            onClick={fetchStudents}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      >
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search ${activeSubTab} students by name, reg number, course/department...`}
            className="input font-mono flex-1"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="btn-secondary flex items-center gap-1.5"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading student directory...</div>
        ) : currentList.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No students found matching your filter. Click "Add New Student" above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <th scope="col" className="th">Name</th>
                  <th scope="col" className="th">Registration No</th>
                  <th scope="col" className="th">
                    {activeSubTab === 'degree' ? 'Course / Year' : 'Dept / Class'}
                  </th>
                  <th scope="col" className="th">Section</th>
                  <th scope="col" className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((st) => (
                  <tr key={st.id} className="transition hover:bg-white/[0.02]">
                    <td className="td font-medium text-white">{st.name}</td>
                    <td className="td font-mono text-xs text-sky-300">{st.registration_number || st.registrationNumber}</td>
                    <td className="td text-slate-300">
                      {activeSubTab === 'degree'
                        ? `${(st as DegreeStudent).course} · ${(st as DegreeStudent).year}`
                        : `${(st as JuniorStudent).department || '—'} · ${(st as JuniorStudent).class_name || (st as JuniorStudent).className || '—'}`}
                    </td>
                    <td className="td text-slate-300">Section {st.section}</td>
                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(st)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                          title="Edit Student"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeletingStudent({
                              id: st.id,
                              name: st.name,
                              type: activeSubTab,
                            })
                          }
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                          title="Delete Student"
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
        open={showCreateModal || !!editingStudent}
        onClose={() => { setShowCreateModal(false); setEditingStudent(null); }}
        title={editingStudent ? `Edit ${editingStudent.name}` : `Add New ${activeSubTab === 'degree' ? 'Degree' : 'Junior'} Student`}
        subtitle={activeSubTab === 'degree' ? 'Undergraduate degree student record' : 'Junior college (11th / 12th) student record'}
      >
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Registration Number</label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  placeholder={activeSubTab === 'degree' ? 'e.g. D2026012 or 25BCA090' : 'e.g. JUN2026001'}
                  className="input font-mono uppercase"
                />
              </div>

              {activeSubTab === 'degree' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Course</label>
                      <select
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className="input"
                      >
                        {COURSE_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Year</label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="input"
                      >
                        {YEAR_OPTIONS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Department</label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="input"
                      >
                        {JUNIOR_DEPARTMENT_OPTIONS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Board</label>
                      <select
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        className="input"
                      >
                        {JUNIOR_BOARD_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Class</label>
                    <select
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="input"
                    >
                      {JUNIOR_CLASS_OPTIONS.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="label">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="input"
                >
                  {SECTION_OPTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingStudent(null); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary"
                >
                  {isProcessing ? 'Saving...' : editingStudent ? 'Update Student' : 'Create Student'}
                </button>
              </div>
            </form>
      </Modal>

      {/* Delete confirmation dialog */}
      {deletingStudent && (
        <ConfirmDialog
          open
          title={`Delete ${deletingStudent.name}?`}
          description="Are you sure you want to permanently delete this student record? Note: Deletion is blocked if related gatepasses exist in the database."
          confirmLabel={isProcessing ? 'Deleting...' : 'Delete Student'}
          onCancel={() => setDeletingStudent(null)}
          onConfirm={handleDeleteStudent}
        />
      )}
    </div>
  );
}
