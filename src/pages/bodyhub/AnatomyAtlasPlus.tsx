import { useMemo, useState } from 'react'
import {
  ATLAS_PLUS_ENTRIES,
  ATLAS_PLUS_REVIEW,
  ATLAS_PLUS_SOURCE_IDS,
  atlasPlusById,
  atlasPlusSearch,
  type AtlasPlusEntry,
} from './anatomyAtlasPlusData'

type AtlasMode = 'explore' | 'compare' | 'quiz'

interface Props {
  onFocusEntry: (entry: AtlasPlusEntry) => void
  onIsolateEntry: (entry: AtlasPlusEntry) => void
  onCompareEntries: (entries: AtlasPlusEntry[]) => void
  onCrossSection: (entry: AtlasPlusEntry) => void
}

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

export function AnatomyAtlasPlus({ onFocusEntry, onIsolateEntry, onCompareEntries, onCrossSection }: Props) {
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

  return (
    <div data-anatomy-atlas-plus="reference-only" className="space-y-3">
      <SourceBoundary />

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
        {([
          ['explore', 'Explore'],
          ['compare', 'Compare'],
          ['quiz', 'Quiz'],
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
            <label className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              Structure A
              <select value={compareA} onChange={(event) => setCompareA(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-2 text-xs font-bold normal-case tracking-normal dark:border-white/10 dark:bg-neutral-900">
                {ATLAS_PLUS_ENTRIES.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
              </select>
            </label>
            <label className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              Structure B
              <select value={compareB} onChange={(event) => setCompareB(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-2 text-xs font-bold normal-case tracking-normal dark:border-white/10 dark:bg-neutral-900">
                {ATLAS_PLUS_ENTRIES.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
              </select>
            </label>
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

      <div className="rounded-xl bg-neutral-50 p-2.5 text-[10px] leading-relaxed text-neutral-500 dark:bg-white/[0.03]">
        Contract: review={ATLAS_PLUS_REVIEW.humanReview} · patient-specific={String(ATLAS_PLUS_REVIEW.patientSpecific)} · clinical-decision-use={String(ATLAS_PLUS_REVIEW.clinicalDecisionUse)}.
        Atlas+ orchestrates existing Panacea geometry; it never substitutes a different mesh when a requested structure is absent.
      </div>
    </div>
  )
}

export default AnatomyAtlasPlus
