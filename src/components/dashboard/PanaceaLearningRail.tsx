import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LIFE_LIBRARY, WEALTH_DOMAINS, type WealthDomain } from '../../lib/lifeWealthLibrary'
import { SKDI_ENTRIES } from '../../lib/skdiTherapyReference'
import { KISAH } from '../../lib/kisahKetahanan'
import { KUTIPAN_ATLET } from '../../lib/kutipanAtlet'
import { MOTIVATION } from '../../lib/studyContent'

const DAY = 864e5
function dayNumber() { return Math.floor(Date.now() / DAY) }

type Mode = 'library' | 'medicine' | 'story' | 'motivation' | 'education'

const MODES: { key: Mode; label: string; emoji: string }[] = [
  { key: 'library', label: 'Life library', emoji: '📚' },
  { key: 'medicine', label: 'Med study', emoji: '🩺' },
  { key: 'story', label: 'Stories', emoji: '🎬' },
  { key: 'motivation', label: 'Motivation', emoji: '✨' },
  { key: 'education', label: 'Health explained', emoji: '📗' },
]

function anotherLabel(index: number) {
  return `Another ${index + 1}`
}

export function PanaceaLearningRail() {
  const [mode, setMode] = useState<Mode>('library')
  const [domain, setDomain] = useState<WealthDomain>('Time')
  const [offset, setOffset] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const lifeReadings = useMemo(() => LIFE_LIBRARY.filter((item) => item.domain === domain), [domain])
  const life = lifeReadings[(dayNumber() + offset) % Math.max(1, lifeReadings.length)]
  const med = SKDI_ENTRIES[(dayNumber() * 11 + offset) % Math.max(1, SKDI_ENTRIES.length)]
  const story = KISAH[(dayNumber() * 5 + offset) % Math.max(1, KISAH.length)]

  const motivationCards = useMemo(() => [
    ...MOTIVATION.map((item) => ({ text: item.quote, by: item.context, type: 'Study' })),
    ...KUTIPAN_ATLET.map((item) => ({ text: item.quote, by: `${item.author} · ${item.feat}`, type: 'Sport' })),
  ], [])
  const motivation = motivationCards[(dayNumber() * 3 + offset) % Math.max(1, motivationCards.length)]

  function another() {
    setOffset((value) => value + 1)
    setRevealed(false)
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white/90 p-4 shadow-[0_12px_35px_rgba(25,45,55,.05)] dark:border-white/10 dark:bg-white/[.035] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.15em] text-neutral-500 dark:text-neutral-400">Learn every day</div>
          <h2 className="mt-1 text-[18px] font-black tracking-tight text-neutral-950 dark:text-white">Knowledge, medicine, stories and motivation</h2>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">One calm shelf instead of five separate dashboards. Switch the lens, read something useful, then keep moving.</p>
        </div>
        <Link to="/learn" className="rounded-full bg-neutral-950 px-3 py-2 text-[10px] font-black text-white dark:bg-white dark:text-neutral-950">Open Learn</Link>
      </div>

      <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {MODES.map((item) => (
          <button
            key={item.key}
            onClick={() => { setMode(item.key); setOffset(0); setRevealed(false) }}
            className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black transition ${mode === item.key ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200'}`}
          >
            {item.emoji} {item.label}
          </button>
        ))}
      </div>

      {mode === 'library' && life && (
        <div className="mt-3">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2">
            {WEALTH_DOMAINS.map((item) => (
              <button key={item} onClick={() => { setDomain(item); setOffset(0) }} className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-black ${domain === item ? 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-400/15 dark:text-fuchsia-100' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10'}`}>
                {item}
              </button>
            ))}
          </div>
          <article className="rounded-[24px] bg-gradient-to-br from-fuchsia-50 via-white to-violet-50 p-4 dark:from-fuchsia-400/[.08] dark:via-white/[.025] dark:to-violet-400/[.08]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase tracking-[.14em] text-fuchsia-700 dark:text-fuchsia-300">{life.domain} · {life.kind.replace('-', ' ')}</div>
                <h3 className="mt-1 text-[16px] font-black leading-tight text-neutral-950 dark:text-white">{life.title}</h3>
                <div className="mt-1 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">{life.by}{life.year ? ` · ${life.year}` : ''}</div>
              </div>
              <button onClick={another} className="shrink-0 rounded-full bg-white/80 px-3 py-2 text-[9px] font-black text-neutral-600 shadow-sm dark:bg-white/10 dark:text-neutral-200">Another ↻</button>
            </div>
            <p className="mt-3 text-[12px] font-medium leading-relaxed text-neutral-700 dark:text-neutral-200">{life.summary}</p>
            <div className="mt-3 rounded-2xl border border-fuchsia-200/70 bg-white/70 p-3 dark:border-fuchsia-400/15 dark:bg-white/[.04]">
              <div className="text-[9px] font-black uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300">Try this</div>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-neutral-700 dark:text-neutral-200">{life.tryThis}</p>
            </div>
            <div className="mt-3 text-[9px] font-black text-neutral-400">{LIFE_LIBRARY.length} original short guides across seven forms of wealth</div>
          </article>
        </div>
      )}

      {mode === 'medicine' && med && (
        <article className="mt-3 rounded-[24px] bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 dark:from-amber-400/[.08] dark:via-white/[.025] dark:to-orange-400/[.08]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-[.14em] text-amber-700 dark:text-amber-300">Daily recall · {med.system}</div>
              <h3 className="mt-1 text-[16px] font-black leading-tight text-neutral-950 dark:text-white">{med.diagnosis}</h3>
              {med.classification && <div className="mt-1 text-[10px] font-semibold text-neutral-500">{med.classification}</div>}
            </div>
            <button onClick={another} className="shrink-0 rounded-full bg-white/80 px-3 py-2 text-[9px] font-black text-neutral-600 shadow-sm dark:bg-white/10 dark:text-neutral-200">Another ↻</button>
          </div>
          {revealed ? (
            <p className="mt-3 rounded-2xl bg-white/70 p-3 text-[11px] font-medium leading-relaxed text-neutral-700 dark:bg-white/[.04] dark:text-neutral-200">{med.therapy}</p>
          ) : (
            <button onClick={() => setRevealed(true)} className="mt-3 rounded-full bg-amber-500 px-3.5 py-2 text-[10px] font-black text-white">Reveal management</button>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/med-study?bagian=therapy" className="rounded-full bg-neutral-950 px-3 py-2 text-[9px] font-black text-white dark:bg-white dark:text-neutral-950">Open Med Study Hub</Link>
            <span className="self-center text-[9px] font-bold text-neutral-400">{SKDI_ENTRIES.length} treatment-reference cards</span>
          </div>
        </article>
      )}

      {mode === 'story' && story && (
        <article className="mt-3 rounded-[24px] bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4 dark:from-sky-400/[.08] dark:via-white/[.025] dark:to-indigo-400/[.08]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.14em] text-sky-700 dark:text-sky-300">Resilience story · {story.field}</div>
              <h3 className="mt-1 text-[16px] font-black text-neutral-950 dark:text-white">{story.name}</h3>
            </div>
            <button onClick={another} className="rounded-full bg-white/80 px-3 py-2 text-[9px] font-black text-neutral-600 shadow-sm dark:bg-white/10 dark:text-neutral-200">Another ↻</button>
          </div>
          <p className="mt-3 text-[11px] font-medium leading-relaxed text-neutral-600 dark:text-neutral-300">{story.hardship}</p>
          <div className="mt-3 rounded-2xl bg-white/70 p-3 dark:bg-white/[.04]">
            <div className="text-[9px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">What to keep</div>
            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-neutral-800 dark:text-neutral-100">{story.lesson}</p>
          </div>
          <Link to="/resilience-stories" className="mt-3 inline-flex rounded-full bg-sky-600 px-3 py-2 text-[9px] font-black text-white">More stories</Link>
        </article>
      )}

      {mode === 'motivation' && motivation && (
        <article className="mt-3 rounded-[24px] bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4 dark:from-emerald-400/[.08] dark:via-white/[.025] dark:to-lime-400/[.08]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[9px] font-black uppercase tracking-[.14em] text-emerald-700 dark:text-emerald-300">{motivation.type} motivation</div>
            <button onClick={another} className="rounded-full bg-white/80 px-3 py-2 text-[9px] font-black text-neutral-600 shadow-sm dark:bg-white/10 dark:text-neutral-200">Another ↻</button>
          </div>
          <p className="mt-4 text-[16px] font-black leading-relaxed tracking-[-.02em] text-neutral-950 dark:text-white">“{motivation.text}”</p>
          <div className="mt-2 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">{motivation.by}</div>
          <div className="mt-3 flex gap-2">
            <Link to="/resilience-stories" className="rounded-full bg-emerald-600 px-3 py-2 text-[9px] font-black text-white">Stories</Link>
            <Link to="/ringkasan-karya" className="rounded-full bg-white px-3 py-2 text-[9px] font-black text-neutral-700 shadow-sm dark:bg-white/10 dark:text-neutral-200">Books & films</Link>
          </div>
        </article>
      )}

      {mode === 'education' && (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { to: '/health-explained', emoji: '📗', title: 'Health, explained', text: 'Everyday health questions in plain language before technical detail.' },
            { to: '/knowledge-bridge', emoji: '🧠', title: 'Explanation depth', text: 'Move from simple explanation to mechanism only when you want it.' },
            { to: '/med-study', emoji: '🩺', title: 'Clinical learning', text: 'Disease notes, treatment references, stations and recall tools.' },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="rounded-[22px] border border-neutral-200 bg-white p-4 active:scale-[.99] dark:border-white/10 dark:bg-white/[.04]">
              <div className="text-2xl" aria-hidden>{item.emoji}</div>
              <div className="mt-3 text-[13px] font-black text-neutral-950 dark:text-white">{item.title}</div>
              <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-neutral-600 dark:text-neutral-300">{item.text}</p>
              <div className="mt-3 text-[9px] font-black text-neutral-400">OPEN →</div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-3 text-[9px] font-semibold text-neutral-400" aria-hidden>{anotherLabel(offset)}</div>
    </section>
  )
}

export default PanaceaLearningRail
