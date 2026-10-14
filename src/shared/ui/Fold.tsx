import { useMemo, type ReactNode } from 'react'
import './fold.css'
import { foldsOpenForSession, type SessionLike } from './foldsPreference'

// Pembuka-tutup satu kata. Tertutup secara bawaan supaya layar utama hanya
// memuat satu proyeksi 3D dan satu baris kata per bagian; isinya tetap
// dirender penuh di DOM (details native) sehingga tidak ada kendali yang hilang.
// Tautan berparameter `folds=open` membuka semuanya (tautan bersama, uji QA).

export interface FoldProps {
  /** Satu kata atau judul singkat. */
  label: string
  /** Subtitle atau deskripsi ringkas. */
  subtitle?: string
  children: ReactNode
  className?: string
  /** Buka saat konteks memintanya (mis. hasil pencarian harus terlihat). */
  defaultOpen?: boolean
}

export function Fold({ label, subtitle, children, className = '', defaultOpen = false }: FoldProps) {
  const forced = useMemo(() => {
    if (typeof window === 'undefined') return false
    let storage: SessionLike | null = null
    try { storage = window.sessionStorage } catch { storage = null }
    return foldsOpenForSession(window.location.hash, storage)
  }, [])
  return (
    <details className={`fold ${className}`.trim()} open={forced || defaultOpen || undefined}>
      <summary className="fold__summary">
        <div className="flex items-center gap-3 min-w-0">
          <span className="fold__word">{label}</span>
          {subtitle && (
            <span className="hidden sm:inline-block rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </span>
          )}
        </div>
        <span className="fold__chevron" aria-hidden="true" />
      </summary>
      <div className="fold__body">{children}</div>
    </details>
  )
}
