import sys
import re

with open('src/pages/EmployeesPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

rep1 = "<td style={{ color: 'var(--text-secondary)' }}>{Array.isArray(emp.weeklyOff) ? emp.weeklyOff.join(', ') : emp.weeklyOff}</td>"
content = content.replace('<td style={{ color: \'var(--text-secondary)\' }}>{emp.weeklyOff}</td>', rep1)

new_state = '''  const [form, setForm] = useState(initial ? {
    ...initial,
    weeklyOff: Array.isArray(initial.weeklyOff) ? initial.weeklyOff : [initial.weeklyOff].filter(Boolean),
  } : {
    id: '', name: '', position: 'Room Attendant', floorNo: '', section: 'Rooms',
    defaultShift: 'M', weeklyOff: ['Sunday'],
  });'''
content = re.sub(r'  const \[form, setForm\] = useState\(initial \|\| \{.*?\n  \}\);', new_state, content, flags=re.DOTALL)

emp_num_input = '''          <div className="form-group" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
          </div>'''
content = re.sub(r'<div className="form-group" style={{ gridColumn: .1 / -1. }}>\s*<label className="form-label">Employee Name</label>\s*<input className="form-control" value=\{form\.name\}\s*onChange=\{e => setForm\(f => \(\{ \.\.\.f, name: e\.target\.value \}\)\)\} />\s*</div>', emp_num_input, content, flags=re.DOTALL)

old_weekly_off = '''          <div className="form-group">
            <label className="form-label">Weekly Off Day</label>
            <select className="form-control" value={form.weeklyOff}
              onChange={e => setForm(f => ({ ...f, weeklyOff: e.target.value }))}>
              {DAYS_OF_WEEK.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>'''

new_weekly_off = '''          <div className="form-group">
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
          </div>'''
content = content.replace(old_weekly_off, new_weekly_off)

with open('src/pages/EmployeesPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Success 3')
