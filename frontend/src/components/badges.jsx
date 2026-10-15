import React from 'react';

export function levelColor(level) {
  if (level === 'CRITICAL') return 'bg-red-500/15 text-red-300 border-red-500/40';
  if (level === 'HIGH') return 'bg-orange-500/15 text-orange-300 border-orange-500/40';
  if (level === 'MEDIUM') return 'bg-yellow-500/10 text-yellow-200 border-yellow-500/30';
  return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
}

export function statusBadge(status) {
  const map = {
    critical: 'NO SIGNAL — STALE',
    contradictory: 'CONTRADICTORY',
    stale: 'STALE',
    reliable: 'RELIABLE'
  };
  const colors = {
    critical: 'bg-red-500/20 text-red-200 border-red-500/40',
    contradictory: 'bg-purple-500/15 text-purple-200 border-purple-500/40',
    stale: 'bg-yellow-500/10 text-yellow-200 border-yellow-500/30',
    reliable: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30'
  };
  return <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${colors[status] || colors.stale}`}>{map[status] || status}</span>;
}

export function SignalBars({ bars }) {
  return (
    <span className="flex items-end gap-0.5" aria-label={`${bars} bars signal`}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`w-1 rounded-sm ${i <= Math.max(1, bars) ? (bars <= 1 ? 'bg-red-400' : bars === 2 ? 'bg-yellow-300' : 'bg-emerald-400') : 'bg-white/15'}`} style={{ height: `${4 + i * 3}px` }} />
      ))}
    </span>
  );
}

export function Battery({ pct }) {
  const color = pct <= 15 ? 'bg-red-400' : pct <= 35 ? 'bg-yellow-300' : 'bg-emerald-400';
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-8 h-3.5 rounded-sm border border-white/30 p-[2px] flex">
        <span className={`${color} rounded-[1px] h-full`} style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-xs">{pct}%</span>
    </span>
  );
}
