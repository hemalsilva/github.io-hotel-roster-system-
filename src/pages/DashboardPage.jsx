// src/pages/DashboardPage.jsx
import { useApp } from '../context/AppContext';
import { generateRoster, getDaysInMonth, getDailySummary, validateRoster } from '../utils/rosterEngine';
import {
  Users, Calendar, Moon, TrendingUp, AlertTriangle,
  Zap, CheckCircle, Clock, BarChart3, RefreshCw
} from 'lucide-react';
import { MONTH_NAMES } from '../utils/helpers';

export default function DashboardPage() {
  const { state, dispatch, toast } = useApp();
  const { employees, leaves, busyDays, settings, rules, alerts, rosterGenerated, manualEdits, editLog, stats } = state;

  const monthName = new Date(settings.year, settings.month - 1, 1)
    .toLocaleString('en', { month: 'long' });
  const numDays = getDaysInMonth(settings.year, settings.month);

  const approvedLeaves  = leaves.filter(l => l.status === 'YES').length;
  const pendingLeaves   = leaves.filter(l => l.status === 'PENDING').length;
  const highDays        = busyDays.filter(b => {
    const m = parseInt(b.date.split('-')[1]);
    return b.level === 'HIGH' && m === settings.month;
  }).length;
  const nightGroupCount = employees.filter(e => e.nightGroup === settings.nightGroup).length;

  const dangerAlerts  = alerts.filter(a => a.type === 'danger');
  const warnAlerts    = alerts.filter(a => a.type === 'warning');

  const totalWorkDays  = Object.values(stats).reduce((s, st) => s + (st.workDays || 0), 0);
  const totalNightDays = Object.values(stats).reduce((s, st) => s + (st.nightDays || 0), 0);

  function handleGenerate() {
    dispatch({ type: 'GENERATE_ROSTER' });
    toast('Roster generated successfully!', 'success');
    dispatch({ type: 'SET_TAB', payload: 'roster' });
  }

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1628 0%, #0D2A47 50%, #1A0A2E 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            {settings.hotelName} · {settings.department}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            🏨 AI Smart Roster — {monthName} {settings.year}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
            Smart scheduling with occupancy-aware off distribution, monthly night shift rotation, and full manual editing.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={handleGenerate}>
              <Zap size={16} /> Generate Roster
            </button>
            {rosterGenerated && (
              <button className="btn btn-ghost btn-lg" onClick={() => dispatch({ type: 'SET_TAB', payload: 'roster' })}>
                <Calendar size={16} /> View Roster
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-icon">👥</div>
          <div className="kpi-label">Total Employees</div>
          <div className="kpi-value">{employees.length}</div>
          <div className="kpi-sub">{settings.department}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon">🌙</div>
          <div className="kpi-label">Night Group (Active)</div>
          <div className="kpi-value">Group {settings.nightGroup}</div>
          <div className="kpi-sub">{nightGroupCount} employees on night duty</div>
        </div>
        <div className="kpi-card teal">
          <div className="kpi-icon">📅</div>
          <div className="kpi-label">Monthly Day Off / Person</div>
          <div className="kpi-value">{settings.monthlyDayOff}</div>
          <div className="kpi-sub">Configurable per month</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-icon">📊</div>
          <div className="kpi-label">High Occupancy Days</div>
          <div className="kpi-value">{highDays}</div>
          <div className="kpi-sub">Offs minimized on these days</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon">✅</div>
          <div className="kpi-label">Approved Leaves</div>
          <div className="kpi-value">{approvedLeaves}</div>
          <div className="kpi-sub">{pendingLeaves} pending approval</div>
        </div>
        <div className={`kpi-card ${dangerAlerts.length > 0 ? 'red' : 'green'}`}>
          <div className="kpi-icon">⚠️</div>
          <div className="kpi-label">Active Alerts</div>
          <div className="kpi-value">{dangerAlerts.length + warnAlerts.length}</div>
          <div className="kpi-sub">{dangerAlerts.length} critical, {warnAlerts.length} warnings</div>
        </div>
      </div>

      <div className="two-col">
        {/* Alerts Panel */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><AlertTriangle size={16} /> Smart Alerts</div>
            {rosterGenerated && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {alerts.length} total
              </span>
            )}
          </div>
          {!rosterGenerated ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <Zap size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>Generate the roster to see alerts</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="alert-banner success">
              <CheckCircle size={16} /> All checks passed — roster looks good!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.slice(0, 6).map((a, i) => (
                <div key={i} className={`alert-banner ${a.type === 'danger' ? 'danger' : 'warning'}`}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{a.message}</span>
                </div>
              ))}
              {alerts.length > 6 && (
                <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'SET_TAB', payload: 'roster' })}>
                  View all {alerts.length} alerts →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><BarChart3 size={16} /> Month Overview</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Days in Month', value: numDays, max: 31, color: '#58A6FF' },
              { label: 'Approved Leaves', value: approvedLeaves, max: employees.length * 2, color: '#56D364' },
              { label: 'HIGH Occupancy Days', value: highDays, max: numDays, color: '#FF7B7B' },
              { label: 'Manual Edits', value: Object.keys(manualEdits).length, max: Math.max(employees.length, 1), color: '#FBB724' },
            ].map(row => (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontWeight: 600 }}>{row.value}</span>
                </div>
                <div className="occ-bar">
                  <div
                    className="occ-bar-fill"
                    style={{
                      width: `${Math.min(100, (row.value / row.max) * 100)}%`,
                      background: row.color,
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="section-divider"><span>Night Shift Rotation</span></div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['A','B','C'].map(g => (
                <div key={g} style={{
                  flex: 1, textAlign: 'center', padding: '10px 8px',
                  borderRadius: 8,
                  background: g === settings.nightGroup ? 'rgba(124,58,237,0.2)' : 'var(--bg-secondary)',
                  border: `1px solid ${g === settings.nightGroup ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`,
                }}>
                  <div style={{
                    fontSize: 16, fontWeight: 800,
                    color: g === settings.nightGroup ? '#A78BFA' : 'var(--text-muted)',
                  }}>Group {g}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {employees.filter(e => e.nightGroup === g).length} emp
                  </div>
                  {g === settings.nightGroup && (
                    <div style={{ fontSize: 9, color: '#A78BFA', marginTop: 3, fontWeight: 600 }}>● ACTIVE</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Log preview */}
      {editLog.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div className="card-title">✏️ Recent Manual Edits</div>
            <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'SET_TAB', payload: 'editlog' })}>
              View All ({editLog.length})
            </button>
          </div>
          <div className="edit-log">
            {editLog.slice(0, 5).map(entry => (
              <div key={entry.id} className="edit-log-item">
                <span className="edit-log-time">{entry.time}</span>
                <span className="edit-log-msg">
                  <strong>{entry.empName}</strong> — Day {entry.day}:&nbsp;
                  <span className={`badge-shift badge-${entry.oldShift}`}>{entry.oldShift}</span>
                  {' → '}
                  <span className={`badge-shift badge-${entry.newShift}`}>{entry.newShift}</span>
                  {entry.reason && <span style={{ color: 'var(--text-muted)' }}> ({entry.reason})</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
