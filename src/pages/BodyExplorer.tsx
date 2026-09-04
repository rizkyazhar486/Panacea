import { useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconActivity } from '../components/icons'
import { BODY_REGIONS, type BodyRegion } from '../lib/bodyRegions'
import { api, type OntologyTerm } from '../lib/api'
import { explainBodyRegion } from '../lib/ai'
import { useStore } from '../lib/store'

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

  async function pick(region: BodyRegion) {
    setActive(region)
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

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<IconActivity />}
        title="Body Explorer"
        subtitle="Tap a region to see real terms from the Human Disease & Phenotype Ontologies"
      />
      <Card>
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
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

          <div className="min-w-0">
            {!active && (
              <p className="text-sm leading-relaxed text-neutral-500">
                Tap a marker on the silhouette to look up real disease and symptom terms for that region, and get a
                plain-language explanation grounded in those terms — not a diagnosis for you personally.
              </p>
            )}
            {active && (
              <div className="space-y-3">
                <h3 className="text-base font-black text-ink dark:text-white">{active.label}</h3>
                {loading && <p className="text-sm text-neutral-500">Looking up ontology terms…</p>}
                {!loading && explanation && (
                  <p className="rounded-xl bg-brand/5 p-3 text-sm leading-relaxed text-ink dark:bg-brand/10 dark:text-white">
                    {explanation}
                  </p>
                )}
                {!loading && (
                  <>
                    <TermList title="Related diseases (DOID)" terms={diseases} />
                    <TermList title="Related symptoms (HPO)" terms={phenotypes} />
                    {!diseases.length && !phenotypes.length && (
                      <p className="text-sm text-neutral-500">No ontology terms were found for this region.</p>
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
    </div>
  )
}

export default BodyExplorer
