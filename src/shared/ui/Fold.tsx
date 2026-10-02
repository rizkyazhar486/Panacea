import { useMemo, type ReactNode } from 'react'
import './fold.css'
import { foldsOpenForSession, type SessionLike } from './foldsPreference'

// Pembuka-tutup satu kata. Tertutup secara bawaan supaya layar utama hanya
// memuat satu proyeksi 3D dan satu baris kata per bagian; isinya tetap
// dirender penuh di DOM (details native) sehingga tidak ada kendali yang hilang.
// Tautan berparameter `folds=open` membuka semuanya (tautan bersama, uji QA).

export interface FoldProps {
  /** Satu kata. */
  label: string
  children: ReactNode
  className?: string
  /** Buka saat konteks memintanya (mis. hasil pencarian harus terlihat). */
  defaultOpen?: boolean
}

export function Fold({ label, children, className = '', defaultOpen = false }: FoldProps) {
  const forced = useMemo(() => {
    if (typeof window === 'undefined') return false
    let storage: SessionLike | null = null
    try { storage = window.sessionStorage } catch { storage = null }
    return foldsOpenForSession(window.location.hash, storage)
  }, [])
  return (
    <details className={`fold ${className}`.trim()} open={forced || defaultOpen || undefined}>
      <summary className="fold__summary">
        <span className="fold__word">{label}</span>
        <span className="fold__chevron" aria-hidden="true" />
      </summary>
      <div className="fold__body">{children}</div>
    </details>
  )
}
