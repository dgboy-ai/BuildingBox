import React from 'react';
import { levelColor } from './badges.jsx';

export default function RecommendedAction({ top, source, weatherLabel }) {
  if (!top) return null;
  return (
    <section className="rounded-2xl border border-ember-500/30 bg-gradient-to-br from-ember-500/10 via-forest-900 to-forest-900 p-5" aria-label="Recommended next action">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-mono uppercase tracking-widest text-ember-400">★ Recommended Next Action <span className="text-white/30">— {source === 'live' ? 'live backend' : 'local demo scoring'}</span></h2>
        <span className="text-[11px] font-mono text-white/50">Weather: {weatherLabel}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="text-2xl font-extrabold">{top.id} — {top.name}</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${levelColor(top.level)}`}>{top.level} · SCORE {top.score}/100</span>
      </div>
      <p className="mt-2 text-sm text-white/80">
        Deploy to <b>{top.sectorLabel}</b> (search radius ~{top.radiusKm} km). Top factors: {top.reasons.slice(0, 3).join(' · ')}.
      </p>
      {top.missing.length > 0 && (
        <p className="mt-1.5 text-xs text-yellow-200/90 font-mono">⚠ Unknowns: {top.missing.join('; ')}. Do NOT assume precise coordinates — stage at sector edge, verify by radio/whistle.</p>
      )}
      <p className="mt-1.5 text-xs text-white/50">Why not others? {top.id} outscores the next case on injury + battery + staleness. See ranked cards below for full comparison.</p>
    </section>
  );
}
