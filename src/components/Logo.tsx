// Panaceamed.id brand mark — red cross + green "tP" letterform with U descender.

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
        strokeWidth="74"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M178 152 V340 Q178 404 242 404 Q306 404 306 340 V268" />
        <path d="M178 152 H300 Q366 152 366 214 Q366 276 300 276 H244" />
      </g>
      <rect x="74" y="34" width="64" height="150" rx="8" fill="#FF3131" />
      <rect x="14" y="78" width="184" height="64" rx="8" fill="#FF3131" />
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
