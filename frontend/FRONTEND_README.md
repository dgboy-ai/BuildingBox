# LOST SIGNAL — Incident Command Frontend

Operation: Lost Signal (Build in a Box, TechUtsav 1.0). **Hackathon prototype with SIMULATED data. Not real GPS, not certified for real rescue.**

Frontend for the Incident Commander: WHO needs help first? WHERE to send 3 limited teams? WHY, and how confident are we?

## Run

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

Connect to teammate backend (optional):
```bash
cp .env.example .env
# edit .env: VITE_API_BASE_URL=http://127.0.0.1:8000
npm run dev
```
Without `.env`, app runs in MOCK MODE with bundled data + local scoring. Badge in header shows LIVE vs MOCK.

Build check:
```bash
npm run build
```

## What was built

- `src/data/mockTrekkers.js` — 6 simulated trekkers (TRK-01…TRK-06), 3 rescue teams, weather presets
- `src/lib/scoring.js` — transparent 100-pt priority engine (injury 30 + battery 20 + staleness 15 + signal 15 + weather/terrain 10 + isolation 10), rank + team allocator
- `src/services/api.js` — `VITE_API_BASE_URL` service layer with 3.5s timeout + mock fallback, never mislabels mock as live
- `src/components/` — `RecommendedAction` (explainable triage), `TrekkerCard` (why-score expandable), `Simulator` (weather/signal/battery what-if with before→after rank deltas), `ReliabilityInspector` (stale/contradictory/no-signal table), `ResourcePanel` (3 teams → top sectors), `badges`
- `src/App.jsx` — stats, search + sector/priority filter + sort, empty-state, error handling, responsive dark command-center theme

## Differentiator (why not a generic dashboard)

1. **Explainable triage, not just a list** — every score shows its math + unknowns.
2. **Honest uncertainty** — contradictory pings and search-radius shown; never pins a false precise location.
3. **Live cause→effect simulator** — “Storm hits” button moves ranks in front of judges using real recalculation.

## Files created/changed (frontend only, backend untouched)

Created: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`,
`src/main.jsx`, `src/index.css`, `src/App.jsx`, `src/data/mockTrekkers.js`, `src/lib/scoring.js`,
`src/services/api.js`, `src/components/*.jsx`, `.env.example`, `FRONTEND_API_CONTRACT.md`.
Preserved: `frontend/app.py` (legacy placeholder, unused), `backend/` untouched.

## Assumptions & limits

- Synthetic telemetry; staleness measured to 11:30 AM incident time.
- Search radius heuristic: 0.8 km per hour stale + confidence gap — illustrative only.
- Weather penalty is a simple multiplier, not a terrain model.
- 3 teams cannot cover 6 trekkers — system forces triage by design.
