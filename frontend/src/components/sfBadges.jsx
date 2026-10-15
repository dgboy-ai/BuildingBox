import React from 'react';

export function fmt(v, suffix = '') {
  if (v === null || v === undefined || v === '') return 'Unknown';
  return `${v}${suffix}`;
}

const pill = 'inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap';

export function FreshnessBadge({ hours }) {
  if (hours == null) return <span className={`${pill} bg-stone-100 text-stone-500 border-stone-200`}>MISSING</span>;
  if (hours <= 3.5) return <span className={`${pill} bg-emerald-50 text-emerald-700 border-emerald-200`}>FRESH ≤ 3.5h</span>;
  return <span className={`${pill} bg-amber-50 text-amber-700 border-amber-200`}>STALE {hours.toFixed(1)}h</span>;
}

export function SigBadge({ bars }) {
  if (bars === null || bars === undefined)
    return <span className={`${pill} bg-stone-100 text-stone-500 border-stone-200`}>Unknown</span>;
  if (bars <= 1) return <span className={`${pill} bg-red-50 text-red-600 border-red-200`}>{bars} bar</span>;
  if (bars === 2) return <span className={`${pill} bg-amber-50 text-amber-700 border-amber-200`}>{bars} bars</span>;
  return <span className={`${pill} bg-emerald-50 text-emerald-700 border-emerald-200`}>{bars} bars</span>;
}

export function ConfBadge({ conflicting }) {
  if (!conflicting) return null;
  return <span className={`${pill} bg-purple-50 text-purple-700 border-purple-200`}>CONFLICTING</span>;
}

export function MissingBadge() {
  return <span className={`${pill} bg-stone-100 text-stone-500 border-stone-200`}>MISSING</span>;
}

export function BattPill({ pct }) {
  if (pct === null || pct === undefined)
    return <span className="text-stone-400 font-medium">Unknown</span>;
  const cls = pct <= 15 ? 'text-red-600 font-semibold' : pct <= 30 ? 'text-amber-600 font-medium' : 'text-stone-700';
  return <span className={cls}>{pct}%</span>;
}

export function Bar({ value, max = 100, color }) {
  return (
    <div className="h-1.5 rounded-full bg-[#e9dfcb] overflow-hidden w-full">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
    </div>
  );
}

export function UrgencyBar({ value, max = 100 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 rounded-full bg-[#E8E1D5] overflow-hidden w-full">
      <div
        className="h-full bg-[#E5733A] rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ConfidenceBar({ value, max = 100 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 rounded-full bg-[#E8E1D5] overflow-hidden w-full">
      <div
        className="h-full bg-[#2B82C9] rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function StatusPill({ assigned, team, unassignedReason }) {
  if (assigned) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-md bg-[#244638] text-white tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></span>
        ASSIGNED · Team {team}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-md bg-[#E2DBD0] text-[#6E6458] tracking-wide">
      UNASSIGNED
    </span>
  );
}

const rankBadge = {
  1: 'bg-[#e86a2c] text-white',
  2: 'bg-slate-500 text-white',
  3: 'bg-stone-400 text-white',
  4: 'bg-stone-400 text-white'
};

export function SectorActionCard({ a, selected, onSelect }) {
  const assigned = a.team && !a.unassigned_reason;
  const top = a.rank === 1;
  return (
    <button
      onClick={() => onSelect(a.rank)}
      aria-label={`Select rank ${a.rank} sector ${a.sector}`}
      className={`text-left rounded-xl border bg-white p-4 transition-shadow w-full hover:shadow-md ${
        top ? 'border-[#e86a2c] ring-1 ring-[#e86a2c]/40' : selected ? 'border-[#1d5c4d] ring-1 ring-[#1d5c4d]/30' : 'border-stone-200'
      }`}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className={`text-xs font-extrabold px-2 py-1 rounded-md ${rankBadge[a.rank] || rankBadge[4]}`}>#{a.rank}</span>
        <span className="font-extrabold text-[17px] text-stone-800">{a.sector}</span>
        <span className="text-[11px] text-stone-500 font-medium">{a.trekker_ids.join(' + ')}</span>
        <span className="ml-auto">
          {assigned ? (
            <span className={`${pill} bg-[#1d5c4d] text-white border-[#1d5c4d]`}>ASSIGNED · Team {a.team}</span>
          ) : (
            <span className={`${pill} bg-stone-100 text-stone-500 border-stone-200`}>UNASSIGNED</span>
          )}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-[13px] font-bold text-[#c2410c]">{a.urgency_low}–{a.urgency_high}</div>
          <div className="text-[10px] text-stone-500">Urgency</div>
          <Bar value={a.urgency_mid} color="bg-orange-500" />
        </div>
        <div>
          <div className="text-[13px] font-bold text-sky-700">{a.confidence}%</div>
          <div className="text-[10px] text-stone-500">Confidence</div>
          <Bar value={a.confidence} color="bg-sky-500" />
        </div>
        <div>
          <div className="text-[13px] font-bold text-stone-800">{a.decision_score}</div>
          <div className="text-[10px] text-stone-500">Score</div>
        </div>
        <div>
          <div className="text-[13px] font-bold text-stone-800">{a.eta_min}m</div>
          <div className="text-[10px] text-stone-500">ETA</div>
          <div className="text-[10px] text-stone-500 mt-0.5">{a.kit_assigned ? '🎒 Kit: YES' : '🎒 Kit: –'}</div>
        </div>
      </div>

      <p className="mt-2.5 text-[11.5px] text-stone-600 leading-snug">{(a.reasons || []).slice(0, 3).join(' · ') || 'Unknown'}</p>
      {a.unassigned_reason && (
        <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">⚠ {a.unassigned_reason}</p>
      )}
    </button>
  );
}
