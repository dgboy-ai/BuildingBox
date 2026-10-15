// SignalFuse mock service — SEPARATE from presentation components.
// Clearly labelled fallback when backend unavailable. Mirrors locked backend
// heuristics so the workflow (plan/report/reset/replan) can be demoed honestly.
// All telemetry is SIMULATED. Unknown fields are null and rendered as "Unknown".

export const REF = '11:55 AM';
export const MULT = { clear: 1.0, cloudy: 1.25, storm: 1.6 };
export const BASE_ETA = { 'A-South': 20, 'B-North': 25, 'C-East': 35, 'D-West': 45 };

// Original sample values (simulated). One null each on TRK-02/TRK-03 to demo Unknown handling.
function baseMission() {
  return {
    ref: REF,
    records: [
      { id: 'TRK-01', name: 'Aarav Sharma', sector: 'B-North', sector_label: 'Sector B-North (Ridge Trail)', ping: '07:15 AM', hours_elapsed: 4.67, signal_bars: 1, battery_pct: 14, health: 'minor', health_label: 'Minor ankle injury', conflicting: true, note: 'Cell handshake B-North vs ranger log B-Ridge junction.' },
      { id: 'TRK-02', name: 'Maya Patel', sector: 'B-North', sector_label: 'Sector B-North (Ridge Trail)', ping: '07:18 AM', hours_elapsed: 4.62, signal_bars: 2, battery_pct: null, health: null, health_label: null, conflicting: false, note: 'Paired with TRK-01. Battery and health not yet confirmed.' },
      { id: 'TRK-03', name: 'Rohan Varma', sector: 'C-East', sector_label: 'Sector C-East (Gorge Creek)', ping: '06:40 AM', hours_elapsed: 5.25, signal_bars: 0, battery_pct: 8, health: null, health_label: null, conflicting: false, note: 'Gorge blocks signal. Health unknown — treat with precautionary allowance.' },
      { id: 'TRK-04', name: 'Ananya Sen', sector: 'A-South', sector_label: 'Sector A-South (Pine Basin)', ping: '08:05 AM', hours_elapsed: 3.83, signal_bars: 3, battery_pct: 56, health: 'none', health_label: 'No reported injury', conflicting: false, note: 'Sheltered basin, most stable fix.' },
      { id: 'TRK-05', name: 'Vikram Malhotra', sector: 'D-West', sector_label: 'Sector D-West (Old Mine Pass)', ping: '05:55 AM', hours_elapsed: 6.0, signal_bars: 1, battery_pct: 22, health: 'serious', health_label: 'Chest pain reported', conflicting: false, note: 'Highest altitude, oldest ping, solo.' },
      { id: 'TRK-06', name: 'Dr. Priyamvada Iyer', sector: 'A-South', sector_label: 'Sector A-South (Pine Basin)', ping: '08:12 AM', hours_elapsed: 3.72, signal_bars: 3, battery_pct: 67, health: 'none', health_label: 'No reported injury (medical asset)', conflicting: false, note: 'Doctor in field — can stabilize others.' }
    ],
    known_fields: ['sector', 'ping time', 'signal', 'battery', 'health'],
    report_applied: false
  };
}

let live = baseMission();

export function getMockMission() {
  return JSON.parse(JSON.stringify(live));
}

export function resetMockMission() {
  live = baseMission();
  return getMockMission();
}

// Scripted TRK-05 field report: worsening chest pain, battery drop, signal loss.
export function applyMockReport() {
  live = getMockMission();
  live.records = live.records.map((r) =>
    r.id === 'TRK-05'
      ? { ...r, health: 'serious', health_label: 'Chest pain worsening (field report 12:05 PM)', battery_pct: 9, signal_bars: 0, hours_elapsed: 6.2, ping: '05:55 AM', conflicting: false, note: 'FIELD REPORT 12:05 PM: chest pain worsening, battery 9%, signal lost. Still D-West.' }
      : r
  );
  live.report_applied = true;
  live.ref = '12:05 PM';
  return getMockMission();
}

function urgencyOf(t, weather) {
  let s = 35;
  if (t.health === 'minor') s += 15;
  if (t.health === 'serious') s += 30;
  if (t.battery_pct !== null && t.battery_pct !== undefined) {
    if (t.battery_pct <= 15) s += 20;
    else if (t.battery_pct <= 30) s += 12;
    else if (t.battery_pct <= 50) s += 5;
  }
  if (t.signal_bars !== null && t.signal_bars !== undefined) {
    if (t.signal_bars <= 1) s += 10;
    else if (t.signal_bars === 2) s += 5;
  }
  s += Math.min(15, Math.floor(t.hours_elapsed) * 3);
  if (weather === 'cloudy') s += 5;
  if (weather === 'storm') s += 15;
  const floor = Math.min(100, s);
  const upper = Math.min(
    100,
    floor + (t.health == null ? 20 : 0) + (t.battery_pct == null ? 10 : 0) + (t.signal_bars == null ? 10 : 0)
  );
  return { lo: floor, hi: upper, mid: (floor + upper) / 2 };
}

function confidenceOf(t) {
  const F = Math.max(0, 100 - 15 * t.hours_elapsed);
  const S = t.sector ? 100 : 0;
  const G = t.signal_bars !== null && t.signal_bars !== undefined ? 20 * t.signal_bars : 0;
  const known = [t.sector, t.ping, t.signal_bars, t.battery_pct, t.health].filter((v) => v !== null && v !== undefined && v !== '').length;
  const D = (100 * known) / 5;
  return Math.round((0.35 * F + 0.25 * S + 0.2 * G + 0.2 * D) * 10) / 10;
}

export function planMock(mission, weather) {
  const bySector = {};
  mission.records.forEach((t) => {
    (bySector[t.sector] = bySector[t.sector] || []).push(t);
  });

  let actions = Object.entries(bySector).map(([sector, members]) => {
    const us = members.map((m) => urgencyOf(m, weather));
    const cs = members.map((m) => confidenceOf(m));
    const lo = Math.min(...us.map((u) => u.lo));
    const hi = Math.max(...us.map((u) => u.hi));
    const mid = us.reduce((a, u) => a + u.mid, 0) / us.length;
    const conf = Math.round((cs.reduce((a, c) => a + c, 0) / cs.length) * 10) / 10;
    const eta = Math.round(BASE_ETA[sector] * (MULT[weather] ?? 1.25) * 10) / 10;
    const P = 100 * (1 - eta / 90);
    const R = Math.round((0.6 * mid + 0.2 * (100 - conf) + 0.2 * P) * 10) / 10;

    const reasons = [];
    if (members.some((m) => m.health === 'serious')) reasons.push('Serious injury in sector (+30)');
    else if (members.some((m) => m.health === 'minor')) reasons.push('Minor injury in sector (+15)');
    if (members.some((m) => m.battery_pct !== null && m.battery_pct <= 15)) reasons.push('Critical battery ≤15% (+20)');
    if (members.every((m) => m.hours_elapsed > 4)) reasons.push('All pings >4h stale (+12–15)');
    if (members.some((m) => m.signal_bars !== null && m.signal_bars <= 1)) reasons.push('Weak/lost signal 0–1 bars (+10)');
    if (weather === 'storm') reasons.push('Storm +15 urgency, ETA ×1.6');
    else if (weather === 'cloudy') reasons.push('Cloudy +5 urgency, ETA ×1.25');
    if (sector === 'C-East') reasons.push('Gorge flash-mudslide hazard');
    if (sector === 'D-West') reasons.push('High-altitude cold + oldest ping');

    const missing = [];
    members.forEach((m) => {
      if (m.health == null) missing.push(`${m.id} health unknown (+20 allowance)`);
      if (m.battery_pct == null) missing.push(`${m.id} battery unknown (+10 allowance)`);
      if (m.signal_bars == null) missing.push(`${m.id} signal unknown (+10 allowance)`);
      if (m.hours_elapsed > 4) missing.push(`${m.id} ping >4h old — drift likely`);
      if (m.conflicting) missing.push(`${m.id} conflicting sector reports`);
    });

    return {
      sector,
      sector_label: members[0].sector_label,
      trekker_ids: members.map((m) => m.id),
      urgency_low: lo,
      urgency_high: hi,
      urgency_mid: Math.round(mid * 10) / 10,
      confidence: conf,
      eta_min: eta,
      decision_score: R,
      reasons,
      missing,
      assumptions: [
        `Clear-weather base ETA ${BASE_ETA[sector]} min × ${MULT[weather]} (${weather}).`,
        'Sector urgency spans member range; confidence is member average.',
        'Unknown health/battery/signal use precautionary upper-bound allowances.'
      ],
      team: null,
      kit_assigned: false,
      unassigned_reason: null
    };
  });

  actions.sort((a, b) => b.decision_score - a.decision_score);
  // Assign max 3 teams / 2 kits in rank order; ETA>60 unsafe; always leave ≥1 unassigned.
  const teamNames = ['Alpha', 'Bravo', 'Charlie'];
  let teamsLeft = 3;
  let kitsLeft = 2;
  actions = actions.map((a, idx) => ({ ...a, rank: idx + 1 }));
  const lastIdx = actions.length - 1;
  actions.forEach((a, i) => {
    if (a.eta_min > 60) {
      a.unassigned_reason = `Unsafe: ETA ${a.eta_min} min > 60 min heuristic. Stage at sector edge.`;
      return;
    }
    if (i === lastIdx) {
      a.unassigned_reason = 'Held in reserve: at least one action stays unassigned with 3 teams / 4 sectors.';
      return;
    }
    if (teamsLeft > 0) {
      a.team = teamNames[3 - teamsLeft];
      teamsLeft -= 1;
      const hasSerious = a.trekker_ids.some((id) => mission.records.find((r) => r.id === id)?.health === 'serious');
      if (kitsLeft > 0 && (hasSerious || i < 2)) {
        a.kit_assigned = true;
        kitsLeft -= 1;
      }
    } else {
      a.unassigned_reason = 'No rescue team left (limit 3).';
    }
  });

  // Next Best Question: value = urgency_mid * (1 - C/100), prefer unknowns.
  let nbq = null;
  {
    const scored = mission.records.map((t) => {
      const u = urgencyOf(t, weather);
      const c = confidenceOf(t);
      return { t, value: u.mid * (1 - c / 100), c };
    }).sort((a, b) => b.value - a.value);
    const top = scored[0];
    if (top) {
      const need = [];
      if (top.t.health == null) need.push('health');
      if (top.t.battery_pct == null) need.push('battery');
      if (top.t.signal_bars == null) need.push('signal');
      const q = need.length
        ? `Ask ${top.t.id} (${top.t.sector}): confirm ${need.join(' + ')} to cut uncertainty?`
        : `Re-ping ${top.t.id} (${top.t.sector}): fresh GPS would raise confidence ${top.c}%?`;
      nbq = { question: q, trekker_id: top.t.id, sector: top.t.sector, value: Math.round(top.value * 10) / 10 };
    }
  }

  const warnings = [];
  if (weather === 'storm') warnings.push('Storm: aerial search grounded, gorge/high-pass travel slowed (×1.6).');
  warnings.push('At least one sector action held unassigned — 3 teams cannot cover 4 sectors.');
  if (mission.records.some((r) => r.hours_elapsed > 5)) warnings.push('Pings >5h old exist — treat locations as sectors, not coordinates.');
  if (live.report_applied || mission.report_applied) warnings.push('TRK-05 field report applied — D-West urgency raised.');

  return { ranked_actions: actions, next_best_question: nbq, global_warnings: warnings, weather, ref: mission.ref };
}
