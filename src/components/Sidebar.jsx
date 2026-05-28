// src/components/Sidebar.jsx
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Users, Calendar, CalendarOff, TrendingUp,
  Settings, Moon, ClipboardList, FileText, BookOpen, LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',        icon: LayoutDashboard, section: 'main' },
  { id: 'roster',       label: 'Auto Roster',       icon: Calendar,        section: 'main' },
  { id: 'employees',    label: 'Employees',         icon: Users,           section: 'data' },
  { id: 'leaves',       label: 'Leave Requests',    icon: ClipboardList,   section: 'data' },
  { id: 'offrequests',  label: 'Off Requests',      icon: CalendarOff,     section: 'data' },
  { id: 'busydays',     label: 'Busy Days',         icon: TrendingUp,      section: 'data' },
  { id: 'nightshift',   label: 'Night Rotation',    icon: Moon,            section: 'config' },
  { id: 'settings',     label: 'Monthly Settings',  icon: Settings,        section: 'config' },
  { id: 'rules',        label: 'Roster Rules',      icon: BookOpen,        section: 'config' },
  { id: 'editlog',      label: 'Edit Log',          icon: FileText,        section: 'log' },
];

const SECTIONS = {
  main:   'Navigation',
  data:   'Data Entry',
  config: 'Configuration',
  log:    'Audit',
};

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { activeTab, settings, alerts, editLog } = state;

  const groups = {};
  NAV_ITEMS.forEach(item => {
    if (!groups[item.section]) groups[item.section] = [];
    groups[item.section].push(item);
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🏨</div>
        <div>
          <h1 style={{ fontSize: 16, margin: 0, fontWeight: 800, color: 'var(--primary)' }}>HK Roster AI</h1>
          <p style={{ fontSize: 11, margin: 0, color: 'var(--text-secondary)' }}>{settings.hotelName}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {Object.entries(groups).map(([section, items]) => (
          <div key={section}>
            <div className="nav-section-label">{SECTIONS[section]}</div>
            {items.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const badge =
                item.id === 'roster' && alerts.filter(a => a.type === 'danger').length > 0
                  ? alerts.filter(a => a.type === 'danger').length
                  : item.id === 'editlog' && editLog.length > 0
                  ? editLog.length
                  : null;

              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => dispatch({ type: 'SET_TAB', payload: item.id })}
                >
                  <Icon size={16} className="nav-icon" />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {badge && (
                    <span style={{
                      background: item.id === 'editlog' ? 'rgba(88,166,255,0.2)' : 'rgba(218,54,51,0.2)',
                      color: item.id === 'editlog' ? '#58A6FF' : '#FF7B7B',
                      fontSize: '10px', fontWeight: 700,
                      padding: '1px 6px', borderRadius: '10px',
                    }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: 4, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {settings.month}/{settings.year} · Night: Group {settings.nightGroup}
        </div>
        <div>Day Off: {settings.monthlyDayOff}/person</div>
      </div>
    </aside>
  );
}
