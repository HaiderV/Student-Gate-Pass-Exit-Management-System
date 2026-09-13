import type { DegreeStudent, GatePass, JuniorStudent } from '@/types';

/**
 * The next available short numeric unique number for a junior student.
 * Numbers start at 1 and stay sequential — gaps are filled first.
 */
export function nextAvailableNumber(students: JuniorStudent[]): number {
  const used = new Set(
    students
      .map((s) => s.uniqueNumber ?? s.unique_number)
      .filter((n): n is number => typeof n === 'number')
  );
  let next = 1;
  while (used.has(next)) next += 1;
  return next;
}

export interface DegreeStudentProfile {
  name: string;
  registrationNumber: string;
  course: string;
  year: string;
  section: string;
}

/**
 * Find a degree student by registration number (case-insensitive).
 * Falls back to deriving the profile from the most recent gate pass,
 * so passes created at reception for walk-in students remain searchable.
 */
export function findDegreeStudent(
  students: DegreeStudent[],
  passes: GatePass[],
  query: string,
): DegreeStudentProfile | null {
  const q = query.trim().toUpperCase();
  if (!q) return null;

  const fromDirectory = students.find((s) => {
    const reg = s.registration_number || s.registrationNumber;
    return reg && reg.toUpperCase() === q;
  });
  if (fromDirectory) {
    return {
      name: fromDirectory.name,
      registrationNumber: fromDirectory.registration_number || fromDirectory.registrationNumber || q,
      course: fromDirectory.course,
      year: fromDirectory.year,
      section: fromDirectory.section,
    };
  }

  const fromPass = passes
    .filter((p) => p.studentType === 'degree' && p.registrationNumber?.toUpperCase() === q)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (fromPass) {
    return {
      name: fromPass.studentName,
      registrationNumber: fromPass.registrationNumber ?? q,
      course: fromPass.course ?? '—',
      year: fromPass.year ?? '—',
      section: fromPass.section,
    };
  }

  return null;
}

export interface JuniorStudentProfile {
  id: string;
  name: string;
  uniqueNumber: number;
  className: string;
  section: string;
}

/**
 * Find a junior student by their short numeric unique number.
 * Falls back to deriving the profile from the most recent gate pass.
 */
export function findJuniorStudent(
  students: JuniorStudent[],
  passes: GatePass[],
  query: string,
): JuniorStudentProfile | null {
  const q = query.trim();
  if (!q || !/^\d+$/.test(q)) return null;
  const num = parseInt(q, 10);

  const fromDirectory = students.find((s) => (s.uniqueNumber ?? s.unique_number) === num);
  if (fromDirectory) {
    return {
      id: fromDirectory.id,
      name: fromDirectory.name,
      uniqueNumber: fromDirectory.uniqueNumber ?? fromDirectory.unique_number ?? num,
      className: fromDirectory.class_name || fromDirectory.className || '—',
      section: fromDirectory.section,
    };
  }

  const fromPass = passes
    .filter((p) => p.studentType === 'junior' && p.uniqueNumber === num)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (fromPass) {
    return {
      id: '',
      name: fromPass.studentName,
      uniqueNumber: num,
      className: fromPass.className ?? '—',
      section: fromPass.section,
    };
  }

  return null;
}

/** Sort gate passes newest-first (by creation time). */
export function sortPassesNewestFirst(passes: GatePass[]): GatePass[] {
  return [...passes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
