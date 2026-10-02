import { useState, type ReactNode } from 'react'

/**
 * Shared progressive-disclosure prose.
 *
 * Primary Panacea surfaces are visual-first: long copy stays available, but
 * the scrolling state defaults to one concise line plus an info control.
 */
const BATAS_KATA = 16

export function Prosa({ children, kelas, baris = 1 }: {
  children?: ReactNode
  kelas?: string
  baris?: number
}) {
  const [buka, setBuka] = useState(false)
  const teks = typeof children === 'string' ? children : ''
  const panjang = teks ? teks.trim().split(/\s+/).length > BATAS_KATA : false

  if (!panjang) return <p className={kelas}>{children}</p>

  return (
    <p className={`relative min-w-0 pr-8 ${kelas ?? ''}`}>
      <span
        style={buka ? undefined : {
          display: '-webkit-box',
          WebkitLineClamp: baris,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {children}
      </span>
      <button
        type="button"
        onClick={() => setBuka((value) => !value)}
        aria-expanded={buka}
        aria-label={buka ? 'Hide context' : 'Show context'}
        title={buka ? 'Hide context' : 'More context'}
        className={`absolute right-0 top-0 grid h-7 w-7 place-items-center rounded-full border text-[10px] font-black leading-none transition ${
          buka
            ? 'border-brand/35 bg-brand/15 text-brand-dark dark:text-emerald-200'
            : 'border-black/10 bg-black/[.035] text-neutral-500 hover:text-ink dark:border-white/10 dark:bg-white/[.05] dark:text-neutral-300 dark:hover:text-white'
        }`}
      >
        i
      </button>
    </p>
  )
}
