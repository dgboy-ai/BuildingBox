import math
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SignalFuse — Rescue Intelligence Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REF = "11:55 AM"
MULT = {"clear": 1.0, "cloudy": 1.25, "storm": 1.6}
BASE_ETA = {"A-South": 20, "B-North": 25, "C-East": 35, "D-West": 45}

def get_base_mission():
    return {
        "ref": REF,
        "records": [
            {
                "id": "TRK-01",
                "name": "Aarav Sharma",
                "sector": "B-North",
                "sector_label": "Sector B-North (Ridge Trail)",
                "ping": "07:15 AM",
                "hours_elapsed": 4.67,
                "signal_bars": 1,
                "battery_pct": 14,
                "health": "minor",
                "health_label": "Minor ankle injury",
                "conflicting": True,
                "note": "Cell handshake B-North vs ranger log B-Ridge junction."
            },
            {
                "id": "TRK-02",
                "name": "Maya Patel",
                "sector": "B-North",
                "sector_label": "Sector B-North (Ridge Trail)",
                "ping": "07:18 AM",
                "hours_elapsed": 4.62,
                "signal_bars": 2,
                "battery_pct": None,
                "health": None,
                "health_label": None,
                "conflicting": False,
                "note": "Paired with TRK-01. Battery and health not yet confirmed."
            },
            {
                "id": "TRK-03",
                "name": "Rohan Varma",
                "sector": "C-East",
                "sector_label": "Sector C-East (Gorge Creek)",
                "ping": "06:40 AM",
                "hours_elapsed": 5.25,
                "signal_bars": 0,
                "battery_pct": 8,
                "health": None,
                "health_label": None,
                "conflicting": False,
                "note": "Gorge blocks signal. Health unknown — treat with precautionary allowance."
            },
            {
                "id": "TRK-04",
                "name": "Ananya Sen",
                "sector": "A-South",
                "sector_label": "Sector A-South (Pine Basin)",
                "ping": "08:05 AM",
                "hours_elapsed": 3.83,
                "signal_bars": 3,
                "battery_pct": 56,
                "health": "none",
                "health_label": "No reported injury",
                "conflicting": False,
                "note": "Sheltered basin, most stable fix."
            },
            {
                "id": "TRK-05",
                "name": "Vikram Malhotra",
                "sector": "D-West",
                "sector_label": "Sector D-West (Old Mine Pass)",
                "ping": "05:55 AM",
                "hours_elapsed": 6.0,
                "signal_bars": 1,
                "battery_pct": 22,
                "health": "serious",
                "health_label": "Chest pain reported",
                "conflicting": False,
                "note": "Highest altitude, oldest ping, solo."
            },
            {
                "id": "TRK-06",
                "name": "Dr. Priyamvada Iyer",
                "sector": "A-South",
                "sector_label": "Sector A-South (Pine Basin)",
                "ping": "08:12 AM",
                "hours_elapsed": 3.72,
                "signal_bars": 3,
                "battery_pct": 67,
                "health": "none",
                "health_label": "No reported injury (medical asset)",
                "conflicting": False,
                "note": "Doctor in field — can stabilize others."
            }
        ],
        "known_fields": ["sector", "ping time", "signal", "battery", "health"],
        "report_applied": False
    }

live_mission = get_base_mission()

def urgency_of(t, weather: str):
    s = 35
    if t.get("health") == "minor":
        s += 15
    if t.get("health") == "serious":
        s += 30
    
    bp = t.get("battery_pct")
    if bp is not None:
        if bp <= 15:
            s += 20
        elif bp <= 30:
            s += 12
        elif bp <= 50:
            s += 5
            
    sb = t.get("signal_bars")
    if sb is not None:
        if sb <= 1:
            s += 10
        elif sb == 2:
            s += 5
            
    hours = t.get("hours_elapsed", 0)
    s += min(15, math.floor(hours) * 3)
    if weather == "cloudy":
        s += 5
    elif weather == "storm":
        s += 15
        
    floor = min(100, s)
    upper = min(
        100,
        floor
        + (20 if t.get("health") is None else 0)
        + (10 if t.get("battery_pct") is None else 0)
        + (10 if t.get("signal_bars") is None else 0)
    )
    return {"lo": floor, "hi": upper, "mid": (floor + upper) / 2}

def confidence_of(t):
    hours = t.get("hours_elapsed", 0)
    F = max(0, 100 - 15 * hours)
    S = 100 if t.get("sector") else 0
    sb = t.get("signal_bars")
    G = 20 * sb if sb is not None else 0
    fields = [t.get("sector"), t.get("ping"), t.get("signal_bars"), t.get("battery_pct"), t.get("health")]
    known = len([v for v in fields if v is not None and v != ""])
    D = (100 * known) / 5
    return round((0.35 * F + 0.25 * S + 0.2 * G + 0.2 * D) * 10) / 10

def plan_mission(mission_data, weather: str, teams_count: int = 3, kits_count: int = 2):
    by_sector: Dict[str, List[Any]] = {}
    for t in mission_data["records"]:
        sec = t["sector"]
        if sec not in by_sector:
            by_sector[sec] = []
        by_sector[sec].append(t)
        
    actions = []
    for sector, members in by_sector.items():
        us = [urgency_of(m, weather) for m in members]
        cs = [confidence_of(m) for m in members]
        lo = min(u["lo"] for u in us)
        hi = max(u["hi"] for u in us)
        mid = sum(u["mid"] for u in us) / len(us)
        conf = round((sum(cs) / len(cs)) * 10) / 10
        mult = MULT.get(weather, 1.25)
        eta = round(BASE_ETA.get(sector, 30) * mult * 10) / 10
        P = 100 * (1 - eta / 90)
        R = round((0.6 * mid + 0.2 * (100 - conf) + 0.2 * P) * 10) / 10
        
        reasons = []
        if any(m.get("health") == "serious" for m in members):
            reasons.append("Serious injury in sector (+30)")
        elif any(m.get("health") == "minor" for m in members):
            reasons.append("Minor injury in sector (+15)")
        if any(m.get("battery_pct") is not None and m["battery_pct"] <= 15 for m in members):
            reasons.append("Critical battery ≤15% (+20)")
        if all(m.get("hours_elapsed", 0) > 4 for m in members):
            reasons.append("All pings >4h stale (+12–15)")
        if any(m.get("signal_bars") is not None and m["signal_bars"] <= 1 for m in members):
            reasons.append("Weak/lost signal 0–1 bars (+10)")
        if weather == "storm":
            reasons.append("Storm +15 urgency, ETA ×1.6")
        elif weather == "cloudy":
            reasons.append("Cloudy +5 urgency, ETA ×1.25")
        if sector == "C-East":
            reasons.append("Gorge flash-mudslide hazard")
        if sector == "D-West":
            reasons.append("High-altitude cold + oldest ping")
            
        missing = []
        for m in members:
            if m.get("health") is None:
                missing.append(f"{m['id']} health unknown (+20 allowance)")
            if m.get("battery_pct") is None:
                missing.append(f"{m['id']} battery unknown (+10 allowance)")
            if m.get("signal_bars") is None:
                missing.append(f"{m['id']} signal unknown (+10 allowance)")
            if m.get("hours_elapsed", 0) > 4:
                missing.append(f"{m['id']} ping >4h old — drift likely")
            if m.get("conflicting"):
                missing.append(f"{m['id']} conflicting sector reports")
                
        actions.append({
            "sector": sector,
            "sector_label": members[0].get("sector_label", sector),
            "trekker_ids": [m["id"] for m in members],
            "urgency_low": lo,
            "urgency_high": hi,
            "urgency_mid": round(mid * 10) / 10,
            "confidence": conf,
            "eta_min": eta,
            "decision_score": R,
            "reasons": reasons,
            "missing": missing,
            "assumptions": [
                f"Clear-weather base ETA {BASE_ETA.get(sector, 30)} min × {mult} ({weather}).",
                "Sector urgency spans member range; confidence is member average.",
                "Unknown health/battery/signal use precautionary upper-bound allowances."
            ],
            "team": None,
            "kit_assigned": False,
            "unassigned_reason": None
        })
        
    actions.sort(key=lambda x: x["decision_score"], reverse=True)
    team_names = ["Alpha", "Bravo", "Charlie"]
    teams_left = teams_count
    kits_left = kits_count
    for idx, a in enumerate(actions):
        a["rank"] = idx + 1
        
    last_idx = len(actions) - 1
    for i, a in enumerate(actions):
        if a["eta_min"] > 60:
            a["unassigned_reason"] = f"Unsafe: ETA {a['eta_min']} min > 60 min heuristic. Stage at sector edge."
            continue
        if i == last_idx:
            a["unassigned_reason"] = "Held in reserve: at least one action stays unassigned with 3 teams / 4 sectors."
            continue
        if teams_left > 0:
            a["team"] = team_names[teams_count - teams_left]
            teams_left -= 1
            has_serious = any(
                next((r for r in mission_data["records"] if r["id"] == tid), {}).get("health") == "serious"
                for tid in a["trekker_ids"]
            )
            if kits_left > 0 and (has_serious or i < 2):
                a["kit_assigned"] = True
                kits_left -= 1
        else:
            a["unassigned_reason"] = f"No rescue team left (limit {teams_count})."

    # Next best question
    nbq = None
    scored_trekkers = []
    for t in mission_data["records"]:
        u = urgency_of(t, weather)
        c = confidence_of(t)
        val = u["mid"] * (1 - c / 100)
        scored_trekkers.append({"t": t, "val": val, "c": c})
    scored_trekkers.sort(key=lambda x: x["val"], reverse=True)
    if scored_trekkers:
        top = scored_trekkers[0]
        need = []
        if top["t"].get("health") is None:
            need.append("health")
        if top["t"].get("battery_pct") is None:
            need.append("battery")
        if top["t"].get("signal_bars") is None:
            need.append("signal")
        if need:
            q = f"Ask {top['t']['id']} ({top['t']['sector']}): confirm {' + '.join(need)} to cut uncertainty?"
        else:
            q = f"Re-ping {top['t']['id']} ({top['t']['sector']}): fresh GPS would raise confidence {top['c']}%?"
        nbq = {
            "question": q,
            "trekker_id": top["t"]["id"],
            "sector": top["t"]["sector"],
            "value": round(top["val"] * 10) / 10
        }
        
    warnings = []
    if weather == "storm":
        warnings.append("Storm: aerial search grounded, gorge/high-pass travel slowed (×1.6).")
    warnings.append("At least one sector action held unassigned — 3 teams cannot cover 4 sectors.")
    if any(r.get("hours_elapsed", 0) > 5 for r in mission_data["records"]):
        warnings.append("Pings >5h old exist — treat locations as sectors, not coordinates.")
    if mission_data.get("report_applied"):
        warnings.append("TRK-05 field report applied — D-West urgency raised.")
        
    return {
        "ranked_actions": actions,
        "next_best_question": nbq,
        "global_warnings": warnings,
        "weather": weather,
        "ref": mission_data["ref"]
    }

class PlanRequest(BaseModel):
    weather: str = "cloudy"
    teams: Optional[int] = 3
    kits: Optional[int] = 2
    ref: Optional[str] = "11:55 AM"

class ReportRequest(BaseModel):
    trekker_id: str
    ref: Optional[str] = "11:55 AM"
    report: Optional[str] = "TRK-05_SCRIPTED"

class ResetRequest(BaseModel):
    ref: Optional[str] = "11:55 AM"

@app.get("/health")
def health():
    return {"status": "ok", "service": "SignalFuse Rescue Intelligence"}

@app.get("/api/mission")
def get_mission():
    return {"mission": live_mission}

@app.post("/api/plan")
def create_plan(body: PlanRequest):
    return plan_mission(live_mission, body.weather, body.teams or 3, body.kits or 2)

@app.post("/api/report")
def submit_report(body: ReportRequest):
    global live_mission
    for r in live_mission["records"]:
        if r["id"] == body.trekker_id:
            r["health"] = "serious"
            r["health_label"] = "Chest pain worsening (field report 12:05 PM)"
            r["battery_pct"] = 9
            r["signal_bars"] = 0
            r["hours_elapsed"] = 6.2
            r["ping"] = "05:55 AM"
            r["conflicting"] = False
            r["note"] = "FIELD REPORT 12:05 PM: chest pain worsening, battery 9%, signal lost. Still D-West."
    live_mission["report_applied"] = True
    live_mission["ref"] = "12:05 PM"
    return {"status": "success", "mission": live_mission}

@app.post("/api/reset")
def reset_mission(body: Optional[ResetRequest] = None):
    global live_mission
    live_mission = get_base_mission()
    return {"status": "success", "mission": live_mission}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)