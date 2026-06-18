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
      <g stroke={stroke} strokeWidth="74" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* stem + rounded U tail (heart bottom) */}
        <path d="M186 150 V326 Q186 404 256 404 Q322 404 322 330 V298" />
        {/* P bowl */}
        <path d="M186 150 H300 Q374 150 374 214 Q374 278 300 278 H214" />
      </g>
      {/* red cross */}
      <rect x="70" y="28" width="66" height="158" rx="13" fill="#FF3131" />
      <rect x="8" y="74" width="190" height="66" rx="13" fill="#FF3131" />
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
