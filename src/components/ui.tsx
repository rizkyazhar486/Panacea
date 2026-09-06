import type { ReactNode } from 'react'
import { rupaRute } from '../lib/warnaRute'
import { Prosa } from './Prosa'

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
      className={`kaca relative overflow-hidden rounded-[28px] border border-white/65 bg-white/70 shadow-[0_18px_55px_rgba(15,35,45,.075)] ring-1 ring-black/[.025] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[.045] dark:shadow-[0_22px_70px_rgba(0,0,0,.26)] dark:ring-white/[.025] ${pad ? 'p-5 sm:p-6' : ''} ${className}`}
    >
      {children}
    </div>
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
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3.5">
        {icon && (
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-[inset_0_1px_rgba(255,255,255,.7),0_8px_24px_rgba(20,40,50,.08)] ${w.bg} ${w.teks}`}>
            {icon}
          </span>
        )}
        <div className="min-w-0 pt-0.5">
          <h2 className="flex items-start gap-2.5 text-[clamp(1.2rem,2.3vw,1.65rem)] font-black leading-[1.08] tracking-[-.025em] text-ink dark:text-white">
            <span aria-hidden className={`mt-1 h-5 w-1.5 shrink-0 rounded-full ${w.garis}`} />
            <span>{title}</span>
          </h2>
          {subtitle && (
            <Prosa kelas="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </Prosa>
          )}
        </div>
      </div>
      {right && <div className="no-scrollbar flex max-w-full shrink-0 items-center gap-2 overflow-x-auto sm:justify-end">{right}</div>}
    </div>
  )
}

const toneMap: Record<string, string> = {
  low: 'bg-amber-100 text-amber-700',
  normal: 'bg-brand-100 text-brand-dark',
  high: 'bg-red-100 text-accent',
  critical: 'bg-accent text-white',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300',
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
    ghost: 'text-neutral-600 dark:text-neutral-300',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`liquid-glass-btn liquid-glass-btn--${variant} inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black tracking-[-.01em] shadow-sm transition duration-200 hover:-translate-y-0.5 active:scale-[.98] active:translate-y-0 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 ${textColor[variant]} ${className}`}
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
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
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
  'w-full min-h-[46px] rounded-2xl border border-black/[.08] bg-white/80 px-3.5 py-2.5 text-sm text-ink shadow-[inset_0_1px_rgba(255,255,255,.8),0_6px_20px_rgba(20,40,50,.035)] outline-none backdrop-blur-xl transition duration-200 placeholder:text-neutral-400 hover:border-black/[.12] focus:border-brand/55 focus:ring-4 focus:ring-brand/10 dark:border-white/10 dark:bg-white/[.055] dark:text-white dark:placeholder:text-white/30'
