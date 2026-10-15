import React, { useState } from 'react';
import { levelColor, statusBadge, SignalBars, Battery } from './badges.jsx';

export default function TrekkerCard({ t, rank }) {
  const [open, setOpen] = useState(rank === 1);
  return (
    <article className="rounded-xl border border-white/10 bg-forest-900/80 p-4 hover:border-white/20 transition-colors" aria-label={`${t.id} ${t.name}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-white/50">#{rank}</span>
            <span className="font-mono text-xs font-bold text-white/90">{t.id}</span>
            {statusBadge(t.status)}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${levelColor(t.level)}`}>{t.level} · {t.score}</span>
          </div>
          <h3 className="text-lg font-bold mt-1">{t.name}, {t.age}</h3>
          <p className="text-xs text-white/60">{t.sectorLabel} · {t.elevation}m</p>
        </div>
        <div className="text-right text-xs space-y-1">
          <div className="flex justify-end"><SignalBars bars={t._effSignal} /></div>
          <div className="text-white/60">{t.lastPing} · {Math.floor(t.minutesAgo / 60)}h ago</div>
          <div className="flex justify-end"><Battery pct={t._effBattery} /></div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-black/30 p-2">
          <div className="text-white/40 text-[10px] uppercase tracking-wide">Injury / Gear</div>
          <div className="mt-1 font-medium">{t.injury}</div>
          <div className="text-white/60 mt-0.5">{t.gear.join(' · ')}</div>
        </div>
        <div className="rounded-lg bg-black/30 p-2">
          <div className="text-white/40 text-[10px] uppercase tracking-wide">Confidence {t.confidence}%</div>
          <div className="mt-1 w-full h-1.5 rounded bg-white/10 overflow-hidden">
            <div className="h-full bg-moss-400" style={{ width: `${t.confidence}%` }} />
          </div>
          <div className="text-white/60 mt-1">{t.confidenceLabel}</div>
          <div className="text-white/50">Search radius ~{t.radiusKm} km · {t.companions}</div>
        </div>
      </div>

      <p className="mt-2 text-xs text-white/60 italic">“{t.lastMessage}” — {t.statusNote}</p>

      <button
        onClick={() => setOpen(!open)}
        className="mt-2 text-xs font-mono text-moss-400 hover:text-moss-500"
        aria-expanded={open}
      >
        {open ? '▼ hide why this score' : '▶ why this score?'}
      </button>
      {open && (
        <ul className="mt-2 space-y-1 text-xs font-mono bg-black/40 rounded-lg p-2.5 border border-white/5">
          {t.reasons.map((r, i) => <li key={i} className="text-white/80">+ {r}</li>)}
          {t.missing.length > 0 && (
            <li className="text-yellow-200/90 pt-1 border-t border-white/10 mt-1">Missing: {t.missing.join('; ')}</li>
          )}
        </ul>
      )}
    </article>
  );
}
