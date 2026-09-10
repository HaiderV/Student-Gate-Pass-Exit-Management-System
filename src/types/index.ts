export type StudentType = 'degree' | 'junior';

export type JuniorClass = '11th' | '12th';

export type GatePassStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export type ActivityStatus = 'ACTIVE' | 'COMPLETED' | 'REGISTERED';

export interface DegreeStudent {
  id: string;
  registrationNumber: string;
  name: string;
  course: string;
  year: string;
  section: string;
}

export interface JuniorStudent {
  id: string;
  uniqueNumber: number;
  name: string;
  className: JuniorClass;
  section: string;
}

export interface GatePass {
  id: string;
  /** Human readable pass id, e.g. GP-2026-00124 */
  passId: string;
  studentType: StudentType;
  studentName: string;
  section: string;
  reason: string;
  teacher: string;
  /** Display time, e.g. "02:30 PM" */
  expectedExit: string;
  status: GatePassStatus;
  /** ISO date (yyyy-mm-dd) the pass was created for */
  date: string;
  /** ISO datetime used for sorting */
  createdAt: string;
  /** Name of the mock proof file attached at reception */
  teacherProof?: string;
  /** Time the exit was recorded (set when status becomes USED) */
  exitTime?: string;
  // --- Degree-only fields ---
  registrationNumber?: string;
  course?: string;
  year?: string;
  // --- Junior-only fields ---
  uniqueNumber?: number;
  className?: JuniorClass;
}

export interface ExitRecord {
  id: string;
  studentName: string;
  studentType: StudentType;
  /** Registration number (degree) or unique number (junior) */
  identifier: string;
  reason?: string;
  gatePassId?: string;
  time: string;
  date: string;
}

export type ActivityAction = 'Gate Pass Created' | 'Exit Recorded' | 'Student Registered';

export interface Activity {
  id: string;
  studentName: string;
  type: StudentType;
  action: ActivityAction;
  time: string;
  createdAt: string;
  status: ActivityStatus;
}

export interface NewJuniorInput {
  name: string;
  className: JuniorClass;
  section: string;
}

export interface NewGatePassInput {
  studentType: StudentType;
  studentName: string;
  section: string;
  reason: string;
  teacher: string;
  expectedExit: string;
  teacherProof?: string;
  registrationNumber?: string;
  course?: string;
  year?: string;
  uniqueNumber?: number;
  className?: JuniorClass;
}

export const SECTION_OPTIONS = ['A', 'B', 'C'] as const;

export const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year'] as const;

export const REASON_OPTIONS = [
  'Medical',
  'Home Visit',
  'Family Function',
  'Emergency',
  'Personal Work',
  'Sports Practice',
  'Other',
] as const;
