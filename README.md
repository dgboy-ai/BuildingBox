# SignalFuse — Operation: Lost Signal

Explainable rescue decision-support for the Incident Commander.
Turns incomplete signals into ranked sector-actions with visible reasoning.
Heuristics only — NOT a validated SAR model.

## Problem
Six trekkers missing, pings up to 6h stale and partly contradictory,
limited teams/kits/daylight, storm closing in. A map of pins is not enough:
the commander needs who to send where first, why, and what changes the plan.

## Run (backend)
Terminal 1: `cd backend && pip install -r requirements.txt && uvicorn main:app --port 8000`
Health: `GET http://127.0.0.1:8000/health` → `{"ok": true}`
Docs: `http://127.0.0.1:8000/docs`
Terminal fallback (no server): `python backend/engine.py`
Frontend (Tejshvee, React+Vite): `cd frontend && npm install && npm run dev` → port 5173.
Mock contract for UI: `contract/plan.sample.json` (cloudy, 4 teams, UTF-8).

## API
| Endpoint | Example |
|---|---|
| `GET /api/mission` | 6 trekkers, unknown = `null` |
| `POST /api/plan {"weather":"storm","available_teams":4,"medical_kits":2,"reference_time":"11:55 AM"}` | ranked actions + unassigned + next_best_question |
| `POST /api/report {"trekker_id":"TRK-05","ping_time":"11:40","battery":9,"signal_bars":0,"sector":"D-West","weather":"cloudy","teams":4,"medkits":2,"ref":"11:55 AM"}` | applies simulated report, returns full plan |
| `POST /api/reset` | restores original state — run before every demo |
| bad `trekker_id` → 404, bad `weather` → 422, never 500 |

## Assumptions (all hand-set, unvalidated)
- Scenario clock `11:55 AM` (adjustable). Oldest ping 05:55 = 6.0h stale.
- Resources: 4 teams demo (3 also works), 2 med kits, 240 min daylight.
- Synthetic travel: A-South 20, B-North 25, C-East 35, D-West 45 min × weather 1.0/1.25/1.6.
- Safe approach limit 60 min; feasibility `P=100×(1−ETA/90)`.
- Urgency base 35: minor +15 / serious +30, batt ≤15 +20 / ≤30 +12 / ≤50 +5, signal ≤1 +10 / 2 bars +5, +3/stale-hr cap 15, cloudy +5 / storm +15. Unknown adds +20 health/+10 batt/+10 signal to the high end (range, never hidden).
- Confidence `0.35F+0.25S+0.20G+0.20D`; rank `0.6U+0.2(100−C)+0.2P`, +6 for shared sector. Sector U = max member midpoint, C = average.
- Kits: injured clusters first (only TRK-01 reported), 2nd kit labelled precautionary.
- TRK-01 companion reported; identity as TRK-02 is assumed, not proven. All other missing fields are `null`.
- Demo order: Clear (D-West assigned) → Storm (D-West unsafe, ETA 72>60) → Reset → Report TRK-05 in cloudy (urgency low rises, confidence rises, rank holds — frame as "now actionable", not "higher rank").

## Real vs mock
Real: scoring, ETA, dispatch, NBQ heuristic, API, reset, 4 tests.
Mock: trekker nulls, distances, multipliers, weights, clock, teams/kits, sample JSON snapshot, TRK-05 report. In-memory state only, no DB/GPS/maps/LLM.

## Limitations
No database by design (isolated state layer, `/reset` restores). No real coordinates.
PM times not parsed (AM-only scenario). Daylight total not enforced in dispatch (only per-sector 60-min rule). Weights not calibrated. Prototype only.
