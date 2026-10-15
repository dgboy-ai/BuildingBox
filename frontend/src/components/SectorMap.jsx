import React from 'react';

export default function SectorMap({ selectedSector, onSelectSector }) {
  // 4 Sectors matching the schematic:
  // B-North (TRK-01, 02) top-center-left
  // C-East (TRK-03) top-right
  // D-West (TRK-05) center-left
  // A-South (TRK-04, 06) bottom-right
  
  return (
    <div className="relative w-full h-[220px] rounded-xl overflow-hidden shadow-inner border border-[#E4DC CE] bg-[#1E382B]">
      {/* Aerial terrain representation */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `radial-gradient(ellipse at 30% 20%, rgba(68, 116, 85, 0.9), rgba(28, 48, 38, 0.98)), linear-gradient(135deg, #1c3528 0%, #2a4c3a 50%, #162a20 100%)`
        }}
      >
        {/* Subtle contour lines SVG */}
        <svg className="w-full h-full opacity-25" viewBox="0 0 400 240" fill="none">
          <path d="M-20 60 Q 80 40, 160 80 T 340 70 T 420 110" stroke="#E2DFC8" strokeWidth="1" strokeDasharray="4 4" />
          <path d="M-20 120 Q 90 90, 200 130 T 360 120 T 420 160" stroke="#E2DFC8" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M-20 180 Q 110 150, 220 190 T 370 170 T 420 210" stroke="#E2DFC8" strokeWidth="1" strokeDasharray="4 4" />
          <path d="M120 -20 Q 150 90, 140 180 T 170 260" stroke="#E2DFC8" strokeWidth="1" strokeDasharray="2 4" />
          <path d="M260 -20 Q 280 100, 270 190 T 290 260" stroke="#E2DFC8" strokeWidth="1" strokeDasharray="2 4" />
        </svg>

        {/* Mountain ridge texture shadows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,rgba(0,0,0,0.4),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.05),transparent_50%)]" />
      </div>

      {/* Compass rose */}
      <div className="absolute top-3 right-3 flex flex-col items-center pointer-events-none text-white/70">
        <span className="text-[10px] font-mono font-bold">N</span>
        <svg className="w-3.5 h-3.5 -mt-0.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15 11L12 9L9 11L12 2Z" fill="#FFF" />
          <path d="M12 22L15 13L12 15L9 13L12 22Z" fill="#FFF" opacity="0.4" />
        </svg>
      </div>

      {/* Sector overlays */}
      {/* B-North */}
      <button
        onClick={() => onSelectSector('B-North')}
        className={`absolute top-[18px] left-[70px] w-[100px] h-[72px] rounded-[48%_52%_55%_45%/45%_45%_55%_55%] transition-all transform hover:scale-105 flex flex-col items-center justify-center text-center p-1 cursor-pointer ${
          selectedSector === 'B-North'
            ? 'ring-2 ring-white scale-105'
            : 'opacity-90 hover:opacity-100'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(31, 107, 145, 0.75), rgba(15, 65, 90, 0.9))',
          boxShadow: '0 0 15px rgba(26, 120, 160, 0.4)',
          border: '1.5px dashed rgba(125, 205, 240, 0.7)'
        }}
        title="B-North: TRK-01, 02"
      >
        <span className="text-white text-[12px] font-extrabold tracking-wide drop-shadow">B-North</span>
        <span className="text-cyan-200 text-[9.5px] font-mono drop-shadow">TRK-01, 02</span>
      </button>

      {/* C-East */}
      <button
        onClick={() => onSelectSector('C-East')}
        className={`absolute top-[28px] right-[40px] w-[95px] h-[68px] rounded-[55%_45%_48%_52%/50%_55%_45%_50%] transition-all transform hover:scale-105 flex flex-col items-center justify-center text-center p-1 cursor-pointer ${
          selectedSector === 'C-East'
            ? 'ring-2 ring-white scale-105'
            : 'opacity-90 hover:opacity-100'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(38, 122, 92, 0.75), rgba(18, 70, 52, 0.9))',
          boxShadow: '0 0 15px rgba(35, 140, 100, 0.4)',
          border: '1.5px dashed rgba(110, 230, 180, 0.7)'
        }}
        title="C-East: TRK-03"
      >
        <span className="text-white text-[12px] font-extrabold tracking-wide drop-shadow">C-East</span>
        <span className="text-emerald-200 text-[9.5px] font-mono drop-shadow">TRK-03</span>
      </button>

      {/* D-West */}
      <button
        onClick={() => onSelectSector('D-West')}
        className={`absolute bottom-[22px] left-[35px] w-[105px] h-[75px] rounded-[52%_48%_58%_42%/42%_58%_42%_58%] transition-all transform hover:scale-105 flex flex-col items-center justify-center text-center p-1 cursor-pointer ${
          selectedSector === 'D-West'
            ? 'ring-2 ring-white scale-105'
            : 'opacity-90 hover:opacity-100'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168, 48, 38, 0.8), rgba(110, 24, 18, 0.9))',
          boxShadow: '0 0 18px rgba(200, 50, 40, 0.5)',
          border: '1.5px dashed rgba(255, 140, 130, 0.8)'
        }}
        title="D-West: TRK-05"
      >
        <span className="text-white text-[12px] font-extrabold tracking-wide drop-shadow">D-West</span>
        <span className="text-rose-200 text-[9.5px] font-mono drop-shadow">TRK-05</span>
      </button>

      {/* A-South */}
      <button
        onClick={() => onSelectSector('A-South')}
        className={`absolute bottom-[24px] right-[65px] w-[108px] h-[72px] rounded-[45%_55%_48%_52%/52%_45%_55%_48%] transition-all transform hover:scale-105 flex flex-col items-center justify-center text-center p-1 cursor-pointer ${
          selectedSector === 'A-South'
            ? 'ring-2 ring-white scale-105'
            : 'opacity-90 hover:opacity-100'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(175, 115, 30, 0.75), rgba(115, 70, 15, 0.9))',
          boxShadow: '0 0 15px rgba(210, 135, 35, 0.4)',
          border: '1.5px dashed rgba(250, 195, 95, 0.7)'
        }}
        title="A-South: TRK-04, 06"
      >
        <span className="text-white text-[12px] font-extrabold tracking-wide drop-shadow">A-South</span>
        <span className="text-amber-200 text-[9.5px] font-mono drop-shadow">TRK-04, 06</span>
      </button>

      {/* Subtle trail dashed connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 240">
        <path d="M 120 70 L 190 125 L 85 160" stroke="#FDE68A" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
        <path d="M 190 125 L 300 70" stroke="#FDE68A" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
        <path d="M 190 125 L 285 170" stroke="#FDE68A" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="190" cy="125" r="3.5" fill="#FBBF24" />
      </svg>
    </div>
  );
}
