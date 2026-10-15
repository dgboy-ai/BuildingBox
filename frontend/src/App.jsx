import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMission, fetchPlan, sendReport, sendReset, checkHealth, backendBase } from './api.js';
import { getMockMission, resetMockMission, applyMockReport, planMock } from './mock/signalFuseMock.js';
import Sidebar from './components/Sidebar.jsx';
import SectorMap from './components/SectorMap.jsx';
import ActionCard from './components/ActionCard.jsx';
import EvidenceTable from './components/EvidenceTable.jsx';
import { fmt, UrgencyBar, ConfidenceBar, StatusPill } from './components/sfBadges.jsx';

const WEATHERS = [
  { id: 'clear', label: 'Clear', mult: '×1.0', icon: '☀', hint: 'baseline speed' },
  { id: 'cloudy', label: 'Cloudy', mult: '×1.25', icon: '☁', hint: '+25% travel time' },
  { id: 'storm', label: 'Storm', mult: '×1.6', icon: '⛈', hint: 'D-West turns unsafe' }
];

function normalizePlan(raw, weather, missionRef) {
  if (raw && Array.isArray(raw.ranked_actions) && raw.ranked_actions.length) return raw;
  if (raw && Array.isArray(raw.ranked) && raw.ranked.length) {
    return {
      ranked_actions: raw.ranked,
      next_best_question: raw.next_best_question || null,
      global_warnings: raw.global_warnings || [],
      _adapted: true
    };
  }
  const m = getMockMission();
  const base = missionRef || m;
  return { ...planMock(base, weather), _mock: true };
}

export default function App() {
  const [mission, setMission] = useState(null);
  const [plan, setPlan] = useState(null);
  const [prevPlan, setPrevPlan] = useState(null);
  const [weather, setWeather] = useState('cloudy');
  const [selectedRank, setSelectedRank] = useState(1);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [source, setSource] = useState('mock');
  const [statusNote, setStatusNote] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentNav, setCurrentNav] = useState('overview');

  const loadAll = useCallback(async (w, keepPrev) => {
    setWorking(true);
    setStatusNote('');
    let m = null;
    let live = false;
    try {
      await checkHealth();
      live = true;
    } catch {
      live = false;
    }

    try {
      if (live) {
        const mm = await fetchMission();
        m = mm.mission || mm.records ? (mm.mission || mm) : mm;
        if (!m.records) throw new Error('mission shape mismatch');
        setMission(m);

        const p = await fetchPlan(w);
        setPrevPlan((prev) => (keepPrev ? (plan || prev) : prev));
        const norm = normalizePlan(p, w, m);
        setPlan(norm);
        setSource(norm._mock ? 'mock' : 'live');
      } else {
        throw new Error('backend down');
      }
    } catch (e) {
      if (!m) m = getMockMission();
      setMission(m);
      setPrevPlan((prev) => (keepPrev ? (plan || prev) : prev));
      setPlan({ ...planMock(m, w), _mock: true });
      setSource('mock');
      if (live) setStatusNote(`Backend error (${String(e.message || e)}) — fallback to mock.`);
    } finally {
      setWorking(false);
    }
  }, [plan]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadAll('cloudy', false);
      setLoading(false);
    })();
  }, []);

  const changeWeather = async (w) => {
    if (w === weather) return;
    setPrevPlan(plan);
    setWeather(w);
    await loadAll(w, true);
  };

  const onReport = async () => {
    setPrevPlan(plan);
    setWorking(true);
    try {
      await sendReport();
      setStatusNote('Field report TRK-05 applied via backend.');
      const mm = await fetchMission();
      const m = mm.mission || mm.records ? (mm.mission || mm) : mm;
      setMission(m);
      const p = await fetchPlan(weather);
      setPlan(normalizePlan(p, weather, m));
      setSource('live');
    } catch {
      applyMockReport();
      setStatusNote('TRK-05 field report applied to simulated mock.');
      const m = getMockMission();
      setMission(m);
      setPlan({ ...planMock(m, weather), _mock: true });
      setSource('mock');
    } finally {
      setWorking(false);
      setSelectedRank(1);
    }
  };

  const onReset = async () => {
    setWorking(true);
    try {
      await sendReset();
    } catch {
      /* ignore */
    }
    const m = resetMockMission();
    setMission(m);
    setPrevPlan(plan);
    setWeather('cloudy');
    try {
      const p = await fetchPlan('cloudy');
      setPlan(normalizePlan(p, 'cloudy', m));
      setSource('live');
    } catch {
      setPlan({ ...planMock(m, 'cloudy'), _mock: true });
      setSource('mock');
    }
    setSelectedRank(1);
    setStatusNote('Mission restored to original simulated state.');
    setWorking(false);
  };

  // Difference comparison for What Changed
  const diff = useMemo(() => {
    if (!prevPlan?.ranked_actions || !plan?.ranked_actions) return null;
    const prevMap = {};
    prevPlan.ranked_actions.forEach((a) => {
      prevMap[a.sector] = a;
    });
    return plan.ranked_actions.map((a) => {
      const prev = prevMap[a.sector];
      const dScore = prev ? Math.round((a.decision_score - prev.decision_score) * 10) / 10 : 0;
      return {
        sector: a.sector,
        fromRank: prev ? prev.rank : '—',
        toRank: a.rank,
        dScore
      };
    });
  }, [prevPlan, plan]);

  // Selected Action
  const selectedAction = useMemo(() => {
    return (
      plan?.ranked_actions?.find((a) => a.rank === selectedRank) ||
      plan?.ranked_actions?.[0] ||
      null
    );
  }, [plan, selectedRank]);

  const handleSelectSectorByName = (sectorName) => {
    const act = plan?.ranked_actions?.find((a) => a.sector === sectorName);
    if (act) {
      setSelectedRank(act.rank);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F0E5] flex flex-col items-center justify-center p-6 text-[#244638]">
        <div className="w-12 h-12 border-3 border-[#244638] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold font-mono">Initializing SignalFuse Intelligence...</h2>
        <p className="text-sm text-stone-500 mt-1">Connecting to backend and synchronizing mission telemetry</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F6F0E5] text-[#1E2E27]">
      {/* Persistent Desktop Sidebar & Mobile Drawer */}
      <Sidebar
        currentSection={currentNav}
        onSelectSection={setCurrentNav}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-[#F6F0E5]/95 backdrop-blur-md border-b border-[#E6DED2] px-4 lg:px-8 py-3.5">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
            {/* Left title & mobile hamburger */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-white border border-[#E6DED2] text-[#244638]"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div className="w-9 h-9 rounded-lg bg-[#244638] text-white flex items-center justify-center font-bold shadow-sm">
                <svg className="w-5 h-5 text-[#E5A87B]" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[17px] font-extrabold tracking-tight text-[#1E2E27] leading-none">
                    Operation: Lost Signal
                  </h1>
                  <span
                    className={`inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                      source === 'live'
                        ? 'bg-[#EBF7EE] text-[#248247] border border-[#C5E8CC]'
                        : 'bg-[#D97732] text-white shadow-sm'
                    }`}
                  >
                    {source === 'live' ? '● LIVE BACKEND' : 'DEMO SIMULATION'}
                  </span>
                  <span className="text-[11px] font-mono text-stone-500 font-medium">
                    Ref: {mission?.ref || '11:55 AM'} | 15 Oct 2026
                  </span>
                </div>
                <p className="text-[12px] text-stone-500 font-medium mt-0.5">
                  Trust-Aware Adaptive Rescue Intelligence
                </p>
              </div>
            </div>

            {/* Right Status Badges & Profile */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E6DED2] text-xs font-medium text-stone-700 shadow-sm">
                <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </svg>
                <span className="capitalize">{weather} 18°C</span>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#244638] text-white font-mono text-xs font-bold flex items-center justify-center shadow-sm">
                TS
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-4 lg:p-7 max-w-[1400px] w-full mx-auto space-y-5">
          {statusNote && (
            <div className="text-xs font-mono px-3.5 py-2 rounded-lg bg-[#FAF0E4] border border-[#EAC9A7] text-[#914614] flex items-center justify-between">
              <span>{statusNote}</span>
              <button onClick={() => setStatusNote('')} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
          )}

          {/* TOP ROW: Mission Overview Cards & Weather / Mission Controls */}
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* 4 Overview Metric Cards */}
            <div className="xl:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Trekkers */}
              <div className="bg-white rounded-xl p-3.5 border border-[#E4DCD0] shadow-sm flex items-center gap-3" title="Missing trekkers in this mission, from live backend records.">
                <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] text-[#244638] flex items-center justify-center shrink-0 border border-[#EFE8DD]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#1E2E27] font-mono leading-none">{mission?.records?.length || 6}</div>
                  <div className="text-[11px] font-bold text-stone-700 mt-0.5">Trekkers</div>
                  <div className="text-[10px] font-bold text-[#B85D1B]">missing</div>
                </div>
              </div>

              {/* Sectors */}
              <div className="bg-white rounded-xl p-3.5 border border-[#E4DCD0] shadow-sm flex items-center gap-3" title="Search sectors ranked below. One card each — including unassigned ones with reasons.">
                <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] text-[#244638] flex items-center justify-center shrink-0 border border-[#EFE8DD]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#1E2E27] font-mono leading-none">{new Set((mission?.records || []).map((r) => r.sector)).size || 4}</div>
                  <div className="text-[11px] font-bold text-stone-700 mt-0.5">Sectors</div>
                  <div className="text-[10px] font-bold text-stone-500">ranked below</div>
                </div>
              </div>

              {/* Rescue Teams */}
              <div className="bg-white rounded-xl p-3.5 border border-[#E4DCD0] shadow-sm flex items-center gap-3" title="Rescue teams available. Unassigned sectors show why no team went there.">
                <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] text-[#244638] flex items-center justify-center shrink-0 border border-[#EFE8DD]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#1E2E27] font-mono leading-none">{plan?.resources?.available_teams || plan?.resources?.teams || 3}</div>
                  <div className="text-[11px] font-bold text-stone-700 mt-0.5">Rescue Teams</div>
                  <div className="text-[10px] font-bold text-stone-500">{plan?.resources?.spare_teams ? `${plan.resources.spare_teams} idle` : 'all assigned'}</div>
                </div>
              </div>

              {/* Medical Kits */}
              <div className="bg-white rounded-xl p-3.5 border border-[#E4DCD0] shadow-sm flex items-center gap-3" title="Medical kits: injured sectors first, rest precautionary. Never over-allocated.">
                <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] text-[#244638] flex items-center justify-center shrink-0 border border-[#EFE8DD]">
                  <svg className="w-5 h-5 text-[#244638]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6h-2V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8-2h2v2h-2V4zm-1 9v-2h2v2h2v2h-2v2h-2v-2H8v-2h2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#1E2E27] font-mono leading-none">{plan?.resources?.medical_kits || plan?.resources?.medkits || 2}</div>
                  <div className="text-[11px] font-bold text-stone-700 mt-0.5">Medical Kits</div>
                  <div className="text-[10px] font-bold text-[#B85D1B]">{(plan?.ranked_actions || []).filter((a) => a.medkit || a.kit_assigned).length} placed</div>
                </div>
              </div>
            </div>

            {/* Weather & Mission Control Buttons — LIVE INPUTS: every control replans via backend */}
            <div className="xl:col-span-6 bg-white rounded-xl p-3 border-2 border-[#D97732] shadow-sm flex flex-wrap items-center justify-between gap-3 relative">
              <span className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-md bg-[#D97732] text-white text-[9px] font-extrabold tracking-widest uppercase">
                ● Live inputs — click to replan
              </span>
              {/* Weather conditions buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold font-mono text-stone-500 uppercase tracking-wider mr-1">
                  Weather:
                </span>
                {WEATHERS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => changeWeather(w.id)}
                    disabled={working}
                    title={w.id === 'clear' ? 'Good conditions: baseline travel times, all sectors reachable' : w.id === 'cloudy' ? 'Current weather: every approach 25% slower' : 'Storm hits: approaches 60% slower, D-West exceeds the 60-min safety cap'}
                    className={`flex flex-col items-start gap-0.5 px-4 py-2 rounded-xl text-sm font-extrabold transition-all border-2 ${
                      weather === w.id
                        ? 'bg-[#244638] text-white shadow-md border-[#244638]'
                        : 'bg-[#FAF7F2] text-stone-800 hover:bg-[#EFE8DD] border-[#E4DCD0]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">{w.icon}</span>
                      <span>{w.label}</span>
                      <span className="font-mono text-[11px] opacity-80">{w.mult}</span>
                    </span>
                    <span className={`text-[10px] font-semibold ${weather === w.id ? 'text-[#E5A87B]' : 'text-stone-500'}`}>{w.hint}</span>
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onReport}
                  disabled={working}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#D97732] hover:bg-[#BF6223] text-white shadow-sm transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <span>Simulate TRK-05 Field Report</span>
                </button>

                <button
                  onClick={onReset}
                  disabled={working}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FAF7F2] hover:bg-[#EFE8DD] text-stone-700 border border-[#E4DCD0] shadow-sm transition-colors"
                  title="Reset mission to initial state"
                >
                  <svg className="w-3.5 h-3.5 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  <span>Reset Mission</span>
                </button>
              </div>
            </div>
          </section>

          {/* MAIN 2-COLUMN SECTION: Ranked Sectors (Left) vs Sector Overview & Selected Action Detail (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: Ranked Sector Actions (8 Cols) */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#D97732] text-white flex items-center justify-center font-bold text-xs">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="8" />
                    </svg>
                  </div>
                  <h2 className="text-[17px] font-extrabold text-[#1E2E27] tracking-tight">
                    Ranked Sector Actions
                  </h2>
                </div>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Rule-based prioritization based on urgency, evidence confidence, ETA and resource constraints
                </p>
              </div>

              {/* 2x2 Grid of Ranked Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(plan?.ranked_actions || []).map((action) => (
                  <ActionCard
                    key={action.sector}
                    a={action}
                    selected={selectedAction?.rank === action.rank}
                    onSelect={setSelectedRank}
                  />
                ))}
              </div>

              {/* EVIDENCE TABLE: Before - Raw Mission Records */}
              <div className="bg-white rounded-xl p-4 border border-[#E4DCD0] shadow-sm mt-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#244638]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <h3 className="text-sm font-extrabold text-[#1E2E27] tracking-tight">
                      Before — Raw Mission Records (6 Trekkers)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400">
                    Null = "Unknown"
                  </span>
                </div>

                <EvidenceTable records={mission?.records || []} />
              </div>

              {/* Evidence Legend */}
              <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#EFE8DD] flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-stone-600 font-medium">
                <span className="font-bold font-mono text-stone-700">Evidence Legend:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2A9D5C]" /> Fresh ≤ 3.5h
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E8A338]" /> Stale &gt; 3.5h
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E15241]" /> Weak Signal (0–1)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" /> Conflicting
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-400" /> Missing / Unknown
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: Sector Overview Map & Selected Action Details (5 Cols) */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-4">
              {/* Sector Overview Map */}
              <div className="bg-white rounded-xl p-4 border border-[#E4DCD0] shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#244638]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                      <line x1="8" y1="2" x2="8" y2="18" />
                      <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                    <h3 className="text-sm font-extrabold text-[#1E2E27] tracking-tight">
                      Sector Overview <span className="font-normal text-stone-500 text-xs">(Illustrative)</span>
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">Click sector to inspect</span>
                </div>

                <SectorMap
                  selectedSector={selectedAction?.sector}
                  onSelectSector={handleSelectSectorByName}
                />
              </div>

              {/* Selected Action Detail Card */}
              <div className="bg-white rounded-xl p-4 border border-[#E4DCD0] shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-[#D97732]" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                  <h3 className="text-sm font-extrabold text-[#1E2E27] tracking-tight">
                    Selected Action Detail
                  </h3>
                </div>

                {selectedAction ? (
                  <div className="space-y-3.5">
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#EFE8DD] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-[#E5733A] text-white flex items-center justify-center font-bold text-xs font-mono">
                          #{selectedAction.rank}
                        </span>
                        <div>
                          <div className="font-extrabold text-[15px] text-[#1E2E27] leading-tight">
                            {selectedAction.sector} — {selectedAction.trekker_ids.join(', ')}
                          </div>
                          <div className="text-[11px] text-stone-500 font-medium">
                            {selectedAction.sector_label}
                          </div>
                        </div>
                      </div>

                      <StatusPill
                        assigned={!!selectedAction.team && !selectedAction.unassigned_reason}
                        team={selectedAction.team}
                        unassignedReason={selectedAction.unassigned_reason}
                      />
                    </div>

                    {/* 4 Metrics Strip */}
                    <div className="grid grid-cols-4 gap-2 text-center py-2 px-2 rounded-lg bg-[#FAF7F2] border border-[#EFE8DD]">
                      <div>
                        <div className="text-[9.5px] font-bold text-stone-500 uppercase font-mono">Team</div>
                        <div className="font-extrabold text-xs text-[#1E2E27] mt-0.5">
                          {fmt(selectedAction.team)}
                        </div>
                      </div>
                      <div className="border-l border-[#E6DED2]">
                        <div className="text-[9.5px] font-bold text-stone-500 uppercase font-mono">Medical Kit</div>
                        <div className="font-extrabold text-xs text-[#D97732] mt-0.5">
                          {selectedAction.kit_assigned ? 'YES' : '—'}
                        </div>
                      </div>
                      <div className="border-l border-[#E6DED2]">
                        <div className="text-[9.5px] font-bold text-stone-500 uppercase font-mono">ETA</div>
                        <div className="font-extrabold text-xs text-[#1E2E27] mt-0.5">
                          {selectedAction.eta_min} min
                        </div>
                      </div>
                      <div className="border-l border-[#E6DED2]">
                        <div className="text-[9.5px] font-bold text-stone-500 uppercase font-mono">Decision Score</div>
                        <div className="font-extrabold text-xs text-[#1E2E27] mt-0.5">
                          {selectedAction.decision_score}
                        </div>
                      </div>
                    </div>

                    {/* Urgency & Confidence bars */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] font-bold font-mono text-stone-600 mb-1">
                          <span>Urgency Range</span>
                          <span>{selectedAction.urgency_low}–{selectedAction.urgency_high} (mid {selectedAction.urgency_mid})</span>
                        </div>
                        <UrgencyBar value={selectedAction.urgency_mid} />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold font-mono text-stone-600 mb-1">
                          <span>Evidence Confidence</span>
                          <span>{selectedAction.confidence}%</span>
                        </div>
                        <ConfidenceBar value={selectedAction.confidence} />
                      </div>
                    </div>

                    {/* Explanations & Missing Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <div className="font-bold text-[#1E2E27] mb-1 flex items-center gap-1">
                          <span className="text-[#D97732]">●</span> Why this rank?
                        </div>
                        <ul className="text-stone-600 space-y-1 text-[11.5px] list-disc list-inside">
                          {selectedAction.reasons?.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="font-bold text-[#1E2E27] mb-1 flex items-center gap-1">
                          <span className="text-[#B87A18]">●</span> Missing Information
                        </div>
                        {selectedAction.missing?.length ? (
                          <ul className="text-stone-600 space-y-1 text-[11.5px] list-disc list-inside">
                            {selectedAction.missing.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-stone-400 italic text-[11.5px]">No missing critical fields</p>
                        )}
                      </div>
                    </div>

                    {/* Assumptions */}
                    <div className="text-[11px] text-stone-500 bg-[#FAF7F2] p-2 rounded-lg border border-[#EFE8DD] leading-relaxed">
                      <span className="font-bold text-stone-700">Assumptions: </span>
                      {selectedAction.assumptions?.join(' ')}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-stone-400">Select an action above to see detailed breakdown.</p>
                )}
              </div>

              {/* What Changed & Why */}
              <div className="bg-white rounded-xl p-4 border border-[#E4DCD0] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-[#244638]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <h3 className="text-sm font-extrabold text-[#1E2E27] tracking-tight">
                    What Changed and Why?
                  </h3>
                </div>

                {diff ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {diff.map((d) => (
                        <span
                          key={d.sector}
                          className={`text-[11px] font-mono px-2 py-1 rounded-md border font-semibold ${
                            d.fromRank !== d.toRank
                              ? 'bg-[#FEF5E7] text-[#B87A18] border-[#FBE0B5]'
                              : 'bg-[#FAF7F2] text-stone-600 border-[#EFE8DD]'
                          }`}
                        >
                          {d.sector}: #{d.fromRank} → #{d.toRank} ({d.dScore >= 0 ? `+${d.dScore}` : d.dScore})
                        </span>
                      ))}
                    </div>
                    <p className="text-[11.5px] text-stone-600 leading-snug">
                      Changed weather to <span className="font-bold capitalize">{weather}</span> ({WEATHERS.find(x => x.id === weather)?.mult}). ETA adjusted for all sectors. Decision score recalculated via 0.6·U + 0.2·(100−C) + 0.2·P.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">
                    Switch weather condition or trigger the TRK-05 field report to see live ranking replanning diffs.
                  </p>
                )}
              </div>

              {/* Next Best Question */}
              <div className="bg-white rounded-xl p-4 border border-[#E4DCD0] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-[#244638] text-white flex items-center justify-center font-bold text-xs">
                    ?
                  </div>
                  <h3 className="text-sm font-extrabold text-[#1E2E27] tracking-tight">
                    Next Best Question
                  </h3>
                </div>

                {plan?.next_best_question ? (
                  <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#EFE8DD] flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-[#1E2E27]">
                        {plan.next_best_question.question}
                      </div>
                      <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                        Value: {plan.next_best_question.value} (high urgency, low confidence)
                      </div>
                    </div>
                    <span className="text-stone-400 text-sm font-bold">›</span>
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic">No next best question available.</p>
                )}
              </div>

              {/* Global Warnings */}
              {plan?.global_warnings?.length > 0 && (
                <div className="bg-[#FEF5E7] rounded-xl p-3.5 border border-[#FBE0B5]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#B87A18] mb-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                    <span>Global Warnings</span>
                  </div>
                  <ul className="text-[11px] text-[#8C5807] space-y-1 list-disc list-inside">
                    {plan.global_warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Important Note Disclaimer */}
              <div className="bg-[#FAF0E4] rounded-xl p-3 border border-[#EAC9A7] flex items-start gap-2.5 text-[11px] text-[#914614]">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-[#D97732]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
                <div>
                  <span className="font-bold">Important Note: </span>
                  Simulated prototype heuristics — not medical risk, find-probability, or route-safety certified. Action = sector-level response, not a precise location.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
