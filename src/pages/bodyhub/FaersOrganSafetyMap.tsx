import { useMemo, useState } from 'react'
import type { AnatomyLayer } from '../../components/Body3D'

type ReactionRow = { term: string; count: number }

type OrganSpec = {
  key: string
  label: string
  terms: Set<string>
  keywords: string[]
  layers: Array<AnatomyLayer['key']>
  note: string
}

const SYSTEMS: OrganSpec[] = [
  {
    key: 'digestive',
    label: 'Digestive',
    terms: new Set(['DIARRHOEA', 'NAUSEA', 'VOMITING', 'CONSTIPATION', 'ABDOMINAL PAIN', 'ABDOMINAL PAIN UPPER', 'IMPAIRED GASTRIC EMPTYING', 'DECREASED APPETITE']),
    keywords: ['stomach', 'intestine', 'colon', 'liver', 'pancreas'],
    layers: ['visceral'],
    note: 'Selected gastrointestinal MedDRA preferred terms from the retrieved FAERS aggregate.',
  },
  {
    key: 'renal',
    label: 'Kidney / urinary',
    terms: new Set(['ACUTE KIDNEY INJURY', 'RENAL FAILURE', 'RENAL IMPAIRMENT']),
    keywords: ['kidney', 'ureter', 'bladder'],
    layers: ['visceral'],
    note: 'Selected renal/urinary reaction terms only; this is not a renal-risk estimate.',
  },
  {
    key: 'respiratory',
    label: 'Respiratory',
    terms: new Set(['DYSPNOEA', 'COUGH', 'PNEUMONIA']),
    keywords: ['lung', 'bronch', 'trachea'],
    layers: ['visceral'],
    note: 'Selected respiratory reaction terms only; pneumonia reports do not establish drug causation.',
  },
  {
    key: 'nervous',
    label: 'Nervous system',
    terms: new Set(['HEADACHE', 'DIZZINESS', 'SEIZURE', 'PARAESTHESIA']),
    keywords: ['brain', 'nerve', 'spinal'],
    layers: ['nervous'],
    note: 'Selected neurological reaction terms used for anatomy orientation, not neurological diagnosis.',
  },
  {
    key: 'skin',
    label: 'Skin / surface',
    terms: new Set(['RASH', 'PRURITUS', 'URTICARIA']),
    keywords: ['skin'],
    layers: ['surface'],
    note: 'Selected cutaneous reaction terms only; no lesion-image or allergy diagnosis is performed.',
  },
  {
    key: 'musculoskeletal',
    label: 'Musculoskeletal',
    terms: new Set(['ARTHRALGIA', 'MYALGIA', 'MUSCLE SPASMS']),
    keywords: ['muscle', 'joint', 'bone'],
    layers: ['muscular', 'skeletal'],
    note: 'Selected musculoskeletal reaction terms only; no injury or pain-source inference is made.',
  },
  {
    key: 'cardiovascular',
    label: 'Cardiovascular',
    terms: new Set(['PALPITATIONS', 'TACHYCARDIA', 'BRADYCARDIA', 'HYPOTENSION', 'HYPERTENSION', 'CHEST PAIN']),
    keywords: ['heart', 'aorta', 'artery', 'vein'],
    layers: ['cardiovascular', 'visceral'],
    note: 'Selected cardiovascular terms only; spontaneous reports cannot quantify cardiovascular risk.',
  },
]

const SYSTEMIC_TERMS = new Set([
  'LACTIC ACIDOSIS',
  'BLOOD GLUCOSE INCREASED',
  'WEIGHT DECREASED',
  'FATIGUE',
  'ASTHENIA',
  'MALAISE',
])

interface Props {
  drugName: string
  onHighlightSites: (keywords: string[], layers: Array<AnatomyLayer['key']>) => void
}

export function FaersOrganSafetyMap({ drugName, onHighlightSites }: Props) {
  const [rows, setRows] = useState<ReactionRow[]>([])
  const [loadedDrug, setLoadedDrug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadFaers() {
    const cleaned = drugName.trim().replace(/["\\]/g, '')
    if (!cleaned) return

    setLoading(true)
    setError('')
    setRows([])
    setLoadedDrug('')

    try {
      const search = `patient.drug.medicinalproduct:"${cleaned}"`
      const url = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(search)}&count=patient.reaction.reactionmeddrapt.exact&limit=50`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`openFDA returned ${response.status}`)
      const json = await response.json() as { results?: ReactionRow[] }
      if (!Array.isArray(json.results) || json.results.length === 0) throw new Error('No reaction aggregate returned')

      setRows(json.results.filter((row) => typeof row.term === 'string' && Number.isFinite(row.count) && row.count > 0))
      setLoadedDrug(cleaned)
    } catch {
      setError('FAERS data could not be loaded right now. No estimate or substitute data is shown.')
    } finally {
      setLoading(false)
    }
  }

  const mapped = useMemo(() => SYSTEMS.map((spec) => {
    const matched = rows.filter((row) => spec.terms.has(row.term.toUpperCase()))
    return {
      ...spec,
      matched,
      count: matched.reduce((sum, row) => sum + row.count, 0),
    }
  }).filter((group) => group.count > 0), [rows])

  const systemic = useMemo(() => rows.filter((row) => SYSTEMIC_TERMS.has(row.term.toUpperCase())), [rows])
  const systemicCount = systemic.reduce((sum, row) => sum + row.count, 0)
  const mappedTotal = mapped.reduce((sum, group) => sum + group.count, 0) + systemicCount
  const mappedTerms = useMemo(() => new Set([
    ...SYSTEMS.flatMap((spec) => [...spec.terms]),
    ...SYSTEMIC_TERMS,
  ]), [])
  const unmapped = useMemo(() => rows.filter((row) => !mappedTerms.has(row.term.toUpperCase())), [rows, mappedTerms])

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-ink dark:text-white">FAERS reported reactions → body systems</div>
          <p className="mt-0.5 max-w-2xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Explore spontaneous adverse-event report terms from the FDA Adverse Event Reporting System and use selected terms to orient the anatomy model above.
          </p>
        </div>
        <button
          type="button"
          onClick={loadFaers}
          disabled={loading || !drugName.trim()}
          className="min-h-11 rounded-xl bg-ink px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
        >
          {loading ? 'Loading FAERS…' : `Explore ${drugName.trim() || 'drug'} reports`}
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
        <strong>Association only — not causality or incidence.</strong> A FAERS report does not prove that a drug caused an event. FAERS has no exposed-user denominator here, so these counts cannot estimate incidence, prevalence, probability or comparative risk. Nothing on this panel is patient-specific.
      </div>

      {error && <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-300">{error}</p>}

      {loadedDrug && rows.length > 0 && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span><strong className="text-ink dark:text-white">{loadedDrug}</strong> · top {rows.length} reaction terms returned by openFDA</span>
            <span>{mappedTotal.toLocaleString('en-US')} report-term occurrences in the selected educational mapping</span>
          </div>

          {mapped.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {mapped.map((group) => {
                const share = mappedTotal > 0 ? (group.count / mappedTotal) * 100 : 0
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => onHighlightSites(group.keywords, group.layers)}
                    className="min-h-11 rounded-xl border border-neutral-200 p-2.5 text-left transition hover:border-brand hover:bg-brand/[0.03] dark:border-white/10 dark:hover:border-brand/60"
                    aria-label={`Highlight ${group.label} anatomy`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-bold text-ink dark:text-white">{group.label}</span>
                      <span className="text-[11px] font-semibold text-neutral-500">{share.toFixed(1)}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(2, share)}%` }} />
                    </div>
                    <div className="mt-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                      {group.count.toLocaleString('en-US')} mapped report-term occurrences
                    </div>
                    <div className="mt-1 text-[10.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {group.matched.slice(0, 4).map((row) => `${row.term} ${row.count.toLocaleString('en-US')}`).join(' · ')}
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">{group.note}</p>
                  </button>
                )
              })}
            </div>
          )}

          {systemicCount > 0 && (
            <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-xs font-bold text-ink dark:text-white">Systemic / metabolic terms</div>
                <div className="text-[11px] font-semibold text-neutral-500">
                  {mappedTotal > 0 ? ((systemicCount / mappedTotal) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                {systemic.map((row) => `${row.term} ${row.count.toLocaleString('en-US')}`).join(' · ')}
              </p>
              <p className="mt-1 text-[10px] text-neutral-400">Not forced onto one organ because these terms are systemic or metabolic.</p>
            </div>
          )}

          {unmapped.length > 0 && (
            <details className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
              <summary className="cursor-pointer text-xs font-bold text-ink dark:text-white">
                Other / deliberately unmapped terms ({unmapped.length})
              </summary>
              <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                These are left unmapped rather than assigning an organ without a defensible rule: {unmapped.slice(0, 15).map((row) => row.term).join(' · ')}{unmapped.length > 15 ? ' · …' : ''}
              </p>
            </details>
          )}

          <div className="rounded-xl bg-neutral-50 p-2.5 text-[10.5px] leading-relaxed text-neutral-500 dark:bg-white/5 dark:text-neutral-400">
            <div className="font-bold text-neutral-600 dark:text-neutral-300">How the percentage is calculated</div>
            <div className="mt-0.5 font-mono">share(system) = mapped report-term occurrences in system / all mapped report-term occurrences × 100%</div>
            <p className="mt-1">This percentage describes only the selected mapping among the reaction terms returned by this query. It is not incidence, probability, relative risk, prevalence, severity or causal strength.</p>
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">
        Source: FDA Adverse Event Reporting System (FAERS) via openFDA drug/event reaction-term aggregation. Reaction terms are returned by openFDA; Panacea maps only a small explicit set of exact terms to broad body systems for educational anatomy navigation. It does not claim this subset is an official MedDRA System Organ Class mapping.
      </p>
    </section>
  )
}

export default FaersOrganSafetyMap
