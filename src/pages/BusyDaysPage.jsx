// src/pages/BusyDaysPage.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Save, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function BusyDayForm({ settings, onSave, onCancel }) {
  const [form, setForm] = useState({
    date: `${settings.year}-${String(settings.month).padStart(2,'0')}-01`,
    occupancy: 80,
    level: 'MEDIUM',
    required: 18,
    notes: '',
  });

  // Auto-set level based on occupancy
  function handleOccupancyChange(val) {
    const n = Number(val);
    const level = n >= 85 ? 'HIGH' : n >= 65 ? 'MEDIUM' : 'LOW';
    const required = n >= 85 ? 22 : n >= 65 ? 18 : 14;
    setForm(f => ({ ...f, occupancy: n, level, required }));
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add Busy Day / Occupancy</div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={14} /></button>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-control" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Occupancy %</label>
            <input className="form-control" type="number" min={0} max={100}
              value={form.occupancy} onChange={e => handleOccupancyChange(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Busy Level (auto-set)</label>
            <select className="form-control" value={form.level}
              onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
              <option>HIGH</option><option>MEDIUM</option><option>LOW</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Required Staff</label>
            <input className="form-control" type="number" value={form.required}
              onChange={e => setForm(f => ({ ...f, required: Number(e.target.value) }))} />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Notes</label>
            <input className="form-control" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        {/* Occupancy preview */}
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Occupancy Preview</div>
          <div className="occ-bar" style={{ height: 10, marginBottom: 6 }}>
            <div className="occ-bar-fill" style={{
              width: `${form.occupancy}%`,
              background: form.level === 'HIGH' ? 'var(--danger)' : form.level === 'LOW' ? 'var(--success)' : 'var(--warning)',
            }} />
          </div>
          <div style={{ fontSize: 12, color: form.level === 'HIGH' ? '#FF7B7B' : form.level === 'LOW' ? '#56D364' : '#E8B63A' }}>
            {form.level} — {form.occupancy}% — Need {form.required} staff on duty
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>
            <Save size={14} /> Add Busy Day
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BusyDaysPage() {
  const { state, dispatch, toast } = useApp();
  const { busyDays, settings } = state;
  const [showForm, setShowForm] = useState(false);

  const monthBusy = busyDays.filter(b => {
    const m = parseInt(b.date.split('-')[1]);
    const y = parseInt(b.date.split('-')[0]);
    return m === settings.month && y === settings.year;
  });

  const highCount = monthBusy.filter(b => b.level === 'HIGH').length;
  const medCount  = monthBusy.filter(b => b.level === 'MEDIUM').length;
  const lowCount  = monthBusy.filter(b => b.level === 'LOW').length;

  function handleAdd(form) {
    dispatch({ type: 'ADD_BUSY_DAY', payload: form });
    setShowForm(false);
    toast('Busy day added! Regenerate roster to apply.', 'success');
  }

  function handleUpdateLevel(id, level) {
    const required = level === 'HIGH' ? 22 : level === 'MEDIUM' ? 18 : 14;
    dispatch({ type: 'UPDATE_BUSY_DAY', payload: { id, level, required } });
    toast('Busy level updated!', 'success');
  }

  function handleDelete(id) {
    if (confirm('Remove this busy day?')) {
      dispatch({ type: 'DELETE_BUSY_DAY', payload: id });
      toast('Busy day removed', 'warning');
    }
  }

  const LEVEL_ICON = { HIGH: TrendingUp, MEDIUM: Minus, LOW: TrendingDown };
  const LEVEL_COLOR = { HIGH: '#FF7B7B', MEDIUM: '#E8B63A', LOW: '#56D364' };
  const LEVEL_BG = { HIGH: 'rgba(218,54,51,0.1)', MEDIUM: 'rgba(210,153,34,0.1)', LOW: 'rgba(46,160,67,0.1)' };

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="kpi-card red">
          <div className="kpi-label">HIGH Occupancy Days</div>
          <div className="kpi-value">{highCount}</div>
          <div className="kpi-sub">OFF minimized — max staff required</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">MEDIUM Occupancy Days</div>
          <div className="kpi-value">{medCount}</div>
          <div className="kpi-sub">Normal staffing</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">LOW Occupancy Days</div>
          <div className="kpi-value">{lowCount}</div>
          <div className="kpi-sub">More OFFs distributed here</div>
        </div>
      </div>

      {/* Smart Logic Explanation */}
      <div className="alert-banner info" style={{ marginBottom: 16 }}>
        <TrendingUp size={14} />
        <span>
          <strong>Occupancy-Based Logic:</strong> HIGH days → fewer OFFs (max {state.rules.maxOffHigh}/day) · MEDIUM → normal (max {state.rules.maxOffMed}/day) · LOW → more OFFs concentrated here (max {state.rules.maxOffLow}/day)
        </span>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">📊 Hotel Occupancy Planner</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Add Busy Day
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Occupancy</th><th>Level</th>
                <th>Required Staff</th><th>Notes</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {monthBusy.sort((a,b) => a.date.localeCompare(b.date)).map(bd => {
                const LIcon = LEVEL_ICON[bd.level];
                return (
                  <tr key={bd.id}>
                    <td style={{ fontWeight: 600 }}>{bd.date}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="occ-bar" style={{ width: 80 }}>
                          <div className="occ-bar-fill" style={{
                            width: `${bd.occupancy}%`,
                            background: LEVEL_COLOR[bd.level],
                          }} />
                        </div>
                        <span style={{ fontWeight: 600, color: LEVEL_COLOR[bd.level] }}>{bd.occupancy}%</span>
                      </div>
                    </td>
                    <td>
                      <select
                        style={{
                          background: LEVEL_BG[bd.level], color: LEVEL_COLOR[bd.level],
                          border: `1px solid ${LEVEL_COLOR[bd.level]}44`,
                          borderRadius: 20, padding: '3px 10px',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        }}
                        value={bd.level}
                        onChange={e => handleUpdateLevel(bd.id, e.target.value)}
                      >
                        <option>HIGH</option><option>MEDIUM</option><option>LOW</option>
                      </select>
                    </td>
                    <td style={{ fontWeight: 600, color: LEVEL_COLOR[bd.level] }}>{bd.required}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{bd.notes}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(bd.id)}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {monthBusy.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    No busy days configured for this month
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <BusyDayForm settings={settings} onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}
    </div>
  );
}
