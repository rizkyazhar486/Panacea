import { useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass } from '../components/ui'
import { IconRun } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Fitness Hub — one searchable index for the training/performance suite,
// same pattern as Wellness Hub and Calculator Hub. Lets the Fitness sidebar
// group stay short (a few daily-use entries) without losing reachability for
// the rest. Pure catalog, no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Tool { to: string; name: string; what: string; kw: string; tag: string }

const GROUPS: { title: string; emoji: string; tools: Tool[] }[] = [
  {
    title: 'Daily Training',
    emoji: '🏃',
    tools: [
      { to: '/athlete', name: 'Athlete', what: 'Your training dashboard — HR zones, load, GPS runs', kw: 'athlete dashboard heart rate zones gps run', tag: 'Core' },
      { to: '/workout', name: 'Workout', what: 'Guided sessions with movement-form demo videos', kw: 'workout exercise session movement demo', tag: 'Core' },
      { to: '/training-plan', name: 'AI Program', what: 'A structured, adaptive training plan', kw: 'training plan program ai schedule periodization', tag: 'Core' },
      { to: '/fitness-test', name: 'Fitness Test', what: 'AI form & posture check from a photo of your movement', kw: 'fitness test form posture ai photo injury risk', tag: 'AI' },
    ],
  },
  {
    title: 'Recovery & Readiness',
    emoji: '🔋',
    tools: [
      { to: '/readiness', name: 'Recovery & Strain', what: "Is today a push day or a rest day?", kw: 'recovery strain readiness hrv fatigue', tag: 'Recovery' },
      { to: '/assessment', name: 'Initial Assessment', what: 'Baseline fitness & movement screening', kw: 'initial assessment baseline screening onboarding', tag: 'Core' },
    ],
  },
  {
    title: 'Body & Performance Data',
    emoji: '📊',
    tools: [
      { to: '/body', name: 'Body Composition', what: 'InBody-style visual breakdown of your composition', kw: 'body composition inbody fat muscle scale', tag: 'Data' },
      { to: '/lab', name: 'Performance Lab', what: 'Load management, VO2max, and performance metrics', kw: 'performance lab vo2max load management', tag: 'Data' },
      { to: '/sports-science', name: 'Science & KPIs', what: 'The evidence and key metrics behind your numbers', kw: 'sports science kpi evidence metrics', tag: 'Data' },
      { to: '/organ-vitality', name: 'Anti-Aging & Organs', what: 'System-by-system vitality snapshot', kw: 'organ vitality anti-aging longevity', tag: 'Longevity' },
    ],
  },
  {
    title: 'Programs & Scores',
    emoji: '🏆',
    tools: [
      { to: '/shape-forming', name: 'Shape Forming', what: 'A structured body-recomposition program', kw: 'shape forming body recomposition program', tag: 'Program' },
      { to: '/sports-scores', name: 'Live Scores', what: 'Real-time scores for your favorite teams & leagues', kw: 'live scores sports scoreboard football f1 motogp', tag: 'Live' },
    ],
  },
]

export function FitnessHub() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!q) return GROUPS
    return GROUPS.map((g) => ({
      ...g,
      tools: g.tools.filter((t) => (t.name + ' ' + t.what + ' ' + t.kw).toLowerCase().includes(q)),
    })).filter((g) => g.tools.length > 0)
  }, [q])

  const total = GROUPS.reduce((s, g) => s + g.tools.length, 0)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={20} />} title="Fitness Hub" subtitle={`${total} training & performance tools, searchable by what you need`} />
        <input
          className={`${inputClass} mt-3`}
          placeholder="Search: recovery, body composition, VO2max, plan…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </Card>

      {filtered.length === 0 && (
        <Card className="!p-5 text-center text-sm text-neutral-400">
          Nothing matches "{query}" — try "recovery", "plan", or "data".
        </Card>
      )}

      {filtered.map((g) => (
        <Card key={g.title} className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{g.emoji} {g.title}</div>
          <div className="mt-3 space-y-1.5">
            {g.tools.map((t) => (
              <a key={t.to} href={`#${t.to}`} className="group flex items-start justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 transition hover:bg-brand/10 dark:bg-white/5">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-ink group-hover:text-brand-dark dark:text-white">{t.name}</div>
                  <div className="text-[12px] leading-snug text-neutral-500">{t.what}</div>
                </div>
                <span className="mt-1 shrink-0 text-neutral-300 transition group-hover:text-brand-dark">→</span>
              </a>
            ))}
          </div>
        </Card>
      ))}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Training guidance here is educational, not a substitute for individualized coaching —
        especially if you have an existing injury or medical condition.
      </div>
    </div>
  )
}

export default FitnessHub
