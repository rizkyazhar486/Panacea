import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useAdaptive } from './useAdaptive'

export interface AdaptiveDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  ariaLabel?: string
}

const MAX_WIDTH_MAP = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
}

export function AdaptiveDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
  className = '',
  ariaLabel,
}: AdaptiveDialogProps) {
  const { isDesktop } = useAdaptive()
  const contentRef = useRef<HTMLDivElement>(null)

  // Escape key listener untuk desktop & keyboard accessibility
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Cegah scroll di background body saat dialog terbuka
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  if (!isOpen || typeof document === 'undefined') return null

  // ── DESKTOP VIEW: CENTERED MODAL DIALOG ────────────────────────────
  if (isDesktop) {
    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || (typeof title === 'string' ? title : 'Dialog')}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
      >
        {/* Backdrop dengan blur */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Window */}
        <div
          ref={contentRef}
          className={`relative z-10 flex max-h-[90vh] w-full ${MAX_WIDTH_MAP[maxWidth]} flex-col overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl dark:border-white/15 dark:bg-neutral-900 menu-turun ${className}`}
        >
          {/* Header */}
          {(title || subtitle) && (
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4 dark:border-white/10">
              <div className="min-w-0 flex-1">
                {title && <h3 className="truncate text-base font-extrabold text-ink dark:text-white">{title}</h3>}
                {subtitle && <p className="truncate text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                aria-label="Tutup Dialog"
              >
                ✕
              </button>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 text-sm">{children}</div>

          {/* Footer (Actions) */}
          {footer && (
            <div className="flex items-center justify-end gap-2.5 border-t border-black/5 bg-neutral-50/70 px-6 py-3.5 dark:border-white/10 dark:bg-neutral-800/40">
              {footer}
            </div>
          )}
        </div>
      </div>,
      document.body
    )
  }

  // ── MOBILE VIEW: BOTTOM SHEET DRAWER ───────────────────────────────
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || (typeof title === 'string' ? title : 'Lembar Bawah')}
      className="fixed inset-0 z-[120] flex flex-col justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Card */}
      <div
        ref={contentRef}
        className={`relative z-10 flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[32px] border-t border-black/10 bg-white shadow-2xl dark:border-white/15 dark:bg-neutral-900 ${className}`}
        style={{ animation: 'geser-ke-atas 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Drag Pill Handle */}
        <div className="flex w-full justify-center pt-3 pb-1" onClick={onClose}>
          <span className="h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-3 dark:border-white/10">
            <div className="min-w-0 flex-1">
              {title && <h3 className="truncate text-sm font-extrabold text-ink dark:text-white">{title}</h3>}
              {subtitle && <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 text-xs">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-black/5 bg-neutral-50/70 p-4 pb-6 dark:border-white/10 dark:bg-neutral-800/40">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
