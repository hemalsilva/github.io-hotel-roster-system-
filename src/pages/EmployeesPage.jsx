// src/pages/EmployeesPage.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserPlus, Trash2, Edit2, Save, X, Moon, UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DAYS_OF_WEEK, DEPARTMENTS } from '../data/initialData';

function EmployeeRow({ emp, nightGroup, shiftOptions, onEdit, onDelete }) {
  const isNight = emp.nightGroup === nightGroup;
  
  const getBadgeStyle = (code) => {
    const s = shiftOptions.find(opt => opt.code === code);
    if (!s) return { background: '#eee', color: '#333', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 };
    return { background: s.bg, color: s.color, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 };
  };
  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{emp.id}</td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isNight && <Moon size={12} color="var(--purple-light)" />}
          <span>{emp.name}</span>
        </div>
      </td>
      <td>{emp.position}</td>
      <td>{emp.section}</td>
      <td><span className={`badge-shift badge-${emp.skill}`}>{emp.skill}</span></td>
      <td><span style={getBadgeStyle(emp.defaultShift)}>{emp.defaultShift}</span></td>
      <td style={{ color: 'var(--text-secondary)' }}>{emp.weeklyOff}</td>
      <td>
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: 11,
          background: isNight ? 'rgba(124,58,237,0.15)' : 'transparent',
          color: isNight ? 'var(--purple-light)' : 'var(--text-muted)',
          border: `1px solid ${isNight ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`,
        }}>
          {isNight && '🌙 '}Group {emp.nightGroup}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(emp)}><Edit2 size={12} /></button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(emp.id)}><Trash2 size={12} /></button>
        </div>
      </td>
    </tr>
  );
}

function EmployeeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', position: 'Room Attendant', section: 'Rooms',
    skill: 'A', defaultShift: 'M', weeklyOff: 'Sunday', nightGroup: 'A',
  });

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ minWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-title">{initial ? 'Edit Employee' : 'Add New Employee'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={14} /></button>
        </div>
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Employee Name</label>
            <input className="form-control" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Position</label>
            <select className="form-control" value={form.position}
              onChange={e => setForm(f => ({ ...f, position: e.target.value }))}>
              <option>Room Attendant</option>
              <option>Supervisor</option>
              <option>Team Leader</option>
              <option>Houseman</option>
              <option>Linen Attendant</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Section / Department</label>
            <select className="form-control" value={form.section}
              onChange={e => setForm(f => ({ ...f, section: e.target.value }))}>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Skill Level</label>
            <select className="form-control" value={form.skill}
              onChange={e => setForm(f => ({ ...f, skill: e.target.value }))}>
              <option value="A">A (Senior)</option>
              <option value="B">B (Regular)</option>
              <option value="C">C (Junior)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Default Shift</label>
            <select className="form-control" value={form.defaultShift}
              onChange={e => setForm(f => ({ ...f, defaultShift: e.target.value }))}>
              <option value="M">Morning (M)</option>
              <option value="E">Evening (E)</option>
              <option value="N">Night (N)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Weekly Off Day</label>
            <select className="form-control" value={form.weeklyOff}
              onChange={e => setForm(f => ({ ...f, weeklyOff: e.target.value }))}>
              {DAYS_OF_WEEK.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Night Shift Group</label>
            <select className="form-control" value={form.nightGroup}
              onChange={e => setForm(f => ({ ...f, nightGroup: e.target.value }))}>
              <option value="A">Group A</option>
              <option value="B">Group B</option>
              <option value="C">Group C</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>
            <Save size={14} /> {initial ? 'Update' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const { state, dispatch, toast } = useApp();
  const { employees, settings, shiftOptions } = state;
  const [showForm, setShowForm] = useState(false);
  const [editEmp, setEditEmp] = useState(null);

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
        
        const newEmps = data.map(row => ({
          name: row['Employee Name'] || row['Name'] || 'Unknown',
          position: row['Position'] || 'Room Attendant',
          section: row['Section'] || row['Department'] || 'Rooms',
          skill: row['Skill Level'] || row['Skill'] || 'B',
          defaultShift: row['Default Shift'] || 'M',
          weeklyOff: row['Weekly Off'] || 'Sunday',
          nightGroup: row['Night Group'] || 'A'
        }));

        if (newEmps.length > 0) {
          dispatch({ type: 'BULK_ADD_EMPLOYEES', payload: newEmps });
          toast(`Successfully uploaded ${newEmps.length} employees!`, 'success');
        } else {
          toast('No data found in Excel file', 'warning');
        }
      } catch (err) {
        toast('Error parsing Excel file', 'danger');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  }

  function handleAdd(form) {
    dispatch({ type: 'ADD_EMPLOYEE', payload: form });
    setShowForm(false);
    toast(`Employee "${form.name}" added!`, 'success');
  }

  function handleUpdate(form) {
    dispatch({ type: 'UPDATE_EMPLOYEE', payload: { ...form, id: editEmp.id } });
    setEditEmp(null);
    toast(`Employee "${form.name}" updated!`, 'success');
  }

  function handleDelete(id) {
    const emp = employees.find(e => e.id === id);
    if (confirm(`Delete "${emp?.name}"?`)) {
      dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
      toast(`Employee deleted`, 'warning');
    }
  }

  const byGroup = { A: 0, B: 0, C: 0 };
  employees.forEach(e => byGroup[e.nightGroup]++);

  return (
    <div>
      {/* Summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="kpi-card blue">
          <div className="kpi-label">Total Employees</div>
          <div className="kpi-value">{employees.length}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label">Night Group A</div>
          <div className="kpi-value">{byGroup.A}</div>
          <div className="kpi-sub">{settings.nightGroup === 'A' ? '🌙 Active this month' : 'Resting'}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label">Night Group B</div>
          <div className="kpi-value">{byGroup.B}</div>
          <div className="kpi-sub">{settings.nightGroup === 'B' ? '🌙 Active this month' : 'Resting'}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label">Night Group C</div>
          <div className="kpi-value">{byGroup.C}</div>
          <div className="kpi-sub">{settings.nightGroup === 'C' ? '🌙 Active this month' : 'Resting'}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">👥 Employee Master List</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
              <UploadCloud size={14} /> Bulk Upload (Excel)
              <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              <UserPlus size={14} /> Add Employee
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Emp No</th>
                <th>Name</th>
                <th>Position</th>
                <th>Section</th>
                <th>Skill</th>
                <th>Default Shift</th>
                <th>Weekly Off</th>
                <th>Night Group</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <EmployeeRow
                  key={emp.id}
                  emp={emp}
                  nightGroup={settings.nightGroup}
                  shiftOptions={shiftOptions}
                  onEdit={setEditEmp}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(showForm || editEmp) && (
        <EmployeeForm
          initial={editEmp}
          onSave={editEmp ? handleUpdate : handleAdd}
          onCancel={() => { setShowForm(false); setEditEmp(null); }}
        />
      )}
    </div>
  );
}
