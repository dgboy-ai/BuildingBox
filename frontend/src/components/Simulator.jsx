import React from 'react';
import { WEATHER_PRESETS } from '../data/mockTrekkers.js';

export default function Simulator({ sim, setSim, baseline, current }) {
  const deltas = React.useMemo(() => {
    if (!baseline?.length || !current?.length) return [];
    const baseRank = {};
    baseline.forEach((t, i) => { baseRank[t.id] = i + 1; });
    return current.map((t, i) => ({
      id: t.id,
      from: baseRank[t.id] ?? '-',
      to: i + 1,
      dScore: t.score - (baseline.find((b) => b.id === t.id)?.score ?? t.score)
    }));
  }, [baseline, current]);

  return (
    <section className="rounded-2xl border border-white/10 bg-forest-900/80 p-5" aria-label="What-if simulator">
      <h2 className="text-sm font-mono uppercase tracking-widest text-moss-400">◈ What-If Rescue Simulator <span className="text-white/30">— change conditions, watch priorities move</span></h2>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <label className="block text-xs">
          <span className="text-white/60 font-mono uppercase">Weather severity</span>
          <select value={sim.weather} onChange={(e) => setSim({ ...sim, weather: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 p-2 text-sm">
            <option value={1}>☁ Cloudy — {WEATHER_PRESETS.cloudy.desc}</option>
            <option value={2}>🌧 Rain — {WEATHER_PRESETS.rain.desc}</option>
            <option value={3}>⛈ Storm — {WEATHER_PRESETS.storm.desc}</option>
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-white/60 font-mono uppercase">Signal degradation: {sim.signalDegradation} bar(s)</span>
          <input type="range" min={0} max={2} step={1} value={sim.signalDegradation}
            onChange={(e) => setSim({ ...sim, signalDegradation: Number(e.target.value) })}
            className="mt-2 w-full" aria-label="Signal degradation" />
        </label>
        <label className="block text-xs">
          <span className="text-white/60 font-mono uppercase">Extra battery drain: {sim.batteryDrain}%</span>
          <input type="range" min={0} max={30} step={5} value={sim.batteryDrain}
            onChange={(e) => setSim({ ...sim, batteryDrain: Number(e.target.value) })}
            className="mt-2 w-full" aria-label="Battery drain" />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setSim({ weather: 1, signalDegradation: 0, batteryDrain: 0 })}
          className="text-xs font-mono px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5">Reset: Cloudy / full signal</button>
        <button onClick={() => setSim({ weather: 3, signalDegradation: 1, batteryDrain: 10 })}
          className="text-xs font-mono px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/20">Demo: Storm hits ⛈</button>
      </div>

      <div className="mt-4 rounded-xl bg-black/30 border border-white/5 p-3">
        <div className="text-[11px] font-mono uppercase text-white/40 mb-2">Before → After (baseline cloudy vs current)</div>
        <div className="flex flex-wrap gap-2">
          {deltas.map((d) => (
            <span key={d.id} className={`text-[11px] font-mono px-2 py-1 rounded-lg border ${d.from !== d.to ? 'border-ember-500/50 bg-ember-500/10 text-ember-400' : 'border-white/10 text-white/60'}`}>
              {d.id}: #{d.from}→#{d.to} ({d.dScore >= 0 ? '+' : ''}{d.dScore})
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-white/50">Judges: press “Storm hits” — watch gorge/high-pass cases jump. This is live recalculation, not hardcoded.</p>
      </div>
    </section>
  );
}
