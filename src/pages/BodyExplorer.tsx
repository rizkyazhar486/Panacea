import { useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconActivity, IconSearch, IconStethoscope } from '../components/icons'
import { BODY_REGIONS, type BodyRegion } from '../lib/bodyRegions'
import { api, type OntologyTerm, type DrugLabelInfo } from '../lib/api'
import { explainBodyRegion, explainDrug } from '../lib/ai'
import { useStore } from '../lib/store'
import { Body3D } from '../components/Body3D'

// ─────────────────────────────────────────────────────────────────────────────
// Body Explorer — klik satu region tubuh, dapatkan istilah NYATA dari dua
// ontologi kedokteran gratis (Human Disease Ontology + Human Phenotype
// Ontology, lewat EBI OLS4 di server) beserta penjelasan bahasa awam yang
// WAJIB mengutip istilah itu (lihat groundingBlock di lib/ai.ts).
//
// Ini SENGAJA bukan model anatomi 3D. Model 3D nyata (mis. Z-Anatomy/
// BodyParts3D) adalah berkas mesh besar (puluhan-ratusan MB) dengan lisensi
// dan hosting-nya sendiri — memuatnya di sini butuh pipeline aset terpisah,
// bukan sesuatu yang bisa ditulis sebagai kode dalam satu sesi. Siluet 2D
// yang bisa diklik ini memberi kemampuan yang sama (satu titik tubuh →
// istilah medis bertaut) tanpa aset 3D yang belum ada.
// ─────────────────────────────────────────────────────────────────────────────

function TermList({ title, terms }: { title: string; terms: OntologyTerm[] }) {
  if (!terms.length) return null
  return (
    <div>
      <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">{title}</div>
      <ul className="mt-1.5 space-y-1.5">
        {terms.map((t) => (
          <li key={t.id} className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-ink dark:text-white">{t.label}</span>
              <span className="t-mikro shrink-0 font-mono text-neutral-400">{t.id}</span>
            </div>
            {t.description && <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{t.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BodyExplorer() {
  const { state } = useStore()
  const [active, setActive] = useState<BodyRegion | null>(null)
  const [loading, setLoading] = useState(false)
  const [diseases, setDiseases] = useState<OntologyTerm[]>([])
  const [phenotypes, setPhenotypes] = useState<OntologyTerm[]>([])
  const [explanation, setExplanation] = useState('')
  const [askedLabel, setAskedLabel] = useState('')

  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [view, setView] = useState<'2d' | '3d'>('3d')

  // "Ask" — pencarian bebas (bahasa natural atau gejala/fungsi, bukan hanya
  // nama region tubuh) yang mengisi PANEL YANG SAMA dengan klik region: satu
  // tempat untuk membaca hasilnya, dua cara untuk sampai ke sana. Kalau
  // istilah yang diambil balik cocok dengan salah satu region di siluet
  // (dicocokkan lewat kata kunci region itu sendiri, bukan tebakan AI), region
  // itu ikut disorot — inilah bagian "mulai dari penyakit/gejala, lihat organ
  // yang terlibat", kebalikan dari mengklik organ dulu.
  async function ask() {
    const q = question.trim()
    if (!q) return
    setAsking(true)
    setActive(null)
    setAskedLabel(q)
    setExplanation('')
    setDiseases([])
    setPhenotypes([])
    try {
      const { diseases: d, phenotypes: p } = await api.anatomyOntology([q])
      setDiseases(d)
      setPhenotypes(p)
      const matched = BODY_REGIONS.find((r) =>
        r.searchTerms.some((t) => t.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(t.toLowerCase())) ||
        [...d, ...p].some((term) => term.label.toLowerCase().includes(r.label.split(' ')[0].toLowerCase())),
      )
      if (matched) setActive(matched)
      const text = await explainBodyRegion(state.settings, q, d, p)
      setExplanation(text)
    } catch {
      setExplanation('Could not reach the ontology service right now. Please try again in a moment.')
    } finally {
      setAsking(false)
    }
  }

  const [drugQuery, setDrugQuery] = useState('')
  const [drugLoading, setDrugLoading] = useState(false)
  const [drugInfo, setDrugInfoState] = useState<DrugLabelInfo | null>(null)
  const [drugExplanation, setDrugExplanation] = useState('')
  const [drugError, setDrugError] = useState('')

  async function pick(region: BodyRegion) {
    setActive(region)
    setAskedLabel('')
    setQuestion('')
    setLoading(true)
    setExplanation('')
    setDiseases([])
    setPhenotypes([])
    try {
      const { diseases: d, phenotypes: p } = await api.anatomyOntology(region.searchTerms)
      setDiseases(d)
      setPhenotypes(p)
      const text = await explainBodyRegion(state.settings, region.label, d, p)
      setExplanation(text)
    } catch {
      setExplanation('Could not reach the ontology service right now. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  async function lookupDrug() {
    const name = drugQuery.trim()
    if (!name) return
    setDrugLoading(true)
    setDrugError('')
    setDrugInfoState(null)
    setDrugExplanation('')
    try {
      const info = await api.drugInfo(name)
      setDrugInfoState(info)
      const text = await explainDrug(state.settings, info)
      setDrugExplanation(text)
    } catch {
      setDrugError(`No FDA label found for "${name}" — try the generic or brand name spelled exactly (e.g. "ibuprofen", "metformin").`)
    } finally {
      setDrugLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<IconActivity />}
        title="Body Explorer"
        subtitle="Tap a region to see real terms from the Human Disease & Phenotype Ontologies"
      />
      <Card>
        <form onSubmit={(e) => { e.preventDefault(); ask() }} className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about anatomy, a symptom, or a disease…"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={asking || !question.trim()}
            className="liquid-glass-btn liquid-glass-btn--primary flex h-11 shrink-0 items-center rounded-xl px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {asking ? 'Asking…' : 'Ask'}
          </button>
        </form>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
          Ask in your own words — e.g. "where is the median nerve", "symptoms of liver disease", "what does the
          pancreas do". If the terms retrieved match a region below, it lights up on the silhouette.
        </p>

        <div className="mt-4 flex justify-center gap-1 rounded-full bg-neutral-100 p-1 dark:bg-white/5 sm:justify-start">
          <button
            onClick={() => setView('3d')}
            className={`min-h-[36px] rounded-full px-4 text-xs font-bold transition ${view === '3d' ? 'bg-brand text-white' : 'text-neutral-500'}`}
          >
            3D (rotate & zoom)
          </button>
          <button
            onClick={() => setView('2d')}
            className={`min-h-[36px] rounded-full px-4 text-xs font-bold transition ${view === '2d' ? 'bg-brand text-white' : 'text-neutral-500'}`}
          >
            2D silhouette
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[280px_1fr]">
          {view === '3d' ? (
            <div>
              <Body3D active={active} onPick={pick} />
              <p className="mt-1.5 text-center text-[10px] text-neutral-400">Drag to rotate · scroll/pinch to zoom · tap a shape</p>
            </div>
          ) : (
          <div className="relative mx-auto">
            <svg viewBox="0 0 200 440" className="h-[340px] w-auto">
              <g fill="#eef4f0" stroke="#d6e4dc" strokeWidth="1.5" className="dark:fill-white/5 dark:stroke-white/10">
                <circle cx="100" cy="40" r="26" />
                <rect x="86" y="64" width="28" height="16" rx="6" />
                <path d="M62 84 Q100 74 138 84 L150 150 Q152 200 142 250 L132 250 Q126 200 124 170 L120 250 L116 360 Q116 380 104 380 L96 380 Q84 380 84 360 L80 250 L76 170 Q74 200 68 250 L58 250 Q48 200 50 150 Z" />
                <path d="M62 86 L40 180 Q38 196 48 198 Q58 198 60 184 L70 120" />
                <path d="M138 86 L160 180 Q162 196 152 198 Q142 198 140 184 L130 120" />
              </g>
              {BODY_REGIONS.map((r) => {
                const isActive = active?.key === r.key
                return (
                  <g key={r.key} className="cursor-pointer" onClick={() => pick(r)}>
                    <circle
                      cx={(r.x / 100) * 200}
                      cy={(r.y / 100) * 440}
                      r={isActive ? 9 : 6}
                      fill={isActive ? '#00BF63' : '#94a3b8'}
                      stroke="#fff"
                      strokeWidth="2"
                      opacity={isActive ? 1 : 0.75}
                    />
                    {isActive && (
                      <circle cx={(r.x / 100) * 200} cy={(r.y / 100) * 440} r="14" fill="none" stroke="#00BF63" strokeWidth="1.5" opacity="0.5" />
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
          )}

          <div className="min-w-0">
            {!active && !askedLabel && (
              <p className="text-sm leading-relaxed text-neutral-500">
                Tap a marker on the silhouette, or ask a question above, to look up real disease and symptom terms —
                and get a plain-language explanation grounded in those terms, not a diagnosis for you personally.
              </p>
            )}
            {(active || askedLabel) && (
              <div className="space-y-3">
                <h3 className="text-base font-black capitalize text-ink dark:text-white">{active?.label ?? askedLabel}</h3>
                {(loading || asking) && <p className="text-sm text-neutral-500">Looking up ontology terms…</p>}
                {!loading && !asking && explanation && (
                  <p className="rounded-xl bg-brand/5 p-3 text-sm leading-relaxed text-ink dark:bg-brand/10 dark:text-white">
                    {explanation}
                  </p>
                )}
                {!loading && !asking && (
                  <>
                    <TermList title="Related diseases (DOID)" terms={diseases} />
                    <TermList title="Related symptoms (HPO)" terms={phenotypes} />
                    {!diseases.length && !phenotypes.length && (
                      <p className="text-sm text-neutral-500">No ontology terms were found for this.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">
          Disease and symptom terms are retrieved live from the Human Disease Ontology and Human Phenotype Ontology
          via EBI's public Ontology Lookup Service (OLS4) — general medical reference data, not a diagnosis. Always
          consult a licensed clinician about your own symptoms.
        </p>
      </Card>

      <Card>
        <SectionTitle
          icon={<IconStethoscope />}
          title="Medicine Lookup"
          subtitle="How a medicine works, which organ it acts on, and its side effects — from the official FDA label"
        />
        <form
          onSubmit={(e) => { e.preventDefault(); lookupDrug() }}
          className="mt-3 flex gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={drugQuery}
              onChange={(e) => setDrugQuery(e.target.value)}
              placeholder="e.g. ibuprofen, metformin, amlodipine…"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={drugLoading || !drugQuery.trim()}
            className="liquid-glass-btn liquid-glass-btn--primary flex h-11 shrink-0 items-center rounded-xl px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {drugLoading ? 'Looking up…' : 'Search'}
          </button>
        </form>

        {drugError && <p className="mt-3 text-sm text-neutral-500">{drugError}</p>}

        {drugInfo && (
          <div className="mt-4 space-y-3">
            <h3 className="text-base font-black text-ink dark:text-white">
              {drugInfo.brandName}
              {drugInfo.genericName && drugInfo.genericName.toLowerCase() !== drugInfo.brandName.toLowerCase() && (
                <span className="ml-1.5 text-sm font-semibold text-neutral-500">({drugInfo.genericName})</span>
              )}
            </h3>
            {drugExplanation && (
              <p className="rounded-xl bg-brand/5 p-3 text-sm leading-relaxed text-ink dark:bg-brand/10 dark:text-white">
                {drugExplanation}
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {drugInfo.purpose && (
                <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
                  <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Purpose</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{drugInfo.purpose}</p>
                </div>
              )}
              {drugInfo.mechanismOfAction && (
                <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
                  <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Mechanism of action</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{drugInfo.mechanismOfAction}</p>
                </div>
              )}
              {drugInfo.adverseReactions && (
                <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
                  <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Adverse reactions</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{drugInfo.adverseReactions}</p>
                </div>
              )}
              {drugInfo.warnings && (
                <div className="rounded-xl bg-red-50 p-2.5 dark:bg-red-500/10">
                  <div className="t-mikro font-bold uppercase tracking-wide text-red-500">Warnings</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-red-700 dark:text-red-300">{drugInfo.warnings}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">
          Drug information is retrieved live from the official FDA drug label via openFDA — general reference
          information, not medical advice. Always follow your prescriber's instructions and the physical package
          insert; ask a doctor or pharmacist about your own medications and doses.
        </p>
      </Card>
    </div>
  )
}

export default BodyExplorer
