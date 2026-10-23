import { useRef, type ReactNode } from 'react'
import { useAdaptive } from './useAdaptive'

export interface TabItem<T extends string = string> {
  id: T
  label: string
  icon?: ReactNode
  badge?: string | number
  disabled?: boolean
}

export interface AdaptiveTabsProps<T extends string = string> {
  tabs: TabItem<T>[]
  activeTab: T
  onChange: (tabId: T) => void
  className?: string
  ariaLabel?: string
}

export function AdaptiveTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  ariaLabel = 'Bilah Tab Navigasi',
}: AdaptiveTabsProps<T>) {
  const { isDesktop } = useAdaptive()
  const scrollRef = useRef<HTMLDivElement>(null)

  // ── DESKTOP: Expanded Horizontal Tabs Berjajar Penuh ───────────────
  if (isDesktop) {
    return (
      <nav
        aria-label={ariaLabel}
        className={`flex items-center gap-1 border-b border-black/5 bg-transparent p-1 dark:border-white/10 ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-neutral-100 text-brand-dark shadow-xs dark:bg-neutral-800 dark:text-emerald-400'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200'
              } ${tab.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-brand/20 text-brand-dark dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-black/5 text-neutral-500 dark:bg-white/10 dark:text-neutral-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute -bottom-1 inset-x-3 h-0.5 rounded-full bg-brand dark:bg-emerald-400" />
              )}
            </button>
          )
        })}
      </nav>
    )
  }

  // ── MOBILE: Horizontal Scrolling Pills dengan Masking Tepi Pudar ───
  return (
    <div className={`relative w-full ${className}`}>
      {/* Scrollable track */}
      <div
        ref={scrollRef}
        role="tablist"
        aria-label={ariaLabel}
        className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto px-1 py-1.5 scroll-smooth"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                isActive
                  ? 'bg-brand text-brand-dark shadow-xs dark:bg-emerald-500 dark:text-neutral-950'
                  : 'border border-black/10 bg-white text-neutral-600 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300'
              } ${tab.disabled ? 'opacity-40' : ''}`}
            >
              {tab.icon && <span className="shrink-0 text-sm">{tab.icon}</span>}
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                    isActive
                      ? 'bg-black/15 text-neutral-900'
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
