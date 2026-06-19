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
        hover ? 'transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,191,99,0.14)]' : ''
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
        {icon && <span className="text-brand">{icon}</span>}
        <div>
          <h2 className="text-lg font-bold leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
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
    primary: 'bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] text-white hover:brightness-105 shadow-sm',
    danger: 'bg-accent text-white hover:opacity-90 shadow-sm',
    outline: 'border border-brand text-brand-dark hover:bg-brand-50',
    ghost: 'text-neutral-600 hover:bg-neutral-100',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'
