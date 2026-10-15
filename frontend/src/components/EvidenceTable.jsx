import React from 'react';
import { fmt } from './sfBadges.jsx';

export default function EvidenceTable({ records }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs min-w-[700px]">
        <thead>
          <tr className="border-b border-[#E6DED2] text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider">
            <th className="py-2.5 px-3">ID</th>
            <th className="py-2.5 px-3">Name</th>
            <th className="py-2.5 px-3">Sector</th>
            <th className="py-2.5 px-3">Last Ping</th>
            <th className="py-2.5 px-3">Signal</th>
            <th className="py-2.5 px-3">Battery</th>
            <th className="py-2.5 px-3">Health</th>
            <th className="py-2.5 px-3">Evidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EFE8DD] text-[12px] text-stone-800">
          {records.map((r) => {
            const isFresh = r.hours_elapsed !== null && r.hours_elapsed <= 3.5;
            const isStale = r.hours_elapsed !== null && r.hours_elapsed > 3.5;
            const hasMissing = r.battery_pct === null || r.health === null || r.signal_bars === null;
            
            return (
              <tr key={r.id} className="hover:bg-[#FAF7F2] transition-colors">
                {/* ID */}
                <td className="py-2 px-3 font-mono font-bold text-[#1E2E27]">
                  {r.id}
                </td>

                {/* Name */}
                <td className="py-2 px-3 font-medium text-stone-900 whitespace-nowrap">
                  {r.name}
                </td>

                {/* Sector */}
                <td className="py-2 px-3 font-semibold text-stone-700 whitespace-nowrap">
                  {r.sector}
                </td>

                {/* Last Ping */}
                <td className="py-2 px-3 font-mono">
                  <div className="font-bold text-stone-800">{fmt(r.ping)}</div>
                  <div className="text-[10px] text-stone-500">{r.hours_elapsed ? `${r.hours_elapsed.toFixed(1)}h ago` : 'Unknown'}</div>
                </td>

                {/* Signal */}
                <td className="py-2 px-3 font-mono">
                  {r.signal_bars === null || r.signal_bars === undefined ? (
                    <span className="text-[11px] text-stone-400">Unknown</span>
                  ) : (
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        r.signal_bars <= 1
                          ? 'bg-[#FBE8E6] text-[#C93B2B] border border-[#F5C2BD]'
                          : r.signal_bars === 2
                          ? 'bg-[#FEF5E7] text-[#B87A18] border border-[#FBE0B5]'
                          : 'bg-[#EBF7EE] text-[#248247] border border-[#C5E8CC]'
                      }`}
                    >
                      {r.signal_bars} {r.signal_bars === 1 ? 'bar' : 'bars'}
                    </span>
                  )}
                </td>

                {/* Battery */}
                <td className="py-2 px-3 font-mono font-semibold">
                  {r.battery_pct === null || r.battery_pct === undefined ? (
                    <span className="text-stone-400 italic">Unknown</span>
                  ) : (
                    <span
                      className={
                        r.battery_pct <= 15
                          ? 'text-[#C93B2B] font-bold'
                          : r.battery_pct <= 30
                          ? 'text-[#B87A18] font-bold'
                          : 'text-stone-700'
                      }
                    >
                      {r.battery_pct}%
                    </span>
                  )}
                </td>

                {/* Health */}
                <td className="py-2 px-3 font-medium">
                  {r.health_label ? (
                    <span
                      className={
                        r.health === 'serious'
                          ? 'text-[#C93B2B] font-bold'
                          : r.health === 'minor'
                          ? 'text-[#B87A18] font-semibold'
                          : 'text-stone-600'
                      }
                    >
                      {r.health_label}
                    </span>
                  ) : (
                    <span className="text-stone-400 italic">Unknown</span>
                  )}
                </td>

                {/* Evidence badges */}
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Staleness / freshness */}
                    {isFresh && (
                      <span className="inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EBF7EE] text-[#248247] border border-[#C5E8CC]">
                        FRESH
                      </span>
                    )}
                    {isStale && (
                      <span className="inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FEF5E7] text-[#B87A18] border border-[#FBE0B5]">
                        STALE {r.hours_elapsed.toFixed(1)}h
                      </span>
                    )}

                    {/* Conflicting */}
                    {r.conflicting && (
                      <span className="inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F2EAFA] text-[#7C3AED] border border-[#DFCEF5]">
                        CONFLICTING
                      </span>
                    )}

                    {/* Missing data */}
                    {hasMissing && (
                      <span className="inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F4EFEB] text-stone-600 border border-[#E2DBD0]">
                        MISSING
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
