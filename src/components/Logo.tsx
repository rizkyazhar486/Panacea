// Panaceamed.id brand mark — red cross + "tP" letterform (P bowl + heart U tail).
// `dark` renders the letterform white for use on green/dark backgrounds.

export function LogoMark({
  size = 40,
  className = '',
  dark = false,
}: {
  size?: number
  className?: string
  dark?: boolean
}) {
  const stroke = dark ? '#FFFFFF' : '#00BF63'
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
      <g stroke={stroke} strokeWidth="80" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* stem + rounded U tail (heart bottom) */}
        <path d="M172 150 V330 Q172 402 242 402 Q312 402 312 330 V300" />
        {/* P bowl */}
        <path d="M172 150 H300 Q374 150 374 216 Q374 282 300 282 H224" />
      </g>
      {/* red cross (bold plus, top-left) */}
      <rect x="62" y="24" width="78" height="168" rx="12" fill="#FF3131" />
      <rect x="4" y="72" width="198" height="70" rx="12" fill="#FF3131" />
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
      <LogoMark size={size} dark={onDark} />
      <span
        className="font-extrabold tracking-tight"
        style={{ fontSize: size * 0.6, color: onDark ? '#fff' : '#0c1410' }}
      >
        Panacea
        <span style={{ color: onDark ? '#fff' : '#00BF63' }}>med</span>
        <span style={{ color: onDark ? '#ffd7d7' : '#FF3131' }}>.id</span>
      </span>
    </div>
  )
}
