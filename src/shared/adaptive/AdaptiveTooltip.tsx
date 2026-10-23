import { useState, useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useAdaptive } from './useAdaptive'

export interface AdaptiveTooltipProps {
  content: ReactNode
  title?: string
  children: ReactNode
  className?: string
}

export function AdaptiveTooltip({
  content,
  title,
  children,
  className = '',
}: AdaptiveTooltipProps) {
  const { isDesktop } = useAdaptive()
  const [buka, setBuka] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  const updatePos = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setCoords({
      top: rect.bottom + 6,
      left: Math.max(12, Math.min(rect.left + rect.width / 2 - 120, window.innerWidth - 260)),
    })
  }

  // Tutup saat klik di luar (khusus mobile tap popover)
  useEffect(() => {
    if (!buka || isDesktop) return
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setBuka(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [buka, isDesktop])

  // ── DESKTOP: Hover Floating Tooltip ────────────────────────────────
  if (isDesktop) {
    return (
      <span
        ref={triggerRef}
        onMouseEnter={() => { updatePos(); setBuka(true) }}
        onMouseLeave={() => setBuka(false)}
        className={`relative inline-flex items-center cursor-help ${className}`}
      >
        {children}
        {buka && typeof document !== 'undefined' && createPortal(
          <span
            role="tooltip"
            style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
            className="fixed z-[130] max-w-xs rounded-xl border border-black/10 bg-neutral-900/95 px-3 py-2 text-[11px] font-medium leading-relaxed text-white shadow-xl backdrop-blur-md dark:border-white/15 dark:bg-black/95 pointer-events-none menu-turun"
          >
            {title && <strong className="block font-bold text-emerald-400 mb-0.5">{title}</strong>}
            {content}
          </span>,
          document.body
        )}
      </span>
    )
  }

  // ── MOBILE: Tap Popover / Mini Info Sheet ──────────────────────────
  return (
    <>
      <span
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation()
          setBuka((prev) => !prev)
        }}
        className={`inline-flex items-center cursor-pointer active:scale-95 ${className}`}
        aria-haspopup="dialog"
        aria-expanded={buka}
      >
        {children}
      </span>

      {buka && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/40 p-3 backdrop-blur-xs">
          <div
            className="w-full max-w-sm rounded-3xl border border-black/10 bg-white p-5 shadow-2xl dark:border-white/15 dark:bg-neutral-900"
            style={{ animation: 'geser-ke-atas 0.18s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-2.5 dark:border-white/10">
              <span className="text-xs font-black text-ink dark:text-white">
                {title || 'Penjelasan Informasi Medis'}
              </span>
              <button
                type="button"
                onClick={() => setBuka(false)}
                className="grid h-7 w-7 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Tutup info"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              {content}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
