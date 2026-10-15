import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import engine

def test_kit_limit():
    engine.reset_state()
    p = engine.build_plan("clear", 3, 2)
    assert sum(1 for a in p["actions"] if a["medkit"]) <= 2

def test_missing_flagged():
    engine.reset_state()
    p = engine.build_plan("cloudy", 3, 2)
    t5 = [t for t in p["trekkers"] if t["id"] == "TRK-05"][0]
    assert "battery" in t5["unknown"] or t5["urgency"]["high"] > t5["urgency"]["low"]

def test_weather_changes_eta():
    engine.reset_state()
    c = engine.build_plan("clear", 4, 2)
    s = engine.build_plan("storm", 4, 2)
    ce = [a for a in c["actions"] if a["sector"] == "C-East"]
    se = [a for a in s["actions"] if a["sector"] == "C-East"]
    assert ce and se and se[0]["eta_min"] > ce[0]["eta_min"], "storm must raise C-East ETA"

def test_empty_no_crash():
    engine.reset_state()
    p = engine.build_plan("storm", 0, 0)
    assert p["actions"] == [] and p["unassigned"]

if __name__ == "__main__":
    for f in (test_kit_limit, test_missing_flagged, test_weather_changes_eta, test_empty_no_crash):
        f(); print("PASS", f.__name__)
