// src/pages/EditLogPage.jsx
import { useApp } from '../context/AppContext';
import { Trash2, RotateCcw, Edit3, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function EditLogPage() {
  const { state, dispatch, toast } = useApp();
  const { editLog, manualEdits, shiftOptions } = state;

  const getBadgeStyle = (code) => {
    const s = shiftOptions.find(opt => opt.code === code);
    if (!s) return { background: '#eee', color: '#333', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 };
    return { background: s.bg, color: s.color, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 };
  };

  function handleClearLog() {
    if (confirm('Clear all manual edits and regenerate roster?')) {
      dispatch({ type: 'GENERATE_ROSTER' });
      toast('Manual edits cleared and roster regenerated', 'info');
    }
  }

  function handleExportLog() {
    if (editLog.length === 0) { toast('No edits to export', 'warning'); return; }
    const rows = [['Time', 'Employee', 'Day', 'Previous Shift', 'New Shift', 'Reason']];
    editLog.forEach(e => rows.push([e.time, e.empName, e.day, e.oldShift, e.newShift, e.reason]));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Edit Log');
    XLSX.writeFile(wb, 'Roster_Edit_Log.xlsx');
    toast('Edit log exported!', 'success');
  }

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="kpi-card orange">
          <div className="kpi-label">Total Manual Edits</div>
          <div className="kpi-value">{Object.keys(manualEdits).length}</div>
          <div className="kpi-sub">cells modified</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">Log Entries</div>
          <div className="kpi-value">{editLog.length}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label">Employees Affected</div>
          <div className="kpi-value">
            {new Set(editLog.map(e => e.empId)).size}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><Edit3 size={16} /> Manual Edit Audit Log</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleExportLog}>
              <Download size={12} /> Export
            </button>
            <button className="btn btn-warning btn-sm" onClick={handleClearLog}>
              <RotateCcw size={12} /> Clear &amp; Regenerate
            </button>
          </div>
        </div>

        {editLog.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <Edit3 size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p>No manual edits recorded yet.</p>
            <p style={{ fontSize: 11, marginTop: 6 }}>Generate the roster and click any cell to edit.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Employee</th>
                  <th>Day</th>
                  <th>Previous</th>
                  <th>Changed To</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {editLog.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{entry.time}</td>
                    <td style={{ fontWeight: 500 }}>{entry.empName}</td>
                    <td style={{ fontWeight: 600 }}>Day {entry.day}</td>
                    <td>
                      <span style={getBadgeStyle(entry.oldShift)}>
                        {entry.oldShift || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={getBadgeStyle(entry.newShift)}>
                        {entry.newShift}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontStyle: entry.reason ? 'normal' : 'italic' }}>
                      {entry.reason || 'No reason given'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Edits Map */}
      {Object.keys(manualEdits).length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div className="card-title">🗺️ Currently Modified Cells</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(manualEdits).map(([key, edit]) => (
              <div key={key} style={{
                padding: '6px 12px',
                background: 'rgba(251,183,36,0.08)',
                border: '1px solid rgba(251,183,36,0.3)',
                borderRadius: 8,
                fontSize: 11,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  {edit.empName} — Day {edit.day}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  <span style={getBadgeStyle(edit.oldShift)}>{edit.oldShift}</span>
                  {' → '}
                  <span style={getBadgeStyle(edit.newShift)}>{edit.newShift}</span>
                </div>
                {edit.reason && (
                  <div style={{ color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                    "{edit.reason}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
