import React from 'react';

export default function ResourcePanel({ teams, plan, source }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-forest-900/80 p-5" aria-label="Resource allocation">
      <h2 className="text-sm font-mono uppercase tracking-widest text-moss-400">⬢ Rescue Resource Allocation <span className="text-white/30">— {source === 'live' ? 'live backend' : 'local demo allocation'}</span></h2>
      <div className="mt-3 grid md:grid-cols-2 gap-3">
        <div className="space-y-2">
          {teams.map((tm) => (
            <div key={tm.id} className="rounded-lg bg-black/30 border border-white/5 p-2.5 text-xs flex justify-between">
              <span><b>Team {tm.id}</b> · {tm.size} pers · {tm.medic ? '🚑 medic' : 'no medic'} · {tm.base}</span>
              <span className={`font-mono ${tm.status === 'ready' ? 'text-emerald-300' : 'text-yellow-200'}`}>{tm.status}</span>
            </div>
          ))}
          <p className="text-[11px] text-white/40">Only 3 teams for 6 trekkers — allocation is forced to prioritize. That constraint is the point judges want to see.</p>
        </div>
        <ol className="space-y-2">
          {plan.map((p, i) => (
            <li key={i} className="rounded-lg border border-ember-500/20 bg-ember-500/5 p-2.5 text-xs">
              <div className="font-mono font-bold">Team {p.teamId} → {p.trekkerId} ({p.sector})</div>
              <div className="text-white/70 mt-0.5">{p.action}</div>
              <div className="text-white/40 font-mono text-[11px]">{p.why}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
