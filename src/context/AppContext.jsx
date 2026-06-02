// src/context/AppContext.jsx
import { createContext, useContext, useReducer, useCallback } from 'react';
import {
  DEFAULT_EMPLOYEES, DEFAULT_LEAVES, DEFAULT_OFF_REQUESTS,
  DEFAULT_BUSY_DAYS, DEFAULT_SETTINGS, DEFAULT_RULES, SHIFT_OPTIONS
} from '../data/initialData';
import { generateRoster, validateRoster, getDailySummary, getDaysInMonth } from '../utils/rosterEngine';

const AppContext = createContext(null);

const initialState = {
  shiftOptions: SHIFT_OPTIONS,
  employees:    DEFAULT_EMPLOYEES,
  leaves:       DEFAULT_LEAVES,
  offRequests:  DEFAULT_OFF_REQUESTS,
  busyDays:     DEFAULT_BUSY_DAYS,
  settings:     DEFAULT_SETTINGS,
  rules:        DEFAULT_RULES,
  roster:       {},       // empId -> { day -> shiftCode }
  stats:        {},       // empId -> { workDays, offDays, nightDays, leaveDays }
  dailySummary: {},       // day -> { onDuty, offCount, nightCount, leaveCount }
  busyMap:      {},       // day -> { level, occupancy, required }
  manualEdits:  {},       // "empId-day" -> { oldShift, newShift, reason, time }
  editLog:      [],       // [{time, empName, day, oldShift, newShift, reason}]
  alerts:       [],
  rosterGenerated: false,
  activeTab:    'dashboard',
  toasts:       [],
};

function reducer(state, action) {
  switch (action.type) {

    case 'SET_TAB':
      return { ...state, activeTab: action.payload };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'UPDATE_RULES':
      return { ...state, rules: { ...state.rules, ...action.payload } };

    case 'UPDATE_SHIFT_OPTIONS':
      return { ...state, shiftOptions: action.payload };

    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };

    case 'ADD_EMPLOYEE': {
      const newEmp = { ...action.payload, id: action.payload.id || Date.now() };
      return { ...state, employees: [...state.employees, newEmp] };
    }

    case 'BULK_ADD_EMPLOYEES': {
      // payload should be an array of employee objects
      const maxId = state.employees.length > 0 ? Math.max(...state.employees.map(e => e.id)) : 1000;
      const newEmployees = action.payload.map((emp, i) => ({ ...emp, id: maxId + 1 + i }));
      return { ...state, employees: [...state.employees, ...newEmployees] };
    }

    case 'UPDATE_EMPLOYEE': {
      const updated = state.employees.map(e =>
        e.id === action.payload.id ? { ...e, ...action.payload } : e
      );
      return { ...state, employees: updated };
    }

    case 'DELETE_EMPLOYEE':
      return { ...state, employees: state.employees.filter(e => e.id !== action.payload) };

    case 'SET_LEAVES':
      return { ...state, leaves: action.payload };

    case 'ADD_LEAVE': {
      const emp = state.employees.find(e => e.id === Number(action.payload.empId));
      const newLeave = {
        ...action.payload,
        id: Date.now(),
        empName: emp?.name || '',
      };
      return { ...state, leaves: [...state.leaves, newLeave] };
    }

    case 'UPDATE_LEAVE': {
      const updated = state.leaves.map(l =>
        l.id === action.payload.id ? { ...l, ...action.payload } : l
      );
      return { ...state, leaves: updated };
    }

    case 'DELETE_LEAVE':
      return { ...state, leaves: state.leaves.filter(l => l.id !== action.payload) };

    case 'ADD_OFF_REQUEST': {
      const emp = state.employees.find(e => e.id === Number(action.payload.empId));
      const newOff = {
        ...action.payload,
        id: Date.now(),
        empName: emp?.name || '',
      };
      return { ...state, offRequests: [...state.offRequests, newOff] };
    }

    case 'UPDATE_OFF_REQUEST': {
      const updated = state.offRequests.map(r =>
        r.id === action.payload.id ? { ...r, ...action.payload } : r
      );
      return { ...state, offRequests: updated };
    }

    case 'DELETE_OFF_REQUEST':
      return { ...state, offRequests: state.offRequests.filter(r => r.id !== action.payload) };

    case 'BULK_ADD_OFF_REQUESTS': {
      const maxId = state.offRequests.length > 0 ? Math.max(...state.offRequests.map(e => e.id)) : Date.now();
      const newOffRequests = action.payload.map((req, i) => ({ ...req, id: maxId + 1 + i }));
      return { ...state, offRequests: [...state.offRequests, ...newOffRequests] };
    }

    case 'ADD_BUSY_DAY': {
      const newBd = { ...action.payload, id: Date.now() };
      return { ...state, busyDays: [...state.busyDays, newBd] };
    }

    case 'UPDATE_BUSY_DAY': {
      const updated = state.busyDays.map(b =>
        b.id === action.payload.id ? { ...b, ...action.payload } : b
      );
      return { ...state, busyDays: updated };
    }

    case 'DELETE_BUSY_DAY':
      return { ...state, busyDays: state.busyDays.filter(b => b.id !== action.payload) };

    case 'GENERATE_ROSTER': {
      const { roster, stats, dailyOffCount, numDays, busyMap } =
        generateRoster(
          state.employees, state.leaves, state.offRequests,
          state.busyDays, state.settings, state.rules
        );
      const dailySummary = getDailySummary(roster, state.employees, numDays);
      const alerts = validateRoster(
        roster, stats, state.employees, state.busyDays,
        state.settings, state.rules, {}
      );
      return {
        ...state,
        roster,
        stats,
        dailySummary,
        busyMap,
        alerts,
        manualEdits: {},
        editLog: [],
        rosterGenerated: true,
      };
    }

    case 'MANUAL_EDIT_CELL': {
      const { empId, day, newShift, reason, empName } = action.payload;
      const key = `${empId}-${day}`;
      const oldShift = state.roster[empId]?.[day] || '';

      // Update roster
      const newRoster = {
        ...state.roster,
        [empId]: { ...state.roster[empId], [day]: newShift },
      };

      // Track manual edit
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newManualEdits = {
        ...state.manualEdits,
        [key]: { oldShift, newShift, reason: reason || '', time: timeStr, empName, day },
      };

      // Add to edit log
      const logEntry = {
        id: Date.now(),
        time: timeStr,
        empId,
        empName,
        day,
        oldShift,
        newShift,
        reason: reason || 'Manual edit',
      };

      // Recalculate daily summary
      const numDays = getDaysInMonth(state.settings.year, state.settings.month);
      const dailySummary = getDailySummary(newRoster, state.employees, numDays);

      // Re-validate
      const alerts = validateRoster(
        newRoster, state.stats, state.employees, state.busyDays,
        state.settings, state.rules, newManualEdits
      );

      return {
        ...state,
        roster: newRoster,
        dailySummary,
        manualEdits: newManualEdits,
        editLog: [logEntry, ...state.editLog].slice(0, 100),
        alerts,
      };
    }

    case 'CLEAR_MANUAL_EDITS':
      return { ...state, manualEdits: {}, editLog: [] };

    case 'ADD_TOAST': {
      const toast = { ...action.payload, id: Date.now() };
      return { ...state, toasts: [...state.toasts, toast] };
    }

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

    case 'RESTORE_BACKUP':
      return { ...initialState, ...action.payload, toasts: state.toasts };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const savedState = localStorage.getItem('rosterAppState');
  const parsedState = savedState ? JSON.parse(savedState) : null;
  const [state, dispatch] = useReducer(reducer, parsedState || initialState);

  import('react').then(React => {
    React.useEffect(() => {
      localStorage.setItem('rosterAppState', JSON.stringify(state));
    }, [state]);
  });

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now();
    dispatch({ type: 'ADD_TOAST', payload: { message, type, id } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3500);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, toast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

