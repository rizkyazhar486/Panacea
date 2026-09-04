import { useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconActivity, IconSearch, IconStethoscope } from '../components/icons'
import { api, type OntologyTerm, type DrugLabelInfo } from '../lib/api'
import { explainBodyRegion, explainDrug } from '../lib/ai'
import { useStore } from '../lib/store'
import { Body3D, ANATOMY_LAYERS, type AnatomyLayer } from '../components/Body3D'
import { WORKOUT_MUSCLE_GROUPS } from '../lib/workoutMuscles'

// ─────────────────────────────────────────────────────────────────────────────
// Body Explorer — model 3D anatomi NYATA (lihat Body3D.tsx untuk sumber data
// dan lisensinya). Tap satu struktur (tulang/otot/pembuluh/saraf/organ) atau
// pilih target latihan otot untuk mendapat istilah NYATA dari dua ontologi
// kedokteran gratis (Human Disease Ontology + Human Phenotype Ontology, lewat
// EBI OLS4 di server) beserta penjelasan bahasa awam yang WAJIB mengutip
// istilah itu (lihat groundingBlock di lib/ai.ts). Tidak ada lagi tampilan
// siluet 2D — itu gambar skematik, bukan anatomi nyata.
// ─────────────────────────────────────────────────────────────────────────────

/** "Rectus femoris muscle.l" -> "rectus femoris muscle" (buang penanda sisi
 *  kiri/kanan supaya query ke ontologi tidak kebanyakan kata). */
function toSearchTerm(rawName: string): string {
  return rawName.replace(/\.[lr]$/, '').replace(/^\(|\)$/g, '').toLowerCase()
}

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
  const [loading, setLoading] = useState(false)
  const [diseases, setDiseases] = useState<OntologyTerm[]>([])
  const [phenotypes, setPhenotypes] = useState<OntologyTerm[]>([])
  const [explanation, setExplanation] = useState('')
  const [selectedLabel, setSelectedLabel] = useState('')

  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)

  const [layers, setLayers] = useState<Set<AnatomyLayer['key']>>(
    () => new Set(ANATOMY_LAYERS.filter((l) => l.defaultOn).map((l) => l.key)),
  )
  function toggleLayer(key: AnatomyLayer['key']) {
    setLayers((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const [activeWorkout, setActiveWorkout] = useState<string | null>(null)
  const [highlighted, setHighlighted] = useState<string[]>([])

  async function lookup(label: string, searchTerms: string[]) {
    setSelectedLabel(label)
    setQuestion('')
    setLoading(true)
    setExplanation('')
    setDiseases([])
    setPhenotypes([])
    try {
      const { diseases: d, phenotypes: p } = await api.anatomyOntology(searchTerms)
      setDiseases(d)
      setPhenotypes(p)
      const text = await explainBodyRegion(state.settings, label, d, p)
      setExplanation(text)
    } catch {
      setExplanation('Could not reach the ontology service right now. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  // Tap langsung pada satu struktur di model 3D (tulang/otot/pembuluh/
  // saraf/organ spesifik, bukan hanya sistemnya).
  function onPickStructure(rawName: string, label: string) {
    setActiveWorkout(null)
    setHighlighted([rawName])
    // Pastikan lapisan otot dinyalakan supaya sorotan target latihan terlihat.
    if (!layers.has('muscular')) toggleLayer('muscular')
    lookup(label, [toSearchTerm(rawName)])
  }

  function onPickWorkoutMuscle(groupKey: string) {
    const group = WORKOUT_MUSCLE_GROUPS.find((g) => g.key === groupKey)
    if (!group) return
    setActiveWorkout(groupKey)
    setHighlighted(group.nodeNames)
    if (!layers.has('muscular')) toggleLayer('muscular')
    lookup(`${group.label} muscles`, group.searchTerms)
  }

  // "Ask" — pencarian bebas (bahasa natural atau gejala/fungsi). Kalau
  // pertanyaannya cocok dengan salah satu target latihan otot, otot itu ikut
  // disorot di model 3D.
  async function ask() {
    const q = question.trim()
    if (!q) return
    setAsking(true)
    setActiveWorkout(null)
    setHighlighted([])
    setSelectedLabel(q)
    setExplanation('')
    setDiseases([])
    setPhenotypes([])
    try {
      const { diseases: d, phenotypes: p } = await api.anatomyOntology([q])
      setDiseases(d)
      setPhenotypes(p)
      const matchedGroup = WORKOUT_MUSCLE_GROUPS.find((g) =>
        q.toLowerCase().includes(g.label.toLowerCase()) || g.searchTerms.some((t) => q.toLowerCase().includes(t)),
      )
      if (matchedGroup) {
        setActiveWorkout(matchedGroup.key)
        setHighlighted(matchedGroup.nodeNames)
        if (!layers.has('muscular')) toggleLayer('muscular')
      }
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
        subtitle="A real 3D anatomy model — tap any bone, muscle, vessel, nerve, or organ"
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
          pancreas do". Real anatomical structures light up in green on the model when a match is found.
        </p>

        <Body3D layers={layers} highlighted={highlighted} onPick={onPickStructure} />

        <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
          {ANATOMY_LAYERS.map((l) => (
            <button
              key={l.key}
              onClick={() => toggleLayer(l.key)}
              className={`min-h-[32px] rounded-full border px-3 text-xs font-bold transition ${
                layers.has(l.key)
                  ? 'border-brand bg-brand text-white'
                  : 'border-neutral-200 text-neutral-500 dark:border-white/10'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-center text-[10px] text-neutral-400 sm:text-left">
          Drag to rotate · scroll/pinch to zoom · tap any structure to identify it
        </p>

        <div className="mt-4">
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Target workout muscle</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {WORKOUT_MUSCLE_GROUPS.map((g) => (
              <button
                key={g.key}
                onClick={() => onPickWorkoutMuscle(g.key)}
                className={`min-h-[32px] rounded-full border px-3 text-xs font-bold transition ${
                  activeWorkout === g.key
                    ? 'border-brand bg-brand text-white'
                    : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 min-w-0">
          {!selectedLabel && (
            <p className="text-sm leading-relaxed text-neutral-500">
              Tap a structure on the model, pick a workout target above, or ask a question — and get a
              plain-language explanation grounded in real ontology terms, not a diagnosis for you personally.
            </p>
          )}
          {selectedLabel && (
            <div className="space-y-3">
              <h3 className="text-base font-black capitalize text-ink dark:text-white">{selectedLabel}</h3>
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

        <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">
          Disease and symptom terms are retrieved live from the Human Disease Ontology and Human Phenotype Ontology
          via EBI's public Ontology Lookup Service (OLS4) — general medical reference data, not a diagnosis. Always
          consult a licensed clinician about your own symptoms.
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
          3D anatomy model: <a href={`${import.meta.env.BASE_URL}anatomy/CREDITS.txt`} target="_blank" rel="noreferrer" className="underline">Z-Anatomy</a>,
          based on BodyParts3D — licensed under CC BY-SA 4.0.
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
