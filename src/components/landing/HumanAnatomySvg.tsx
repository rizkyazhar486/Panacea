import React from 'react'

export function HumanAnatomy() {
  const ribs = [0, 1, 2, 3, 4, 5]
  return (
    <svg className="h-full w-full overflow-visible" viewBox="0 0 520 760" role="img" aria-label="Human anatomy layers separating into organs and systems">
      <defs>
        <radialGradient id="skinGlow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#e8fbff" stopOpacity=".24" />
          <stop offset="65%" stopColor="#7dd3fc" stopOpacity=".08" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bone" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#bdefff" />
        </linearGradient>
        <linearGradient id="vessel" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6ee7f9" />
          <stop offset="48%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
        <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="organGlow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse className="anatomy-floor" cx="260" cy="714" rx="112" ry="18" fill="rgba(64,220,255,.13)" />

      <g className="anatomy-envelope">
        <circle cx="260" cy="92" r="48" fill="url(#skinGlow)" stroke="rgba(202,244,255,.28)" strokeWidth="1.5" />
        <path d="M210 151C191 173 184 219 190 279l17 135-31 214c-4 31 15 53 32 30l44-214h16l44 214c17 23 36 1 32-30l-31-214 17-135c6-60-1-106-20-128-20-12-80-12-100 0Z" fill="url(#skinGlow)" stroke="rgba(202,244,255,.26)" strokeWidth="1.5" />
        <path d="M203 171 117 357c-7 21 10 32 23 14l79-141M317 171l86 186c7 21-10 32-23 14l-79-141" fill="none" stroke="rgba(202,244,255,.22)" strokeWidth="27" strokeLinecap="round" />
      </g>

      <g className="anatomy-part anatomy-skeleton" filter="url(#softGlow)">
        <circle cx="260" cy="92" r="34" fill="none" stroke="url(#bone)" strokeWidth="5" opacity=".8" />
        <path d="M244 106q16 12 32 0M260 126v294" fill="none" stroke="url(#bone)" strokeWidth="6" strokeLinecap="round" opacity=".78" />
        {ribs.map((i) => { const y = 177 + i * 28; const w = 58 - i * 4; return <path key={i} d={`M260 ${y}C${260-w} ${y-15} ${260-w} ${y+24} 260 ${y+24}C${260+w} ${y+24} ${260+w} ${y-15} 260 ${y}`} fill="none" stroke="url(#bone)" strokeWidth="3.8" opacity=".66" /> })}
        <path d="m223 158-59 106-38 100m171-206 59 106 38 100M224 408q36 24 72 0m-64 14-30 193m86-193 30 193m-115 0-9 65m123-65 9 65" fill="none" stroke="url(#bone)" strokeWidth="8" strokeLinecap="round" opacity=".73" />
      </g>

      <g className="anatomy-part anatomy-neuro" fill="none" stroke="#c4b5fd" strokeLinecap="round" filter="url(#organGlow)">
        <path d="M260 128v303" strokeWidth="3.2" /><path d="M260 202c-36 30-65 67-96 127m96-127c36 30 65 67 96 127M260 330c-24 69-42 163-55 285m55-285c24 69 42 163 55 285" strokeWidth="1.7" opacity=".82" />
      </g>

      <g className="anatomy-part anatomy-brain" filter="url(#organGlow)">
        <path d="M226 86c-2-26 17-43 34-36 17-10 38 8 34 29 12 20-4 43-26 39-19 12-47-7-42-32Z" fill="rgba(196,181,253,.84)" stroke="#ede9fe" strokeWidth="2" />
        <path d="M240 61c10 10 6 24-4 31m28-39c-9 13 0 26 10 32m11-19c-11 10-9 29 3 36m-39-2c11-11 24-4 30 11" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
      </g>

      <g className="anatomy-part anatomy-lungs" filter="url(#organGlow)">
        <path d="M248 176c-29-5-43 27-41 71 2 39 22 58 43 37V181Z" fill="rgba(103,232,249,.7)" stroke="#cffafe" strokeWidth="2" /><path d="M272 176c29-5 43 27 41 71-2 39-22 58-43 37V181Z" fill="rgba(103,232,249,.7)" stroke="#cffafe" strokeWidth="2" /><path d="M260 147v44m0-7-25 25m25-25 25 25" fill="none" stroke="#e6fdff" strokeWidth="4" strokeLinecap="round" />
      </g>

      <g className="anatomy-part anatomy-heart" filter="url(#organGlow)">
        <path d="M260 251c-15-22-40-12-39 10 1 24 39 50 39 50s38-26 39-50c1-22-24-32-39-10Z" fill="#fb7185" stroke="#fecdd3" strokeWidth="2.4" /><path d="M256 244c-4-14-2-25 4-35m8 37c10-15 15-25 15-38" fill="none" stroke="#fda4af" strokeWidth="5" strokeLinecap="round" />
      </g>

      <g className="anatomy-part anatomy-liver" filter="url(#organGlow)">
        <path d="M246 326c-39-11-47 16-36 45 19 14 56 7 77-13 13-13-1-32-41-32Z" fill="rgba(251,146,60,.82)" stroke="#fed7aa" strokeWidth="2" />
      </g>

      <g className="anatomy-part anatomy-kidneys" filter="url(#organGlow)">
        <path d="M222 372c-17-7-26 12-19 35 7 19 27 14 29-8 2-16-1-23-10-27Z" fill="rgba(244,114,182,.76)" stroke="#fbcfe8" strokeWidth="2" />
        <path d="M298 372c17-7 26 12 19 35-7 19-27 14-29-8-2-16 1-23 10-27Z" fill="rgba(244,114,182,.76)" stroke="#fbcfe8" strokeWidth="2" />
      </g>

      <g className="anatomy-part anatomy-digestive" filter="url(#organGlow)">
        <path d="M274 338c29 1 26 41 4 44-18 2-21-17-13-30" fill="rgba(253,186,116,.7)" stroke="#ffedd5" strokeWidth="2" />
        <path d="M234 410c-17 12-17 59 4 73 24 16 61 4 64-26 4-31-17-49-38-41-20 7-21 33-5 40 20 9 30-15 19-25" fill="none" stroke="#fdba74" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g className="anatomy-part anatomy-vascular" fill="none" stroke="url(#vessel)" strokeLinecap="round" filter="url(#organGlow)">
        <path d="M265 209c5 50 3 115-2 223l24 182" strokeWidth="5" />
        <path d="m263 320-45 87m45-87 39 87m-36-142-48-59m48 59 41-60" strokeWidth="2.6" opacity=".8" />
      </g>
    </svg>
  )
}
