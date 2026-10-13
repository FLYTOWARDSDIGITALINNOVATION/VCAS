import React from 'react';

/**
 * Official Vivekanandha College of Arts and Sciences (VCAS) Logo Component
 * High-definition vector emblem featuring the Swami Vivekananda crest,
 * lamp of wisdom, open sacred book, and university laurel wreath.
 */
export default function CollegeLogo({ 
  size = 'md', 
  showText = false, 
  variant = 'color', // 'color' | 'white' | 'dark' | 'print'
  className = '',
  textClassName = ''
}) {
  const sizeMap = {
    xs: { box: 'w-7 h-7', svg: 28 },
    sm: { box: 'w-8 h-8', svg: 32 },
    md: { box: 'w-10 h-10', svg: 40 },
    lg: { box: 'w-12 h-12', svg: 48 },
    xl: { box: 'w-16 h-16', svg: 64 },
    '2xl': { box: 'w-20 h-20', svg: 80 }
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 shrink-0 ${className}`}>
      {/* High-Definition SVG Crest */}
      <div 
        className={`${dim.box} rounded-2xl flex items-center justify-center relative overflow-hidden shadow-sm shrink-0 transition-transform hover:scale-105 duration-200`}
        style={{
          background: variant === 'print' 
            ? '#ffffff' 
            : 'linear-gradient(135deg, #0a1e47 0%, #173b7a 50%, #1e4ea8 100%)',
          border: variant === 'print' ? '1.5px solid #0f1e3c' : '1.5px solid rgba(255,255,255,0.2)'
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Outer Glow & Ring */}
          <circle cx="50" cy="50" r="46" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="3 2" />
          <circle cx="50" cy="50" r="42" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
          
          {/* Decorative College Arch & Rays */}
          <path d="M25 50 Q50 20 75 50" stroke="#fef08a" strokeWidth="1.2" strokeOpacity="0.7" fill="none" />
          <path d="M50 14 L50 24" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M38 18 L43 26" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M62 18 L57 26" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />

          {/* Swami Vivekananda Inspired Meditative Crest / Torch */}
          {/* Sacred Flame / Jyoti of Knowledge */}
          <path 
            d="M50 23 C52 28, 56 31, 56 36 C56 40, 53 43, 50 44 C47 43, 44 40, 44 36 C44 31, 48 28, 50 23 Z" 
            fill="url(#vcas_flame)"
          />
          <path 
            d="M50 27 C51 30, 53 32, 53 35 C53 37, 51.5 39, 50 39.5 C48.5 39, 47 37, 47 35 C47 32, 49 30, 50 27 Z" 
            fill="#ffffff"
          />

          {/* Lamp Base / Kalash / Stand */}
          <path 
            d="M44 44 Q50 42 56 44 L55 48 Q50 49 45 48 Z" 
            fill="#f59e0b" 
            stroke="#b45309" 
            strokeWidth="0.5" 
          />

          {/* Open Book of Universal Wisdom (Vidya) */}
          <path 
            d="M50 56 Q36 50 24 53 L24 67 Q36 64 50 70 Q64 64 76 67 L76 53 Q64 50 50 56 Z" 
            fill="#ffffff" 
            stroke="#cbd5e1" 
            strokeWidth="0.8" 
          />
          {/* Book Spine & Page Crease */}
          <path d="M50 56 L50 70" stroke="#0f1e3c" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M30 57 Q38 55 46 58" stroke="#94a3b8" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M30 61 Q38 59 46 62" stroke="#94a3b8" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M54 58 Q62 55 70 57" stroke="#94a3b8" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M54 62 Q62 59 70 61" stroke="#94a3b8" strokeWidth="0.8" strokeLinecap="round" />

          {/* Lotus Petal Base (Purity) */}
          <path 
            d="M32 72 Q50 82 68 72 Q59 86 50 87 Q41 86 32 72 Z" 
            fill="#f59e0b" 
            stroke="#d97706" 
            strokeWidth="0.6" 
          />
          <path d="M50 73 L50 85" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
          <path d="M42 75 Q46 80 50 84" stroke="#ffffff" strokeWidth="0.7" />
          <path d="M58 75 Q54 80 50 84" stroke="#ffffff" strokeWidth="0.7" />

          {/* Lettering Ribbon / Bottom Motto */}
          <rect x="36" y="86" width="28" height="5.5" rx="2" fill="#0f172a" />
          <text 
            x="50" 
            y="90.5" 
            textAnchor="middle" 
            fill="#fde047" 
            fontSize="4.2" 
            fontWeight="900" 
            letterSpacing="0.8"
            fontFamily="sans-serif"
          >
            VCAS
          </text>

          {/* Shading Gradients */}
          <defs>
            <linearGradient id="vcas_flame" x1="50" y1="23" x2="50" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.4" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#dc2626" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* College Title & Campus Information */}
      {showText && (
        <div className={`leading-tight min-w-0 flex-1 ${textClassName}`}>
          <h1 className="font-extrabold tracking-tight text-slate-900 text-xs sm:text-sm truncate leading-snug">
            Vivekanandha College
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span 
              className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 shrink-0"
              title="Affiliated with Manonmaniam Sundaranar University"
            >
              MSU Affiliated
            </span>
            <span className="text-[10px] text-slate-400 font-semibold truncate">
              VCAS
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function getCollegeLogoHtml(width = 60) {
  return `
    <div style="display:inline-block;width:${width}px;height:${width}px;border-radius:12px;background:linear-gradient(135deg,#0a1e47,#1e4ea8);padding:4px;box-sizing:border-box;vertical-align:middle;">
      <svg viewBox="0 0 100 100" style="width:100%;height:100%;" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="3 2" />
        <circle cx="50" cy="50" r="42" stroke="#ffffff" stroke-width="1" stroke-opacity="0.4" />
        <path d="M50 23 C52 28, 56 31, 56 36 C56 40, 53 43, 50 44 C47 43, 44 40, 44 36 C44 31, 48 28, 50 23 Z" fill="#f59e0b" />
        <path d="M44 44 Q50 42 56 44 L55 48 Q50 49 45 48 Z" fill="#d97706" />
        <path d="M50 56 Q36 50 24 53 L24 67 Q36 64 50 70 Q64 64 76 67 L76 53 Q64 50 50 56 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
        <path d="M50 56 L50 70" stroke="#0f1e3c" stroke-width="1.5" />
        <path d="M32 72 Q50 82 68 72 Q59 86 50 87 Q41 86 32 72 Z" fill="#f59e0b" stroke="#d97706" stroke-width="0.6" />
        <rect x="36" y="86" width="28" height="5.5" rx="2" fill="#0f172a" />
        <text x="50" y="90.5" text-anchor="middle" fill="#fde047" font-size="4.2" font-weight="900" font-family="sans-serif">VCAS</text>
      </svg>
    </div>
  `;
}

