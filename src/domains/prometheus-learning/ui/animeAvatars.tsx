import React from 'react'

export type AvatarExpression = 'neutral' | 'correct' | 'wrong' | 'thinking'

interface AvatarProps {
  expression?: AvatarExpression
  size?: number
  className?: string
}

/**
 * 100% Vector SVG Anime Character Portraits for the 3 Competitive Study Bots:
 * - Aria: Energetic teal-haired speedster
 * - Kenji: Methodical dark-haired scholar with glasses & stethoscope
 * - Mira: Serene lavender-haired grandmaster theorist
 * Fully offline, zero external bandwidth, resolution-independent.
 */

export function AriaAvatar({ expression = 'neutral', size = 96, className = '' }: AvatarProps) {
  const isCorrect = expression === 'correct'
  const isWrong = expression === 'wrong'
  const isThinking = expression === 'thinking'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-2xl transition-transform duration-200 ${className}`}
      aria-label="Aria - Speedster Study Rival"
    >
      <defs>
        <linearGradient id="aria_bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d9488" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="aria_hair" x1="30" y1="20" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="aria_hoodie" x1="20" y1="80" x2="100" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Background Badge */}
      <rect width="120" height="120" rx="24" fill="url(#aria_bg)" />
      <circle cx="60" cy="60" r="50" stroke="#5eead4" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />

      {/* Shoulders / Lab Coat & Hoodie */}
      <path d="M22 120C24 95 38 86 60 86C82 86 96 95 98 120H22Z" fill="#f8fafc" />
      <path d="M42 86L60 102L78 86C78 98 60 114 60 114C60 114 42 98 42 86Z" fill="url(#aria_hoodie)" />
      <path d="M30 120L44 92L52 120H30Z" fill="#e2e8f0" />
      <path d="M90 120L76 92L68 120H90Z" fill="#e2e8f0" />

      {/* Neck */}
      <rect x="52" y="70" width="16" height="18" rx="4" fill="#fed7aa" />

      {/* Hair (Back) */}
      <path d="M28 65C24 45 32 24 60 22C88 24 96 45 92 65C88 78 80 84 80 84C80 84 76 68 60 68C44 68 40 84 40 84C40 84 32 78 28 65Z" fill="url(#aria_hair)" />

      {/* Face & Ears */}
      <path d="M36 50C36 40 44 32 60 32C76 32 84 40 84 50C84 64 74 76 60 78C46 76 36 64 36 50Z" fill="#ffedd5" />
      <circle cx="35" cy="52" r="5" fill="#fed7aa" />
      <circle cx="85" cy="52" r="5" fill="#fed7aa" />

      {/* Hair (Front Bangs & Hairclip) */}
      <path d="M34 42C38 30 50 25 60 25C74 25 84 32 86 44C78 36 68 36 60 38C52 40 44 36 34 42Z" fill="url(#aria_hair)" />
      <path d="M42 34L48 54L54 38L62 56L68 37L76 50L82 40" stroke="url(#aria_hair)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Orange Hairclip */}
      <rect x="74" y="30" width="12" height="4" rx="2" transform="rotate(25 74 30)" fill="#f97316" />

      {/* Eyes (Amber/Gold) */}
      {isWrong ? (
        // Dizzy / Sweat eyes
        <g stroke="#d97706" strokeWidth="2.5" strokeLinecap="round">
          <line x1="44" y1="48" x2="52" y2="54" />
          <line x1="52" y1="48" x2="44" y2="54" />
          <line x1="68" y1="48" x2="76" y2="54" />
          <line x1="76" y1="48" x2="68" y2="54" />
        </g>
      ) : isCorrect ? (
        // Sparkling happy crescent eyes
        <g stroke="#b45309" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M43 53C45 47 51 47 53 53" />
          <path d="M67 53C69 47 75 47 77 53" />
        </g>
      ) : (
        // Confident amber eyes
        <g>
          <ellipse cx="48" cy="52" rx="4.5" ry="6" fill="#f59e0b" />
          <ellipse cx="72" cy="52" rx="4.5" ry="6" fill="#f59e0b" />
          <circle cx="49" cy="50" r="1.8" fill="#ffffff" />
          <circle cx="73" cy="50" r="1.8" fill="#ffffff" />
          <path d="M43 45C46 43 51 44 54 46" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" />
          <path d="M77 45C74 43 69 44 66 46" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* Mouth */}
      {isCorrect ? (
        <path d="M53 64C56 70 64 70 67 64" fill="#f43f5e" stroke="#be123c" strokeWidth="1.5" />
      ) : isWrong ? (
        <ellipse cx="60" cy="65" rx="3.5" ry="4.5" fill="#e11d48" />
      ) : isThinking ? (
        <path d="M55 64C58 63 62 63 65 64" stroke="#9f1239" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M54 63C57 66 63 66 66 63" stroke="#9f1239" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}

      {/* Sweat drop if wrong */}
      {isWrong && (
        <path d="M84 38C84 38 88 44 86 47C84 50 81 48 81 45C81 42 84 38 84 38Z" fill="#38bdf8" />
      )}
    </svg>
  )
}

export function KenjiAvatar({ expression = 'neutral', size = 96, className = '' }: AvatarProps) {
  const isCorrect = expression === 'correct'
  const isWrong = expression === 'wrong'
  const isThinking = expression === 'thinking'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-2xl transition-transform duration-200 ${className}`}
      aria-label="Kenji - Methodical Study Rival"
    >
      <defs>
        <linearGradient id="kenji_bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#312e81" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="kenji_hair" x1="30" y1="15" x2="90" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e1b4b" />
          <stop offset="1" stopColor="#312e81" />
        </linearGradient>
        <linearGradient id="kenji_vest" x1="20" y1="80" x2="100" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Background Badge */}
      <rect width="120" height="120" rx="24" fill="url(#kenji_bg)" />
      <circle cx="60" cy="60" r="50" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" opacity="0.35" />

      {/* Shoulders / Shirt & Navy Cardigan */}
      <path d="M22 120C24 95 38 86 60 86C82 86 96 95 98 120H22Z" fill="url(#kenji_vest)" />
      {/* White Collared Shirt V */}
      <path d="M50 86L60 106L70 86H50Z" fill="#ffffff" />
      {/* Stethoscope */}
      <path d="M42 88C42 108 52 118 60 118C68 118 78 108 78 88" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="116" r="4.5" fill="#94a3b8" stroke="#f1f5f9" strokeWidth="1.5" />

      {/* Neck */}
      <rect x="52" y="70" width="16" height="18" rx="4" fill="#fde68a" />

      {/* Hair (Back) */}
      <path d="M30 60C26 40 34 22 60 20C86 22 94 40 90 60C86 70 82 78 82 78C82 78 78 68 60 68C42 68 38 78 38 78C38 78 34 70 30 60Z" fill="url(#kenji_hair)" />

      {/* Face & Ears */}
      <path d="M36 48C36 38 45 32 60 32C75 32 84 38 84 48C84 63 73 75 60 77C47 75 36 63 36 48Z" fill="#fef3c7" />
      <circle cx="35" cy="50" r="5" fill="#fde68a" />
      <circle cx="85" cy="50" r="5" fill="#fde68a" />

      {/* Neat Dark Bangs */}
      <path d="M34 40C40 28 50 25 60 25C70 25 80 28 86 40C80 34 72 32 64 34C56 36 46 33 34 40Z" fill="url(#kenji_hair)" />
      <path d="M40 32L46 48L52 35L62 49L70 34L76 46L82 36" stroke="url(#kenji_hair)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Rectangular Glasses */}
      <rect x="42" y="46" width="14" height="10" rx="2" stroke="#38bdf8" strokeWidth="2" fill="#e0f2fe" fillOpacity="0.3" />
      <rect x="64" y="46" width="14" height="10" rx="2" stroke="#38bdf8" strokeWidth="2" fill="#e0f2fe" fillOpacity="0.3" />
      <line x1="56" y1="51" x2="64" y2="51" stroke="#38bdf8" strokeWidth="2" />
      <line x1="38" y1="50" x2="42" y2="50" stroke="#38bdf8" strokeWidth="1.5" />
      <line x1="78" y1="50" x2="82" y2="50" stroke="#38bdf8" strokeWidth="1.5" />

      {/* Eyes Behind Glasses */}
      {isWrong ? (
        <g stroke="#475569" strokeWidth="2" strokeLinecap="round">
          <line x1="46" y1="49" x2="52" y2="53" />
          <line x1="52" y1="49" x2="46" y2="53" />
          <line x1="68" y1="49" x2="74" y2="53" />
          <line x1="74" y1="49" x2="68" y2="53" />
        </g>
      ) : isCorrect ? (
        <g stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M45 52C47 48 51 48 53 52" />
          <path d="M67 52C69 48 73 48 75 52" />
        </g>
      ) : (
        <g>
          <ellipse cx="49" cy="51" rx="3.5" ry="4.5" fill="#0f172a" />
          <ellipse cx="71" cy="51" rx="3.5" ry="4.5" fill="#0f172a" />
          <circle cx="50" cy="50" r="1.3" fill="#ffffff" />
          <circle cx="72" cy="50" r="1.3" fill="#ffffff" />
          {/* Eyebrows */}
          <path d="M44 42C47 40 51 40 54 42" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
          <path d="M76 42C73 40 69 40 66 42" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* Mouth */}
      {isCorrect ? (
        <path d="M55 64C58 67 62 67 65 64" stroke="#475569" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : isWrong ? (
        <path d="M55 65C58 63 62 63 65 65" stroke="#475569" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : isThinking ? (
        <line x1="56" y1="64" x2="64" y2="64" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M56 64C58 65 62 65 64 64" stroke="#475569" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}
    </svg>
  )
}

export function MiraAvatar({ expression = 'neutral', size = 96, className = '' }: AvatarProps) {
  const isCorrect = expression === 'correct'
  const isWrong = expression === 'wrong'
  const isThinking = expression === 'thinking'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-2xl transition-transform duration-200 ${className}`}
      aria-label="Mira - Grandmaster Scholar Study Rival"
    >
      <defs>
        <linearGradient id="mira_bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#701a75" />
          <stop offset="1" stopColor="#a21caf" />
        </linearGradient>
        <linearGradient id="mira_hair" x1="30" y1="15" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e9d5ff" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
      </defs>

      {/* Background Badge */}
      <rect width="120" height="120" rx="24" fill="url(#mira_bg)" />
      <circle cx="60" cy="60" r="50" stroke="#f0abfc" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />

      {/* Shoulders / High-Collared White Lab Coat */}
      <path d="M22 120C24 95 38 86 60 86C82 86 96 95 98 120H22Z" fill="#ffffff" />
      <path d="M48 86L60 104L72 86H48Z" fill="#fdf4ff" />
      {/* Heart-Shaped Brooch / Pin */}
      <path
        d="M58 96C56 94 54 95 54 97C54 100 58 102 58 102C58 102 62 100 62 97C62 95 60 94 58 96Z"
        fill="#e11d48"
      />

      {/* Long Flowing Hair (Back) */}
      <path d="M24 75C20 45 30 20 60 18C90 20 100 45 96 75C94 95 86 115 86 115C86 115 76 72 60 72C44 72 34 115 34 115C34 115 26 95 24 75Z" fill="url(#mira_hair)" />

      {/* Neck */}
      <rect x="52" y="70" width="16" height="18" rx="4" fill="#fce7f3" />

      {/* Face & Delicate Ears */}
      <path d="M37 48C37 38 46 32 60 32C74 32 83 38 83 48C83 62 73 74 60 76C47 74 37 62 37 48Z" fill="#fff1f2" />
      <circle cx="36" cy="50" r="4.5" fill="#fce7f3" />
      <circle cx="84" cy="50" r="4.5" fill="#fce7f3" />

      {/* Silvery Bangs */}
      <path d="M34 40C40 28 50 24 60 24C70 24 80 28 86 40C80 34 72 32 60 34C48 32 40 34 34 40Z" fill="url(#mira_hair)" />
      <path d="M42 32L46 54L54 36L60 52L66 36L74 54L78 34" stroke="url(#mira_hair)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Eyes (Deep Violet/Amethyst) */}
      {isWrong ? (
        <g stroke="#86198f" strokeWidth="2.5" strokeLinecap="round">
          <line x1="45" y1="48" x2="53" y2="54" />
          <line x1="53" y1="48" x2="45" y2="54" />
          <line x1="67" y1="48" x2="75" y2="54" />
          <line x1="75" y1="48" x2="67" y2="54" />
        </g>
      ) : isCorrect ? (
        <g stroke="#701a75" strokeWidth="2.8" strokeLinecap="round" fill="none">
          <path d="M44 52C46 47 52 47 54 52" />
          <path d="M66 52C68 47 74 47 76 52" />
        </g>
      ) : (
        <g>
          <ellipse cx="49" cy="51" rx="4" ry="5.5" fill="#701a75" />
          <ellipse cx="71" cy="51" rx="4" ry="5.5" fill="#701a75" />
          <circle cx="50" cy="49" r="1.5" fill="#ffffff" />
          <circle cx="72" cy="49" r="1.5" fill="#ffffff" />
          <circle cx="48" cy="53" r="0.8" fill="#e879f9" />
          <circle cx="70" cy="53" r="0.8" fill="#e879f9" />
          {/* Elegant Eyebrows */}
          <path d="M43 43C46 41 51 41 55 43" stroke="#a21caf" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M77 43C74 41 69 41 65 43" stroke="#a21caf" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {/* Gentle Smile */}
      {isCorrect ? (
        <path d="M54 63C57 67 63 67 66 63" stroke="#be185d" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      ) : isWrong ? (
        <ellipse cx="60" cy="64" rx="2.5" ry="3.5" fill="#be185d" />
      ) : isThinking ? (
        <path d="M56 63C58 63 62 63 64 63" stroke="#9d174d" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path d="M55 63C57 65 63 65 65 63" stroke="#be185d" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      )}
    </svg>
  )
}

export function LearnerAvatar({ size = 96, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-2xl ${className}`}
      aria-label="Learner (You)"
    >
      <defs>
        <linearGradient id="learner_bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#learner_bg)" />
      <circle cx="60" cy="60" r="48" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="60" cy="46" r="18" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="2" />
      <path d="M30 102C32 82 44 72 60 72C76 72 88 82 90 102" fill="#10b981" fillOpacity="0.25" stroke="#10b981" strokeWidth="2" />
      <text x="60" y="52" fill="#34d399" fontSize="16" fontWeight="bold" textAnchor="middle">YOU</text>
    </svg>
  )
}
