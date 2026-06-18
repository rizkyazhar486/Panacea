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
        strokeWidth="84"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* stem + rounded U descender (heart bottom) */}
        <path d="M180 150 V322 Q180 402 252 402 Q324 402 324 322 V286" />
        {/* P bowl */}
        <path d="M180 150 H300 Q380 150 380 218 Q380 286 300 286 H216" />
      </g>
      {/* red cross */}
      <rect x="66" y="24" width="70" height="162" rx="14" fill="#FF3131" />
      <rect x="2" y="72" width="200" height="70" rx="14" fill="#FF3131" />
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
