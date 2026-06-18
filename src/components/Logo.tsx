// Panaceamed.id brand mark — red cross + green "P" letterform whose stem
// curves into a U descender (white negative space forms the bowl).

export function LogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 440 440"
      fill="none"
      className={className}
      aria-label="Panaceamed.id"
      role="img"
    >
      <g
        stroke="#00BF63"
        strokeWidth="80"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* stem + U descender */}
        <path d="M182 150 V322 Q182 398 250 398 Q318 398 318 322 V300" />
        {/* P bowl */}
        <path d="M182 150 H298 Q374 150 374 218 Q374 286 298 286 H214" />
      </g>
      {/* red cross */}
      <rect x="70" y="30" width="66" height="156" rx="10" fill="#FF3131" />
      <rect x="8" y="76" width="190" height="66" rx="10" fill="#FF3131" />
    </svg>
  )
}

export function Wordmark({
  size = 40,
  onDark = false,
}: {
  size?: number
  onDark?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span
        className="font-extrabold tracking-tight"
        style={{ fontSize: size * 0.6, color: onDark ? '#fff' : '#0c1410' }}
      >
        Panacea
        <span style={{ color: onDark ? '#fff' : '#00BF63' }}>med</span>
        <span style={{ color: '#FF3131' }}>.id</span>
      </span>
    </div>
  )
}
