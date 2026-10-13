import React from 'react';
import vcasLogo from '../assets/vcas-logo.png';

/**
 * Official Vivekanandha College of Arts and Sciences (VCAS) Logo Component
 * High-definition institutional emblem featuring Swami Vivekananda crest,
 * Vivekananda College of Arts and Science, Vellalankulam.
 */
export default function CollegeLogo({ 
  size = 'md', 
  showText = false, 
  variant = 'color',
  className = '',
  textClassName = ''
}) {
  // Enhanced, prominent size mapping so emblem details and banners are crisp and clear
  const sizeMap = {
    xs: { box: 'w-9 h-9', px: 36 },
    sm: { box: 'w-11 h-11', px: 44 },
    md: { box: 'w-14 h-14 sm:w-16 sm:h-16', px: 60 },
    lg: { box: 'w-20 h-20', px: 80 },
    xl: { box: 'w-24 h-24', px: 96 },
    '2xl': { box: 'w-32 h-32', px: 128 }
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3.5 shrink-0 min-w-0 ${className}`}>
      {/* Official Institutional Crest Image - Prominently sized & sharp */}
      <div 
        className={`${dim.box} flex items-center justify-center relative shrink-0 transition-transform hover:scale-105 duration-200`}
      >
        <img 
          src={vcasLogo} 
          alt="VCAS Official Emblem" 
          className="w-full h-full object-contain filter drop-shadow-sm select-none"
          loading="eager"
        />
      </div>

      {/* College Title & Campus Information - Stacked cleanly down without hiding */}
      {showText && (
        <div className={`leading-tight min-w-0 flex-1 flex flex-col justify-center ${textClassName}`}>
          <h1 className="font-black tracking-tight text-slate-900 text-sm leading-snug break-words">
            Vivekanandha College
          </h1>
          <p className="text-[11px] text-slate-600 font-bold leading-tight mt-0.5">
            of Arts and Sciences
          </p>
          <p className="text-[10px] text-slate-500 font-bold mt-1 leading-tight">
            VCAS • Vellalankulam
          </p>
          <div className="mt-1">
            <span 
              className="inline-block text-[9px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200"
              title="Affiliated with Manonmaniam Sundaranar University"
            >
              MSU Affiliated
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Returns printable HTML embed code for official reports, hall tickets, and receipts
 */
export function getCollegeLogoHtml(width = 65) {
  return `
    <div style="display:inline-block;width:${width}px;height:${width}px;box-sizing:border-box;vertical-align:middle;text-align:center;">
      <img src="/vcas-logo.png" style="width:100%;height:100%;object-fit:contain;display:block;" alt="VCAS Official Emblem" />
    </div>
  `;
}
