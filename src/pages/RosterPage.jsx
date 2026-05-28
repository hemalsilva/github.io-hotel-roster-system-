// src/pages/RosterPage.jsx
// ─── Main Roster Page with Manual Editing ───────────────
import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  getDaysInMonth, getWeekdayIndex, getDayAbbr, validateRoster
} from '../utils/rosterEngine';
import { SHIFT_OPTIONS } from '../data/initialData';
import {
  Zap, Download, RefreshCw, AlertTriangle, CheckCircle,
  Edit3, Undo2, Filter, Eye, EyeOff, Info
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ── Shift Dropdown (inline cell editor) ──────────────────
function ShiftDropdown({ empId, empName, day, currentShift, position, onSelect, onClose, busyInfo }) {
  const [reason, setReason] = useState('');

  function handleSelect(code) {
    onSelect(empId, day, code, reason, empName);
    onClose();
  }

  return (
    <>
      <div className="shift-dropdown-overlay" onClick={onClose} />
      <div className="shift-dropdown" style={{ top: position.y, left: position.x }}>
        <div className="dropdown-header">
          <span>✏️ {empName} — Day {day}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>×</button>
        </div>

        {busyInfo && (
          <div style={{
            padding: '6px 8px', marginBottom: 8, borderRadius: 6,
            background: busyInfo.level === 'HIGH' ? 'rgba(218,54,51,0.1)' : busyInfo.level === 'LOW' ? 'rgba(46,160,67,0.1)' : 'rgba(210,153,34,0.1)',
            border: `1px solid ${busyInfo.level === 'HIGH' ? 'rgba(218,54,51,0.3)' : busyInfo.level === 'LOW' ? 'rgba(46,160,67,0.3)' : 'rgba(210,153,34,0.3)'}`,
            fontSize: 10, color: busyInfo.level === 'HIGH' ? '#FF7B7B' : busyInfo.level === 'LOW' ? '#56D364' : '#E8B63A',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Info size={10} />
            {busyInfo.level} occupancy {busyInfo.occupancy}% — {busyInfo.level === 'HIGH' ? 'Avoid OFF if possible' : busyInfo.level === 'LOW' ? 'Good day for OFF' : 'Normal day'}
          </div>
        )}

        <div className="dropdown-shifts">
          {SHIFT_OPTIONS.map(s => (
            <button
              key={s.code}
              className={`dropdown-shift-btn ${currentShift === s.code ? 'active' : ''}`}
              style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}33` }}
              onClick={() => handleSelect(s.code)}
            >
              {s.code}
              <span style={{ fontSize: 9, display: 'block', fontWeight: 400, opacity: 0.8 }}>{s.label}</span>
            </button>
          ))}
        </div>

        <div className="dropdown-note">
          <input
            placeholder="Reason (optional)..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
            autoFocus
          />
        </div>
      </div>
    </>
  );
}

// ── Shift Cell ────────────────────────────────────────────
function ShiftCell({ empId, empName, day, shift, isManual, busyInfo, onClick }) {
  const shiftColor = SHIFT_OPTIONS.find(s => s.code === shift);

  return (
    <td style={{ padding: '2px', minWidth: 38 }}>
      <div
        className={`shift-cell shift-${shift} ${isManual ? 'manual-edit' : ''}`}
        onClick={e => onClick(e, empId, empName, day, shift)}
        title={`${empName} - Day ${day}: ${shift}${busyInfo ? ` | ${busyInfo.level} ${busyInfo.occupancy}%` : ''}`}
      >
        {shift || '—'}
      </div>
    </td>
  );
}

// ── Main Roster Page ──────────────────────────────────────
export default function RosterPage() {
  const { state, dispatch, toast } = useApp();
  const {
    employees, roster, stats, dailySummary, busyMap,
    settings, rules, alerts, manualEdits, rosterGenerated
  } = state;

  const [dropdown, setDropdown] = useState(null);
  const [showAlerts, setShowAlerts] = useState(true);
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [highlightManual, setHighlightManual] = useState(true);

  const { month, year, nightGroup, monthlyDayOff } = settings;
  const numDays = getDaysInMonth(year, month);
  const monthName = new Date(year, month - 1, 1).toLocaleString('en', { month: 'long' });

  const dangerAlerts = alerts.filter(a => a.type === 'danger');
  const warnAlerts   = alerts.filter(a => a.type === 'warning');

  const filteredEmployees = filterGroup === 'ALL'
    ? employees
    : filterGroup === 'NIGHT'
    ? employees.filter(e => e.nightGroup === nightGroup)
    : employees.filter(e => e.nightGroup === filterGroup);

  // Generate if not done
  function handleGenerate() {
    dispatch({ type: 'GENERATE_ROSTER' });
    toast('Roster generated!', 'success');
  }

  // Cell click opens dropdown
  function handleCellClick(e, empId, empName, day, currentShift) {
    if (!rosterGenerated) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let x = rect.left + window.scrollX;
    let y = rect.bottom + window.scrollY + 4;
    // keep in viewport
    if (x + 230 > window.innerWidth) x = window.innerWidth - 240;
    if (y + 300 > window.innerHeight) y = rect.top + window.scrollY - 310;
    setDropdown({ empId, empName, day, currentShift, position: { x, y } });
  }

  function handleShiftSelect(empId, day, newShift, reason, empName) {
    dispatch({
      type: 'MANUAL_EDIT_CELL',
      payload: { empId, day, newShift, reason, empName },
    });
    const bd = busyMap[day];
    if (newShift === 'OFF' && bd?.level === 'HIGH') {
      toast(`⚠️ Warning: ${empName} set OFF on HIGH occupancy day ${day}`, 'warning');
    } else {
      toast(`Edited: ${empName} Day ${day} → ${newShift}`, 'success');
    }
  }

  function handleUndo() {
    toast('Undo: Regenerating roster (clears manual edits)', 'info');
    dispatch({ type: 'GENERATE_ROSTER' });
  }

  // Export to Excel
  function handleExport() {
    if (!rosterGenerated) { toast('Generate the roster first', 'warning'); return; }
    const wb = XLSX.utils.book_new();
    const header = ['Emp No', 'Employee Name', ...Array.from({length: numDays}, (_,i) => String(i+1)), 'Work Days', 'OFF Days', 'Night(N)'];
    const rows = [header];
    filteredEmployees.forEach(emp => {
      const row = [emp.id, emp.name];
      for (let d = 1; d <= numDays; d++) row.push(roster[emp.id]?.[d] || '');
      const s = stats[emp.id] || {};
      row.push(s.workDays || 0, s.offDays || 0, s.nightDays || 0);
      rows.push(row);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, `${monthName} ${year}`);
    XLSX.writeFile(wb, `Roster_${monthName}_${year}.xlsx`);
    toast('Roster exported to Excel!', 'success');
  }

  // Occupancy class for column header
  function getOccClass(day) {
    const bd = busyMap[day];
    if (!bd) return '';
    return `occ-${bd.level.toLowerCase()}`;
  }

  if (!rosterGenerated) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 40px' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📅</div>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>No Roster Generated Yet</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
          Configure your settings and click Generate to create the smart monthly roster.
        </p>
        <button className="btn btn-primary btn-lg" onClick={handleGenerate}>
          <Zap size={18} /> Generate {monthName} {year} Roster
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Alerts */}
      {showAlerts && dangerAlerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {dangerAlerts.slice(0, 3).map((a, i) => (
            <div key={i} className="alert-banner danger" style={{ marginBottom: 4 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Roster Container */}
      <div className="roster-container">
        {/* Toolbar */}
        <div className="roster-toolbar">
          <div className="roster-toolbar-title">
            📅 {monthName} {year} Roster
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10, fontWeight: 400 }}>
              {filteredEmployees.length} employees · Click any cell to edit · {Object.keys(manualEdits).length} manual edits
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter */}
            <select
              className="form-control"
              style={{ padding: '5px 8px', fontSize: 11, width: 'auto' }}
              value={filterGroup}
              onChange={e => setFilterGroup(e.target.value)}
            >
              <option value="ALL">All Employees</option>
              <option value="A">Night Group A</option>
              <option value="B">Night Group B</option>
              <option value="C">Night Group C</option>
              <option value="NIGHT">Active Night Shift</option>
            </select>

            <button
              className={`btn btn-sm ${highlightManual ? 'btn-warning' : 'btn-ghost'}`}
              onClick={() => setHighlightManual(!highlightManual)}
              title="Toggle manual edit highlights"
            >
              <Edit3 size={12} /> {Object.keys(manualEdits).length} edits
            </button>

            <button
              className={`btn btn-sm ${showAlerts ? 'btn-danger' : 'btn-ghost'}`}
              onClick={() => setShowAlerts(!showAlerts)}
            >
              <AlertTriangle size={12} />
              {dangerAlerts.length + warnAlerts.length} alerts
            </button>

            <button className="btn btn-ghost btn-sm" onClick={handleUndo} title="Regenerate (clears manual edits)">
              <Undo2 size={12} /> Reset
            </button>

            <button className="btn btn-success btn-sm" onClick={handleGenerate}>
              <RefreshCw size={12} /> Regenerate
            </button>

            <button className="btn btn-primary btn-sm" onClick={handleExport}>
              <Download size={12} /> Export Excel
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="legend">
            {SHIFT_OPTIONS.map(s => (
              <div key={s.code} className="legend-item">
                <div className="legend-color" style={{ background: s.bg, border: `1px solid ${s.color}44` }} />
                <span>{s.code} = {s.label}</span>
              </div>
            ))}
            <div className="legend-item">
              <div className="legend-color" style={{ background: 'rgba(251,183,36,0.1)', border: '2px solid #FBB724' }} />
              <span>✏️ Manual Edit</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: 'var(--occ-high)', borderBottom: '2px solid var(--occ-high-border)' }} />
              <span>HIGH Occ</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: 'var(--occ-low)', borderBottom: '2px solid var(--occ-low-border)' }} />
              <span>LOW Occ</span>
            </div>
          </div>
        </div>

        {/* Roster Table */}
        <div className="roster-scroll">
          <table className="roster-table">
            <thead>
              <tr>
                <th className="name-col">Employee</th>
                {Array.from({ length: numDays }, (_, i) => {
                  const d = i + 1;
                  const isWknd = [0,6].includes(getWeekdayIndex(year, month, d));
                  const occClass = getOccClass(d);
                  const bd = busyMap[d];
                  return (
                    <th
                      key={d}
                      className={`${isWknd ? 'weekend' : ''} ${occClass}`}
                      title={bd ? `${bd.level} - ${bd.occupancy}% occupancy` : ''}
                    >
                      <div style={{ fontWeight: 700 }}>{d}</div>
                      <div style={{ fontSize: 9, opacity: 0.7 }}>{getDayAbbr(year, month, d)}</div>
                    </th>
                  );
                })}
                <th title="Working Days">WD</th>
                <th title="OFF Days">OFF</th>
                <th title="Night Shifts">N</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, rowIdx) => {
                const empStats = stats[emp.id] || {};
                const isNightEmp = emp.nightGroup === nightGroup;
                return (
                  <tr key={emp.id}>
                    <td className="name-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isNightEmp && <span title="On Night Shift this month" style={{ fontSize: 10 }}>🌙</span>}
                        <div>
                          <div style={{ fontWeight: 500 }}>{emp.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {emp.position} · Gr {emp.nightGroup}
                          </div>
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: numDays }, (_, i) => {
                      const d = i + 1;
                      const shift = roster[emp.id]?.[d] || '';
                      const editKey = `${emp.id}-${d}`;
                      const isManual = highlightManual && !!manualEdits[editKey];
                      const bd = busyMap[d];
                      return (
                        <ShiftCell
                          key={d}
                          empId={emp.id}
                          empName={emp.name}
                          day={d}
                          shift={shift}
                          isManual={isManual}
                          busyInfo={bd}
                          onClick={handleCellClick}
                        />
                      );
                    })}
                    <td className="summary-cell">
                      <span className="count-badge ok">{empStats.workDays || 0}</span>
                    </td>
                    <td className="summary-cell">
                      <span className="count-badge ok">{empStats.offDays || 0}</span>
                    </td>
                    <td className="summary-cell">
                      <span className={`count-badge ${isNightEmp ? 'warn' : 'ok'}`}>
                        {empStats.nightDays || 0}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* Daily On-Duty Count Row */}
              <tr className="summary-row">
                <td className="name-cell" style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)' }}>
                  📊 On-Duty Count
                </td>
                {Array.from({ length: numDays }, (_, i) => {
                  const d = i + 1;
                  const count = dailySummary[d]?.onDuty || 0;
                  const bd = busyMap[d];
                  const minReq = bd?.level === 'HIGH' ? rules.minStaffHigh : bd?.level === 'LOW' ? rules.minStaffLow : rules.minStaffMed;
                  const isLow = count < minReq;
                  return (
                    <td key={d} className="summary-cell" title={`${count} on duty${bd ? `, need ${minReq} (${bd.level})` : ''}`}>
                      <span className={`count-badge ${isLow ? 'danger' : 'ok'}`}>{count}</span>
                    </td>
                  );
                })}
                <td className="summary-cell" colSpan={3} />
              </tr>

              {/* Daily OFF Count Row */}
              <tr className="summary-row">
                <td className="name-cell" style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)' }}>
                  📴 OFF Count
                </td>
                {Array.from({ length: numDays }, (_, i) => {
                  const d = i + 1;
                  const count = dailySummary[d]?.offCount || 0;
                  const bd = busyMap[d];
                  const maxOff = bd?.level === 'HIGH' ? rules.maxOffHigh : bd?.level === 'LOW' ? rules.maxOffLow : rules.maxOffMed;
                  const isHigh = count > maxOff;
                  return (
                    <td key={d} className="summary-cell">
                      <span className={`count-badge ${isHigh ? 'warn' : 'ok'}`}>{count}</span>
                    </td>
                  );
                })}
                <td className="summary-cell" colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* All Alerts Section */}
      {alerts.length > 0 && showAlerts && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div className="card-title"><AlertTriangle size={16} /> All Alerts & Warnings</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {dangerAlerts.length} critical · {warnAlerts.length} warnings
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alerts.map((a, i) => (
              <div key={i} className={`alert-banner ${a.type === 'danger' ? 'danger' : 'warning'}`}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12 }}>{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dropdown */}
      {dropdown && (
        <ShiftDropdown
          empId={dropdown.empId}
          empName={dropdown.empName}
          day={dropdown.day}
          currentShift={dropdown.currentShift}
          position={dropdown.position}
          busyInfo={busyMap[dropdown.day]}
          onSelect={handleShiftSelect}
          onClose={() => setDropdown(null)}
        />
      )}
    </div>
  );
}
