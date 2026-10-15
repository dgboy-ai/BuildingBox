#initial Commit
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import os
import engine

app = FastAPI(title="SignalFuse")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"],
                   allow_headers=["*"], allow_credentials=False)


class PlanReq(BaseModel):
    weather: str = "cloudy"
    teams: int = 3
    medkits: int = 2
    ref: str = "11:55 AM"
    # aliases from GPT draft
    available_teams: Optional[int] = None
    medical_kits: Optional[int] = None
    reference_time: Optional[str] = None


class ReportReq(BaseModel):
    trekker_id: str
    ping_time: Optional[str] = None
    last_ping: Optional[str] = None
    sector: Optional[str] = None
    battery: Optional[int] = None
    signal_bars: Optional[int] = None
    injury: Optional[str] = None
    report: Optional[str] = None
    weather: str = "cloudy"
    teams: int = 3
    medkits: int = 2
    ref: str = "11:55 AM"
    available_teams: Optional[int] = None
    medical_kits: Optional[int] = None
    reference_time: Optional[str] = None


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/mission")
def mission():
    trekkers = [{**t, "hours_stale": engine.hours_stale(t["last_ping"])} for t in engine.get_trekkers()]
    trekkers = [engine.public_trekker(t) for t in trekkers]
    return {"now": engine.REF_DEFAULT, "reference_time": engine.REF_DEFAULT,
            "trekkers": trekkers, "records": trekkers,
            "mission": {"records": trekkers},
            "note": "unknown=null, never guessed"}


@app.post("/api/plan")
def plan(r: PlanReq):
    teams = r.available_teams if r.available_teams is not None else r.teams
    kits = r.medical_kits if r.medical_kits is not None else r.medkits
    ref = r.reference_time if r.reference_time is not None else r.ref
    if r.weather not in engine.WEATHER_MULT:
        raise HTTPException(422, f"invalid weather '{r.weather}', use clear|cloudy|rain|storm")
    return engine.build_plan(r.weather, teams, kits, ref)


@app.post("/api/report")
def report(r: ReportReq):
    known = {t["id"] for t in engine.get_trekkers()}
    if r.trekker_id not in known:
        raise HTTPException(404, f"unknown trekker_id '{r.trekker_id}'")
    if r.weather not in engine.WEATHER_MULT:
        raise HTTPException(422, f"invalid weather '{r.weather}', use clear|cloudy|rain|storm")
    teams = r.available_teams if r.available_teams is not None else r.teams
    kits = r.medical_kits if r.medical_kits is not None else r.medkits
    ref = r.reference_time if r.reference_time is not None else r.ref
    if r.report == "TRK-05_SCRIPTED":
        payload = {"trekker_id": "TRK-05", "sector": "C-East", "battery": 9,
                   "signal_bars": 0, "injury": None, "ping_time": "11:40"}
    else:
        payload = {"trekker_id": r.trekker_id, "sector": r.sector, "battery": r.battery,
                   "signal_bars": r.signal_bars, "injury": r.injury,
                   "ping_time": r.ping_time or r.last_ping}
    return engine.apply_report(payload, r.weather, teams, kits, ref)


@app.post("/api/reset")
def reset():
    engine.reset_state()
    return {"ok": True}


class LoadReq(BaseModel):
    trekkers: list


@app.post("/api/load")
def load(req: LoadReq):
    try:
        n = engine.set_trekkers(req.trekkers)
    except ValueError as e:
        raise HTTPException(422, str(e))
    return {"ok": True, "loaded": n}


_STATIC = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(_STATIC):
    app.mount("/static", StaticFiles(directory=_STATIC), name="static")


@app.get("/", include_in_schema=False)
def index():
    idx = os.path.join(_STATIC, "index.html")
    if os.path.isfile(idx):
        return FileResponse(idx)
    return {"service": "SignalFuse", "docs": "/docs"}
