# SignalFuse engine — deterministic heuristics, NOT validated SAR model.
# All weights hand-set. Documented in README.
from __future__ import annotations
import copy

REF_DEFAULT = "11:55 AM"
DAYLIGHT_MIN = 240
SAFE_LIMIT_MIN = 60
FEAS_DENOM = 90.0

BASE_ETA = {"A-South": 20, "B-North": 25, "C-East": 35, "D-West": 45}
WEATHER_MULT = {"clear": 1.0, "cloudy": 1.25, "rain": 1.4, "storm": 1.6}
WEATHER_URG = {"clear": 0, "cloudy": 5, "rain": 6, "storm": 15}

INITIAL_TREKKERS = [
    {"id": "TRK-01", "name": "Aarav Sharma", "sector": "B-North",
     "last_ping": "07:15", "battery": 14, "signal_bars": 1,
     "injury": "minor", "elevation_m": 2450, "companion": None,
     "flags": ["ankle injury", "companion reported but identity unknown (TRK-02 proximity assumed, not proven)"]},
    {"id": "TRK-02", "name": "Maya Patel", "sector": "B-North",
     "last_ping": "07:18", "battery": None, "signal_bars": None,
     "injury": None, "elevation_m": None, "companion": None, "flags": []},
    {"id": "TRK-03", "name": "Rohan Varma", "sector": "C-East",
     "last_ping": "06:40", "battery": None, "signal_bars": None,
     "injury": None, "elevation_m": None, "companion": None, "flags": []},
    {"id": "TRK-04", "name": "Ananya Sen", "sector": "A-South",
     "last_ping": "08:05", "battery": None, "signal_bars": None,
     "injury": None, "elevation_m": None, "companion": None, "flags": []},
    {"id": "TRK-05", "name": "Vikram Malhotra", "sector": "D-West",
     "last_ping": "05:55", "battery": None, "signal_bars": None,
     "injury": None, "elevation_m": None, "companion": None, "flags": []},
    {"id": "TRK-06", "name": "Dr. Priyamvada Iyer", "sector": "A-South",
     "last_ping": "08:12", "battery": None, "signal_bars": None,
     "injury": None, "elevation_m": None, "companion": None, "flags": []},
]

_state = {"trekkers": copy.deepcopy(INITIAL_TREKKERS), "reports": []}


def reset_state():
    _state["trekkers"] = copy.deepcopy(INITIAL_TREKKERS)
    _state["reports"] = []


def set_trekkers(trekkers: list) -> int:
    """Replace in-memory trekkers with dashboard Sample JSON.
    Missing keys default to None (unknown). Returns count loaded."""
    norm = []
    for i, t in enumerate(trekkers):
        if not t.get("id") or not (t.get("last_ping") or t.get("ping_time")):
            raise ValueError(f"row {i}: 'id' and 'last_ping' are required")
        norm.append({
            "id": t.get("id"), "name": t.get("name"), "sector": t.get("sector"),
            "last_ping": t.get("last_ping") or t.get("ping_time"),
            "battery": t.get("battery"), "signal_bars": t.get("signal_bars"),
            "injury": t.get("injury"), "elevation_m": t.get("elevation_m"),
            "companion": t.get("companion"), "flags": t.get("flags") or [],
        })
    _state["trekkers"] = norm
    _state["reports"] = []
    return len(norm)


def get_trekkers():
    return copy.deepcopy(_state["trekkers"])


def public_trekker(e: dict) -> dict:
    """Trekker view with both backend names and the React table's key names.
    Unknowns stay None (UI renders 'Unknown')."""
    base = {k: e[k] for k in ("id", "name", "sector", "last_ping", "hours_stale",
                              "urgency", "confidence", "unknown", "flags") if k in e}
    base["ping"] = e.get("last_ping")
    base["hours_elapsed"] = e.get("hours_stale")
    base["battery_pct"] = e.get("battery")
    base["health"] = e.get("injury")
    return base


def _to_min(t: str) -> int:
    # "07:15" or "11:55 AM" (PM handled: +12h unless 12 PM)
    u = t.strip().upper()
    pm = u.endswith("PM")
    s = u.replace("AM", "").replace("PM", "").strip()
    hh, mm = s.split(":")
    h = int(hh) % 12
    if pm:
        h += 12
    return h * 60 + int(mm)


def hours_stale(ping: str, ref: str = REF_DEFAULT) -> float:
    return round((_to_min(ref) - _to_min(ping)) / 60.0, 2)


def urgency(t: dict, weather: str = "cloudy", ref: str = REF_DEFAULT) -> dict:
    low = 35.0
    factors = ["base 35"]
    inj = t.get("injury")
    if inj == "minor":
        low += 15; factors.append("minor injury +15")
    elif inj == "serious":
        low += 30; factors.append("serious injury +30")
    b = t.get("battery")
    if b is not None:
        if b <= 15:
            low += 20; factors.append(f"battery {b}% +20")
        elif b <= 30:
            low += 12; factors.append(f"battery {b}% +12")
        elif b <= 50:
            low += 5; factors.append(f"battery {b}% +5")
    s = t.get("signal_bars")
    if s is not None:
        if s <= 1:
            low += 10; factors.append(f"signal {s} bar +10")
        elif s == 2:
            low += 5; factors.append("signal 2 bars +5")
    h = hours_stale(t["last_ping"], ref)
    add = min(15, round(h * 3))
    low += add; factors.append(f"stale {h}h +{add}")
    w = WEATHER_URG.get(weather, 0)
    low += w
    if w:
        factors.append(f"weather {weather} +{w}")
    low = min(100, round(low))
    high = low
    if t.get("injury") is None:
        high += 20
    if t.get("battery") is None:
        high += 10
    if t.get("signal_bars") is None:
        high += 10
    high = min(100, high)
    return {"low": low, "high": high, "factors": factors}


def confidence(t: dict, ref: str = REF_DEFAULT) -> dict:
    h = hours_stale(t["last_ping"], ref)
    F = max(0, 100 - 15 * h)
    S = 100 if t.get("sector") else 0
    G = 20 * t["signal_bars"] if t.get("signal_bars") is not None else 0
    crit = ["sector", "last_ping", "signal_bars", "battery", "injury"]
    known = sum(1 for k in crit if t.get(k) is not None)
    D = 100 * known / 5
    score = round(0.35 * F + 0.25 * S + 0.20 * G + 0.20 * D)
    f = [f"ping {h}h old", f"{known}/5 fields known"]
    if t.get("signal_bars") is not None and t["signal_bars"] <= 1:
        f.append("weak signal")
    return {"score": score, "factors": f}


def eta_for(sector: str, weather: str) -> int:
    return round(BASE_ETA.get(sector, 30) * WEATHER_MULT.get(weather, 1.0))


def build_plan(weather: str = "cloudy", teams: int = 3, medkits: int = 2,
               ref: str = REF_DEFAULT) -> dict:
    trekkers = _state["trekkers"]
    enriched = []
    for t in trekkers:
        u = urgency(t, weather, ref)
        c = confidence(t, ref)
        mid = (u["low"] + u["high"]) / 2
        unk = [k for k in ("battery", "signal_bars", "injury") if t.get(k) is None]
        enriched.append({**t, "hours_stale": hours_stale(t["last_ping"], ref),
                         "urgency": u, "confidence": c, "mid": mid, "unknown": unk})
    # cluster by sector
    clusters: dict[str, list] = {}
    for e in enriched:
        clusters.setdefault(e["sector"], []).append(e)
    scored = []
    for sector, members in clusters.items():
        umid = max(m["mid"] for m in members)
        if len(members) > 1:
            umid = min(100, umid + 6)
        cavg = sum(m["confidence"]["score"] for m in members) / len(members)
        eta = eta_for(sector, weather)
        P = 100 * max(0, 1 - eta / FEAS_DENOM)
        R = round(min(100, 0.6 * umid + 0.2 * (100 - cavg) + 0.2 * P), 1)
        scored.append({"sector": sector, "members": members, "umid": round(umid, 1),
                       "cavg": round(cavg, 1), "eta": eta, "P": round(P, 1), "R": R})
    scored.sort(key=lambda x: -x["R"])
    actions, unassigned = [], []
    team_n = 1
    kit_left = medkits
    for sc in scored:
        ids = [m["id"] for m in sc["members"]]
        injured = any(m.get("injury") for m in sc["members"])
        if sc["eta"] > SAFE_LIMIT_MIN:
            unassigned.append({"sector": sc["sector"], "targets": ids,
                               "reason": f"ETA {sc['eta']} min exceeds safe {SAFE_LIMIT_MIN}"})
            continue
        if team_n > teams:
            unassigned.append({"sector": sc["sector"], "targets": ids,
                               "reason": "no team left"})
            continue
        give_kit = injured and kit_left > 0
        if give_kit:
            kit_left -= 1
        why = []
        if injured:
            why.append("reported injury")
        lowb = [m for m in sc["members"] if m.get("battery") is not None and m["battery"] <= 15]
        if lowb:
            why.append(f"battery {lowb[0]['battery']}%")
        if any(m["hours_stale"] >= 5 for m in sc["members"]):
            why.append("stale >5h")
        if len(ids) > 1:
            why.append(f"{len(ids)} trekkers together")
        why.append("feasible ETA" if sc["eta"] <= 40 else f"ETA {sc['eta']} min")
        actions.append({"rank": len(actions) + 1, "team": f"T{team_n}",
                        "sector": sc["sector"], "targets": ids,
                        "medkit": give_kit, "eta_min": sc["eta"],
                        "text": f"Send T{team_n}{' with med kit' if give_kit else ''} to {sc['sector']}",
                        "why": why, "score": sc["R"],
                        "assumptions": ["synthetic ETA", "3 km/h equiv", f"weather x{WEATHER_MULT[weather]}"]})
        team_n += 1
    ranked_actions = []
    for a, sc in zip(actions, [s for s in scored if s["sector"] in {x["sector"] for x in actions}]):
        members = sc["members"]
        ulo = min(m["urgency"]["low"] for m in members)
        uhi = max(m["urgency"]["high"] for m in members)
        umid = sc["umid"]
        miss = []
        for m in members:
            for f in m["unknown"]:
                miss.append(f"{m['id']} {f} unknown")
        ranked_actions.append({
            "rank": a["rank"], "sector": a["sector"],
            "targets": a["targets"], "trekker_ids": a["targets"],
            "team": a["team"], "team_id": a["team"],
            "medkit": a["medkit"], "medical_kit_assigned": a["medkit"],
            "kit_assigned": a["medkit"],
            "missing": miss, "missing_information": miss,
            "eta_min": a["eta_min"], "text": a["text"], "why": a["why"],
            "score": a["score"], "decision_score": a["score"],
            "urgency_low": ulo, "urgency_high": uhi, "urgency_mid": umid,
            "confidence": sc["cavg"], "assumptions": a["assumptions"]})
    # precautionary kit: if kits left and no injured unassigned, give to rank1 without kit
    if kit_left > 0:
        for a in actions:
            if not a["medkit"] and kit_left > 0:
                a["medkit"] = True
                a["text"] += " (precautionary kit)"
                kit_left -= 1
                break
    # next best question
    best = max(enriched, key=lambda m: m["mid"] * (1 - m["confidence"]["score"] / 100))
    nbq_field = (best["unknown"] + ["sector log"])[0]
    nbq = {"target": best["id"],
           "text": f"Ask ranger for {best['sector']} log: {best['id']} {nbq_field} unknown"}
    changes = [f"weather={weather} eta x{WEATHER_MULT.get(weather,1.0)}"]
    spare = max(0, teams - len(actions))
    assigned_sectors = {x["sector"] for x in actions}
    for pos, sc in enumerate(scored, start=1):
        if sc["sector"] in assigned_sectors:
            continue
        reason = next((u["reason"] for u in unassigned if u["sector"] == sc["sector"]),
                      "no team left")
        members = sc["members"]
        ulo = min(m["urgency"]["low"] for m in members)
        uhi = max(m["urgency"]["high"] for m in members)
        ids = [m["id"] for m in members]
        miss = [f"{m['id']} {f} unknown" for m in members for f in m["unknown"]]
        ranked_actions.append({
            "rank": pos, "sector": sc["sector"],
            "targets": ids, "trekker_ids": ids,
            "team": None, "team_id": None,
            "assigned": False, "unassigned_reason": reason,
            "medkit": False, "medical_kit_assigned": False, "kit_assigned": False,
            "eta_min": sc["eta"], "text": f"{sc['sector']} — unassigned ({reason})",
            "why": [reason], "score": sc["R"], "decision_score": sc["R"],
            "urgency_low": ulo, "urgency_high": uhi, "urgency_mid": sc["umid"],
            "confidence": sc["cavg"],
            "missing": miss, "missing_information": miss,
            "assumptions": ["synthetic ETA", "3 km/h equiv", f"weather x{WEATHER_MULT[weather]}"]})
    ranked_actions.sort(key=lambda a: (a["rank"] if isinstance(a["rank"], int) else 99))
    return {"reference_time": ref, "now": ref, "weather": weather,
            "resources": {"available_teams": teams, "medical_kits": medkits,
                          "teams": teams, "medkits": medkits, "daylight_min": DAYLIGHT_MIN,
                          "spare_teams": spare},
            "trekkers": [public_trekker(e) for e in enriched],
            "records": [public_trekker(e) for e in enriched],
            "actions": actions, "ranked_actions": ranked_actions, "ranked": ranked_actions,
            "unassigned": unassigned,
            "next_best_question": nbq, "changes": changes}


def apply_report(payload: dict, weather="cloudy", teams=3, medkits=2, ref=REF_DEFAULT):
    tid = payload.get("trekker_id")
    for t in _state["trekkers"]:
        if t["id"] == tid:
            old_sector = t.get("sector")
            for k in ("sector", "battery", "signal_bars", "injury", "last_ping", "ping_time"):
                if payload.get(k) is not None:
                    if k == "ping_time":
                        t["last_ping"] = payload[k]
                    else:
                        t[k] = payload[k]
            # conflict: keep both, flag (compare against pre-update sector)
            if payload.get("sector") and old_sector and payload["sector"] != old_sector:
                t.setdefault("flags", []).append(
                    f"conflicting sector report: was {old_sector}, now {payload['sector']}")
            _state["reports"].append(payload)
            break
    return build_plan(weather, teams, medkits, ref)


if __name__ == "__main__":
    import json
    reset_state()
    print(json.dumps(build_plan("storm", 3, 2, REF_DEFAULT), indent=2))
