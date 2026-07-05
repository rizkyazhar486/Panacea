import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  pad = true,
  hover = false,
}: {
  children: ReactNode
  className?: string
  pad?: boolean
  hover?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-white/50 bg-white/80 shadow-[0_8px_30px_rgba(12,20,16,0.05)] ring-1 ring-black/[0.03] backdrop-blur-xl ${
        hover ? 'transition-all duration-300 hover:-translate-y-1 hover:border-brand/20 hover:shadow-[0_18px_40px_rgba(0,191,99,0.16)]' : ''
      } ${pad ? 'p-5' : ''} ${className}`}
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
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-dark">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold leading-tight tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-neutral-500">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

const toneMap: Record<string, string> = {
  low: 'bg-amber-100 text-amber-700',
  normal: 'bg-brand-100 text-brand-dark',
  high: 'bg-red-100 text-accent',
  critical: 'bg-accent text-white',
  neutral: 'bg-neutral-100 text-neutral-600',
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
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneMap[tone]}`}
    >
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
  const styles: Record<string, string> = {
    primary:
      'bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] text-white shadow-[0_6px_16px_rgba(0,191,99,0.28)] hover:shadow-[0_8px_22px_rgba(0,191,99,0.36)] hover:brightness-105',
    danger: 'bg-accent text-white shadow-[0_6px_16px_rgba(255,49,49,0.25)] hover:opacity-90',
    outline: 'border border-brand/40 text-brand-dark hover:border-brand hover:bg-brand-50',
    ghost: 'text-neutral-600 hover:bg-neutral-100',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 ${styles[variant]} ${className}`}
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
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  )
}

// Shimmering placeholder for content that's loading from the network.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-neutral-200 ${className}`} />
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export const inputClass =
  'w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors duration-200 placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-brand/20'
