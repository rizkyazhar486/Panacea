import { createContext, useContext, useMemo, type ReactNode } from 'react'
import './fold.css'
import { foldsOpenForSession, type SessionLike } from './foldsPreference'

// Pembuka-tutup satu kata. Tertutup secara bawaan supaya layar utama hanya
// memuat satu proyeksi 3D dan satu baris kata per bagian; isinya tetap
// dirender penuh di DOM (details native) sehingga tidak ada kendali yang hilang.
// Tautan berparameter `folds=open` membuka semuanya (tautan bersama, uji QA).

export const FoldGroupContext = createContext<string | undefined>(undefined)

export interface FoldGroupProps {
  name: string
  children: ReactNode
}

export function FoldGroup({ name, children }: FoldGroupProps) {
  return <FoldGroupContext.Provider value={name}>{children}</FoldGroupContext.Provider>
}

export interface FoldProps {
  /** Satu kata atau judul singkat. */
  label: string
  /** Subtitle atau deskripsi ringkas. */
  subtitle?: string
  children: ReactNode
  className?: string
  /** Buka saat konteks memintanya (mis. hasil pencarian harus terlihat). */
  defaultOpen?: boolean
  /** Nama grup eksklusif: hanya 1 lipatan yang terbuka dalam satu nama grup. */
  name?: string
}

export function Fold({ label, subtitle, children, className = '', defaultOpen = false, name: directName }: FoldProps) {
  const groupName = useContext(FoldGroupContext)
  const name = directName ?? groupName

  const forced = useMemo(() => {
    if (typeof window === 'undefined') return false
    let storage: SessionLike | null = null
    try { storage = window.sessionStorage } catch { storage = null }
    return foldsOpenForSession(window.location.hash, storage)
  }, [])
  return (
    <details
      className={`fold ${className}`.trim()}
      name={name}
      open={forced || defaultOpen || undefined}
      onToggle={(e) => {
        const target = e.currentTarget
        if (target.open && name && typeof document !== 'undefined') {
          document.querySelectorAll<HTMLDetailsElement>(`details[name="${name}"]`).forEach((d) => {
            if (d !== target && d.open) {
              d.open = false
            }
          })
        }
      }}
    >
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
