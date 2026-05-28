// src/pages/SettingsPage.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save, Moon, RotateCcw, Calendar, Settings, Sliders, Palette, Plus, Trash2 } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

export default function SettingsPage() {
  const { state, dispatch, toast } = useApp();
  const { settings, rules, shiftOptions } = state;
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [localRules, setLocalRules] = useState({ ...rules });
  const [localShifts, setLocalShifts] = useState([ ...shiftOptions ]);

  function handleSaveShifts() {
    dispatch({ type: 'UPDATE_SHIFT_OPTIONS', payload: localShifts });
    toast('Shift & Leave types saved!', 'success');
  }

  function handleAddShift() {
    setLocalShifts([...localShifts, { code: 'NEW', label: 'New Leave', color: '#FFFFFF', bg: 'rgba(255,255,255,0.15)' }]);
  }

  function handleUpdateShift(index, field, value) {
    const updated = [...localShifts];
    updated[index][field] = value;
    setLocalShifts(updated);
  }

  function handleDeleteShift(index) {
    if (['M','E','N','OFF'].includes(localShifts[index].code)) {
      toast('Cannot delete core shifts!', 'danger');
      return;
    }
    const updated = [...localShifts];
    updated.splice(index, 1);
    setLocalShifts(updated);
  }

  function handleSaveSettings() {
    dispatch({ type: 'UPDATE_SETTINGS', payload: localSettings });
    toast('Settings saved! Regenerate the roster to apply changes.', 'success');
  }

  function handleSaveRules() {
    dispatch({ type: 'UPDATE_RULES', payload: localRules });
    toast('Rules saved! Regenerate the roster to apply changes.', 'success');
  }

  function handleRotateNight() {
    const order = ['A', 'B', 'C'];
    const next = order[(order.indexOf(localSettings.nightGroup) + 1) % 3];
    setLocalSettings(s => ({ ...s, nightGroup: next }));
  }

  const nextNight = ['A','B','C'][(['A','B','C'].indexOf(localSettings.nightGroup) + 1) % 3];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Monthly Configuration */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><Calendar size={16} /> Monthly Configuration</div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Hotel Name</label>
            <input
              className="form-control"
              value={localSettings.hotelName}
              onChange={e => setLocalSettings(s => ({ ...s, hotelName: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input
              className="form-control"
              value={localSettings.department}
              onChange={e => setLocalSettings(s => ({ ...s, department: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Month</label>
            <select
              className="form-control"
              value={localSettings.month}
              onChange={e => setLocalSettings(s => ({ ...s, month: Number(e.target.value) }))}
            >
              {MONTHS.map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Year</label>
            <input
              className="form-control"
              type="number"
              value={localSettings.year}
              onChange={e => setLocalSettings(s => ({ ...s, year: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div style={{ marginTop: 20, padding: '16px 20px', background: 'rgba(201,153,63,0.08)', border: '2px solid rgba(201,153,63,0.3)', borderRadius: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#C9993F', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            📅 Monthly Day Off Count
            <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)' }}>— changes every month</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {[2,3,4,5,6,7].map(n => (
                <button
                  key={n}
                  onClick={() => setLocalSettings(s => ({ ...s, monthlyDayOff: n }))}
                  style={{
                    width: 44, height: 44, borderRadius: 10,
                    border: `2px solid ${localSettings.monthlyDayOff === n ? '#C9993F' : 'var(--border)'}`,
                    background: localSettings.monthlyDayOff === n ? 'rgba(201,153,63,0.2)' : 'var(--bg-secondary)',
                    color: localSettings.monthlyDayOff === n ? '#C9993F' : 'var(--text-secondary)',
                    fontWeight: 700, fontSize: 16, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                className="form-control"
                style={{ width: 80 }}
                min={1} max={15}
                value={localSettings.monthlyDayOff}
                onChange={e => setLocalSettings(s => ({ ...s, monthlyDayOff: Number(e.target.value) }))}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              days off/employee<br />
              <span style={{ color: '#C9993F' }}>→ {localSettings.monthlyDayOff * state.employees.length} total OFF slots</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSaveSettings}>
            <Save size={14} /> Save Monthly Settings
          </button>
        </div>
      </div>

      {/* Night Shift Rotation */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><Moon size={16} /> Night Shift Rotation</div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {['A','B','C'].map(g => {
            const members = state.employees.filter(e => e.nightGroup === g);
            const isActive = localSettings.nightGroup === g;
            return (
              <div
                key={g}
                onClick={() => setLocalSettings(s => ({ ...s, nightGroup: g }))}
                style={{
                  flex: 1, padding: '16px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${isActive ? 'rgba(124,58,237,0.6)' : 'var(--border)'}`,
                  background: isActive ? 'rgba(124,58,237,0.1)' : 'var(--bg-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: isActive ? '#A78BFA' : 'var(--text-muted)' }}>
                    Group {g}
                  </span>
                  {isActive && <span style={{ fontSize: 10, background: 'rgba(124,58,237,0.3)', color: '#A78BFA', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>ACTIVE</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {members.map(m => m.name.split(' ')[0]).join(', ') || 'No members'}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: isActive ? '#A78BFA' : 'var(--text-muted)' }}>
                  {members.length} employees
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-purple" onClick={handleRotateNight}>
            <RotateCcw size={14} /> Rotate to Group {nextNight}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Current: Group {localSettings.nightGroup} · Next month: Group {nextNight}
          </span>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSaveSettings}>
            <Save size={14} /> Save Night Settings
          </button>
        </div>
      </div>

      {/* Roster Rules */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><Sliders size={16} /> Roster Rules & Thresholds</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { key: 'minStaffHigh',    label: 'Min Staff (HIGH days)',      color: 'var(--danger)' },
            { key: 'minStaffMed',     label: 'Min Staff (MEDIUM days)',    color: 'var(--warning)' },
            { key: 'minStaffLow',     label: 'Min Staff (LOW days)',       color: 'var(--success)' },
            { key: 'maxOffHigh',      label: 'Max OFF (HIGH days)',        color: 'var(--danger)' },
            { key: 'maxOffMed',       label: 'Max OFF (MEDIUM days)',      color: 'var(--warning)' },
            { key: 'maxOffLow',       label: 'Max OFF (LOW days)',         color: 'var(--success)' },
            { key: 'maxConsecutive',  label: 'Max Consecutive Work Days',  color: 'var(--info)' },
            { key: 'maxNightShifts',  label: 'Max Night Shifts / Month',   color: 'var(--purple-light)' },
            { key: 'minSupervisors',  label: 'Min Supervisors per Shift',  color: 'var(--gold)' },
          ].map(({ key, label, color }) => (
            <div key={key} className="form-group">
              <label className="form-label" style={{ color }}>{label}</label>
              <input
                className="form-control"
                type="number"
                min={0}
                value={localRules[key]}
                onChange={e => setLocalRules(r => ({ ...r, [key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSaveRules}>
            <Save size={14} /> Save Rules
          </button>
        </div>
      </div>

      {/* Leave Types & Colors */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><Palette size={16} /> Shift & Leave Types</div>
          <button className="btn btn-primary btn-sm" onClick={handleAddShift}>
            <Plus size={14} /> Add New
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Label</th>
                <th>Text Color</th>
                <th>Background</th>
                <th>Preview</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {localShifts.map((s, idx) => {
                const isBase = ['M','E','N','OFF'].includes(s.code);
                return (
                  <tr key={idx}>
                    <td>
                      <input className="form-control" style={{ width: 80 }} value={s.code} disabled={isBase} onChange={e => handleUpdateShift(idx, 'code', e.target.value)} />
                    </td>
                    <td>
                      <input className="form-control" value={s.label} onChange={e => handleUpdateShift(idx, 'label', e.target.value)} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input type="color" value={s.color} onChange={e => handleUpdateShift(idx, 'color', e.target.value)} style={{ width: 30, height: 30, padding: 0, border: 'none', background: 'transparent' }} />
                        <input className="form-control" style={{ width: 80, fontSize: 11 }} value={s.color} onChange={e => handleUpdateShift(idx, 'color', e.target.value)} />
                      </div>
                    </td>
                    <td>
                      <input className="form-control" value={s.bg} onChange={e => handleUpdateShift(idx, 'bg', e.target.value)} />
                    </td>
                    <td>
                      <span style={{ background: s.bg, color: s.color, padding: '4px 8px', borderRadius: 4, fontWeight: 'bold', fontSize: 11 }}>{s.code}</span>
                    </td>
                    <td>
                      {!isBase && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteShift(idx)}><Trash2 size={12} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSaveShifts}>
            <Save size={14} /> Save Shift Types
          </button>
        </div>
      </div>
    </div>
  );
}
