import React from 'react';

export default function Sidebar({ currentSection, onSelectSection, isMobileOpen, onCloseMobile }) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      id: 'sectors',
      label: 'Ranked Sectors',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      )
    },
    {
      id: 'evidence',
      label: 'Mission Evidence',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      id: 'replanning',
      label: 'Live Replanning',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      )
    },
    {
      id: 'insights',
      label: 'Decision Insights',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      id: 'resources',
      label: 'Resources & Teams',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'status',
      label: 'System Status',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    }
  ];

  const content = (
    <div className="h-full flex flex-col justify-between bg-[#244638] text-white">
      {/* Top logo & brand */}
      <div>
        <div className="p-5 flex items-center gap-3 border-b border-[#1C382D]">
          {/* SignalFuse mountain peak logo icon */}
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[#E5A87B]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L2 20H22L12 3ZM12 8L17.5 18H6.5L12 8Z" />
              <circle cx="12" cy="14" r="1.8" fill="#F6F0E5" />
            </svg>
          </div>
          <div>
            <h1 className="text-[17px] font-extrabold tracking-tight text-white leading-tight">SIGNALFUSE</h1>
            <p className="text-[11px] text-[#A6C3B6] font-medium tracking-wide">Rescue Intelligence</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-white text-[#244638] shadow-sm font-semibold'
                    : 'text-[#D3E3DA] hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-[#244638]' : 'text-[#A6C3B6]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom mission graphic panel */}
      <div className="p-4 border-t border-[#1C382D]/80">
        <div className="relative rounded-xl overflow-hidden p-4 bg-gradient-to-t from-[#152B22] to-[#1D3A2E] border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-[#E5A87B]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6z" />
            </svg>
            <span className="text-[12px] font-bold tracking-wider text-white uppercase">Operation Lost Signal</span>
          </div>
          <p className="text-[11px] text-[#A6C3B6] leading-relaxed">
            Six trekkers<br />
            Missing after a storm<br />
            In a mountainous forest
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[240px] shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-[260px] max-w-[80%] h-full z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
