import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type RailGroup = 'Today' | 'Body' | 'Clinical' | 'Learn'

type RailItem = {
  group: RailGroup
  to: string
  eyebrow: string
  title: string
  note: string
  glyph: string
}

const GROUPS: RailGroup[] = ['Today', 'Body', 'Clinical', 'Learn']

const ITEMS: RailItem[] = [
  { group: 'Today', to: '/harian', eyebrow: 'Log', title: 'Daily check-in', note: 'Record sleep, mood, hydration and today’s health context.', glyph: '＋' },
  { group: 'Today', to: '/latihan', eyebrow: 'Move', title: 'Training', note: 'Start a session, review zones and keep progression visible.', glyph: '↗' },
  { group: 'Today', to: '/readiness', eyebrow: 'Recover', title: 'Readiness', note: 'Open recovery inputs and recent readiness context.', glyph: '◌' },
  { group: 'Today', to: '/nutrition', eyebrow: 'Fuel', title: 'Nutrition', note: 'Food, macros, hydration and intake in one place.', glyph: '◎' },
  { group: 'Body', to: '/body-explorer', eyebrow: 'Explore', title: 'Body Exposure', note: 'Open the interactive whole-body anatomy workspace.', glyph: '◉' },
  { group: 'Body', to: '/fitness-hub?view=body', eyebrow: 'Measure', title: 'Your Body', note: 'Body composition, trends and personal body context.', glyph: '◇' },
  { group: 'Body', to: '/fitness-hub?view=recovery', eyebrow: 'Restore', title: 'Sleep & Recovery', note: 'Connect sleep, fatigue and recovery signals.', glyph: '☾' },
  { group: 'Body', to: '/fitness-hub?view=health-data', eyebrow: 'Connect', title: 'Health Data', note: 'Bring recorded and wearable health data into one workspace.', glyph: '⌁' },
  { group: 'Clinical', to: '/chatbot', eyebrow: 'Ask', title: 'Panacea Assistant', note: 'Start from a symptom, question or clinical problem.', glyph: '✦' },
  { group: 'Clinical', to: '/emr', eyebrow: 'Document', title: 'AI-EMR', note: 'Structured clinical records and documentation tools.', glyph: '▤' },
  { group: 'Clinical', to: '/emergency', eyebrow: 'Urgent', title: 'Emergency', note: 'Open emergency information and your health card fast.', glyph: '!' },
  { group: 'Clinical', to: '/second-opinion', eyebrow: 'Review', title: 'Second Opinion', note: 'Organize another perspective around available clinical information.', glyph: '⇄' },
  { group: 'Learn', to: '/learn?t=body', eyebrow: 'See', title: 'Visual Medicine', note: 'Study anatomy, physiology and disease through the body.', glyph: '◫' },
  { group: 'Learn', to: '/learn?t=cases', eyebrow: 'Practice', title: 'Cases & OSCE', note: 'Jump into case-based and exam-oriented practice.', glyph: '✓' },
  { group: 'Learn', to: '/learn?t=imaging', eyebrow: 'Image', title: 'Radiology', note: 'Connect medical imaging with anatomy and clinical context.', glyph: '⌗' },
  { group: 'Learn', to: '/learn?t=drugs', eyebrow: 'Mechanism', title: 'Drugs & Herbal', note: 'Open drug, interaction and mechanism references.', glyph: '✚' },
]

export function HomeInteractiveRail() {
  const [group, setGroup] = useState<RailGroup>('Today')
  const visible = useMemo(() => ITEMS.filter((item) => item.group === group), [group])

  return (
    <section className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-[#050b09] p-3.5 shadow-[0_20px_65px_rgba(0,0,0,.30)] sm:p-5" aria-labelledby="home-interactive-rail-title">
      <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.22em] text-emerald-300">Panacea Live Rail · interactive</div>
          <h2 id="home-interactive-rail-title" className="mt-1 text-[19px] font-black tracking-[-.025em] text-white sm:text-[22px]">Swipe. Tap. Go.</h2>
          <p className="mt-1 max-w-2xl text-[11px] font-semibold leading-relaxed text-emerald-50/60">A fast, scrollable layer for the actions and workspaces you use most.</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-emerald-300/20 bg-emerald-300/10 text-lg text-emerald-200" aria-hidden>✦</span>
      </div>

      <div className="no-scrollbar relative mt-3 flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain pb-1" role="tablist" aria-label="Panacea Live Rail categories">
        {GROUPS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={group === item}
            onClick={() => setGroup(item)}
            className={`min-h-[40px] shrink-0 snap-start rounded-[14px] border px-3.5 text-[10px] font-black transition active:scale-[.98] ${group === item ? 'border-emerald-300/50 bg-emerald-400 text-black' : 'border-white/10 bg-white/[.035] text-neutral-300 hover:border-emerald-300/20 hover:bg-emerald-300/[.07] hover:text-white'}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="no-scrollbar relative mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain pb-1" aria-live="polite">
        {visible.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group min-h-[150px] w-[76vw] max-w-[290px] shrink-0 snap-start rounded-[21px] border border-white/10 bg-gradient-to-br from-white/[.075] to-white/[.025] p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/30 hover:from-emerald-300/[.10] hover:to-white/[.03] active:scale-[.985] sm:w-[250px]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-[13px] border border-white/10 bg-black/25 text-[15px] font-black text-emerald-200">{item.glyph}</span>
              <span className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-300/70">{item.eyebrow}</span>
            </div>
            <div className="mt-4 text-[15px] font-black tracking-[-.02em] text-white">{item.title}</div>
            <p className="mt-1.5 line-clamp-2 text-[10.5px] font-medium leading-relaxed text-neutral-400">{item.note}</p>
            <div className="mt-3 text-[10px] font-black text-emerald-300 transition group-hover:translate-x-0.5">Open →</div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HomeInteractiveRail
