// API service layer — tries live FastAPI backend, falls back to local mock.
// Backend base URL configured via VITE_API_BASE_URL.
// Never present mock as live: callers must check `source` field.

import { MOCK_TREKKERS, MOCK_TEAMS } from '../data/mockTrekkers.js';
import { rankTrekkers, allocateTeams } from '../lib/scoring.js';

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const TIMEOUT_MS = 3500;

async function fetchWithTimeout(url, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function getTrekkers() {
  if (!BASE) {
    return { source: 'mock', trekkers: MOCK_TREKKERS, note: 'VITE_API_BASE_URL not set — using bundled simulated data.' };
  }
  try {
    const res = await fetchWithTimeout(`${BASE}/api/trekkers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const trekkers = Array.isArray(data) ? data : data.trekkers || data.items || [];
    if (!trekkers.length) throw new Error('empty');
    return { source: 'live', trekkers, note: 'Live backend' };
  } catch (e) {
    return { source: 'mock', trekkers: MOCK_TREKKERS, note: `Backend unreachable (${e.message}) — fallback to simulated data.`, error: String(e) };
  }
}

export async function getPriorities(sim) {
  // sim = { weather: 1|2|3, signalDegradation: 0-2, batteryDrain: 0-30 }
  if (!BASE) {
    const ranked = rankTrekkers(MOCK_TREKKERS, sim);
    return { source: 'mock', ranked, note: 'Local calculation (mock mode)' };
  }
  try {
    const q = new URLSearchParams({
      weather: String(sim.weather),
      signalDegradation: String(sim.signalDegradation || 0),
      batteryDrain: String(sim.batteryDrain || 0)
    });
    const res = await fetchWithTimeout(`${BASE}/api/priorities?${q.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const ranked = Array.isArray(data) ? data : data.ranked || data.priorities || [];
    if (!ranked.length) throw new Error('empty priorities');
    return { source: 'live', ranked, note: 'Live backend scoring' };
  } catch (e) {
    const ranked = rankTrekkers(MOCK_TREKKERS, sim);
    return { source: 'mock', ranked, note: `Backend unreachable — local scoring fallback. (${e.message})`, error: String(e) };
  }
}

export async function getResources(ranked, weatherSev) {
  if (!BASE) {
    return { source: 'mock', teams: MOCK_TEAMS, plan: allocateTeams(ranked, MOCK_TEAMS, weatherSev) };
  }
  try {
    const res = await fetchWithTimeout(`${BASE}/api/resources`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const teams = data.teams || MOCK_TEAMS;
    const plan = data.plan || allocateTeams(ranked, teams, weatherSev);
    return { source: 'live', teams, plan };
  } catch {
    return { source: 'mock', teams: MOCK_TEAMS, plan: allocateTeams(ranked, MOCK_TEAMS, weatherSev) };
  }
}

export const API_CONTRACT = `
OPERATION: LOST SIGNAL — Frontend needs (give to backend teammate):

BASE URL -> set as VITE_API_BASE_URL in frontend/.env (e.g. http://127.0.0.1:8000)

1) GET /api/trekkers
   Response: { "trekkers": [ {id, name, age, sector, sectorLabel, lastPing, minutesAgo,
     elevation, signalBars, signalLabel, battery, injury, injurySeverity (none|minor|moderate|severe),
     gear[], companions, groupId, confidence (0-100), confidenceLabel, status, statusNote, lastMessage} ] }

2) GET /api/priorities?weather=1|2|3&signalDegradation=0..2&batteryDrain=0..30
   Response: { "ranked": [ {...trekker, score (0-100), level (CRITICAL|HIGH|MEDIUM|STABLE),
     reasons[], missing[], radiusKm } ], "source": "live" }
   Scoring weights (mirror frontend src/lib/scoring.js): injury 30 + battery 20 + staleness 15
     + signal 15 + weather/terrain 10 + isolation 10. TRK-06 doctor -4.

3) GET /api/resources
   Response: { "teams": [ {id, size, medic:boolean, base, status, speed} ],
               "plan": [ {trekkerId, sector, teamId, action, why} ] }

4) (optional) POST /api/simulate  Body: {weather, signalDegradation, batteryDrain}
   Response: same as GET /api/priorities.

Errors: JSON { "error": "message" } with proper HTTP code.
CORS: allow http://localhost:5173.
`;
