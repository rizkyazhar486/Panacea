import type { ReactNode } from 'react'
import { rupaRute } from '../lib/warnaRute'
import { Prosa } from './Prosa'
import '../styles/readability.css'

export function Card({
  children,
  className = '',
  pad = true,
}: {
  children: ReactNode
  className?: string
  pad?: boolean
}) {
  return (
    <div
      className={`kaca relative overflow-hidden rounded-[22px] border border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,35,45,.06)] ring-1 ring-black/[.025] backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1012]/96 dark:shadow-[0_14px_40px_rgba(0,0,0,.22)] dark:ring-white/[.025] ${pad ? 'p-4 sm:p-5' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

function BodyExplorerStartHere() {
  return (
    <details
      data-testid="body-explorer-start-here"
      className="mt-2 overflow-hidden rounded-[16px] border border-brand/18 bg-brand/[.035] dark:border-brand/20 dark:bg-brand/[.055]"
    >
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2 text-ink marker:hidden dark:text-white">
        <span className="min-w-0">
          <span className="block text-xs font-black">How to use</span>
          <span className="block truncate text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">Tap · rotate · zoom · inspect</span>
        </span>
        <span aria-hidden className="shrink-0 text-[10px] font-black text-brand">＋</span>
      </summary>
      <ol className="grid border-t border-brand/12 sm:grid-cols-3">
        {[
          ['1', 'Select', 'Tap a body structure or use Find.'],
          ['2', 'Inspect', 'Rotate and zoom while keeping Anatomy as the anchor.'],
          ['3', 'Deepen', 'Open physiology, imaging, disease or molecular detail only when needed.'],
        ].map(([step, title, copy]) => (
          <li key={step} className="min-w-0 border-b border-brand/10 px-3.5 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
            <div className="text-[9px] font-black uppercase tracking-[.12em] text-brand">{step} · {title}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">{copy}</p>
          </li>
        ))}
      </ol>
    </details>
  )
}

export function SectionTitle({
  icon,
  title,
  subtitle,
  right,
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  const w = rupaRute()
  const showBodyExplorerGuide = title === 'Body Explorer'
  return (
    <div className="mb-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] shadow-[inset_0_1px_rgba(255,255,255,.55),0_6px_18px_rgba(20,40,50,.06)] ${w.bg} ${w.teks}`}>
              {icon}
            </span>
          )}
          <div className="min-w-0 pt-0.5">
            <h2 className="flex items-start gap-2 text-[clamp(1.08rem,2.1vw,1.48rem)] font-black leading-[1.1] tracking-[-.022em] text-ink dark:text-white">
              <span aria-hidden className={`mt-1 h-4 w-1 shrink-0 rounded-full ${w.garis}`} />
              <span>{title}</span>
            </h2>
            {subtitle && (
              <Prosa kelas="mt-1 max-w-3xl text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                {subtitle}
              </Prosa>
            )}
          </div>
        </div>
        {right && <div className="no-scrollbar flex max-w-full shrink-0 items-center gap-2 overflow-x-auto sm:justify-end">{right}</div>}
      </div>
      {showBodyExplorerGuide && <BodyExplorerStartHere />}
    </div>
  )
}

const toneMap: Record<string, string> = {
  low: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
  normal: 'bg-brand-100 text-brand-dark',
  high: 'bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-200',
  critical: 'bg-accent text-white',
  neutral: 'bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200',
  brand: 'bg-brand-100 text-brand-dark',
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'low' | 'normal' | 'high' | 'critical' | 'neutral' | 'brand'
}) {
  return (
    <span className={`inline-flex min-h-[26px] items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${toneMap[tone]}`}>
      {children}
    </span>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  const textColor: Record<string, string> = {
    primary: 'text-white',
    danger: 'text-white',
    outline: 'text-brand-dark dark:text-emerald-300',
    ghost: 'text-neutral-700 dark:text-neutral-200',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`liquid-glass-btn liquid-glass-btn--${variant} inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-4 py-2 text-[13px] font-black tracking-[-.01em] shadow-sm transition duration-200 hover:-translate-y-0.5 active:scale-[.98] active:translate-y-0 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 ${textColor[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  children,
}: {
  label: ReactNode
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-neutral-600 dark:text-neutral-300">
        {label}
      </span>
      {children}
    </label>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-200/80 dark:bg-white/10 ${className}`} />
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-neutral-50/80 px-3.5 py-3 dark:bg-white/[.035]">
          <Skeleton className="h-10 w-10 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export const inputClass =
  'w-full min-h-[44px] rounded-[14px] border border-black/[.10] bg-white/95 px-3.5 py-2 text-sm text-ink shadow-[inset_0_1px_rgba(255,255,255,.7),0_4px_14px_rgba(20,40,50,.03)] outline-none backdrop-blur-lg transition duration-200 placeholder:text-neutral-500 hover:border-black/[.16] focus:border-brand/55 focus:ring-4 focus:ring-brand/10 dark:border-white/12 dark:bg-[#101214]/96 dark:text-white dark:placeholder:text-neutral-500'