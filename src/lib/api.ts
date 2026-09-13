import type {
  AdminSummaryData,
  AdminTodayData,
  AuditLog,
  BackendGatePass,
  CalendarDaySummary,
  DailyReportSummary,
  DegreeStudent,
  JuniorStudent,
  JuniorUniqueNumber,
  Teacher,
} from '@/types';

const BASE_URL = import.meta.env.VITE_BACKEND_API || 'http://localhost:3000';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg =
      (typeof data === 'object' && (data.error || data.message)) ||
      (typeof data === 'string' ? data : `Request failed with status ${response.status}`);
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}

// ==========================================
// TEACHERS API
// ==========================================

export async function getTeachers(level?: 'JUNIOR' | 'DEGREE'): Promise<Teacher[]> {
  const url = level ? `${BASE_URL}/api/teachers?level=${level}` : `${BASE_URL}/api/teachers`;
  const res = await fetch(url);
  const json = await handleResponse<{ success: boolean; data: Teacher[] }>(res);
  return json.data || [];
}

export async function getTeacherById(id: string): Promise<Teacher> {
  const res = await fetch(`${BASE_URL}/api/teachers/${id}`);
  const json = await handleResponse<{ success: boolean; data: Teacher }>(res);
  return json.data;
}

export async function createTeacher(data: {
  name: string;
  department?: string;
  teaching_level: 'JUNIOR' | 'DEGREE';
}): Promise<Teacher> {
  const res = await fetch(`${BASE_URL}/api/teachers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await handleResponse<{ message: string; teacher: Teacher }>(res);
  return json.teacher;
}

export async function updateTeacher(
  id: string,
  data: { name: string; department?: string; teaching_level: 'JUNIOR' | 'DEGREE' }
): Promise<Teacher> {
  const res = await fetch(`${BASE_URL}/api/teachers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await handleResponse<{ message: string; teacher: Teacher }>(res);
  return json.teacher;
}

export async function deleteTeacher(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/teachers/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<{ message: string }>(res);
}

// ==========================================
// DEGREE STUDENTS API
// ==========================================

export async function getDegreeStudents(): Promise<DegreeStudent[]> {
  const res = await fetch(`${BASE_URL}/api/degree/students`);
  const json = await handleResponse<{ count: number; students: DegreeStudent[] }>(res);
  return json.students || [];
}

export async function searchDegreeStudents(query: string): Promise<DegreeStudent[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${BASE_URL}/api/degree/students/search?search=${encodeURIComponent(query.trim())}`);
  if (res.status === 404) return [];
  const json = await handleResponse<{ count: number; students: DegreeStudent[] }>(res);
  return json.students || [];
}

export async function getDegreeStudentById(id: string): Promise<DegreeStudent> {
  const res = await fetch(`${BASE_URL}/api/degree/students/${id}`);
  const json = await handleResponse<{ student: DegreeStudent }>(res);
  return json.student;
}

export async function createDegreeStudent(data: {
  name: string;
  registration_number: string;
  course: string;
  year: string;
  section: string;
}): Promise<DegreeStudent> {
  const res = await fetch(`${BASE_URL}/api/degree/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await handleResponse<{ message: string; student: DegreeStudent }>(res);
  return json.student;
}

export async function updateDegreeStudent(
  id: string,
  data: {
    name: string;
    registration_number: string;
    course: string;
    year: string;
    section: string;
  }
): Promise<DegreeStudent> {
  const res = await fetch(`${BASE_URL}/api/degree/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await handleResponse<{ message: string; student: DegreeStudent }>(res);
  return json.student;
}

export async function deleteDegreeStudent(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/degree/students/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<{ message: string }>(res);
}

// ==========================================
// JUNIOR STUDENTS API
// ==========================================

export async function getJuniorStudents(): Promise<JuniorStudent[]> {
  const res = await fetch(`${BASE_URL}/api/junior/students`);
  const json = await handleResponse<{ count: number; students: JuniorStudent[] }>(res);
  return json.students || [];
}

export async function searchJuniorStudents(query: string): Promise<JuniorStudent[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${BASE_URL}/api/junior/students/search?search=${encodeURIComponent(query.trim())}`);
  if (res.status === 404) return [];
  const json = await handleResponse<{ count: number; students: JuniorStudent[] }>(res);
  return json.students || [];
}

export async function getJuniorStudentById(id: string): Promise<JuniorStudent> {
  const res = await fetch(`${BASE_URL}/api/junior/students/${id}`);
  const json = await handleResponse<{ student: JuniorStudent }>(res);
  return json.student;
}

export async function createJuniorStudent(data: {
  name: string;
  registration_number: string;
  department: string;
  board: string;
  class_name: string;
  section: string;
}): Promise<JuniorStudent> {
  const res = await fetch(`${BASE_URL}/api/junior/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await handleResponse<{ message: string; student: JuniorStudent }>(res);
  return json.student;
}

export async function updateJuniorStudent(
  id: string,
  data: {
    name: string;
    registration_number: string;
    department: string;
    board: string;
    class_name: string;
    section: string;
  }
): Promise<JuniorStudent> {
  const res = await fetch(`${BASE_URL}/api/junior/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await handleResponse<{ message: string; student: JuniorStudent }>(res);
  return json.student;
}

export async function deleteJuniorStudent(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/junior/students/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<{ message: string }>(res);
}

// ==========================================
// JUNIOR UNIQUE NUMBERS API
// ==========================================

export async function assignJuniorUniqueNumber(registration_number: string): Promise<{
  message: string;
  uniqueNumber: number | { unique_number: number };
  student: JuniorStudent;
}> {
  const res = await fetch(`${BASE_URL}/api/junior/unique-number`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registration_number }),
  });
  return handleResponse(res);
}

export async function getJuniorUniqueNumber(uniqueNumber: number | string): Promise<{
  uniqueNumber: JuniorUniqueNumber;
  student: JuniorStudent;
  gatepass: BackendGatePass | null;
}> {
  const res = await fetch(`${BASE_URL}/api/junior/unique-number/${uniqueNumber}`);
  return handleResponse(res);
}

export async function getJuniorUniqueNumbers(): Promise<JuniorUniqueNumber[]> {
  const res = await fetch(`${BASE_URL}/api/junior/unique-numbers`);
  const json = await handleResponse<{ count: number; uniqueNumbers: JuniorUniqueNumber[] }>(res);
  return json.uniqueNumbers || [];
}

// ==========================================
// DEGREE GATEPASSES API
// ==========================================

export async function getDegreeGatepasses(): Promise<BackendGatePass[]> {
  const res = await fetch(`${BASE_URL}/api/degree/gatepasses`);
  const json = await handleResponse<{ count: number; gatepasses: BackendGatePass[] }>(res);
  return json.gatepasses || [];
}

export async function searchDegreeGatepasses(query: string): Promise<BackendGatePass[]> {
  const res = await fetch(`${BASE_URL}/api/degree/gatepasses/search?search=${encodeURIComponent(query)}`);
  if (res.status === 404) return [];
  const json = await handleResponse<{ count: number; gatepasses: BackendGatePass[] }>(res);
  return json.gatepasses || [];
}

export async function getDegreeGatepassesByRegistration(regNumber: string): Promise<BackendGatePass[]> {
  const res = await fetch(`${BASE_URL}/api/degree/gatepasses/student/${encodeURIComponent(regNumber)}`);
  if (res.status === 404) return [];
  const json = await handleResponse<{ count: number; gatepasses: BackendGatePass[] }>(res);
  return json.gatepasses || [];
}

export async function createDegreeGatepass(formData: FormData): Promise<{
  success: boolean;
  message: string;
  gatepass: BackendGatePass;
}> {
  const res = await fetch(`${BASE_URL}/api/degree/gatepasses`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function updateDegreeGatepass(
  id: string,
  data: { reason?: string; teacher_id?: string; expires_at?: string }
): Promise<{ message: string; gatepass: BackendGatePass }> {
  const res = await fetch(`${BASE_URL}/api/degree/gatepasses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function cancelDegreeGatepass(id: string): Promise<{
  message: string;
  gatepass: BackendGatePass;
}> {
  const res = await fetch(`${BASE_URL}/api/degree/gatepasses/${id}/cancel`, {
    method: 'PATCH',
  });
  return handleResponse(res);
}

export async function markDegreeGatepassExited(id: string): Promise<{
  success: boolean;
  message: string;
  gatepass: BackendGatePass;
}> {
  const res = await fetch(`${BASE_URL}/api/degree/gatepasses/${id}/exit`, {
    method: 'PATCH',
  });
  return handleResponse(res);
}

export async function deleteDegreeGatepass(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/degree/gatepasses/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<{ message: string }>(res);
}

// ==========================================
// JUNIOR GATEPASSES API
// ==========================================

export async function getJuniorGatepasses(): Promise<BackendGatePass[]> {
  const res = await fetch(`${BASE_URL}/api/junior/gatepasses`);
  const json = await handleResponse<{ count: number; gatepasses: BackendGatePass[] }>(res);
  return json.gatepasses || [];
}

export async function searchJuniorGatepasses(query: string): Promise<BackendGatePass[]> {
  const res = await fetch(`${BASE_URL}/api/junior/gatepasses/search?search=${encodeURIComponent(query)}`);
  if (res.status === 404) return [];
  const json = await handleResponse<{ count: number; gatepasses: BackendGatePass[] }>(res);
  return json.gatepasses || [];
}

export async function getJuniorGatepassesByRegistration(regNumber: string): Promise<BackendGatePass[]> {
  const res = await fetch(`${BASE_URL}/api/junior/gatepasses/student/${encodeURIComponent(regNumber)}`);
  if (res.status === 404) return [];
  const json = await handleResponse<{ count: number; gatepasses: BackendGatePass[] }>(res);
  return json.gatepasses || [];
}

export async function createJuniorGatepass(formData: FormData): Promise<{
  success: boolean;
  message: string;
  gatepass: BackendGatePass;
}> {
  const res = await fetch(`${BASE_URL}/api/junior/gatepasses`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function updateJuniorGatepass(
  id: string,
  data: { reason?: string; teacher_id?: string; expires_at?: string }
): Promise<{ message: string; gatepass: BackendGatePass }> {
  const res = await fetch(`${BASE_URL}/api/junior/gatepasses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function cancelJuniorGatepass(id: string): Promise<{
  message: string;
  gatepass: BackendGatePass;
}> {
  const res = await fetch(`${BASE_URL}/api/junior/gatepasses/${id}/cancel`, {
    method: 'PATCH',
  });
  return handleResponse(res);
}

export async function markJuniorGatepassExited(id: string): Promise<{
  success: boolean;
  message: string;
  gatepass: BackendGatePass;
}> {
  const res = await fetch(`${BASE_URL}/api/junior/gatepasses/${id}/exit`, {
    method: 'PATCH',
  });
  return handleResponse(res);
}

export async function deleteJuniorGatepass(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/junior/gatepasses/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<{ message: string }>(res);
}

// ==========================================
// EXITS WORKFLOW API
// ==========================================

export async function recordDegreeExit(registration_number: string): Promise<{
  message: string;
  student: DegreeStudent;
  gatepass: BackendGatePass;
}> {
  const res = await fetch(`${BASE_URL}/api/degree/exit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registration_number }),
  });
  return handleResponse(res);
}

export async function recordJuniorExit(unique_number: number): Promise<{
  message: string;
  student: JuniorStudent;
  uniqueNumber: JuniorUniqueNumber;
  gatepass: BackendGatePass;
}> {
  const res = await fetch(`${BASE_URL}/api/junior/exit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unique_number }),
  });
  return handleResponse(res);
}

export async function recordJuniorExitByRegistration(registration_number: string): Promise<{
  message: string;
  student: JuniorStudent;
  uniqueNumber: JuniorUniqueNumber;
  gatepass: BackendGatePass;
}> {
  const res = await fetch(`${BASE_URL}/api/junior/exit/registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registration_number }),
  });
  return handleResponse(res);
}

// ==========================================
// ADMIN DASHBOARD & AUDIT API
// ==========================================

export async function getAdminSummary(): Promise<AdminSummaryData> {
  const res = await fetch(`${BASE_URL}/api/admin/summary`);
  return handleResponse(res);
}

export async function getAdminToday(): Promise<AdminTodayData> {
  const res = await fetch(`${BASE_URL}/api/admin/today`);
  return handleResponse(res);
}

export async function getAdminAuditLogs(params?: {
  from?: string;
  to?: string;
  actor_type?: string;
  action?: string;
  entity_type?: string;
}): Promise<AuditLog[]> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.actor_type) query.set('actor_type', params.actor_type);
  if (params?.action) query.set('action', params.action);
  if (params?.entity_type) query.set('entity_type', params.entity_type);

  const url = `${BASE_URL}/api/admin/audit-logs${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);
  const json = await handleResponse<{ count: number; logs: AuditLog[] }>(res);
  return json.logs || [];
}

export async function getAdminCalendar(month: string): Promise<{ month: string; days: CalendarDaySummary[] }> {
  const res = await fetch(`${BASE_URL}/api/admin/calendar?month=${encodeURIComponent(month)}`);
  return handleResponse(res);
}

export async function getAdminDailyReport(date: string): Promise<{
  date: string;
  summary: DailyReportSummary;
  degree: DailyReportSummary;
  junior: DailyReportSummary;
  events: any[];
  auditLogs: AuditLog[];
}> {
  const res = await fetch(`${BASE_URL}/api/admin/daily-report?date=${encodeURIComponent(date)}`);
  return handleResponse(res);
}

export async function getAdminRangeReport(
  from: string,
  to: string
): Promise<{
  from: string;
  to: string;
  summary: DailyReportSummary;
  degree: DailyReportSummary;
  junior: DailyReportSummary;
  auditActivity: { count: number; logs: AuditLog[] };
  events: any[];
}> {
  const res = await fetch(`${BASE_URL}/api/admin/report?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  return handleResponse(res);
}

export async function getAdminActiveGatepasses(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/api/admin/active-gatepasses`);
  const json = await handleResponse<{ count: number; gatepasses: any[] }>(res);
  return json.gatepasses || [];
}
