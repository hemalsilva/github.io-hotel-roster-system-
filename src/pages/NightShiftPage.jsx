// src/pages/NightShiftPage.jsx
import { useApp } from '../context/AppContext';
import { RotateCcw, Moon, Sun, Users } from 'lucide-react';

const ROTATION_HISTORY = [
  { month: 'April',  year: 2026, group: 'A', status: 'DONE' },
  { month: 'May',    year: 2026, group: 'C', status: 'DONE' },
  { month: 'July',   year: 2026, group: 'C', status: 'NEXT' },
  { month: 'August', year: 2026, group: 'A', status: 'NEXT' },
];

export default function NightShiftPage() {
  const { state, dispatch, toast } = useApp();
  const { employees, settings } = state;
  const { nightGroup } = settings;

  const order = ['A', 'B', 'C'];
  const nextGroup = order[(order.indexOf(nightGroup) + 1) % 3];

  function handleRotate() {
    dispatch({ type: 'ROTATE_NIGHT_GROUP' });
    dispatch({ type: 'UPDATE_SETTINGS', payload: { nightGroup: nextGroup } });
    toast(`Night shift rotated to Group ${nextGroup}!`, 'success');
  }

  const monthName = new Date(settings.year, settings.month - 1, 1)
    .toLocaleString('en', { month: 'long' });

  return (
    <div>
      {/* Current Month Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1A0A2E 0%, #2D0060 100%)',
        border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(167,139,250,0.6)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Night Shift — {monthName} {settings.year}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#A78BFA' }}>
            🌙 Group {nightGroup} on Night Duty
          </div>
          <div style={{ color: 'rgba(167,139,250,0.7)', fontSize: 13, marginTop: 6 }}>
            {employees.filter(e => e.nightGroup === nightGroup).map(e => e.name.split(' ')[0]).join(' · ')}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.5)', marginBottom: 8 }}>Next Month</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'rgba(167,139,250,0.5)' }}>Group {nextGroup}</div>
          <button className="btn btn-purple" style={{ marginTop: 10 }} onClick={handleRotate}>
            <RotateCcw size={14} /> Rotate Now
          </button>
        </div>
      </div>

      {/* Groups */}
      <div className="three-col" style={{ marginBottom: 20 }}>
        {['A','B','C'].map(g => {
          const members = employees.filter(e => e.nightGroup === g);
          const isActive = g === nightGroup;
          const isNext   = g === nextGroup;
          return (
            <div key={g} className="card" style={{
              border: `2px solid ${isActive ? 'rgba(124,58,237,0.5)' : isNext ? 'rgba(124,58,237,0.2)' : 'var(--border)'}`,
              background: isActive ? 'rgba(124,58,237,0.05)' : 'var(--bg-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: isActive ? 'rgba(124,58,237,0.2)' : 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {isActive ? '🌙' : '☀️'}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isActive ? '#A78BFA' : 'var(--text-secondary)' }}>
                    Group {g}
                  </div>
                  {isActive && (
                    <span style={{ fontSize: 10, background: 'rgba(124,58,237,0.3)', color: '#A78BFA', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                      ● ACTIVE THIS MONTH
                    </span>
                  )}
                  {isNext && !isActive && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                      → Next month
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map(emp => (
                  <div key={emp.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 8,
                    background: 'var(--bg-secondary)',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: isActive ? 'rgba(124,58,237,0.2)' : 'var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: isActive ? '#A78BFA' : 'var(--text-muted)',
                    }}>
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{emp.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{emp.position}</div>
                    </div>
                    {isActive && <Moon size={12} color="var(--purple-light)" style={{ marginLeft: 'auto' }} />}
                  </div>
                ))}
                {members.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '12px' }}>
                    No employees in this group
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rotation Calendar */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📅 Rotation History & Schedule</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Month</th><th>Year</th><th>Night Group</th>
                <th>Members</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...ROTATION_HISTORY.filter(r => r.status === 'DONE'),
                {
                  month: monthName, year: settings.year,
                  group: nightGroup,
                  status: 'ACTIVE',
                },
                ...ROTATION_HISTORY.filter(r => r.status === 'NEXT'),
              ].map((row, i) => {
                const members = employees
                  .filter(e => e.nightGroup === row.group)
                  .map(e => e.name.split(' ')[0])
                  .join(', ');
                const isActive = row.status === 'ACTIVE';
                return (
                  <tr key={i} style={{ background: isActive ? 'rgba(124,58,237,0.05)' : '' }}>
                    <td style={{ fontWeight: isActive ? 700 : 400 }}>{row.month}</td>
                    <td>{row.year}</td>
                    <td>
                      <span className="night-group-badge" style={{
                        background: isActive ? 'rgba(124,58,237,0.2)' : 'transparent',
                        opacity: isActive ? 1 : 0.6,
                      }}>
                        🌙 Group {row.group}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{members}</td>
                    <td>
                      <span style={{
                        padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        background: isActive ? 'rgba(124,58,237,0.2)' : row.status === 'DONE' ? 'rgba(46,160,67,0.15)' : 'rgba(210,153,34,0.15)',
                        color: isActive ? '#A78BFA' : row.status === 'DONE' ? '#56D364' : '#E8B63A',
                      }}>
                        {isActive ? '● ACTIVE' : row.status === 'DONE' ? '✓ DONE' : '→ UPCOMING'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
