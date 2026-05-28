// src/App.jsx
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import DashboardPage   from './pages/DashboardPage';
import RosterPage      from './pages/RosterPage';
import EmployeesPage   from './pages/EmployeesPage';
import LeavesPage      from './pages/LeavesPage';
import OffRequestsPage from './pages/OffRequestsPage';
import BusyDaysPage    from './pages/BusyDaysPage';
import NightShiftPage  from './pages/NightShiftPage';
import SettingsPage    from './pages/SettingsPage';
import EditLogPage     from './pages/EditLogPage';
import { Zap, AlertTriangle, Edit3 } from 'lucide-react';

const PAGE_CONFIG = {
  dashboard:   { title: 'Dashboard',         badge: null,        component: DashboardPage },
  roster:      { title: 'Auto Roster',        badge: 'roster',    component: RosterPage },
  employees:   { title: 'Employees',          badge: null,        component: EmployeesPage },
  leaves:      { title: 'Leave Requests',     badge: null,        component: LeavesPage },
  offrequests: { title: 'Off Requests',       badge: null,        component: OffRequestsPage },
  busydays:    { title: 'Busy Days & Occ.',   badge: null,        component: BusyDaysPage },
  nightshift:  { title: 'Night Shift Rotation',badge: null,       component: NightShiftPage },
  settings:    { title: 'Monthly Settings',   badge: null,        component: SettingsPage },
  rules:       { title: 'Roster Rules',       badge: null,        component: SettingsPage },
  editlog:     { title: 'Edit Audit Log',     badge: 'edits',     component: EditLogPage },
};

function AppContent() {
  const { state, dispatch, toast } = useApp();
  const { activeTab, settings, alerts, manualEdits, rosterGenerated } = state;

  const page = PAGE_CONFIG[activeTab] || PAGE_CONFIG.dashboard;
  const PageComponent = page.component;
  const monthName = new Date(settings.year, settings.month - 1, 1)
    .toLocaleString('en', { month: 'long' });

  const dangerCount = alerts.filter(a => a.type === 'danger').length;
  const editCount   = Object.keys(manualEdits).length;

  function handleGenerate() {
    dispatch({ type: 'GENERATE_ROSTER' });
    dispatch({ type: 'SET_TAB', payload: 'roster' });
    toast('Roster generated successfully!', 'success');
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <div className="page-title">
            <h2>{page.title}</h2>
            <span className="badge">{monthName} {settings.year}</span>
            {dangerCount > 0 && rosterGenerated && (
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 20,
                background: 'rgba(218,54,51,0.15)', color: '#FF7B7B',
                fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <AlertTriangle size={10} /> {dangerCount} alert{dangerCount > 1 ? 's' : ''}
              </span>
            )}
            {editCount > 0 && (
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 20,
                background: 'rgba(251,183,36,0.15)', color: '#FBB724',
                fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Edit3 size={10} /> {editCount} edit{editCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="header-actions">
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>
              Night: Gr {settings.nightGroup} · {settings.monthlyDayOff}d off/person
            </span>
            <button className="btn btn-primary btn-sm" onClick={handleGenerate}>
              <Zap size={13} />
              {rosterGenerated ? 'Regenerate' : 'Generate Roster'}
            </button>
          </div>
        </div>

        {/* Page Body */}
        <div className="page-body">
          <PageComponent />
        </div>
      </div>

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
