import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useAdaptive } from './useAdaptive'

export interface AdaptiveFormActionProps {
  primaryLabel: string
  onPrimaryClick: () => void
  isSubmitting?: boolean
  disabled?: boolean
  secondaryLabel?: string
  onSecondaryClick?: () => void
  statusText?: string
  shortcutHint?: string
  children?: ReactNode
  className?: string
}

export function AdaptiveFormAction({
  primaryLabel,
  onPrimaryClick,
  isSubmitting = false,
  disabled = false,
  secondaryLabel,
  onSecondaryClick,
  statusText,
  shortcutHint = '⌘S',
  children,
  className = '',
}: AdaptiveFormActionProps) {
  const { isDesktop } = useAdaptive()

  // ── DESKTOP: Inline Form Action / Header Bar Actions ───────────────
  if (isDesktop) {
    return (
      <div className={`flex items-center justify-between border-t border-black/5 bg-transparent pt-4 dark:border-white/10 ${className}`}>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          {statusText && <span>{statusText}</span>}
          {children}
        </div>

        <div className="flex items-center gap-3">
          {secondaryLabel && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onSecondaryClick}
              className="rounded-xl border border-black/10 px-4 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40 dark:border-white/15 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {secondaryLabel}
            </button>
          )}

          <button
            type="button"
            disabled={disabled || isSubmitting}
            onClick={onPrimaryClick}
            className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-xs font-extrabold text-brand-dark shadow-sm transition hover:brightness-105 active:scale-98 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-500 dark:text-neutral-950"
          >
            {isSubmitting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-dark/20 border-t-brand-dark" />
                <span>Menyimpan…</span>
              </>
            ) : (
              <>
                <span>{primaryLabel}</span>
                {shortcutHint && (
                  <span className="rounded bg-black/10 px-1.5 py-0.2 text-[9px] font-bold text-neutral-800">
                    {shortcutHint}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // ── MOBILE: Sticky Bottom Bar (Menempel di Bawah Layar) ────────────
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[110] border-t border-black/10 bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/15 dark:bg-neutral-900/95">
      <div className="mx-auto flex max-w-lg items-center gap-2.5">
        {secondaryLabel && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSecondaryClick}
            className="min-h-[44px] flex-1 rounded-2xl border border-black/10 bg-neutral-50 py-2.5 text-xs font-bold text-neutral-700 transition active:scale-95 disabled:opacity-40 dark:border-white/15 dark:bg-neutral-800 dark:text-neutral-200"
          >
            {secondaryLabel}
          </button>
        )}

        <button
          type="button"
          disabled={disabled || isSubmitting}
          onClick={onPrimaryClick}
          className="flex min-h-[44px] flex-[2] items-center justify-center gap-2 rounded-2xl bg-brand py-2.5 text-xs font-black text-brand-dark shadow-md transition active:scale-98 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-500 dark:text-neutral-950"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-dark/20 border-t-brand-dark" />
              <span>Menyimpan data…</span>
            </>
          ) : (
            <span>{primaryLabel}</span>
          )}
        </button>
      </div>
    </div>,
    document.body
  )
}
