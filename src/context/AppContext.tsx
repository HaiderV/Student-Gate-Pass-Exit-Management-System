import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  Activity,
  ActivityAction,
  ActivityStatus,
  DegreeStudent,
  ExitRecord,
  GatePass,
  JuniorStudent,
  NewGatePassInput,
  NewJuniorInput,
  StudentType,
} from '@/types';
import {
  seedActivities,
  seedDegreeStudents,
  seedExitRecords,
  seedGatePasses,
  seedJuniorStudents,
} from '@/data/mockData';
import { nowISO, nowTime12, todayISO } from '@/lib/format';
import { nextAvailableNumber } from '@/lib/students';

/**
 * Global mock-data store.
 * Reception -> Security -> Admin all share this state, so a gate pass
 * created in reception instantly appears on the security portal.
 * When a backend is added later, these action creators are the place
 * to swap local reducers for API calls.
 */

interface AppState {
  degreeStudents: DegreeStudent[];
  juniorStudents: JuniorStudent[];
  gatePasses: GatePass[];
  exitRecords: ExitRecord[];
  activities: Activity[];
  /** Counter used to build the next pass id (GP-2026-XXXXX). */
  passCounter: number;
}

type AppAction =
  | { type: 'REGISTER_JUNIOR'; payload: NewJuniorInput }
  | { type: 'CREATE_GATE_PASS'; payload: NewGatePassInput }
  | { type: 'MARK_PASS_EXITED'; payload: { passId: string } }
  | { type: 'RECORD_JUNIOR_EXIT'; payload: { studentId: string } }
  | { type: 'RESET_DEMO' };

const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const initialState: AppState = {
  degreeStudents: seedDegreeStudents,
  juniorStudents: seedJuniorStudents,
  gatePasses: seedGatePasses,
  exitRecords: seedExitRecords,
  activities: seedActivities,
  passCounter: 124,
};

/**
 * Local persistence — keeps the demo alive across page reloads while staying
 * frontend-only. Stored data is kept for the current day only, so every new
 * day starts with fresh sample data. Swap this for API calls when a backend
 * is connected later.
 */
const STORAGE_KEY = 'caias-sems-state-v1';

interface StoredState {
  date: string;
  state: AppState;
}

function loadInitialState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredState | null;
      if (parsed && parsed.date === todayISO() && parsed.state && Array.isArray(parsed.state.gatePasses)) {
        return parsed.state;
      }
    }
  } catch {
    // Corrupted or unavailable storage — fall back to fresh seeds.
  }
  return initialState;
}

function pushActivity(
  state: AppState,
  studentName: string,
  type: StudentType,
  action: ActivityAction,
  status: ActivityStatus,
): Activity[] {
  const entry: Activity = {
    id: uid(),
    studentName,
    type,
    action,
    status,
    time: nowTime12(),
    createdAt: nowISO(),
  };
  return [entry, ...state.activities].slice(0, 30);
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'REGISTER_JUNIOR': {
      const uniqueNumber = nextAvailableNumber(state.juniorStudents);
      const student: JuniorStudent = {
        id: uid(),
        uniqueNumber,
        name: action.payload.name,
        className: action.payload.className,
        section: action.payload.section,
      };
      return {
        ...state,
        juniorStudents: [...state.juniorStudents, student],
        activities: pushActivity(
          state,
          student.name,
          'junior',
          'Student Registered',
          'REGISTERED',
        ),
      };
    }

    case 'CREATE_GATE_PASS': {
      const passId = `GP-2026-${String(state.passCounter).padStart(5, '0')}`;
      const pass: GatePass = {
        id: uid(),
        passId,
        status: 'ACTIVE',
        date: todayISO(),
        createdAt: nowISO(),
        ...action.payload,
      };
      return {
        ...state,
        gatePasses: [pass, ...state.gatePasses],
        passCounter: state.passCounter + 1,
        activities: pushActivity(
          state,
          pass.studentName,
          pass.studentType,
          'Gate Pass Created',
          'ACTIVE',
        ),
      };
    }

    case 'MARK_PASS_EXITED': {
      const pass = state.gatePasses.find((p) => p.id === action.payload.passId);
      if (!pass || pass.status !== 'ACTIVE') return state;
      const time = nowTime12();
      const record: ExitRecord = {
        id: uid(),
        studentName: pass.studentName,
        studentType: pass.studentType,
        identifier:
          pass.studentType === 'degree'
            ? pass.registrationNumber ?? '—'
            : String(pass.uniqueNumber ?? '—'),
        reason: pass.reason,
        gatePassId: pass.passId,
        time,
        date: todayISO(),
      };
      return {
        ...state,
        gatePasses: state.gatePasses.map((p) =>
          p.id === pass.id ? { ...p, status: 'USED', exitTime: time } : p,
        ),
        exitRecords: [record, ...state.exitRecords],
        activities: pushActivity(state, pass.studentName, pass.studentType, 'Exit Recorded', 'COMPLETED'),
      };
    }

    case 'RECORD_JUNIOR_EXIT': {
      const student = state.juniorStudents.find((s) => s.id === action.payload.studentId);
      if (!student) return state;
      const time = nowTime12();
      const record: ExitRecord = {
        id: uid(),
        studentName: student.name,
        studentType: 'junior',
        identifier: String(student.uniqueNumber),
        time,
        date: todayISO(),
      };
      return {
        ...state,
        exitRecords: [record, ...state.exitRecords],
        activities: pushActivity(state, student.name, 'junior', 'Exit Recorded', 'COMPLETED'),
      };
    }

    case 'RESET_DEMO':
      return initialState;

    default:
      return state;
  }
}

export interface AppContextValue {
  state: AppState;
  /** Registers a junior student and assigns the next available numeric unique number. */
  registerJuniorStudent: (input: NewJuniorInput) => JuniorStudent;
  /** Creates an ACTIVE gate pass and returns it (with its generated pass id). */
  createGatePass: (input: NewGatePassInput) => GatePass;
  /** Marks an ACTIVE gate pass as USED and records the exit. */
  markGatePassExited: (passId: string) => void;
  /** Records a normal junior exit (no gate pass involved). */
  recordJuniorExit: (studentId: string) => void;
  /** Next available junior unique number (preview). */
  getNextJuniorNumber: () => number;
  /** Clears local storage and restores fresh sample data. */
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    try {
      const stored: StoredState = { date: todayISO(), state };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Storage full or unavailable — in-memory state keeps working.
    }
  }, [state]);

  const registerJuniorStudent = useCallback((input: NewJuniorInput): JuniorStudent => {
    const used = new Set(state.juniorStudents.map((s) => s.uniqueNumber));
    let next = 1;
    while (used.has(next)) next += 1;
    dispatch({ type: 'REGISTER_JUNIOR', payload: input });
    return { id: `preview-${next}`, uniqueNumber: next, name: input.name, className: input.className, section: input.section };
  }, [state.juniorStudents]);

  const createGatePass = useCallback((input: NewGatePassInput): GatePass => {
    const passId = `GP-2026-${String(state.passCounter).padStart(5, '0')}`;
    dispatch({ type: 'CREATE_GATE_PASS', payload: input });
    return {
      id: 'preview',
      passId,
      status: 'ACTIVE',
      date: todayISO(),
      createdAt: nowISO(),
      ...input,
    };
  }, [state.passCounter]);

  const markGatePassExited = useCallback((passId: string) => {
    dispatch({ type: 'MARK_PASS_EXITED', payload: { passId } });
  }, []);

  const recordJuniorExit = useCallback((studentId: string) => {
    dispatch({ type: 'RECORD_JUNIOR_EXIT', payload: { studentId } });
  }, []);

  const getNextJuniorNumber = useCallback(
    () => nextAvailableNumber(state.juniorStudents),
    [state.juniorStudents],
  );

  const resetDemoData = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    dispatch({ type: 'RESET_DEMO' });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      registerJuniorStudent,
      createGatePass,
      markGatePassExited,
      recordJuniorExit,
      getNextJuniorNumber,
      resetDemoData,
    }),
    [state, registerJuniorStudent, createGatePass, markGatePassExited, recordJuniorExit, getNextJuniorNumber, resetDemoData],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
