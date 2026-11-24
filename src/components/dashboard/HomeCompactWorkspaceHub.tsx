import { useState } from 'react'
import { HomeLiveWidgetRail } from './HomeLiveWidgetRail'
import { RelWidgetRumah } from './RelWidgetRumah'
import { HomeCommandDeck } from './HomeCommandDeck'
import { foldsOpenForSession } from '../../shared/ui/foldsPreference'

type TabKey = 'live' | 'widgets' | 'deck'

const WORKSPACE_TABS: ReadonlyArray<{
  readonly key: TabKey
  readonly label: string
  readonly badge: string
}> = [
  { key: 'live', label: 'Live Vitals', badge: '33 signals' },
  { key: 'widgets', label: 'Widgets', badge: 'Custom board' },
  { key: 'deck', label: 'Search & Tools', badge: 'All features' },
]

/**
 * Unified compact hub consolidating Live Vitals, custom Widgets, and Search & Tools
 * into a single progressive-disclosure pill bar on Home so secondary modules never
 * bloat viewport height while staying one tap away.
 */
export function HomeCompactWorkspaceHub() {
  const [activeTab, setActiveTab] = useState<TabKey | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      return foldsOpenForSession(window.location.hash, window.sessionStorage) ? 'live' : null
    } catch {
      return foldsOpenForSession(window.location.hash, null) ? 'live' : null
    }
  })

  const toggleTab = (key: TabKey) => {
    setActiveTab((current) => (current === key ? null : key))
  }

  return (
    <section
      aria-label="Home workspace modules"
      data-home-compact-hub="true"
      className="mt-6 w-full rounded-[22px] border border-neutral-200/90 bg-white/95 p-3 shadow-sm transition-colors dark:border-white/12 dark:bg-[#0D1311]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div
          role="tablist"
          aria-label="Home quick modules"
          className="no-scrollbar flex flex-1 flex-wrap items-center gap-2"
        >
          {WORKSPACE_TABS.map((tab) => {
            const selected = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                data-pmd-native="true"
                aria-selected={selected}
                aria-controls={`home-hub-panel-${tab.key}`}
                id={`home-hub-tab-${tab.key}`}
                onClick={() => toggleTab(tab.key)}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50 dark:focus-visible:ring-emerald-400/50 ${
                  selected
                    ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm dark:border-emerald-400 dark:bg-emerald-500 dark:text-neutral-950'
                    : 'border-neutral-300 bg-neutral-100 text-neutral-900 hover:border-emerald-700/45 hover:bg-neutral-200/70 dark:border-white/15 dark:bg-white/[.06] dark:text-neutral-100 dark:hover:border-emerald-400/45 dark:hover:bg-white/[.12]'
                }`}
              >
                <span className="whitespace-nowrap">{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                    selected
                      ? 'bg-emerald-900/35 text-emerald-50 dark:bg-neutral-950/20 dark:text-neutral-950'
                      : 'bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:text-neutral-300'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            )
          })}
        </div>

        {activeTab !== null && (
          <button
            type="button"
            data-pmd-native="true"
            onClick={() => setActiveTab(null)}
            aria-label="Collapse module panel"
            className="inline-flex min-h-[40px] shrink-0 items-center rounded-full border border-neutral-300 bg-neutral-100 px-3 text-[11px] font-bold text-neutral-800 transition hover:bg-neutral-200 dark:border-white/15 dark:bg-white/[.06] dark:text-neutral-200 dark:hover:bg-white/[.12]"
          >
            Hide ▴
          </button>
        )}
      </div>

      {activeTab !== null && (
        <div
          role="tabpanel"
          id={`home-hub-panel-${activeTab}`}
          aria-labelledby={`home-hub-tab-${activeTab}`}
          className="mt-3 border-t border-neutral-200/80 pt-3 dark:border-white/10"
        >
          {activeTab === 'live' && <HomeLiveWidgetRail />}
          {activeTab === 'widgets' && <RelWidgetRumah />}
          {activeTab === 'deck' && <HomeCommandDeck />}
        </div>
      )}
    </section>
  )
}

export default HomeCompactWorkspaceHub
