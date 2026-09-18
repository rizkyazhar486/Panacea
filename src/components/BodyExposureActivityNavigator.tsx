import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BODY_EXPOSURE_ACTIVITIES,
  type BodyExposureActivity,
  type BodyExposureActivityKey,
} from '../lib/bodyExposureActivities'
import { kelompokTerpakai, kelompokUntuk } from '../lib/bodyExplorerTabGroups'

type ActivityContext = 'personal' | 'clinical' | 'explore'

const RECENT_KEY = 'pmd_body_exposure_recent_v2'

const DEFAULTS: Record<ActivityContext, readonly BodyExposureActivityKey[]> = {
  personal: ['layers', 'muscles', 'workout-sim', 'physiology'],
  clinical: ['cari', 'lokalisasi', 'diseases', 'drugs'],
  explore: ['layers', 'cari', 'physiology', 'diseases'],
}

function readRecent(): BodyExposureActivityKey[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    if (!Array.isArray(raw)) return []
    const valid = new Set(BODY_EXPOSURE_ACTIVITIES.map((activity) => activity.key))
    return raw.filter((key): key is BodyExposureActivityKey => typeof key === 'string' && valid.has(key as BodyExposureActivityKey)).slice(0, 4)
  } catch {
    return []
  }
}

function remember(key: BodyExposureActivityKey) {
  try {
    const recent = readRecent().filter((item) => item !== key)
    localStorage.setItem(RECENT_KEY, JSON.stringify([key, ...recent].slice(0, 4)))
  } catch {
    // Recent activity is progressive enhancement only.
  }
}

function ActivityControl({
  activity,
  active,
  onSelect,
}: {
  activity: BodyExposureActivity
  active: boolean
  onSelect?: (key: BodyExposureActivityKey) => void
}) {
  const cls = `flex min-h-[42px] items-center justify-between gap-2 rounded-[14px] border px-3 text-left text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
    active
      ? 'border-cyan-300/30 bg-cyan-300/[.11] text-white'
      : 'border-white/[.07] bg-white/[.025] text-white/58 hover:border-white/15 hover:bg-white/[.05] hover:text-white/85'
  }`
  const content = (
    <>
      <span className="truncate">{activity.label}</span>
      <span className="shrink-0 text-[10px] text-white/24" aria-hidden>›</span>
    </>
  )

  if (onSelect) {
    return (
      <button
        type="button"
        className={cls}
        aria-pressed={active}
        onClick={() => {
          remember(activity.key)
          onSelect(activity.key)
        }}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      className={cls}
      aria-current={active ? 'page' : undefined}
      to={`/fitness-hub?view=body-exposure&panel=${activity.key}`}
      onClick={() => remember(activity.key)}
    >
      {content}
    </Link>
  )
}

export function BodyExposureActivityNavigator({
  context = 'explore',
  activePanel,
  onSelectPanel,
  className = '',
}: {
  context?: ActivityContext
  activePanel?: BodyExposureActivityKey
  onSelectPanel?: (key: BodyExposureActivityKey) => void
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const groups = useMemo(() => kelompokTerpakai(BODY_EXPOSURE_ACTIVITIES.map((activity) => activity.key)), [])
  const [group, setGroup] = useState(groups[0] ?? 'Explore')
  const [recent, setRecent] = useState<BodyExposureActivityKey[]>(() => readRecent())

  const quick = useMemo(() => {
    const keys = [...recent, ...DEFAULTS[context]]
    const unique = keys.filter((key, index) => keys.indexOf(key) === index).slice(0, 4)
    return unique
      .map((key) => BODY_EXPOSURE_ACTIVITIES.find((activity) => activity.key === key))
      .filter((activity): activity is BodyExposureActivity => Boolean(activity))
  }, [context, recent])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle) {
      return BODY_EXPOSURE_ACTIVITIES.filter((activity) =>
        `${activity.label} ${activity.key} ${activity.keywords}`.toLowerCase().includes(needle),
      )
    }
    return BODY_EXPOSURE_ACTIVITIES.filter((activity) => kelompokUntuk(activity.key) === group)
  }, [group, query])

  const choose = (key: BodyExposureActivityKey) => {
    remember(key)
    setRecent(readRecent())
    onSelectPanel?.(key)
    if (onSelectPanel) setExpanded(false)
  }

  return (
    <section className={`rounded-[20px] border border-white/[.08] bg-black/35 p-2.5 backdrop-blur-xl ${className}`} aria-label="Body Exposure activities">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-black uppercase tracking-[.16em] text-white/35">Activities</div>
          <div className="truncate text-[11px] font-bold text-white/72">
            {BODY_EXPOSURE_ACTIVITIES.length} tools · shown only when needed
          </div>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="min-h-[38px] shrink-0 rounded-full border border-white/[.09] bg-white/[.04] px-3 text-[10px] font-black text-white/65 transition hover:bg-white/[.08] hover:text-white"
        >
          {expanded ? 'Close' : 'All activities'}
        </button>
      </div>

      {!expanded && (
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {quick.map((activity) => (
            <div key={activity.key} className="min-w-[132px] max-w-[190px] flex-1">
              <ActivityControl
                activity={activity}
                active={activePanel === activity.key}
                onSelect={onSelectPanel ? choose : undefined}
              />
            </div>
          ))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2.5">
              <label className="flex min-h-[42px] items-center gap-2 rounded-[14px] border border-white/[.08] bg-black/30 px-3 focus-within:border-cyan-300/25">
                <span aria-hidden className="text-white/28">⌕</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find anatomy, physiology, disease, surgery…"
                  className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold text-white outline-none placeholder:text-white/25"
                />
              </label>
            </div>

            {!query && (
              <div className="no-scrollbar mt-2 flex gap-1 overflow-x-auto pb-0.5" role="tablist" aria-label="Activity groups">
                {groups.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={group === item}
                    onClick={() => setGroup(item)}
                    className={`min-h-[34px] shrink-0 rounded-full px-3 text-[9px] font-black uppercase tracking-[.08em] transition ${
                      group === item ? 'bg-white text-black' : 'border border-white/[.07] text-white/38 hover:text-white/70'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-2">
              {visible.map((activity) => (
                <ActivityControl
                  key={activity.key}
                  activity={activity}
                  active={activePanel === activity.key}
                  onSelect={onSelectPanel ? choose : undefined}
                />
              ))}
              {visible.length === 0 && (
                <div className="col-span-full rounded-[14px] border border-white/[.06] px-3 py-4 text-center text-[10px] font-semibold text-white/35">
                  No matching Body Exposure activity.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default BodyExposureActivityNavigator
