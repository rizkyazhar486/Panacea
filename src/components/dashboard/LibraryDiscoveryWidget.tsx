import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ENRICHMENT_LIBRARY, type LibraryKind } from '../../data/enrichmentLibrary'

const KINDS: { id: LibraryKind; label: string }[] = [
  { id: 'book', label: 'Books' },
  { id: 'story', label: 'Stories' },
  { id: 'motivation', label: 'Motivation' },
]

export function LibraryDiscoveryWidget() {
  const [kind, setKind] = useState<LibraryKind>('story')
  const items = useMemo(() => ENRICHMENT_LIBRARY.filter((x) => x.kind === kind), [kind])
  const [index, setIndex] = useState(0)
  const item = items[index % Math.max(items.length, 1)]

  return (
    <section className="liquid-panel h-full p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="panacea-kicker !text-neutral-500 dark:!text-white/55">Learn beyond checklists</div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-neutral-900 dark:text-white">Library, stories & motivation</h2>
        </div>
        <div className="flex rounded-full border border-black/[.05] bg-white/45 p-1 dark:border-white/10 dark:bg-white/[.04]">
          {KINDS.map((k) => <button key={k.id} onClick={() => { setKind(k.id); setIndex(0) }} className={`rounded-full px-2.5 py-1.5 text-[10px] font-black ${kind === k.id ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'text-neutral-500 dark:text-white/50'}`}>{k.label}</button>)}
        </div>
      </div>
      {item && (
        <div className="mt-4 rounded-[22px] border border-black/[.05] bg-white/50 p-4 dark:border-white/10 dark:bg-white/[.035]">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-[#d8bb70]/13 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-[#8d6b22] dark:text-[#f0d68a]">{item.tag}</span>
            {item.author && <span className="text-[10px] text-neutral-400">{item.author}</span>}
          </div>
          <h3 className="mt-3 text-base font-black text-neutral-900 dark:text-white">{item.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-white/60">{item.summary}</p>
          {item.note && <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">{item.note}</p>}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button onClick={() => setIndex((i) => i + 1)} className="liquid-orbit-button">Next {kind} →</button>
        <Link to="/med-study" className="text-xs font-black text-brand-dark dark:text-emerald-300">Open learning hub</Link>
      </div>
    </section>
  )
}
