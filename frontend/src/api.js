// SignalFuse — Locked API service module.
// Backend owns scoring. Frontend requests results, falls back to labelled mock.
// Base URL via VITE_API_BASE_URL, default http://localhost:8000
// Endpoints: GET /api/mission, POST /api/plan, POST /api/report, POST /api/reset, GET /health
// Do NOT silently substitute schema names. Planning request uses {weather, teams, kits, ref}.

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const TIMEOUT_MS = 3500;

async function req(path, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      signal: ctrl.signal
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); if (j.error) msg = j.error; } catch { /* ignore */ }
      throw new Error(msg);
    }
    // 204 / empty reset responses
    const text = await res.text();
    if (!text) return {};
    try { return JSON.parse(text); } catch { return {}; }
  } finally {
    clearTimeout(t);
  }
}

export function planBody(weather) {
  // Locked schema — do not rename keys.
  return { weather, teams: 3, kits: 2, ref: '11:55 AM' };
}

export async function checkHealth() {
  return req('/health', { method: 'GET' });
}

export async function fetchMission() {
  return req('/api/mission', { method: 'GET' });
}

export async function fetchPlan(weather) {
  return req('/api/plan', { method: 'POST', body: JSON.stringify(planBody(weather)) });
}

export async function sendReport() {
  // Scripted TRK-05 field report — body agreed with backend teammate.
  return req('/api/report', {
    method: 'POST',
    body: JSON.stringify({ trekker_id: 'TRK-05', ref: '11:55 AM', report: 'TRK-05_SCRIPTED' })
  });
}

export async function sendReset() {
  return req('/api/reset', { method: 'POST', body: JSON.stringify({ ref: '11:55 AM' }) });
}

export function backendBase() {
  return BASE;
}
