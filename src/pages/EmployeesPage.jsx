// src/pages/EmployeesPage.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserPlus, Trash2, Edit2, Save, X, Moon, UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DAYS_OF_WEEK, DEPARTMENTS } from '../data/initialData';

function EmployeeRow({ emp, shiftOptions, onEdit, onDelete }) {
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
          <span>{emp.name}</span>
        </div>
      </td>
      <td>{emp.position}</td>
      <td>{emp.floorNo || '-'}</td>
      <td>{emp.section}</td>
      <td><span style={getBadgeStyle(emp.defaultShift)}>{emp.defaultShift}</span></td>
      <td style={{ color: 'var(--text-secondary)' }}>{Array.isArray(emp.weeklyOff) ? emp.weeklyOff.join(', ') : emp.weeklyOff}</td>
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
  const [form, setForm] = useState(initial ? {
    ...initial,
    weeklyOff: Array.isArray(initial.weeklyOff) ? initial.weeklyOff : [initial.weeklyOff].filter(Boolean),
  } : {
    id: '', name: '', position: 'Room Attendant', floorNo: '', section: 'Rooms',
    defaultShift: 'M', weeklyOff: ['Sunday'],
  });

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ minWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-title">{initial ? 'Edit Employee' : 'Add New Employee'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={14} /></button>
        </div>
        <div className="form-grid">
                    <div className="form-group" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="form-label">Employee Number</label>
              <input className="form-control" value={form.id || ''} disabled={!!initial} placeholder="e.g. 1001"
                onChange={e => setForm(f => ({ ...f, id: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Employee Name</label>
              <input className="form-control" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
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
              <option>Public Area Attendant</option>
              <option>Laundry Attendant</option>
              <option>Florist</option>
              <option>Storekeeper</option>
              <option>House Runner</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Floor No</label>
            <input className="form-control" value={form.floorNo}
              onChange={e => setForm(f => ({ ...f, floorNo: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Section / Dept</label>
            <input className="form-control" value={form.section}
              onChange={e => setForm(f => ({ ...f, section: e.target.value }))} />
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
            <label className="form-label">Weekly Off Days</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {DAYS_OF_WEEK.map(d => (
                <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13, userSelect: 'none' }}>
                  <input type="checkbox" checked={form.weeklyOff.includes(d)} 
                    onChange={e => {
                      if (e.target.checked) {
                        setForm(f => ({ ...f, weeklyOff: [...f.weeklyOff, d] }));
                      } else {
                        setForm(f => ({ ...f, weeklyOff: f.weeklyOff.filter(w => w !== d) }));
                      }
                    }}
                  />
                  {d.slice(0, 3)}
                </label>
              ))}
            </div>
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
        const wb = XLSX.read(bstr, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const newEmps = [];
        const newOffRequests = [];
        
        data.forEach(row => {
          const empId = Number(row['Emp No']) || Math.floor(Math.random() * 10000);
          const empName = row['Employee Name'] || row['Name'] || 'Unknown';
          
          newEmps.push({
            id: empId,
            name: empName,
            position: row['Position'] || 'Room Attendant',
            floorNo: String(row['Floor No'] || row['Floor'] || ''),
            section: row['Section'] || row['Department'] || 'Rooms',
            defaultShift: row['Default Shift'] || 'M',
            weeklyOff: row['Weekly Off'] || 'Sunday'
          });

          const offReqsRaw = row['Day off Request'] || row['Off Requests'] || row['Requested Dates'];
          if (offReqsRaw) {
            const dates = String(offReqsRaw).split(',').map(d => d.trim()).filter(Boolean);
            dates.forEach(d => {
              let parsedDate = d;
              if (!isNaN(d) && Number(d) > 30000) {
                const dateObj = new Date(Math.round((d - 25569) * 864e5));
                parsedDate = dateObj.toISOString().split('T')[0];
              }
              newOffRequests.push({
                empId,
                empName,
                date: parsedDate,
                status: 'APPROVED'
              });
            });
          }
        });

        if (newEmps.length > 0) {
          dispatch({ type: 'BULK_ADD_EMPLOYEES', payload: newEmps });
          toast(`Successfully uploaded ${newEmps.length} employees!`, 'success');
        } else {
          toast('No data found in Excel file', 'warning');
        }

        if (newOffRequests.length > 0) {
          setTimeout(() => {
            dispatch({ type: 'BULK_ADD_OFF_REQUESTS', payload: newOffRequests });
            toast(`Automatically added ${newOffRequests.length} off requests!`, 'success');
          }, 500);
        }
      } catch (err) {
        console.error(err); toast('Error: ' + err.message, 'danger');
      }
    };
    reader.readAsArrayBuffer(file);
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

  return (
    <div>
      {/* Summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', marginBottom: 20 }}>
        <div className="kpi-card blue">
          <div className="kpi-label">Total Employees</div>
          <div className="kpi-value">{employees.length}</div>
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
                <th>Floor No</th>
                <th>Section</th>
                <th>Default Shift</th>
                <th>Weekly Off</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <EmployeeRow
                  key={emp.id}
                  emp={emp}
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


