import React from 'react';
import { StatusPill, UrgencyBar, ConfidenceBar } from './sfBadges.jsx';

export default function ActionCard({ a, selected, onSelect }) {
  const isSelected = selected;
  const isAssigned = !!a.team && !a.unassigned_reason;

  return (
    <div
      onClick={() => onSelect(a.rank)}
      className={`relative rounded-xl bg-white p-4 transition-all duration-150 cursor-pointer border ${
        isSelected
          ? 'border-[#D97732] ring-2 ring-[#D97732]/20 shadow-md'
          : 'border-[#E4DCD0] hover:border-[#C8BCAC] shadow-sm'
      }`}
    >
      {/* Top Header: Rank badge, Sector title, Assigned pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
              a.rank === 1
                ? 'bg-[#E5733A] text-white shadow-sm'
                : 'bg-[#5A6E65] text-white'
            }`}
          >
            #{a.rank}
          </div>
          <div>
            <h3 className="font-extrabold text-[16px] text-[#1E2E27] tracking-tight leading-none">
              {a.sector}
            </h3>
            <span className="text-[11px] font-mono text-stone-500 font-medium">
              {a.trekker_ids.join(' + ')}
            </span>
          </div>
        </div>

        <StatusPill assigned={isAssigned} team={a.team} unassignedReason={a.unassigned_reason} />
      </div>

      {/* Metrics Row: Urgency, Confidence, Score, ETA */}
      <div className="mt-3.5 grid grid-cols-4 gap-2 items-center text-center py-2 px-1 rounded-lg bg-[#FAF7F2] border border-[#EFE8DD]">
        {/* Urgency */}
        <div className="text-left px-1.5" title="How fast this sector needs help: injury + dying battery + weak signal + stale ping + bad weather. Range = known risks → worst case if the unknowns are bad. Hand-set heuristic, not medical risk.">
          <div className="text-[10px] font-bold tracking-wider text-stone-500 uppercase font-mono">Urgency ⓘ</div>
          <div className="font-bold font-mono text-[13px] text-[#1E2E27]">
            {a.urgency_low}–{a.urgency_high}
          </div>
          <div className="mt-1">
            <UrgencyBar value={a.urgency_mid} />
          </div>
          <div className="text-[11px] font-extrabold text-[#E5733A] leading-tight mt-1">higher = help first</div>
        </div>

        {/* Confidence */}
        <div className="text-left px-1.5 border-l border-[#E6DED2]" title="How much we trust the evidence: fresh ping + known sector + signal + complete fields. Low means stale or missing data — never means safe.">
          <div className="text-[10px] font-bold tracking-wider text-stone-500 uppercase font-mono">Confidence ⓘ</div>
          <div className="font-bold font-mono text-[13px] text-[#1E2E27]">
            {a.confidence}%
          </div>
          <div className="mt-1">
            <ConfidenceBar value={a.confidence} />
          </div>
          <div className="text-[11px] font-extrabold text-[#2B82C9] leading-tight mt-1">higher = trusted data</div>
        </div>

        {/* Score */}
        <div className="px-1 border-l border-[#E6DED2]" title="Final rank score = 60% urgency + 20% uncertainty + 20% feasibility. Heuristic that decides the order.">
          <div className="text-[10px] font-bold tracking-wider text-stone-500 uppercase font-mono" title="Final rank score = 60% urgency + 20% uncertainty + 20% feasibility. Heuristic that decides the order.">Score ⓘ</div>
          <div className="font-extrabold font-mono text-[14px] text-[#1E2E27]">
            {a.decision_score}
          </div>
          <div className="text-[11px] font-extrabold text-stone-700 leading-tight mt-0.5">higher = go first</div>
          <div className="text-[9.5px] font-bold font-mono text-stone-500 mt-0.5">
            {a.kit_assigned ? (
              <span className="text-[#D97732] flex items-center justify-center gap-0.5">
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6h-2V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8-2h2v2h-2V4zm-1 9v-2h2v2h2v2h-2v2h-2v-2H8v-2h2z" />
                </svg>
                Kit: YES
              </span>
            ) : (
              <span className="text-stone-400">Kit: —</span>
            )}
          </div>
        </div>

        {/* ETA */}
        <div className="px-1 border-l border-[#E6DED2]" title="Synthetic walk time from base camp × weather multiplier. Over 60 min = unsafe to send. Not a real measured route.">
          <div className="text-[10px] font-bold tracking-wider text-stone-500 uppercase font-mono">ETA ⓘ</div>
          <div className="font-extrabold font-mono text-[14px] text-[#1E2E27]">
            {a.eta_min}m
          </div>
          <div className="text-[11px] font-extrabold text-stone-700 leading-tight mt-0.5">
            walk × weather
          </div>
        </div>
      </div>

      {/* Explanations & caveats */}
      <div className="mt-2.5 text-[11px] text-stone-600 leading-snug">
        <p className="line-clamp-1">
          {a.reasons?.join(' · ') || 'Standard monitoring'}
        </p>
        {a.unassigned_reason && (
          <p className="mt-1 text-[11px] font-mono text-[#B85D1B] bg-[#FDF3E9] px-2 py-1 rounded flex items-center gap-1.5 border border-[#F5DCBE]">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
            <span>{a.unassigned_reason}</span>
          </p>
        )}
      </div>
    </div>
  );
}
