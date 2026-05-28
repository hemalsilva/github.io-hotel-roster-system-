// src/pages/OffRequestsPage.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Save, X, Check, Clock, XCircle, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

function OffForm({ employees, settings, onSave, onCancel }) {
  const [form, setForm] = useState({
    empId: employees[0]?.id || '',
    date: `${settings.year}-${String(settings.month).padStart(2,'0')}-01`,
    status: 'PENDING',
  });
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add Off Request</div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={14} /></button>
        </div>
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Employee</label>
            <select className="form-control" value={form.empId}
              onChange={e => setForm(f => ({ ...f, empId: Number(e.target.value) }))}>
              {employees.map(e => <option key={e.id} value={e.id}>{e.id} — {e.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Requested Off Date</label>
            <input className="form-control" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.date && onSave(form)}>
            <Save size={14} /> Add Request
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OffRequestsPage() {
  const { state, dispatch, toast } = useApp();
  const { offRequests, employees, settings } = state;
  const [showForm, setShowForm] = useState(false);

  const approved = offRequests.filter(r => r.status === 'APPROVED').length;
  const pending  = offRequests.filter(r => r.status === 'PENDING').length;

  function handleAdd(form) {
    dispatch({ type: 'ADD_OFF_REQUEST', payload: form });
    setShowForm(false);
    toast('Off request added!', 'success');
  }

  function handleStatus(id, status) {
    dispatch({ type: 'UPDATE_OFF_REQUEST', payload: { id, status } });
    toast(`Request ${status.toLowerCase()}!`, status === 'APPROVED' ? 'success' : 'warning');
  }

  function handleDelete(id) {
    if (confirm('Delete this off request?')) {
      dispatch({ type: 'DELETE_OFF_REQUEST', payload: id });
      toast('Off request deleted', 'warning');
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const newRequests = [];
        data.forEach(row => {
          const empId = Number(row['Emp No']);
          const empName = row['Name'] || row['Employee Name'] || 'Unknown';
          const datesRaw = row['Requested Dates'] || row['Requested Date'] || row['Date'] || '';
          
          if (!empId || !datesRaw) return;
          
          const dates = String(datesRaw).split(',').map(d => d.trim()).filter(Boolean);
          dates.forEach(d => {
            let parsedDate = d;
            if (!isNaN(d) && Number(d) > 30000) {
              const dateObj = new Date(Math.round((d - 25569) * 864e5));
              parsedDate = dateObj.toISOString().split('T')[0];
            }
            newRequests.push({
              empId,
              empName,
              date: parsedDate,
              status: 'APPROVED' // Default bulk uploads to APPROVED
            });
          });
        });

        if (newRequests.length > 0) {
          dispatch({ type: 'BULK_ADD_OFF_REQUESTS', payload: newRequests });
          toast(`Successfully uploaded ${newRequests.length} off requests!`, 'success');
        } else {
          toast('No valid data found in Excel file', 'warning');
        }
      } catch (err) {
        toast('Error parsing Excel file', 'danger');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  }

  const STATUS_STYLE = {
    APPROVED: { bg: 'rgba(46,160,67,0.15)',  color: '#56D364' },
    PENDING:  { bg: 'rgba(210,153,34,0.15)', color: '#E8B63A' },
    REJECTED: { bg: 'rgba(218,54,51,0.15)',  color: '#FF7B7B' },
  };

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
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">Total Requests</div>
          <div className="kpi-value">{offRequests.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">🗓️ Employee Off Day Requests</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload size={14} /> Upload Excel
              <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Add Request
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Emp No</th><th>Employee</th>
                <th>Requested Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offRequests.map(or => {
                const ss = STATUS_STYLE[or.status] || STATUS_STYLE.PENDING;
                return (
                  <tr key={or.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{or.empId}</td>
                    <td style={{ fontWeight: 500 }}>{or.empName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{or.date}</td>
                    <td>
                      <select
                        style={{
                          background: ss.bg, color: ss.color,
                          border: `1px solid ${ss.color}44`,
                          borderRadius: 20, padding: '3px 10px',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                        value={or.status}
                        onChange={e => handleStatus(or.id, e.target.value)}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(or.id)}>
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
        <OffForm employees={employees} settings={settings} onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}
    </div>
  );
}
