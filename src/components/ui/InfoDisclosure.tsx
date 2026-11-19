import type { ReactNode } from 'react'

export interface InfoDisclosureProps {
  readonly label?: string
  readonly title: string
  readonly badge?: string
  readonly children: ReactNode
  readonly className?: string
  readonly align?: 'left' | 'right'
}

/**
 * Minimal (i) info-icon popover containment.
 * Keeps long explanations, mechanisms, equations, citations, and truthClass
 * details out of the primary canvas while remaining 1-tap keyboard accessible.
 */
export function InfoDisclosure({
  label = 'More info',
  title,
  badge,
  children,
  className = '',
  align = 'right',
}: InfoDisclosureProps) {
  return (
    <details className={`relative inline-block ${className}`}>
      <summary
        aria-label={label}
        title={title}
        className="inline-flex min-h-[44px] min-w-[44px] lg:min-h-[32px] lg:min-w-[32px] cursor-pointer list-none items-center justify-center rounded-full"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-400 bg-neutral-100 font-mono text-xs font-bold text-neutral-800 transition hover:border-cyan-600 hover:text-ink dark:border-white/20 dark:bg-white/[0.08] dark:text-slate-100 dark:hover:border-cyan-400/60 dark:hover:text-white"
        >
          i
        </span>
      </summary>
      <div
        role="note"
        className={`absolute top-11 z-40 w-[min(320px,82vw)] rounded-2xl border border-neutral-200 bg-white/95 p-3.5 text-left text-xs leading-relaxed text-neutral-800 shadow-xl backdrop-blur-md dark:border-white/15 dark:bg-[#090d14]/95 dark:text-slate-100 ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink dark:text-cyan-300">
            {title}
          </span>
          {badge && (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-amber-700 dark:text-amber-300">
              {badge}
            </span>
          )}
        </div>
        <div className="space-y-1.5">{children}</div>
      </div>
    </details>
  )
}

export default InfoDisclosure
