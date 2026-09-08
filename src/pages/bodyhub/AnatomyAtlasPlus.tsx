import { useEffect, useMemo, useState } from 'react'
import type { AnatomyLayer } from '../../components/Body3D'
import {
  ATLAS_PLUS_ENTRIES,
  ATLAS_PLUS_REVIEW,
  ATLAS_PLUS_SOURCE_IDS,
  atlasPlusById,
  atlasPlusSearch,
  type AtlasPlusEntry,
} from './anatomyAtlasPlusData'

type AtlasMode = 'explore' | 'compare' | 'quiz' | 'breath'
type BreathView = 'mechanics' | 'airway' | 'alveolus'
type BreathPhaseKey = 'inspiration' | 'end-inspiration' | 'expiration'

interface Props {
  onFocusEntry: (entry: AtlasPlusEntry) => void
  onIsolateEntry: (entry: AtlasPlusEntry) => void
  onCompareEntries: (entries: AtlasPlusEntry[]) => void
  onCrossSection: (entry: AtlasPlusEntry) => void
  onOpenPhysiology: () => void
}

const BREATH_PHASES: Array<{
  key: BreathPhaseKey
  label: string
  diaphragm: string
  ribCage: string
  airflow: string
  pressure: string
  summary: string
}> = [
  {
    key: 'inspiration',
    label: 'Inspiration',
    diaphragm: 'Contracts and descends',
    ribCage: 'Thoracic dimensions increase',
    airflow: 'Air moves toward the alveoli',
    pressure: 'Alveolar pressure becomes slightly lower than atmospheric pressure',
    summary: 'Expansion of the thoracic cavity increases lung volume through pleural coupling, creating the pressure gradient that draws air inward.',
  },
  {
    key: 'end-inspiration',
    label: 'End inspiration',
    diaphragm: 'Remains shortened briefly',
    ribCage: 'Thoracic volume is near its cycle maximum',
    airflow: 'Net flow approaches zero at the phase transition',
    pressure: 'Alveolar and atmospheric pressures approach equilibrium',
    summary: 'At the transition between inspiration and expiration, airflow falls toward zero even though lung volume remains elevated.',
  },
  {
    key: 'expiration',
    label: 'Expiration',
    diaphragm: 'Relaxes and rises',
    ribCage: 'Thoracic dimensions return toward resting position',
    airflow: 'Air moves toward the mouth and nose',
    pressure: 'Elastic recoil creates the outward pressure gradient in quiet breathing',
    summary: 'Quiet expiration is driven mainly by elastic recoil as inspiratory muscles relax; forced expiration recruits additional muscles.',
  },
]

const AIRWAY_PATH = [
  'Nose / mouth',
  'Pharynx',
  'Larynx',
  'Trachea',
  'Main bronchi',
  'Bronchioles',
  'Respiratory bronchioles',
  'Alveolar ducts',
  'Alveoli',
]

const MICRO_EXCHANGE = [
  { title: 'Ventilation', text: 'Fresh gas reaches the distal airspaces through the conducting and respiratory airways.' },
  { title: 'Diffusion', text: 'Oxygen and carbon dioxide cross the thin alveolar-capillary interface down partial-pressure gradients.' },
  { title: 'Perfusion', text: 'Pulmonary capillary blood brings carbon dioxide to the exchange surface and carries oxygen away.' },
  { title: 'Surfactant', text: 'Type II alveolar cells produce surfactant, reducing surface tension at the air-liquid interface.' },
]

function initialAtlasId(): string {
  if (typeof window === 'undefined') return 'pan-anat-lungs'
  const query = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''
  const requested = new URLSearchParams(query).get('atlas')
  return atlasPlusById(requested)?.id ?? 'pan-anat-lungs'
}

function SourceBoundary() {
  return (
    <div className="rounded-xl border border-amber-300/50 bg-amber-50/60 p-2.5 text-[10.5px] leading-relaxed text-amber-950 dark:border-amber-300/20 dark:bg-amber-300/5 dark:text-amber-100">
      <div className="font-black">Reference atlas · source checked · human review pending</div>
      <div className="mt-0.5">
        Stable Panacea IDs are authoritative only inside this app. TA2 mapping remains blank until explicitly verified.
        This surface is educational reference material, not patient-specific anatomy, diagnosis, or procedural guidance.
      </div>
      <div className="mt-1 font-mono text-[9.5px] opacity-70">sources: {ATLAS_PLUS_SOURCE_IDS.join(' · ')}</div>
    </div>
  )
}

function EntryCard({ entry, active, onPick }: { entry: AtlasPlusEntry; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`w-full rounded-xl border p-2.5 text-left transition active:scale-[0.99] ${
        active
          ? 'border-brand bg-brand/10'
          : 'border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.03]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block text-sm font-black text-ink dark:text-white">{entry.label}</span>
          <span className="mt-0.5 block text-[10.5px] text-neutral-500">{entry.system} · {entry.region}</span>
        </span>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[9px] text-neutral-500 dark:bg-white/5">
          {entry.id.replace('pan-anat-', '')}
        </span>
      </div>
    </button>
  )
}

function EntryDetail({
  entry,
  onFocus,
  onIsolate,
  onCrossSection,
}: {
  entry: AtlasPlusEntry
  onFocus: () => void
  onIsolate: () => void
  onCrossSection: () => void
}) {
  const [detail, setDetail] = useState<'function' | 'micro' | 'relations'>('function')

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="text-base font-black text-ink dark:text-white">{entry.label}</h3>
          <span className="rounded-full border border-neutral-200 px-2 py-0.5 font-mono text-[9px] text-neutral-500 dark:border-white/10">{entry.id}</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          {entry.system} · {entry.region} · {entry.scale} · TA2 mapping: {entry.ta2 ?? 'pending verification'}
        </p>
        <p className="mt-1 text-[10px] text-neutral-400">Aliases: {entry.aliases.join(', ') || '—'}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={onFocus} className="min-h-[34px] rounded-full bg-brand px-3 text-[11px] font-black text-white">Focus in 3D</button>
        <button type="button" onClick={onIsolate} className="min-h-[34px] rounded-full border border-brand px-3 text-[11px] font-black text-brand">Isolate layer</button>
        <button type="button" onClick={onCrossSection} className="min-h-[34px] rounded-full border border-neutral-200 px-3 text-[11px] font-black text-neutral-600 dark:border-white/10 dark:text-neutral-300">CT cross-section</button>
      </div>

      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
        {([
          ['function', 'Function'],
          ['micro', 'Microscopic'],
          ['relations', 'Relations'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setDetail(key)}
            className={`min-h-[32px] flex-1 rounded-lg text-[10.5px] font-bold ${detail === key ? 'bg-white shadow-sm dark:bg-white/10' : 'text-neutral-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {detail === 'function' && <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{entry.functionSummary}</p>}
      {detail === 'micro' && <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{entry.microSummary}</p>}
      {detail === 'relations' && (
        <div className="flex flex-wrap gap-1.5">
          {entry.relationships.map((relation) => (
            <span key={relation} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10.5px] font-semibold text-neutral-600 dark:bg-white/5 dark:text-neutral-300">{relation}</span>
          ))}
        </div>
      )}

      {import.meta.env.DEV && (
        <details className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/[0.03]">
          <summary className="cursor-pointer text-[10px] font-black uppercase tracking-wide text-neutral-500">Authoring identity</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[9px] leading-relaxed text-neutral-500">{JSON.stringify({ id: entry.id, keywords: entry.keywords, layer: entry.layer, ta2: entry.ta2 }, null, 2)}</pre>
        </details>
      )}
    </div>
  )
}

function BreathMechanicsFigure({ phase }: { phase: BreathPhaseKey }) {
  const inspiration = phase === 'inspiration'
  const expiration = phase === 'expiration'
  const lungScale = inspiration ? 1.06 : expiration ? 0.96 : 1.03
  const diaphragmY = inspiration ? 22 : expiration ? 4 : 16
  const arrow = expiration ? '↑ outward flow' : inspiration ? '↓ inward flow' : '↔ transition'

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-200/60 bg-gradient-to-b from-sky-50 to-white p-3 dark:border-sky-300/10 dark:from-sky-300/5 dark:to-transparent">
      <svg viewBox="0 0 320 245" role="img" aria-label={`Breathing mechanics schematic: ${phase}`} className="mx-auto h-auto w-full max-w-[360px]">
        <path d="M88 30 Q160 3 232 30 L252 170 Q160 208 68 170 Z" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="6" />
        <g transform={`translate(160 112) scale(${lungScale}) translate(-160 -112)`}>
          <path d="M151 52 C115 42 88 67 85 112 C82 154 103 178 145 174 C154 142 155 94 151 52 Z" fill="rgba(56,189,248,0.30)" stroke="rgba(14,116,144,0.75)" strokeWidth="2" />
          <path d="M169 52 C205 42 232 67 235 112 C238 154 217 178 175 174 C166 142 165 94 169 52 Z" fill="rgba(56,189,248,0.30)" stroke="rgba(14,116,144,0.75)" strokeWidth="2" />
        </g>
        <path d="M160 18 L160 64 M160 64 L137 82 M160 64 L183 82" fill="none" stroke="rgba(34,197,94,0.9)" strokeWidth="7" strokeLinecap="round" />
        <path d={`M78 ${186 + diaphragmY} Q160 ${160 + diaphragmY} 242 ${186 + diaphragmY}`} fill="none" stroke="rgba(239,68,68,0.85)" strokeWidth="7" strokeLinecap="round" />
        <text x="160" y="230" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.65">diaphragm</text>
        <text x="160" y="42" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.65">{arrow}</text>
      </svg>
      <p className="text-center text-[10px] leading-relaxed text-neutral-500">Mechanics schematic only. The source Body3D anatomy is not deformed or presented as a patient-specific simulation.</p>
    </div>
  )
}

function BreathAtlas({ onFocusLungs, onFocusDiaphragm, onOpenPhysiology }: { onFocusLungs: () => void; onFocusDiaphragm: () => void; onOpenPhysiology: () => void }) {
  const [view, setView] = useState<BreathView>('mechanics')
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const phase = BREATH_PHASES[phaseIndex]

  useEffect(() => {
    if (!playing) return
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return
    const timer = window.setInterval(() => setPhaseIndex((index) => (index + 1) % BREATH_PHASES.length), 1600)
    return () => window.clearInterval(timer)
  }, [playing])

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-sky-200/60 bg-sky-50/50 p-3 dark:border-sky-300/10 dark:bg-sky-300/5">
        <div className="text-sm font-black text-ink dark:text-white">Breath Atlas · anatomy → mechanics → gas exchange</div>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Follow one breath from upper airway to alveolar-capillary exchange while keeping the real Body3D atlas dimensionally stable.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" onClick={onFocusLungs} className="min-h-[32px] rounded-full bg-brand px-3 text-[10.5px] font-black text-white">Focus lungs in 3D</button>
          <button type="button" onClick={onFocusDiaphragm} className="min-h-[32px] rounded-full border border-brand px-3 text-[10.5px] font-black text-brand">Focus diaphragm</button>
          <button type="button" onClick={onOpenPhysiology} className="min-h-[32px] rounded-full border border-neutral-200 px-3 text-[10.5px] font-black text-neutral-600 dark:border-white/10 dark:text-neutral-300">Open full physiology</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
        {([
          ['mechanics', 'Mechanics'],
          ['airway', 'Airway path'],
          ['alveolus', 'Alveolus'],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setView(key)} className={`min-h-[34px] rounded-lg text-[10.5px] font-bold ${view === key ? 'bg-white shadow-sm dark:bg-white/10' : 'text-neutral-500'}`}>{label}</button>
        ))}
      </div>

      {view === 'mechanics' && (
        <div className="space-y-3">
          <BreathMechanicsFigure phase={phase.key} />
          <div className="flex flex-wrap items-center gap-1.5">
            {BREATH_PHASES.map((item, index) => (
              <button key={item.key} type="button" onClick={() => { setPlaying(false); setPhaseIndex(index) }} className={`min-h-[32px] rounded-full border px-2.5 text-[10.5px] font-bold ${phase.key === item.key ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}>{item.label}</button>
            ))}
            <button type="button" onClick={() => setPlaying((value) => !value)} aria-pressed={playing} className="min-h-[32px] rounded-full border border-sky-300 px-2.5 text-[10.5px] font-black text-sky-700 dark:text-sky-300">{playing ? 'Pause cycle' : 'Play cycle'}</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ['Diaphragm', phase.diaphragm],
              ['Rib cage / thorax', phase.ribCage],
              ['Airflow', phase.airflow],
              ['Pressure relationship', phase.pressure],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/[0.03]">
                <div className="text-[9.5px] font-black uppercase tracking-wide text-neutral-400">{label}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{value}</div>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{phase.summary}</p>
        </div>
      )}

      {view === 'airway' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            {AIRWAY_PATH.map((segment, index) => (
              <span key={segment} className="contents">
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10.5px] font-bold text-sky-800 dark:border-sky-300/10 dark:bg-sky-300/5 dark:text-sky-300">{segment}</span>
                {index < AIRWAY_PATH.length - 1 && <span className="text-neutral-300">→</span>}
              </span>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-500">
            The conducting zone conditions and transports gas; the respiratory zone begins where airway walls participate directly in gas exchange.
          </p>
        </div>
      )}

      {view === 'alveolus' && (
        <div className="grid gap-2 sm:grid-cols-2">
          {MICRO_EXCHANGE.map((item) => (
            <div key={item.title} className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
              <div className="text-[11px] font-black text-ink dark:text-white">{item.title}</div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function QuizMode({ onFocus }: { onFocus: (entry: AtlasPlusEntry) => void }) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const target = ATLAS_PLUS_ENTRIES[index % ATLAS_PLUS_ENTRIES.length]
  const choices = useMemo(() => {
    const offsets = [0, 5, 11, 17]
    const unique = offsets.map((offset) => ATLAS_PLUS_ENTRIES[(index + offset) % ATLAS_PLUS_ENTRIES.length])
    return Array.from(new Map(unique.map((entry) => [entry.id, entry])).values()).slice(0, 4)
  }, [index])
  const correct = answer === target.id

  function next() {
    setAnswer(null)
    setIndex((value) => (value + 1) % ATLAS_PLUS_ENTRIES.length)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-300/10 dark:bg-violet-300/5">
        <div className="text-[10px] font-black uppercase tracking-wide text-violet-700 dark:text-violet-300">Structure challenge</div>
        <p className="mt-1 text-sm font-bold leading-relaxed text-ink dark:text-white">Which structure best matches this reference function?</p>
        <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{target.functionSummary}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {choices.map((entry) => {
          const selected = answer === entry.id
          const isCorrect = answer !== null && entry.id === target.id
          return (
            <button
              key={entry.id}
              type="button"
              disabled={answer !== null}
              onClick={() => setAnswer(entry.id)}
              className={`min-h-11 rounded-xl border px-3 py-2 text-left text-xs font-bold ${
                isCorrect ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-300/10' : selected ? 'border-rose-300 bg-rose-50 dark:bg-rose-300/10' : 'border-neutral-200 dark:border-white/10'
              }`}
            >
              {entry.label}
            </button>
          )
        })}
      </div>
      {answer && (
        <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/[0.03]">
          <p className="text-[11px] font-bold text-ink dark:text-white">{correct ? 'Correct.' : `Answer: ${target.label}.`}</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">{target.microSummary}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => onFocus(target)} className="min-h-[32px] rounded-full border border-brand px-2.5 text-[10.5px] font-black text-brand">Show in 3D</button>
            <button type="button" onClick={next} className="min-h-[32px] rounded-full bg-brand px-2.5 text-[10.5px] font-black text-white">Next challenge</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AnatomyAtlasPlus({ onFocusEntry, onIsolateEntry, onCompareEntries, onCrossSection, onOpenPhysiology }: Props) {
  const [mode, setMode] = useState<AtlasMode>('explore')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(initialAtlasId)
  const [compareA, setCompareA] = useState('pan-anat-lungs')
  const [compareB, setCompareB] = useState('pan-anat-heart')
  const [shareStatus, setShareStatus] = useState('')

  const selected = atlasPlusById(selectedId) ?? ATLAS_PLUS_ENTRIES[0]
  const results = useMemo(() => atlasPlusSearch(query), [query])
  const left = atlasPlusById(compareA) ?? ATLAS_PLUS_ENTRIES[0]
  const right = atlasPlusById(compareB) ?? ATLAS_PLUS_ENTRIES[1]

  function pick(entry: AtlasPlusEntry) {
    setSelectedId(entry.id)
    onFocusEntry(entry)
  }

  async function share(entry: AtlasPlusEntry) {
    if (typeof window === 'undefined') return
    const base = `${window.location.origin}${window.location.pathname}#/body-explorer`
    const url = `${base}?atlas=${encodeURIComponent(entry.id)}&mode=atlas-plus`
    try {
      await navigator.clipboard.writeText(url)
      setShareStatus('Study link copied')
    } catch {
      setShareStatus(url)
    }
  }

  const lungs = atlasPlusById('pan-anat-lungs')!
  const diaphragm = atlasPlusById('pan-anat-diaphragm')!

  return (
    <div data-anatomy-atlas-plus="reference-only" className="space-y-3">
      <SourceBoundary />

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
        {([
          ['explore', 'Explore'],
          ['compare', 'Compare'],
          ['quiz', 'Quiz'],
          ['breath', 'Breath Atlas'],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setMode(key)} className={`min-h-[34px] shrink-0 rounded-lg px-3 text-[10.5px] font-black ${mode === key ? 'bg-white shadow-sm dark:bg-white/10' : 'text-neutral-500'}`}>{label}</button>
        ))}
      </div>

      {mode === 'explore' && (
        <div className="space-y-3">
          <div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search organs, structures, aliases, systems or regions…"
              aria-label="Search Atlas Plus"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
            />
            <p className="mt-1 text-[10px] text-neutral-400">{results.length} / {ATLAS_PLUS_ENTRIES.length} curated Atlas+ identities · separate from the 2,587+ raw mesh-name search.</p>
          </div>

          <div className="grid max-h-64 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {results.map((entry) => <EntryCard key={entry.id} entry={entry} active={entry.id === selected.id} onPick={() => pick(entry)} />)}
          </div>

          <EntryDetail entry={selected} onFocus={() => onFocusEntry(selected)} onIsolate={() => onIsolateEntry(selected)} onCrossSection={() => onCrossSection(selected)} />

          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => share(selected)} className="min-h-[32px] rounded-full border border-neutral-200 px-2.5 text-[10.5px] font-black text-neutral-600 dark:border-white/10 dark:text-neutral-300">Share this atlas state</button>
            {shareStatus && <span role="status" className="text-[10px] text-neutral-400">{shareStatus}</span>}
          </div>
        </div>
      )}

      {mode === 'compare' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[['A', compareA, setCompareA], ['B', compareB, setCompareB]].map(([slot, value, setter]) => (
              <label key={String(slot)} className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                Structure {String(slot)}
                <select value={String(value)} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-2 text-xs font-bold normal-case tracking-normal dark:border-white/10 dark:bg-neutral-900">
                  {ATLAS_PLUS_ENTRIES.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
                </select>
              </label>
            ))}
          </div>
          <button type="button" onClick={() => onCompareEntries([left, right])} className="min-h-[34px] rounded-full bg-brand px-3 text-[10.5px] font-black text-white">Show both in Body3D</button>
          <div className="grid gap-2 sm:grid-cols-2">
            {[left, right].map((entry) => (
              <div key={entry.id} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
                <div className="text-sm font-black text-ink dark:text-white">{entry.label}</div>
                <div className="mt-0.5 text-[10px] text-neutral-400">{entry.system} · {entry.region}</div>
                <p className="mt-2 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{entry.functionSummary}</p>
                <p className="mt-2 text-[10.5px] leading-relaxed text-neutral-500">Micro: {entry.microSummary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'quiz' && <QuizMode onFocus={onFocusEntry} />}

      {mode === 'breath' && (
        <BreathAtlas
          onFocusLungs={() => onFocusEntry(lungs)}
          onFocusDiaphragm={() => onFocusEntry(diaphragm)}
          onOpenPhysiology={onOpenPhysiology}
        />
      )}

      <div className="rounded-xl bg-neutral-50 p-2.5 text-[10px] leading-relaxed text-neutral-500 dark:bg-white/[0.03]">
        Contract: review={ATLAS_PLUS_REVIEW.humanReview} · patient-specific={String(ATLAS_PLUS_REVIEW.patientSpecific)} · clinical-decision-use={String(ATLAS_PLUS_REVIEW.clinicalDecisionUse)}.
        Atlas+ orchestrates existing Panacea geometry; it never substitutes a different mesh when a requested structure is absent.
      </div>
    </div>
  )
}

export default AnatomyAtlasPlus
