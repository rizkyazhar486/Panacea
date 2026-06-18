// Panaceamed.id brand mark — red cross + green "tP" monogram (P bowl + U/heart
// tail). Faithful vector reproduction of the brand artwork; `dark` renders the
// monogram white for use on green/dark backgrounds.

export function LogoMark({
  size = 40,
  className = '',
  dark = false,
}: {
  size?: number
  className?: string
  dark?: boolean
}) {
  const green = dark ? '#FFFFFF' : '#00BF63'
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
      {/* Green "tP" monogram — thick rounded strokes */}
      <g stroke={green} strokeWidth="82" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* stem + rounded U tail */}
        <path d="M168 150 V322 Q168 398 244 398 Q318 398 318 322 V300" />
        {/* P bowl */}
        <path d="M168 150 H298 Q392 150 392 226 Q392 300 298 300 H224" />
      </g>
      {/* Red cross (bold plus, top-left) */}
      <rect x="62" y="28" width="72" height="158" rx="6" fill="#FF3131" />
      <rect x="6" y="74" width="192" height="66" rx="6" fill="#FF3131" />
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
