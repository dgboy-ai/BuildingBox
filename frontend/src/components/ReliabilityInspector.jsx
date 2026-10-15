import React from 'react';

const LEGEND = [
  ['RELIABLE', 'Recent ping (≤3.5h), ≥3 bars, corroborated', 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30'],
  ['STALE', 'Ping 4h+ old, usable but drift likely', 'bg-yellow-500/10 text-yellow-200 border-yellow-500/30'],
  ['CONTRADICTORY', 'Two sources disagree on sector', 'bg-purple-500/15 text-purple-200 border-purple-500/40'],
  ['NO SIGNAL', '0 bars, 5h+ stale — widest search radius', 'bg-red-500/15 text-red-200 border-red-500/40']
];

export default function ReliabilityInspector({ ranked }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-forest-900/80 p-5" aria-label="Signal reliability inspector">
      <h2 className="text-sm font-mono uppercase tracking-widest text-moss-400">◎ Signal Reliability Inspector <span className="text-white/30">— never invent a precise location</span></h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {LEGEND.map(([k, desc, cls]) => (
          <span key={k} title={desc} className={`text-[10px] font-mono px-2 py-1 rounded-full border cursor-help ${cls}`}>{k}</span>
        ))}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left font-mono text-white/40 uppercase text-[10px]">
              <th className="py-1.5 pr-3">Trekker</th>
              <th className="py-1.5 pr-3">Evidence</th>
              <th className="py-1.5 pr-3">Confidence</th>
              <th className="py-1.5">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((t) => (
              <tr key={t.id} className="border-t border-white/5">
                <td className="py-2 pr-3 font-mono font-bold">{t.id}</td>
                <td className="py-2 pr-3 text-white/70">{t.lastPing} · {t._effSignal} bar(s) · {t._effBattery}% batt</td>
                <td className="py-2 pr-3 text-white/70">{t.confidence}% — {t.statusNote}</td>
                <td className="py-2 font-mono text-[11px] text-white/80">Search ~{t.radiusKm}km, do not pin-point</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
