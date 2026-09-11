import { useEffect, useMemo, useState } from 'react'
import { resolveHraTerms, type HraResolvedRecord } from '../../lib/hraResolver'

type SystemKey =
  | 'integument'
  | 'adipose'
  | 'muscle'
  | 'skeleton'
  | 'nervous'
  | 'cardiovascular'
  | 'respiratory'
  | 'digestive'
  | 'urinary'
  | 'reproductive'
  | 'endocrine'
  | 'immune'

type SystemDefinition = {
  key: SystemKey
  label: string
  subtitle: string
  terms: string[]
  functionBridge: string
}

const SYSTEMS: SystemDefinition[] = [
  { key: 'integument', label: 'Integument', subtitle: 'Skin and body envelope', terms: ['integumentary system', 'skin of body', 'skin', 'epidermis', 'dermis'], functionBridge: 'Barrier, sensation, thermoregulation and interface with the environment.' },
  { key: 'adipose', label: 'Fat & soft tissue', subtitle: 'Adipose, connective tissue and fascia context', terms: ['adipose tissue', 'subcutaneous adipose tissue', 'connective tissue', 'fascia', 'soft tissue'], functionBridge: 'Mechanical cushioning, energy storage, endocrine signalling and tissue planes.' },
  { key: 'muscle', label: 'Muscular', subtitle: 'Skeletal muscle and tendon context', terms: ['skeletal muscle tissue', 'skeletal muscle', 'muscle', 'tendon'], functionBridge: 'Force generation, movement, posture, heat production and metabolic demand.' },
  { key: 'skeleton', label: 'Skeletal', subtitle: 'Bone, cartilage and joint context', terms: ['skeletal system', 'bone', 'cortical bone tissue', 'trabecular bone tissue', 'cartilage', 'joint'], functionBridge: 'Support, leverage, protection, mineral reservoir and marrow housing.' },
  { key: 'nervous', label: 'Nervous', subtitle: 'Brain, cord and peripheral neural pathways', terms: ['central nervous system', 'brain', 'spinal cord', 'peripheral nerve', 'optic nerve'], functionBridge: 'Sensation, motor control, autonomic regulation, integration and cognition.' },
  { key: 'cardiovascular', label: 'Cardiovascular', subtitle: 'Heart and blood vasculature', terms: ['heart', 'blood vasculature', 'aorta', 'artery', 'vein'], functionBridge: 'Pressure-flow transport of oxygen, nutrients, hormones, metabolites and heat.' },
  { key: 'respiratory', label: 'Respiratory', subtitle: 'Airways and lungs', terms: ['lung', 'trachea', 'bronchus', 'larynx'], functionBridge: 'Ventilation, diffusion, acid-base contribution and airway conditioning.' },
  { key: 'digestive', label: 'Digestive', subtitle: 'GI tract and accessory organs', terms: ['esophagus', 'stomach', 'small intestine', 'large intestine', 'liver', 'gallbladder', 'pancreas'], functionBridge: 'Digestion, absorption, barrier function, bile handling and nutrient metabolism.' },
  { key: 'urinary', label: 'Urinary', subtitle: 'Kidney to urethra', terms: ['kidney', 'ureter', 'urinary bladder', 'urethra'], functionBridge: 'Filtration, electrolyte-water balance, acid-base handling and excretion.' },
  { key: 'reproductive', label: 'Reproductive', subtitle: 'Sex-specific pelvic anatomy', terms: ['uterus', 'ovary', 'fallopian tube', 'prostate', 'testis'], functionBridge: 'Gamete production, reproductive tract function and endocrine interaction.' },
  { key: 'endocrine', label: 'Endocrine', subtitle: 'Hormone-producing organs', terms: ['pituitary gland', 'thyroid gland', 'adrenal gland', 'pancreas', 'ovary', 'testis'], functionBridge: 'Distributed hormonal regulation of metabolism, growth, stress and reproduction.' },
  { key: 'immune', label: 'Immune & lymphatic', subtitle: 'Lymphoid organs and lymphatic context', terms: ['lymph node', 'spleen', 'thymus', 'bone marrow', 'lymphatic vessel'], functionBridge: 'Immune surveillance, cell maturation, antigen response and lymph transport.' },
]

function uniqueRecords(rows: HraResolvedRecord[]) {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = `${row.release}|${row.label}|${row.ontologyId}|${row.modelStem}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function HumanAnatomyLayerNavigator() {
  const [activeKey, setActiveKey] = useState<SystemKey>('integument')
  const [records, setRecords] = useState<HraResolvedRecord[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const active = SYSTEMS.find((item) => item.key === activeKey) ?? SYSTEMS[0]

  useEffect(() => {
    let cancelled = false
    setState('loading')
    Promise.allSettled(active.terms.map((term) => resolveHraTerms([term], 8)))
      .then((results) => {
        if (cancelled) return
        const merged = uniqueRecords(results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])).slice(0, 28)
        setRecords(merged)
        setState(merged.length ? 'ready' : 'error')
      })
      .catch(() => {
        if (!cancelled) {
          setRecords([])
          setState('error')
        }
      })
    return () => { cancelled = true }
  }, [activeKey])

  const renderableCount = useMemo(() => records.filter((record) => record.renderable && record.model).length, [records])

  return (
    <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="text-[9px] font-black uppercase tracking-[.17em] text-cyan-700 dark:text-cyan-300">End-to-end anatomy layers</div>
          <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">Skin → fat/soft tissue → muscle → skeleton → nerves → vessels → organs.</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">This navigator queries the HRA resolver instead of inventing missing anatomy. A result can be source-mapped even when a standalone browser GLB is unavailable; those states are shown separately.</p>
        </div>
        <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[9px] font-black text-neutral-500 dark:border-white/10 dark:bg-white/[.03] dark:text-neutral-300">{state === 'loading' ? 'Resolving…' : `${records.length} mappings · ${renderableCount} browser 3D`}</div>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {SYSTEMS.map((item) => (
          <button key={item.key} onClick={() => setActiveKey(item.key)} className={`min-w-[160px] shrink-0 rounded-2xl border p-3 text-left transition ${item.key === activeKey ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300/30 dark:bg-cyan-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
            <div className="text-[11px] font-black text-neutral-950 dark:text-white">{item.label}</div>
            <div className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.subtitle}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
          <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{active.label}</div>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-700 dark:text-neutral-200">{active.functionBridge}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {active.terms.map((term) => <span key={term} className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[8px] font-bold text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">{term}</span>)}
          </div>
          <a href="#body-physiology" className="mt-4 inline-flex rounded-full bg-neutral-950 px-3 py-2 text-[9px] font-black text-white dark:bg-white dark:text-neutral-950">Bridge to physiology ↓</a>
        </aside>

        <div className="min-w-0">
          {state === 'loading' ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-neutral-100 dark:bg-white/[.05]" />)}</div>
          ) : state === 'ready' ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {records.map((record) => (
                <a key={`${record.release}-${record.label}-${record.ontologyId}-${record.modelStem}`} href={record.sourceUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 transition hover:border-cyan-300 dark:border-white/10 dark:bg-white/[.025]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-cyan-50 px-2 py-1 text-[8px] font-black text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">HRA {record.release}</span>
                    <span className={`rounded-full px-2 py-1 text-[8px] font-black ${record.renderable ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200' : 'bg-neutral-200/60 text-neutral-500 dark:bg-white/10 dark:text-neutral-300'}`}>{record.renderable ? '3D' : 'mapping'}</span>
                  </div>
                  <div className="mt-2 line-clamp-2 text-[10px] font-black text-neutral-950 dark:text-white">{record.label}</div>
                  <div className="mt-1 truncate text-[8px] text-neutral-500 dark:text-neutral-400">{record.ontologyId || record.nodeName || 'HRA structure'}</div>
                  <div className="mt-2 truncate text-[8px] text-neutral-400">{record.model?.name || record.modelStem}</div>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-5 text-[10px] text-neutral-500 dark:border-white/10 dark:text-neutral-400">No HRA mapping was returned for this layer in the current source indexes. Panacea leaves the gap visible rather than substituting decorative anatomy.</div>
          )}
        </div>
      </div>
    </section>
  )
}

export default HumanAnatomyLayerNavigator
