import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAdaptive } from './useAdaptive'

export type ToastTone = 'info' | 'success' | 'warning' | 'error'

export interface AdaptiveToastItem {
  id: string
  message: string
  title?: string
  tone?: ToastTone
  durationMs?: number
}

export interface AdaptiveToastProps {
  toasts: AdaptiveToastItem[]
  onDismiss: (id: string) => void
}

const TONE_STYLES: Record<ToastTone, { bg: string; text: string; icon: string }> = {
  info: {
    bg: 'bg-neutral-900 text-white dark:bg-black',
    text: 'text-neutral-200',
    icon: 'ℹ️',
  },
  success: {
    bg: 'bg-emerald-900/95 text-white dark:bg-emerald-950/95 border-emerald-500/40',
    text: 'text-emerald-100',
    icon: '✅',
  },
  warning: {
    bg: 'bg-amber-900/95 text-white dark:bg-amber-950/95 border-amber-500/40',
    text: 'text-amber-100',
    icon: '⚠️',
  },
  error: {
    bg: 'bg-rose-900/95 text-white dark:bg-rose-950/95 border-rose-500/40',
    text: 'text-rose-100',
    icon: '🚨',
  },
}

export function AdaptiveToast({ toasts, onDismiss }: AdaptiveToastProps) {
  const { isDesktop } = useAdaptive()

  if (typeof document === 'undefined' || toasts.length === 0) return null

  // ── DESKTOP: Top-Right Floating Toasts ─────────────────────────────
  if (isDesktop) {
    return createPortal(
      <div className="fixed top-20 right-6 z-[140] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const style = TONE_STYLES[t.tone || 'info']
          return (
            <div
              key={t.id}
              role="alert"
              style={{ animation: 'masuk-dari-bawah 0.2s ease-out' }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/10 p-4 shadow-2xl backdrop-blur-xl ${style.bg}`}
            >
              <span className="text-base select-none">{style.icon}</span>
              <div className="min-w-0 flex-1">
                {t.title && <h6 className="text-xs font-black">{t.title}</h6>}
                <p className={`text-xs ${style.text} mt-0.5 leading-relaxed`}>{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="grid h-6 w-6 place-items-center rounded-full text-white/50 hover:text-white hover:bg-white/10"
                aria-label="Tutup notifikasi"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>,
      document.body
    )
  }

  // ── MOBILE: Top Banner Toast (Dynamic Island style) ────────────────
  return createPortal(
    <div className="fixed top-3 inset-x-3 z-[140] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const style = TONE_STYLES[t.tone || 'info']
        return (
          <div
            key={t.id}
            role="alert"
            onClick={() => onDismiss(t.id)}
            style={{ animation: 'geser-ke-bawah 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border border-white/15 p-3.5 shadow-2xl backdrop-blur-xl active:scale-98 ${style.bg}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-base shrink-0">{style.icon}</span>
              <div className="min-w-0">
                {t.title && <h6 className="text-xs font-black truncate">{t.title}</h6>}
                <p className={`text-xs truncate ${style.text}`}>{t.message}</p>
              </div>
            </div>
            <span className="text-[10px] text-white/50 shrink-0 select-none">✕</span>
          </div>
        )
      })}
    </div>,
    document.body
  )
}
