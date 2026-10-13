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
  const sizeMap = {
    xs: { box: 'w-8 h-8', px: 32 },
    sm: { box: 'w-10 h-10', px: 40 },
    md: { box: 'w-12 h-12', px: 48 },
    lg: { box: 'w-16 h-16', px: 64 },
    xl: { box: 'w-20 h-20', px: 80 },
    '2xl': { box: 'w-24 h-24', px: 96 }
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 shrink-0 ${className}`}>
      {/* Official Institutional Crest Image */}
      <div 
        className={`${dim.box} flex items-center justify-center relative shrink-0 transition-transform hover:scale-105 duration-200`}
      >
        <img 
          src={vcasLogo} 
          alt="VCAS Official Emblem" 
          className="w-full h-full object-contain select-none"
          loading="eager"
        />
      </div>

      {/* College Title & Affiliation Badge */}
      {showText && (
        <div className={`leading-tight min-w-0 flex-1 ${textClassName}`}>
          <h1 className="font-extrabold tracking-tight text-slate-900 text-sm truncate leading-snug">
            Vivekanandha College
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span 
              className="text-[9px] font-bold uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 shrink-0"
              title="Affiliated with Manonmaniam Sundaranar University"
            >
              MSU AFFILIATED
            </span>
            <span className="text-[11px] text-slate-400 font-semibold truncate">
              VCAS
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
export function getCollegeLogoHtml(width = 48) {
  return `
    <div style="display:inline-block;width:${width}px;height:${width}px;box-sizing:border-box;vertical-align:middle;text-align:center;">
      <img src="/vcas-logo.png" style="width:100%;height:100%;object-fit:contain;display:block;" alt="VCAS Official Emblem" />
    </div>
  `;
}
