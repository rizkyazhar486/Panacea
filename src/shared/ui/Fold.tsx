import { useMemo, type ReactNode } from 'react'
import './fold.css'

// Pembuka-tutup satu kata. Tertutup secara bawaan supaya layar utama hanya
// memuat satu proyeksi 3D dan satu baris kata per bagian; isinya tetap
// dirender penuh di DOM (details native) sehingga tidak ada kendali yang hilang.
// Tautan berparameter `folds=open` membuka semuanya (tautan bersama, uji QA).

/** `hash` berbentuk "#/body-explorer?folds=open". Murni agar bisa diuji. */
export function foldsForcedOpen(hash: string): boolean {
  const q = hash.indexOf('?')
  if (q < 0) return false
  return new URLSearchParams(hash.slice(q + 1)).get('folds') === 'open'
}

export interface FoldProps {
  /** Satu kata. */
  label: string
  children: ReactNode
  className?: string
}

export function Fold({ label, children, className = '' }: FoldProps) {
  const forced = useMemo(() => (typeof window === 'undefined' ? false : foldsForcedOpen(window.location.hash)), [])
  return (
    <details className={`fold ${className}`.trim()} open={forced || undefined}>
      <summary className="fold__summary">
        <span className="fold__word">{label}</span>
        <span className="fold__chevron" aria-hidden="true" />
      </summary>
      <div className="fold__body">{children}</div>
    </details>
  )
}
