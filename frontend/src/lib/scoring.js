// Transparent priority scoring — same logic frontend uses for mock,
// backend teammate should mirror this for live results.
// Score 0-100. Higher = rescue first.

export function scoreTrekker(t, sim = { weather: 2, signalDegradation: 0, batteryDrain: 0 }) {
  const battery = Math.max(0, t.battery - (sim.batteryDrain || 0));
  const signalBars = Math.max(0, t.signalBars - (sim.signalDegradation || 0));
  const weatherSev = sim.weather ?? 2; // 1 cloudy, 2 rain, 3 storm

  const reasons = [];
  let score = 0;

  // 1. Injury (0-30)
  let injuryPts = 0;
  if (t.injurySeverity === 'severe') injuryPts = 30;
  else if (t.injurySeverity === 'moderate') injuryPts = 18;
  else if (t.injurySeverity === 'minor') injuryPts = 10;
  score += injuryPts;
  if (injuryPts > 0) reasons.push(`Injury +${injuryPts}: ${t.injury}`);

  // 2. Battery (0-20)
  let battPts = 0;
  if (battery <= 10) battPts = 20;
  else if (battery <= 20) battPts = 15;
  else if (battery <= 40) battPts = 8;
  else battPts = 2;
  score += battPts;
  reasons.push(`Battery ${battery}% +${battPts}`);

  // 3. Staleness (0-15)
  let stalePts = 0;
  if (t.minutesAgo >= 300) stalePts = 15;
  else if (t.minutesAgo >= 240) stalePts = 12;
  else if (t.minutesAgo >= 180) stalePts = 8;
  else stalePts = 4;
  score += stalePts;
  reasons.push(`Last ping ${t.lastPing} (${Math.floor(t.minutesAgo / 60)}h+ stale) +${stalePts}`);

  // 4. Signal (0-15)
  let sigPts = 0;
  if (signalBars <= 0) sigPts = 15;
  else if (signalBars === 1) sigPts = 12;
  else if (signalBars === 2) sigPts = 6;
  else sigPts = 2;
  score += sigPts;
  reasons.push(`Signal ${signalBars} bar${signalBars === 1 ? '' : 's'} +${sigPts}`);

  // 5. Weather + terrain hazard (0-10)
  const highRiskSector = t.sector === 'C-East' || t.sector === 'D-West';
  let wxPts = weatherSev * 2 + (highRiskSector ? 3 : 0);
  wxPts = Math.min(10, wxPts);
  score += wxPts;
  reasons.push(`Weather/terrain +${wxPts}${highRiskSector ? ' (hazard sector)' : ''}`);

  // 6. Isolation (0-10)
  let isoPts = 0;
  if (t.companions.toLowerCase().includes('solo')) isoPts = 10;
  else if (t.groupId.includes('solo')) isoPts = 10;
  else isoPts = 3;
  score += isoPts;
  if (isoPts >= 10) reasons.push(`Solo / isolated +${isoPts}`);
  else reasons.push(`Has companion +${isoPts} (lower risk)`);

  // Solo medical asset adjustment: TRK-06 is a doctor, slightly reduce
  if (t.id === 'TRK-06') {
    score -= 4;
    reasons.push('Medical asset -4 (can help others)');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const level = score >= 70 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'STABLE';

  // Search radius heuristic: grows with staleness + low confidence
  const radiusKm = Math.round(((t.minutesAgo / 60) * 0.8 + (100 - t.confidence) / 25) * 10) / 10;

  // Missing info
  const missing = [];
  if (t.confidence < 50) missing.push('Precise location unconfirmed');
  if (signalBars <= 1) missing.push('Signal too weak for triangulation');
  if (t.minutesAgo > 240) missing.push('Ping >4h old — drift likely');

  return {
    ...t,
    _effBattery: battery,
    _effSignal: signalBars,
    score,
    level,
    reasons,
    missing,
    radiusKm
  };
}

export function rankTrekkers(trekkers, sim) {
  return trekkers.map((t) => scoreTrekker(t, sim)).sort((a, b) => b.score - a.score);
}

export function allocateTeams(ranked, teams, weatherSev) {
  // Simple explainable allocator: top sectors get medic teams first,
  // storm blocks C-East air, D-West needs medic.
  const top = ranked.slice(0, 3);
  const plan = [];
  const used = new Set();
  top.forEach((t, i) => {
    const team = teams.find((tm) => !used.has(tm.id) && (t.injurySeverity === 'severe' ? tm.medic : true))
      || teams.find((tm) => !used.has(tm.id));
    if (!team) return;
    used.add(team.id);
    const accessible = weatherSev >= 3 && t.sector === 'C-East'
      ? 'DELAYED — gorge unsafe in storm, stage at rim'
      : weatherSev >= 3 && t.sector === 'D-West'
        ? 'SLOW GO — high pass, rope team needed'
        : 'DEPLOY NOW';
    plan.push({ trekkerId: t.id, sector: t.sector, teamId: team.id, action: accessible, why: `Rank #${i + 1} ${t.level} (${t.score})` });
  });
  return plan;
}
