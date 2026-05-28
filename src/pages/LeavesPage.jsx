// src/pages/LeavesPage.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, CheckCircle, Clock, XCircle, X, Save } from 'lucide-react';

const STATUS_COLORS = {
  YES:     { bg: 'rgba(46,160,67,0.15)',  color: '#56D364', icon: CheckCircle },
  PENDING: { bg: 'rgba(210,153,34,0.15)', color: '#E8B63A', icon: Clock },
  NO:      { bg: 'rgba(218,54,51,0.15)',  color: '#FF7B7B', icon: XCircle },
};

function LeaveForm({ employees, shiftOptions, onSave, onCancel }) {
  const leaveOptions = shiftOptions.filter(s => !['M','E','N','OFF'].includes(s.code));
  
  const [form, setForm] = useState({
    empId: employees[0]?.id || '',
    date: '',
    type: 'AL',
    reason: '',
    status: 'PENDING',
  });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add Leave Request</div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={14} /></button>
        </div>
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Employee</label>
            <select className="form-control" value={form.empId}
              onChange={e => setForm(f => ({ ...f, empId: Number(e.target.value) }))}>
              {employees.map(e => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Leave Date</label>
            <input className="form-control" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Leave Type</label>
            <select className="form-control" value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {leaveOptions.map(t => <option key={t.code} value={t.code}>{t.code} - {t.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Reason</label>
            <input className="form-control" value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Approval Status</label>
            <select className="form-control" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="PENDING">PENDING</option>
              <option value="YES">APPROVED</option>
              <option value="NO">REJECTED</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.date && onSave(form)}>
            <Save size={14} /> Add Leave
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeavesPage() {
  const { state, dispatch, toast } = useApp();
  const { leaves, employees, shiftOptions } = state;
  const [showForm, setShowForm] = useState(false);

  const approved = leaves.filter(l => l.status === 'YES').length;
  const pending  = leaves.filter(l => l.status === 'PENDING').length;
  const rejected = leaves.filter(l => l.status === 'NO').length;

  function handleAdd(form) {
    dispatch({ type: 'ADD_LEAVE', payload: form });
    setShowForm(false);
    toast('Leave request added!', 'success');
  }

  function handleStatus(id, status) {
    dispatch({ type: 'UPDATE_LEAVE', payload: { id, status } });
    toast(`Leave ${status === 'YES' ? 'approved' : 'updated'}!`, status === 'YES' ? 'success' : 'warning');
  }

  function handleDelete(id) {
    if (confirm('Delete this leave request?')) {
      dispatch({ type: 'DELETE_LEAVE', payload: id });
      toast('Leave request deleted', 'warning');
    }
  }

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="kpi-card green">
          <div className="kpi-label">Approved</div>
          <div className="kpi-value">{approved}</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Pending</div>
          <div className="kpi-value">{pending}</div>
          {pending > 0 && <div className="kpi-sub pulse" style={{ color: 'var(--warning)' }}>Action required</div>}
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Rejected</div>
          <div className="kpi-value">{rejected}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">📋 Leave Requests</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Add Leave
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Emp No</th><th>Employee</th><th>Date</th>
                <th>Type</th><th>Reason</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(lv => {
                const sc = STATUS_COLORS[lv.status] || STATUS_COLORS.PENDING;
                const shiftOpt = shiftOptions.find(s => s.code === lv.type);
                const Icon = sc.icon;
                return (
                  <tr key={lv.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{lv.empId}</td>
                    <td style={{ fontWeight: 500 }}>{lv.empName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{lv.date}</td>
                    <td>
                      <span style={{ 
                        background: shiftOpt?.bg || '#eee', 
                        color: shiftOpt?.color || '#333',
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 
                      }}>{lv.type}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{lv.reason}</td>
                    <td>
                      <select
                        style={{
                          background: sc.bg, color: sc.color,
                          border: `1px solid ${sc.color}44`,
                          borderRadius: 20, padding: '3px 8px',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                        value={lv.status}
                        onChange={e => handleStatus(lv.id, e.target.value)}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="YES">APPROVED</option>
                        <option value="NO">REJECTED</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(lv.id)}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <LeaveForm employees={employees} shiftOptions={shiftOptions} onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}
    </div>
  );
}
