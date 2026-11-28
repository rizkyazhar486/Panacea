// Panaceamed.id brand mark — uses the official logo artwork (public/logo-mark.png).
// On dark/green backgrounds we place the mark on a white rounded chip so the red
// cross and green monogram stay legible.
const logoUrl = import.meta.env.BASE_URL + 'logo-mark.png'

export function LogoMark({
  size = 40,
  className = '',
  dark = false,
}: {
  size?: number
  className?: string
  dark?: boolean
}) {
  if (dark) {
    return (
      <span
        className={`inline-grid place-items-center rounded-xl bg-white ${className}`}
        style={{ width: size, height: size }}
      >
        <img src={logoUrl} alt="Panaceamed.id" style={{ width: size * 0.82, height: size * 0.82 }} />
      </span>
    )
  }
  return <img src={logoUrl} alt="Panaceamed.id" width={size} height={size} className={className} style={{ objectFit: 'contain' }} />
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
        className={`tracking-tight font-bold ${onDark ? 'text-white' : 'text-neutral-950 dark:text-white'}`}
        style={{ fontSize: size * 0.6, fontFamily: 'var(--font-wordmark)' }}
      >
        Panacea
        <span className={onDark ? 'text-emerald-300' : 'text-[#047857] dark:text-[#34d399]'}>med</span>
        <span className={onDark ? 'text-rose-300' : 'text-[#dc2626] dark:text-[#f87171]'}>.id</span>
      </span>
    </div>
  )
}
