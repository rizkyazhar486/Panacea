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
        className={`font-extrabold tracking-tight ${onDark ? 'text-white' : 'text-ink'}`}
        style={{ fontSize: size * 0.6 }}
      >
        Panacea
        <span className={onDark ? 'text-white' : 'text-brand'}>med</span>
        <span style={{ color: onDark ? '#ffd7d7' : '#FF3131' }}>.id</span>
      </span>
    </div>
  )
}
