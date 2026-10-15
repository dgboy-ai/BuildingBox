# Frontend ↔ Backend Contract — Operation: Lost Signal

**Frontend owner: you. Backend owner: teammate. Do NOT change `backend/` from frontend side.**

## 1. Base URL

Frontend reads `VITE_API_BASE_URL` from `frontend/.env`:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

- If empty/unset → frontend runs in **MOCK MODE** (bundled simulated data + local scoring in `src/lib/scoring.js`). Badge shows “MOCK MODE”.
- If set → frontend tries live endpoints with 3.5s timeout, falls back to mock on any error. Badge shows “LIVE BACKEND” only on HTTP 200 with valid data.
- Never present mock as live — `src/services/api.js` returns `{ source: 'live'|'mock' }` and UI labels it.

Enable CORS on backend for `http://localhost:5173` and `http://127.0.0.1:5173`.

## 2. Endpoints needed

### GET /api/trekkers
Returns the 6 simulated profiles.
```json
{
  "trekkers": [
    {
      "id": "TRK-01", "name": "Aarav Sharma", "age": 28,
      "sector": "B-North", "sectorLabel": "Sector B-North (Ridge Trail)",
      "lastPing": "07:15 AM", "minutesAgo": 255, "elevation": 2450,
      "signalBars": 1, "signalLabel": "Weak (1 bar)", "battery": 14,
      "injury": "Minor ankle injury", "injurySeverity": "moderate",
      "gear": ["Thermal tent", "Emergency whistle", "Offline GPS"],
      "companions": "With TRK-02", "groupId": "G1",
      "confidence": 48, "confidenceLabel": "Low — single weak ping, 4h+ stale",
      "status": "contradictory", "statusNote": "...", "lastMessage": "..."
    }
  ]
}
```
`injurySeverity`: `none|minor|moderate|severe`. `status`: `reliable|stale|contradictory|critical`.

### GET /api/priorities?weather=1|2|3&signalDegradation=0..2&batteryDrain=0..30
`weather`: 1=cloudy, 2=rain, 3=storm.
```json
{
  "ranked": [
    {
      "id": "TRK-03", "score": 94, "level": "CRITICAL",
      "reasons": ["Injury +30: ...", "Battery 8% +20"],
      "missing": ["Precise location unconfirmed"],
      "radiusKm": 5.2,
      "...plus all trekker fields + _effBattery, _effSignal..."
    }
  ],
  "source": "live"
}
```
**Scoring weights (mirror `frontend/src/lib/scoring.js` exactly):**
injury 30 + battery 20 + staleness 15 + signal 15 + weather/terrain 10 + isolation 10 = 100.
- injury: severe 30 / moderate 18 / minor 10 / none 0
- battery (effective): ≤10 →20, ≤20 →15, ≤40 →8, else 2
- staleness: ≥300min →15, ≥240 →12, ≥180 →8, else 4
- signal (effective bars): 0 →15, 1 →12, 2 →6, else 2
- weather/terrain: min(10, weather*2 + (sector C-East|D-West ? 3 : 0))
- isolation: solo →10 else 3; TRK-06 doctor −4.
- level: ≥70 CRITICAL, ≥50 HIGH, ≥35 MEDIUM, else STABLE.
- radiusKm = round((minutesAgo/60*0.8 + (100-confidence)/25), 1 decimal).

### GET /api/resources
```json
{
  "teams": [
    {"id": "Alpha", "size": 4, "medic": true, "base": "Base Camp", "status": "ready", "speed": "fast"}
  ],
  "plan": [
    {"trekkerId": "TRK-03", "sector": "C-East", "teamId": "Alpha", "action": "DEPLOY NOW", "why": "Rank #1 CRITICAL (94)"}
  ]
}
```
Allocator rule (frontend fallback): top-3 ranked get teams; severe-injury prefers medic team; storm (weather=3) marks C-East “DELAYED — gorge unsafe”, D-West “SLOW GO”.

### (optional) POST /api/simulate
Body `{weather, signalDegradation, batteryDrain}` → same response as GET /api/priorities.

## 3. Errors
On failure return JSON `{ "error": "message" }` with proper HTTP code. Frontend treats any non-200 / timeout / empty array as “backend unreachable” and uses mock fallback.

## 4. Teammate checklist
- [ ] Implement the 3 GET endpoints above with exact field names
- [ ] Allow CORS for Vite dev server
- [ ] Run on `http://127.0.0.1:8000`
- [ ] Tell frontend owner the base URL → put in `frontend/.env` as `VITE_API_BASE_URL=...`
- [ ] Test: `curl http://127.0.0.1:8000/api/trekkers` returns 6 items
