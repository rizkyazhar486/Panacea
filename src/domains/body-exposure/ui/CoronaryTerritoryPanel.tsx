import { useMemo, useState } from 'react'
import {
  AHA17_LIMITATIONS, AHA17_RINGS, AHA17_SOURCES, DOMINANCE_PREVALENCE, branchForSegment, territoryForArtery,
  type CoronaryBranch, type SegmentInfo,
} from '../engine/vascularTerritoryEngine'

// Peta teritori koroner pada model AHA 17 segmen. Tata letak SENGAJA bukan diagram bull's-eye: sudut/orientasi segmen tidak ada pada teks
// yang dibaca, jadi hanya cincin (basal/tengah/apikal/apeks) dan urutan penomoran yang ditampilkan. Rujukan populasi, bukan data pasien.
type Filter = 'ALL' | CoronaryBranch
const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: 'ALL', label: 'All' }, { id: 'LAD', label: 'LAD' }, { id: 'LCx', label: 'LCx' }, { id: 'RCA', label: 'RCA' },
]
const RING_LABEL: Record<string, string> = { basal: 'Basal', mid: 'Mid-cavity', apical: 'Apical', apex: 'Apex' }
// Warna hanya penguat; setiap kartu juga memuat singkatan cabangnya sebagai teks.
// Modifier `!` (Tailwind v4) karena CSS global tombol (panacea-*-v4x.css) menimpa latar/tepi tombol.
const BRANCH_STYLE: Record<CoronaryBranch, string> = {
  LAD: 'border-sky-600! bg-sky-100! text-sky-950! dark:border-sky-400! dark:bg-sky-500/25! dark:text-sky-50!',
  LCx: 'border-violet-600! bg-violet-100! text-violet-950! dark:border-violet-400! dark:bg-violet-500/25! dark:text-violet-50!',
  RCA: 'border-rose-600! bg-rose-100! text-rose-950! dark:border-rose-400! dark:bg-rose-500/25! dark:text-rose-50!',
}

export function CoronaryTerritoryPanel() {
  const [filter, setFilter] = useState<Filter>('ALL')
  const [selected, setSelected] = useState<number | null>(null)

  const bySegment = useMemo(() => {
    const map = new Map<number, SegmentInfo>()
    for (const a of ['LAD', 'LCx', 'RCA'] as const) {
      const r = territoryForArtery(a)
      if (r.ok) for (const s of r.segments) map.set(s.segment, s)
    }
    return map
  }, [])
  const detail = selected === null ? null : branchForSegment(selected)

  return (
    <details className="rounded-2xl border border-neutral-200 p-3 text-sm dark:border-white/10" data-testid="coronary-territory-panel">
      <summary className="cursor-pointer font-bold">Coronary territories on the 17-segment heart model (reference)</summary>
      <p className="mt-2 rounded-xl bg-amber-50 p-2 text-[13px] text-amber-900 dark:bg-amber-400/10 dark:text-amber-100" role="note">
        Atlas reference — not patient-specific: a population-average assignment, because real coronary supply varies, and not for diagnosis or procedural targeting.
      </p>

      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Show segments supplied by">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
            className={`min-h-[44px] min-w-[44px] rounded-xl border px-3 font-bold ${filter === f.id ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900' : 'border-neutral-300 dark:border-white/20'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {AHA17_RINGS.map((ring) => (
          <div key={ring.id}>
            <p className="text-[12px] font-bold text-neutral-600 dark:text-neutral-300">{RING_LABEL[ring.id]} ({ring.segments[0]}{ring.segments.length > 1 ? `–${ring.segments[ring.segments.length - 1]}` : ''})</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {ring.segments.map((n) => {
                const s = bySegment.get(n)
                if (!s) return null
                const dim = filter !== 'ALL' && s.branch !== filter
                return (
                  <li key={n}>
                    <button type="button" onClick={() => setSelected(selected === n ? null : n)} aria-pressed={selected === n}
                      aria-label={`Segment ${n}, ${s.name}, assigned to ${s.branch}${s.contested ? ', contested' : ''}`}
                      className={`flex min-h-[44px] min-w-[56px] flex-col items-center justify-center rounded-xl border-2 px-2 text-[12px] font-bold leading-tight ${BRANCH_STYLE[s.branch]} ${dim ? 'opacity-30' : ''} ${selected === n ? 'ring-2 ring-neutral-900 dark:ring-white' : ''}`}>
                      <span className="text-[15px]">{n}</span>
                      <span>{s.branch}{s.contested ? ' ⚠' : ''}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-3 min-h-[3rem] text-[13px]" aria-live="polite">
        {detail && detail.ok ? (
          <div className="rounded-xl border border-neutral-200 p-2 dark:border-white/10" data-testid="coronary-segment-detail">
            <p className="font-bold">Segment {detail.info.segment}: {detail.info.name}</p>
            <p>Assigned by the AHA model to the <strong>{detail.info.branch}</strong>{detail.info.contested ? ' (contested in the literature)' : ''}.</p>
            {detail.info.evidence.length === 0
              ? <p className="text-neutral-600 dark:text-neutral-300">No segment-specific caveat is recorded in the sources read.</p>
              : <ul className="mt-1 list-disc pl-5">{detail.info.evidence.map((e) => <li key={e.note}>{e.note}</li>)}</ul>}
          </div>
        ) : <p className="text-neutral-600 dark:text-neutral-300">Tap a segment to see its assignment and the evidence notes.</p>}
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-[13px] font-bold">Limits of this map</summary>
        <ul className="mt-1 list-disc pl-5 text-[12px]">{AHA17_LIMITATIONS.map((l) => <li key={l}>{l}</li>)}</ul>
        <p className="mt-1 text-[12px]">Population prevalence of coronary dominance: right {DOMINANCE_PREVALENCE.right}, left {DOMINANCE_PREVALENCE.left}, codominant {DOMINANCE_PREVALENCE.codominant}. The map does not change with dominance.</p>
      </details>
      <p className="mt-2 text-[11px] text-neutral-500">
        Sources read in full text: PubMed {AHA17_SOURCES.assignment.pmid} ({AHA17_SOURCES.assignment.pmcid}) and {AHA17_SOURCES.crossCheck.pmid} ({AHA17_SOURCES.crossCheck.pmcid}). The original AHA statement (PubMed {AHA17_SOURCES.assignment.originalPmid}) was not accessible. Segment layout is a grouped list, not a drawn bull's-eye, because the orientation is not in the text read.
      </p>
    </details>
  )
}
