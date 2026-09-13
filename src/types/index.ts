export type StudentType = 'degree' | 'junior';

export type JuniorClass = '11th' | '12th' | '10th' | string;

export type GatePassStatus = 'ACTIVE' | 'EXITED' | 'CANCELLED' | 'USED' | 'EXPIRED';

export type TeachingLevel = 'JUNIOR' | 'DEGREE' | 'BOTH';

export type ActivityStatus = 'ACTIVE' | 'COMPLETED' | 'REGISTERED';
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

export interface ExitRecord {
  id: string;
  studentName: string;
  studentType: StudentType;
  identifier: string;
  reason?: string;
  gatePassId?: string;
  time: string;
  date: string;
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

export interface Teacher {
  id: string;
  name: string;
  department: string | null;
  teaching_level: 'JUNIOR' | 'DEGREE' | 'BOTH';
  created_at?: string;
}

export interface DegreeStudent {
  id: string;
  registration_number?: string;
  registrationNumber?: string;
  name: string;
  course: string;
  year: string;
  section: string;
  created_at?: string;
}

export interface JuniorStudent {
  id: string;
  registration_number?: string;
  registrationNumber?: string;
  name: string;
  department?: string;
  board?: string;
  class_name?: string;
  className?: JuniorClass;
  section: string;
  created_at?: string;
  unique_number?: number;
  uniqueNumber?: number;
}

export interface JuniorUniqueNumber {
  id: string;
  student_id: string;
  unique_number: number;
  assigned_at: string;
  is_active: boolean;
  student?: JuniorStudent;
}

export interface BackendGatePass {
  id: string;
  student_id: string;
  teacher_id: string;
  reason: string;
  signed_letter_url?: string;
  status: 'ACTIVE' | 'EXITED' | 'CANCELLED';
  created_at: string;
  exit_time?: string | null;
  expires_at?: string | null;
  student?: DegreeStudent | JuniorStudent | null;
  teacher?: Teacher | null;
}

export interface GatePass {
  id: string;
  passId: string;
  studentType: StudentType;
  studentName: string;
  section: string;
  reason: string;
  teacher: string;
  expectedExit: string;
  status: GatePassStatus;
  date: string;
  createdAt: string;
  teacherProof?: string;
  signedLetterUrl?: string;
  exitTime?: string;
  studentId?: string;
  teacherId?: string;
  registrationNumber?: string;
  course?: string;
  year?: string;
  uniqueNumber?: number;
  className?: JuniorClass;
  department?: string;
}

export interface AuditLog {
  id: string;
  actor_type: 'RECEPTION' | 'SECURITY' | 'ADMIN' | 'SYSTEM' | string;
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  created_at: string;
}

export interface DailyReportSummary {
  total: number;
  totalEvents?: number;
  created: number;
  exited: number;
  cancelled: number;
}

export interface CalendarDaySummary {
  date: string;
  total: number;
  totalEvents?: number;
  created: number;
  exited: number;
  cancelled: number;
  degree: number;
  junior: number;
}

export interface AdminSummaryData {
  students: {
    totalDegreeStudents: number;
    totalJuniorStudents: number;
    totalStudents: number;
  };
  teachers: {
    totalTeachers: number;
  };
  gatepasses: {
    totalDegreeGatepasses: number;
    totalJuniorGatepasses: number;
    totalGatepasses: number;
    activeGatepasses: number;
    exitedGatepasses: number;
    cancelledGatepasses: number;
  };
  juniorUniqueNumbers: {
    totalAssignedUniqueNumbers: number;
    activeUniqueNumbers: number;
  };
  recentAuditLogs: AuditLog[];
}

export interface AdminTodayData {
  date: string;
  totalGatepassesCreated: number;
  activeGatepasses: number;
  exitedGatepasses: number;
  cancelledGatepasses: number;
  degreeCount: number;
  juniorCount: number;
  recentEvents: any[];
}

export const COURSE_OPTIONS = ['BCA', 'BBA', 'BCOM', 'BSC', 'BA'] as const;
export const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'] as const;
export const JUNIOR_CLASS_OPTIONS = ['11th', '12th'] as const;
export const JUNIOR_DEPARTMENT_OPTIONS = ['Commerce', 'Arts', 'Science'] as const;
export const JUNIOR_BOARD_OPTIONS = ['PUC', 'CBSE', 'ISC'] as const;
export const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

export const REASON_OPTIONS = [
  'Medical',
  'Home Visit',
  'Family Function',
  'Emergency',
  'Personal Work',
  'Sports Practice',
  'College Event',
  'Other',
] as const;

