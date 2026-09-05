import { useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconActivity, IconSearch, IconStethoscope } from '../components/icons'
import { api, type OntologyTerm, type DrugLabelInfo, type AnatomyImage } from '../lib/api'
import { explainBodyRegion, explainDrug } from '../lib/ai'
import { useStore } from '../lib/store'
import { Body3D, ANATOMY_LAYERS, type AnatomyLayer } from '../components/Body3D'
import { WORKOUT_MUSCLE_GROUPS } from '../lib/workoutMuscles'
import { TISSUE_TYPES, TISSUE_SUBTYPES, ORGAN_SYSTEMS, BODY_REGIONS, IMAGE_ONLY_STRUCTURES, type AnatomyEntry } from '../lib/anatomyHierarchy'
import { ORGAN_FOCUS } from '../lib/organFocus'
import { IconChevronRight } from '../components/icons'

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

// Satu kelompok hierarki anatomi (jaringan / sistem organ / region tubuh)
// sebagai <details> yang bisa dibuka-tutup -- native, tanpa JS tambahan untuk
// animasi buka-tutupnya, konsisten dengan gaya ringan aplikasi ini.
function HierarchyGroup({
  title, entries, onPick, onView3d,
}: {
  title: string
  entries: AnatomyEntry[]
  onPick: (entry: AnatomyEntry) => void
  onView3d: (layer: AnatomyLayer['key']) => void
}) {
  return (
    <details className="group rounded-xl border border-neutral-200 dark:border-white/10">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-bold text-ink dark:text-white">
        {title}
        <IconChevronRight size={16} className="text-neutral-400 transition-transform group-open:rotate-90" />
      </summary>
      <div className="space-y-1.5 border-t border-neutral-100 p-2.5 dark:border-white/5">
        {entries.map((e) => (
          <div key={e.key} className="rounded-lg bg-neutral-50 p-2.5 dark:bg-white/5">
            <div className="flex items-start justify-between gap-2">
              <button onClick={() => onPick(e)} className="min-w-0 flex-1 text-left">
                <div className="text-sm font-bold text-ink dark:text-white">{e.label}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{e.description}</p>
              </button>
              {e.layer3d && (
                <button
                  onClick={() => onView3d(e.layer3d!)}
                  className="shrink-0 rounded-full border border-brand px-2.5 py-1 text-[10px] font-bold text-brand"
                >
                  View in 3D
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
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
  const [activeOrgan, setActiveOrgan] = useState<string | null>(null)
  const [focusKeywords, setFocusKeywords] = useState<string[] | null>(null)
  const [images, setImages] = useState<AnatomyImage[]>([])
  const [imagesLoading, setImagesLoading] = useState(false)
  const [imageKind, setImageKind] = useState<'anatomy' | 'pathology' | 'histology'>('anatomy')

  async function lookup(label: string, searchTerms: string[], kind: 'anatomy' | 'histology' = 'anatomy') {
    setSelectedLabel(label)
    setQuestion('')
    setLoading(true)
    setExplanation('')
    setDiseases([])
    setPhenotypes([])
    setImages([])
    setImageKind(kind)
    // Gambar diambil paralel dan TIDAK ikut menggagalkan lookup kalau
    // sumbernya sedang tidak bisa dijangkau — istilah ontologinya tetap muncul.
    loadImages(label, kind)
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

  async function loadImages(term: string, kind: 'anatomy' | 'pathology' | 'histology') {
    setImagesLoading(true)
    setImageKind(kind)
    try {
      const { images: imgs } = await api.anatomyImages(term, kind)
      setImages(imgs)
    } catch {
      setImages([])
    } finally {
      setImagesLoading(false)
    }
  }

  // Tap langsung pada satu struktur di model 3D (tulang/otot/pembuluh/
  // saraf/organ spesifik, bukan hanya sistemnya). Layer-nya sudah pasti
  // menyala (raycast cuma mengenai apa yang sedang terlihat), jadi tidak
  // perlu memaksa lapisan tertentu di sini.
  function onPickStructure(rawName: string, label: string) {
    setActiveWorkout(null)
    setActiveOrgan(null)
    setFocusKeywords(null)
    setHighlighted([rawName])
    lookup(label, [toSearchTerm(rawName)])
  }

  function onPickWorkoutMuscle(groupKey: string) {
    const group = WORKOUT_MUSCLE_GROUPS.find((g) => g.key === groupKey)
    if (!group) return
    setActiveWorkout(groupKey)
    setActiveOrgan(null)
    setFocusKeywords(null)
    setHighlighted(group.nodeNames)
    if (!layers.has('muscular')) toggleLayer('muscular')
    lookup(`${group.label} muscles`, group.searchTerms)
  }

  // Satu organ utama dipilih -- menyalakan lapisan 3D yang relevan, menyorot
  // & memperbesar (zoom) ke organ itu lewat kecocokan kata kunci nama nyata
  // (lihat organFocus.ts untuk kenapa substring, bukan nama persis).
  function onPickOrgan(organKey: string) {
    const organ = ORGAN_FOCUS.find((o) => o.key === organKey)
    if (!organ) return
    setActiveWorkout(null)
    setHighlighted([])
    setActiveOrgan(organKey)
    setFocusKeywords(organ.keywords)
    if (!layers.has(organ.layer)) toggleLayer(organ.layer)
    lookup(organ.label, organ.searchTerms)
  }

  // Satu entri hierarki anatomi (jaringan/sistem organ/region tubuh) diklik —
  // tidak menyorot satu struktur 3D spesifik (levelnya lebih umum dari itu),
  // tapi tetap mengambil istilah ontologi nyata untuk level tersebut.
  function onPickHierarchyEntry(entry: AnatomyEntry) {
    setActiveWorkout(null)
    setActiveOrgan(null)
    setFocusKeywords(null)
    setHighlighted([])
    lookup(entry.label, entry.searchTerms, entry.imageKind ?? 'anatomy')
  }

  function onViewLayer3d(layer: AnatomyLayer['key']) {
    if (!layers.has(layer)) toggleLayer(layer)
  }

  // "Ask" — pencarian bebas (bahasa natural atau gejala/fungsi). Kalau
  // pertanyaannya cocok dengan salah satu target latihan otot, otot itu ikut
  // disorot di model 3D.
  async function ask() {
    const q = question.trim()
    if (!q) return
    setAsking(true)
    setActiveWorkout(null)
    setActiveOrgan(null)
    setFocusKeywords(null)
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
      const matchedOrgan = ORGAN_FOCUS.find((o) => q.toLowerCase().includes(o.label.toLowerCase()))
      if (matchedGroup) {
        setActiveWorkout(matchedGroup.key)
        setHighlighted(matchedGroup.nodeNames)
        if (!layers.has('muscular')) toggleLayer('muscular')
      } else if (matchedOrgan) {
        setActiveOrgan(matchedOrgan.key)
        setFocusKeywords(matchedOrgan.keywords)
        if (!layers.has(matchedOrgan.layer)) toggleLayer(matchedOrgan.layer)
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

        <Body3D layers={layers} highlighted={highlighted} focusKeywords={focusKeywords} onPick={onPickStructure} />

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

        <div className="mt-4">
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Focus organ</div>
          <p className="mt-0.5 text-[11px] text-neutral-400">Zooms in on that organ specifically and highlights every part of it.</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ORGAN_FOCUS.map((o) => (
              <button
                key={o.key}
                onClick={() => onPickOrgan(o.key)}
                className={`min-h-[32px] rounded-full border px-3 text-xs font-bold transition ${
                  activeOrgan === o.key
                    ? 'border-brand bg-brand text-white'
                    : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Anatomy reference</div>
          <HierarchyGroup title="Tissue types (4)" entries={TISSUE_TYPES} onPick={onPickHierarchyEntry} onView3d={onViewLayer3d} />
          <HierarchyGroup title="Tissues under the microscope (23)" entries={TISSUE_SUBTYPES} onPick={onPickHierarchyEntry} onView3d={onViewLayer3d} />
          <HierarchyGroup title="Organ systems (11)" entries={ORGAN_SYSTEMS} onPick={onPickHierarchyEntry} onView3d={onViewLayer3d} />
          <HierarchyGroup title="Body regions (8)" entries={BODY_REGIONS} onPick={onPickHierarchyEntry} onView3d={onViewLayer3d} />
          <HierarchyGroup
            title="Female reproductive & skin (images + reference)"
            entries={IMAGE_ONLY_STRUCTURES}
            onPick={onPickHierarchyEntry}
            onView3d={onViewLayer3d}
          />
          <p className="px-1 text-[10.5px] leading-relaxed text-neutral-400">
            These structures have no geometry in the 3D dataset — female reproductive anatomy is absent from
            BodyParts3D entirely, and skin is deliberately stripped so the anatomy beneath it is visible. They are
            covered here with real anatomical terms (UBERON/FMA) and freely-licensed images instead.
          </p>
        </div>

        <div className="mt-4 min-w-0">
          {!selectedLabel && (
            <p className="text-sm leading-relaxed text-neutral-500">
              Tap a structure on the model, pick a workout target, browse the anatomy reference above, or ask a
              question — and get a plain-language explanation grounded in real ontology terms, not a diagnosis for
              you personally.
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

              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Images</span>
                  <button
                    onClick={() => loadImages(selectedLabel, 'anatomy')}
                    className={`min-h-[28px] rounded-full border px-2.5 text-[11px] font-bold transition ${
                      imageKind === 'anatomy' ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'
                    }`}
                  >
                    Anatomy
                  </button>
                  <button
                    onClick={() => loadImages(selectedLabel, 'histology')}
                    className={`min-h-[28px] rounded-full border px-2.5 text-[11px] font-bold transition ${
                      imageKind === 'histology' ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'
                    }`}
                  >
                    Histology
                  </button>
                  <button
                    onClick={() => loadImages(selectedLabel, 'pathology')}
                    className={`min-h-[28px] rounded-full border px-2.5 text-[11px] font-bold transition ${
                      imageKind === 'pathology' ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'
                    }`}
                  >
                    Pathology
                  </button>
                </div>
                {imagesLoading && <p className="mt-1.5 text-sm text-neutral-500">Loading images…</p>}
                {!imagesLoading && images.length === 0 && (
                  <p className="mt-1.5 text-sm text-neutral-500">No freely-licensed images found for this.</p>
                )}
                {!imagesLoading && images.length > 0 && (
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {images.map((img) => (
                      <figure key={img.url} className="overflow-hidden rounded-xl bg-neutral-50 dark:bg-white/5">
                        <img src={img.url} alt={img.title} loading="lazy" className="h-32 w-full bg-white object-contain" />
                        {/* Lisensi & pembuat WAJIB tampil — syarat CC, bukan hiasan. */}
                        <figcaption className="p-1.5">
                          <div className="line-clamp-2 text-[11px] font-semibold text-ink dark:text-white">{img.title}</div>
                          <a
                            href={img.sourcePage}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 block truncate text-[10px] text-neutral-400 underline"
                          >
                            {img.artist} · {img.license}
                          </a>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
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
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
          Anatomy and pathology images come from <a href="https://commons.wikimedia.org" target="_blank" rel="noreferrer" className="underline">Wikimedia Commons</a> —
          public-domain or Creative Commons files, each shown with its own author and licence. They are teaching
          images from a public archive, not photographs of you or of any patient of this clinic.
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
