// src/utils/rosterEngine.js
// ─────────────────────────────────────────────────────────
// Smart AI Roster Generation Engine
// ─────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function getWeekdayIndex(year, month, day) {
  // 0=Sunday, 1=Monday, ..., 6=Saturday
  return new Date(year, month - 1, day).getDay();
}

export function isWeekend(year, month, day) {
  const wd = getWeekdayIndex(year, month, day);
  return wd === 0 || wd === 6; // Sunday or Saturday
}

export function getDayAbbr(year, month, day) {
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][getWeekdayIndex(year, month, day)];
}

/**
 * Build lookup maps from raw data arrays
 */
function buildLookups(employees, leaves, offRequests, busyDays, settings) {
  const { month, year, nightGroup } = settings;

  // Busy day lookup: day -> level
  const busyMap = {};
  busyDays.forEach(bd => {
    const d = parseInt(bd.date.split('-')[2]);
    const m = parseInt(bd.date.split('-')[1]);
    const y = parseInt(bd.date.split('-')[0]);
    if (m === month && y === year) {
      busyMap[d] = { level: bd.level, occupancy: bd.occupancy, required: bd.required };
    }
  });

  // Leave lookup: empId -> { day: leaveCode }
  const leaveMap = {};
  leaves.forEach(lv => {
    if (lv.status !== 'YES') return;
    const d = parseInt(lv.date.split('-')[2]);
    const m = parseInt(lv.date.split('-')[1]);
    const y = parseInt(lv.date.split('-')[0]);
    if (m === month && y === year) {
      if (!leaveMap[lv.empId]) leaveMap[lv.empId] = {};
      leaveMap[lv.empId][d] = lv.type;
    }
  });

  // Off request lookup: empId -> [days]
  const offMap = {};
  offRequests.forEach(or => {
    if (or.status !== 'APPROVED') return;
    const d = parseInt(or.date.split('-')[2]);
    const m = parseInt(or.date.split('-')[1]);
    const y = parseInt(or.date.split('-')[0]);
    if (m === month && y === year) {
      if (!offMap[or.empId]) offMap[or.empId] = [];
      offMap[or.empId].push(d);
    }
  });

  // Weekly off map
  const weeklyOffIndexMap = {};
  employees.forEach(emp => {
    weeklyOffIndexMap[emp.id] = DAY_NAMES.indexOf(emp.weeklyOff);
  });

  return { busyMap, leaveMap, offMap, weeklyOffIndexMap };
}

/**
 * Distribute monthly OFF days smartly (occupancy-aware)
 */
function distributeOffs(empId, weeklyOffWeekday, targetOffCount, leaveDays, approvedOffDays, numDays, busyMap, year, month, rules) {
  const offSet = new Set(approvedOffDays);

  if (offSet.size >= targetOffCount) return offSet;

  let remaining = targetOffCount - offSet.size;

  const lowDays = [], medDays = [], highDays = [];

  for (let d = 1; d <= numDays; d++) {
    if (leaveDays[d] || offSet.has(d)) continue;
    const wd = getWeekdayIndex(year, month, d);
    if (wd === weeklyOffWeekday) continue; // weekly off handled separately
    const level = busyMap[d]?.level || 'MEDIUM';
    if (level === 'LOW') lowDays.push(d);
    else if (level === 'MEDIUM') medDays.push(d);
    else highDays.push(d);
  }

  const pool = [...lowDays, ...medDays, ...highDays];
  for (const d of pool) {
    if (remaining <= 0) break;
    offSet.add(d);
    remaining--;
  }

  return offSet;
}

/**
 * Main roster generation function
 */
export function generateRoster(employees, leaves, offRequests, busyDays, settings, rules) {
  const { month, year, monthlyDayOff, nightGroup } = settings;
  const numDays = getDaysInMonth(year, month);

  const { busyMap, leaveMap, offMap, weeklyOffIndexMap } = buildLookups(
    employees, leaves, offRequests, busyDays, settings
  );

  // Daily off counter to enforce max offs per occupancy level
  const dailyOffCount = {};
  for (let d = 1; d <= numDays; d++) dailyOffCount[d] = 0;

  const result = {}; // empId -> { day: shiftCode }
  const stats  = {}; // empId -> { workDays, offDays, nightDays, leaveDays }

  for (const emp of employees) {
    const empId       = emp.id;
    const primaryShift = emp.nightGroup === nightGroup ? 'N' : emp.defaultShift;
    const weeklyOffWd  = weeklyOffIndexMap[empId] ?? 0;
    const leaveDays    = leaveMap[empId] || {};
    const approvedOffs = new Set(offMap[empId] || []);

    // Remove approved offs that clash with leave days
    for (const d of approvedOffs) {
      if (leaveDays[d]) approvedOffs.delete(d);
    }

    // Distribute additional off days smartly
    const offDaySet = distributeOffs(
      empId, weeklyOffWd, monthlyDayOff,
      leaveDays, [...approvedOffs], numDays,
      busyMap, year, month, rules
    );

    result[empId] = {};
    stats[empId]  = { workDays: 0, offDays: 0, nightDays: 0, leaveDays: 0 };

    for (let d = 1; d <= numDays; d++) {
      const occInfo  = busyMap[d] || { level: 'MEDIUM' };
      const occLevel = occInfo.level;
      const maxOff   = occLevel === 'HIGH' ? rules.maxOffHigh :
                       occLevel === 'LOW'  ? rules.maxOffLow  : rules.maxOffMed;
      const weekday  = getWeekdayIndex(year, month, d);
      let cv;

      if (leaveDays[d]) {
        // Priority 1: Approved leave
        cv = leaveDays[d];
        stats[empId].leaveDays++;
      } else if (weekday === weeklyOffWd) {
        // Priority 2: Weekly off (override on HIGH if maxOff reached)
        if (occLevel === 'HIGH' && dailyOffCount[d] >= rules.maxOffHigh) {
          cv = primaryShift;
          stats[empId].workDays++;
          if (cv === 'N') stats[empId].nightDays++;
        } else {
          cv = 'OFF';
          stats[empId].offDays++;
          dailyOffCount[d]++;
        }
      } else if (approvedOffs.has(d)) {
        // Priority 3: Approved off request
        if (dailyOffCount[d] < maxOff) {
          cv = 'OFF';
          stats[empId].offDays++;
          dailyOffCount[d]++;
        } else {
          cv = primaryShift;
          stats[empId].workDays++;
          if (cv === 'N') stats[empId].nightDays++;
        }
      } else if (offDaySet.has(d)) {
        // Priority 4: Auto-distributed off (occupancy-based)
        if (dailyOffCount[d] < maxOff) {
          cv = 'OFF';
          stats[empId].offDays++;
          dailyOffCount[d]++;
        } else {
          cv = primaryShift;
          stats[empId].workDays++;
          if (cv === 'N') stats[empId].nightDays++;
        }
      } else {
        cv = primaryShift;
        stats[empId].workDays++;
        if (cv === 'N') stats[empId].nightDays++;
      }

      result[empId][d] = cv;
    }
  }

  return { roster: result, stats, dailyOffCount, numDays, busyMap };
}

/**
 * Validate roster — returns array of alert objects
 */
export function validateRoster(roster, stats, employees, busyDays, settings, rules, manualEdits) {
  const { month, year } = settings;
  const numDays = getDaysInMonth(year, month);
  const alerts = [];

  // Build busy map
  const busyMap = {};
  busyDays.forEach(bd => {
    const d = parseInt(bd.date.split('-')[2]);
    const m = parseInt(bd.date.split('-')[1]);
    if (m === month) busyMap[d] = bd;
  });

  // Per-day staff count
  for (let d = 1; d <= numDays; d++) {
    const onDuty = employees.filter(emp => {
      const shift = roster[emp.id]?.[d];
      return shift && ['M', 'E', 'N'].includes(shift);
    }).length;

    const bd = busyMap[d];
    if (bd) {
      const minReq = bd.level === 'HIGH' ? rules.minStaffHigh : rules.minStaffMed;
      if (onDuty < minReq) {
        alerts.push({
          type: 'danger',
          day: d,
          message: `Day ${d}: Only ${onDuty} staff on duty, need ${minReq} (${bd.level} occupancy ${bd.occupancy}%)`,
        });
      }
    }

    // Check supervisors on duty
    const supervisorsOnDuty = employees.filter(emp => {
      const shift = roster[emp.id]?.[d];
      return emp.position === 'Supervisor' && shift && ['M','E','N'].includes(shift);
    }).length;
    if (supervisorsOnDuty < rules.minSupervisors) {
      alerts.push({
        type: 'warning',
        day: d,
        message: `Day ${d}: No supervisor on duty (found ${supervisorsOnDuty})`,
      });
    }
  }

  // Consecutive days check
  employees.forEach(emp => {
    let streak = 0;
    let maxStreak = 0;
    for (let d = 1; d <= numDays; d++) {
      const shift = roster[emp.id]?.[d];
      if (shift && ['M','E','N'].includes(shift)) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    }
    if (maxStreak > rules.maxConsecutive) {
      alerts.push({
        type: 'warning',
        empId: emp.id,
        message: `${emp.name}: ${maxStreak} consecutive work days (max is ${rules.maxConsecutive})`,
      });
    }
  });

  // Night shift overload
  employees.forEach(emp => {
    const nightCount = stats[emp.id]?.nightDays || 0;
    if (nightCount > rules.maxNightShifts) {
      alerts.push({
        type: 'warning',
        empId: emp.id,
        message: `${emp.name}: ${nightCount} night shifts (max is ${rules.maxNightShifts})`,
      });
    }
  });

  // Manual edits that conflict with HIGH occupancy
  Object.entries(manualEdits || {}).forEach(([key, edit]) => {
    const [empId, day] = key.split('-').map(Number);
    if (edit.newShift === 'OFF' && busyMap[day]?.level === 'HIGH') {
      const emp = employees.find(e => e.id === empId);
      alerts.push({
        type: 'warning',
        day,
        empId,
        message: `Manual edit: ${emp?.name} set to OFF on Day ${day} (HIGH occupancy ${busyMap[day]?.occupancy}%)`,
      });
    }
  });

  return alerts;
}

/**
 * Get day-level summary stats
 */
export function getDailySummary(roster, employees, numDays) {
  const summary = {};
  for (let d = 1; d <= numDays; d++) {
    const onDuty = employees.filter(e => ['M','E','N'].includes(roster[e.id]?.[d])).length;
    const offCount = employees.filter(e => roster[e.id]?.[d] === 'OFF').length;
    const nightCount = employees.filter(e => roster[e.id]?.[d] === 'N').length;
    const leaveCount = employees.filter(e => ['AL','CL','SL','HL','CO'].includes(roster[e.id]?.[d])).length;
    summary[d] = { onDuty, offCount, nightCount, leaveCount };
  }
  return summary;
}
