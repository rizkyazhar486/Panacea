import type { BodySystemId } from '../lib/bodySystemSourceWave'
import { useLongitudinalState } from '../lib/useLongitudinalState'
import { sinyalPerSistem } from '../lib/sinyalPribadiSistem'
import { labelMetrik, angka } from '../lib/perubahanLongitudinal'

const NAMA: Record<BodySystemId, string> = {
  cardiovascular: 'Cardiovascular', nervous: 'Nervous', respiratory: 'Respiratory', digestive: 'Digestive & liver',
  urinary: 'Kidney & urinary', endocrine: 'Endocrine', reproductive: 'Reproductive', 'lymphatic-immune': 'Immune',
  musculoskeletal: 'Musculoskeletal', 'sensory-ent': 'Senses & ENT', 'integumentary-surface': 'Skin',
}

// Data orang itu sendiri di sistem tubuh yang sedang dilihat, dari status
// longitudinal kanonik. Chip sistem lain membawa langsung ke tempat datanya.
export function SinyalPribadiDiTubuh({ selectedSystemId, onSelectSystem }: { selectedSystemId: BodySystemId; onSelectSystem: (id: BodySystemId) => void }) {
  const { state, labels } = useLongitudinalState()
  if (!state) return null
  const peta = sinyalPerSistem(state)
  if (peta.size === 0) return null
  const di = peta.get(selectedSystemId) ?? []
  return (
    <section aria-label="Your data in this body system" data-personal-body-signals className="dark mb-2 rounded-[20px] border border-white/10 bg-black/55 px-3 py-2 text-white">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="shrink-0 text-[9px] font-black uppercase tracking-[.14em] text-emerald-200/70">Your data</span>
        {[...peta.entries()].map(([id, d]) => (
          <button key={id} type="button" onClick={() => onSelectSystem(id)} aria-pressed={id === selectedSystemId} data-system={id}
            className="min-h-9 shrink-0 rounded-full border border-white/15 px-3 text-[11px] font-black">
            {NAMA[id]} · {d.length}
          </button>
        ))}
      </div>
      {di.length > 0 ? (
        <ul className="mt-1.5 grid gap-1">
          {di.slice(0, 4).map((s) => (
            <li key={s.metric} className="flex items-baseline justify-between gap-3 text-[12px]" data-metric={s.metric}>
              <span className="min-w-0 truncate font-bold">{labelMetrik(s.metric, labels)}</span>
              <span className="shrink-0 tabular-nums">
                <b>{angka(s.value)}</b> <span className="text-white/45">{s.unit}</span>
                {s.delta !== null && <span className="ml-1.5 text-white/55">{s.delta >= 0 ? '▲' : '▼'}{angka(Math.abs(s.delta))}</span>}
                <span className="ml-1.5 text-white/40">{s.recordedAt.slice(0, 10)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[11px] text-white/50">No data of yours is linked to this system yet.</p>
      )}
      <p className="mt-1 text-[10px] text-white/40">Tests are grouped by the system they are usually read with — not where a problem is.</p>
    </section>
  )
}

export default SinyalPribadiDiTubuh
