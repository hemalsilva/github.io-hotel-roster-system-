// src/data/initialData.js
// ─────────────────────────────────────────────────────────
// Default seed data for the Hotel Roster System
// ─────────────────────────────────────────────────────────

export const SHIFT_OPTIONS = [
  { code: 'M',   label: 'Morning',  color: '#1D6FA4', bg: 'rgba(29,111,164,0.15)' },
  { code: 'E',   label: 'Evening',  color: '#D97706', bg: 'rgba(217,119,6,0.15)'  },
  { code: 'N',   label: 'Night',    color: '#7C3AED', bg: 'rgba(124,58,237,0.15)' },
  { code: 'OFF', label: 'Day Off',  color: '#059669', bg: 'rgba(5,150,105,0.15)'  },
  { code: 'AL',  label: 'Ann. Leave',color:'#DC2626', bg: 'rgba(220,38,38,0.15)'  },
  { code: 'CL',  label: 'Cas. Leave',color:'#EA580C', bg: 'rgba(234,88,12,0.15)' },
  { code: 'SL',  label: 'Sick Leave',color:'#DB2777', bg: 'rgba(219,39,119,0.15)'},
  { code: 'HL',  label: 'Half Day', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { code: 'CO',  label: 'Comp. Off', color:'#6366F1', bg: 'rgba(99,102,241,0.12)' },
];

export const NIGHT_GROUPS = ['A', 'B', 'C'];

export const DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export const DEFAULT_RULES = {
  minStaffHigh:     22,
  minStaffMed:      18,
  minStaffLow:      14,
  maxOffHigh:        2,
  maxOffMed:         4,
  maxOffLow:         6,
  maxConsecutive:    6,
  maxNightShifts:   10,
  minSupervisors:    1,
  minSkillA:         3,
  otThreshold:      40,
};

export const DEFAULT_SETTINGS = {
  hotelName:      'Cinnamon Life',
  department:     'HOUSEKEEPING',
  month:           6,
  year:            2026,
  monthlyDayOff:   4,
  nightGroup:     'B',
};

export const DEFAULT_EMPLOYEES = [
  { id: 1001, name: 'Amal Fernando',       position: 'Room Attendant', section: 'HK', skill: 'A', defaultShift: 'M', weeklyOff: 'Sunday',    nightGroup: 'A' },
  { id: 1002, name: 'Kamal Perera',         position: 'Room Attendant', section: 'HK', skill: 'B', defaultShift: 'E', weeklyOff: 'Monday',    nightGroup: 'B' },
  { id: 1003, name: 'Nimal Silva',           position: 'Supervisor',     section: 'HK', skill: 'A', defaultShift: 'M', weeklyOff: 'Tuesday',   nightGroup: 'C' },
  { id: 1004, name: 'Sunil Bandara',         position: 'Room Attendant', section: 'HK', skill: 'B', defaultShift: 'M', weeklyOff: 'Wednesday', nightGroup: 'A' },
  { id: 1005, name: 'Priya Jayasinghe',      position: 'Room Attendant', section: 'HK', skill: 'A', defaultShift: 'E', weeklyOff: 'Thursday',  nightGroup: 'B' },
  { id: 1006, name: 'Chamara Dias',          position: 'Supervisor',     section: 'HK', skill: 'A', defaultShift: 'E', weeklyOff: 'Friday',    nightGroup: 'C' },
  { id: 1007, name: 'Ravi Kumar',            position: 'Room Attendant', section: 'HK', skill: 'B', defaultShift: 'M', weeklyOff: 'Saturday',  nightGroup: 'A' },
  { id: 1008, name: 'Sanduni Rathnayake',    position: 'Room Attendant', section: 'HK', skill: 'A', defaultShift: 'E', weeklyOff: 'Sunday',    nightGroup: 'B' },
  { id: 1009, name: 'Tharindu Madusanka',    position: 'Room Attendant', section: 'HK', skill: 'B', defaultShift: 'M', weeklyOff: 'Monday',    nightGroup: 'C' },
  { id: 1010, name: 'Dilani Wijesekara',     position: 'Supervisor',     section: 'HK', skill: 'A', defaultShift: 'N', weeklyOff: 'Tuesday',   nightGroup: 'A' },
  { id: 1011, name: 'Ishara Wickrama',       position: 'Room Attendant', section: 'HK', skill: 'B', defaultShift: 'M', weeklyOff: 'Wednesday', nightGroup: 'B' },
  { id: 1012, name: 'Lasith Mendis',         position: 'Room Attendant', section: 'HK', skill: 'A', defaultShift: 'E', weeklyOff: 'Thursday',  nightGroup: 'C' },
];

export const DEFAULT_LEAVES = [
  { id: 1, empId: 1001, empName: 'Amal Fernando',      date: '2026-06-12', type: 'AL', reason: 'Annual Leave',  status: 'YES' },
  { id: 2, empId: 1002, empName: 'Kamal Perera',        date: '2026-06-20', type: 'CL', reason: 'Casual Leave',  status: 'YES' },
  { id: 3, empId: 1003, empName: 'Nimal Silva',          date: '2026-06-05', type: 'SL', reason: 'Medical',       status: 'YES' },
  { id: 4, empId: 1005, empName: 'Priya Jayasinghe',    date: '2026-06-18', type: 'AL', reason: 'Annual Leave',  status: 'PENDING' },
  { id: 5, empId: 1007, empName: 'Ravi Kumar',           date: '2026-06-25', type: 'CL', reason: 'Family Event',  status: 'YES' },
  { id: 6, empId: 1009, empName: 'Tharindu Madusanka',  date: '2026-06-08', type: 'SL', reason: 'Medical',       status: 'YES' },
];

export const DEFAULT_OFF_REQUESTS = [
  { id: 1, empId: 1001, empName: 'Amal Fernando',      date: '2026-06-05',  status: 'APPROVED' },
  { id: 2, empId: 1003, empName: 'Nimal Silva',          date: '2026-06-15',  status: 'APPROVED' },
  { id: 3, empId: 1004, empName: 'Sunil Bandara',        date: '2026-06-22',  status: 'PENDING' },
  { id: 4, empId: 1008, empName: 'Sanduni Rathnayake',  date: '2026-06-10',  status: 'APPROVED' },
  { id: 5, empId: 1011, empName: 'Ishara Wickrama',     date: '2026-06-17',  status: 'APPROVED' },
];

export const DEFAULT_BUSY_DAYS = [
  { id:  1, date: '2026-06-07', occupancy: 98, level: 'HIGH',   required: 24, notes: 'Weekend peak' },
  { id:  2, date: '2026-06-08', occupancy: 92, level: 'HIGH',   required: 22, notes: 'Group check-in' },
  { id:  3, date: '2026-06-10', occupancy: 95, level: 'HIGH',   required: 24, notes: 'Conference group' },
  { id:  4, date: '2026-06-11', occupancy: 90, level: 'HIGH',   required: 22, notes: 'Extended group' },
  { id:  5, date: '2026-06-13', occupancy: 70, level: 'MEDIUM', required: 18, notes: 'Normal' },
  { id:  6, date: '2026-06-14', occupancy: 68, level: 'MEDIUM', required: 18, notes: 'Normal' },
  { id:  7, date: '2026-06-17', occupancy: 55, level: 'LOW',    required: 14, notes: 'Quiet midweek' },
  { id:  8, date: '2026-06-18', occupancy: 50, level: 'LOW',    required: 13, notes: 'Quiet' },
  { id:  9, date: '2026-06-21', occupancy: 88, level: 'HIGH',   required: 22, notes: 'Weekend' },
  { id: 10, date: '2026-06-22', occupancy: 85, level: 'HIGH',   required: 20, notes: 'Extended weekend' },
  { id: 11, date: '2026-06-24', occupancy: 60, level: 'LOW',    required: 15, notes: 'Midweek quiet' },
  { id: 12, date: '2026-06-25', occupancy: 80, level: 'MEDIUM', required: 18, notes: 'Pre-weekend' },
  { id: 13, date: '2026-06-28', occupancy: 60, level: 'LOW',    required: 14, notes: 'Quiet' },
  { id: 14, date: '2026-06-29', occupancy: 92, level: 'HIGH',   required: 23, notes: 'Month-end peak' },
  { id: 15, date: '2026-06-30', occupancy: 95, level: 'HIGH',   required: 24, notes: 'Month-end peak' },
];
