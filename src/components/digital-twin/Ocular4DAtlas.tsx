import { useId, useMemo, useState } from 'react'
import { ocularOpticsSchematic } from '../../lib/ocularOpticsSchematic'
import { HraContextBridge } from './HraContextBridge'
import { HraResolvedAnatomyViewer } from './HraResolvedAnatomyViewer'

type OcularGroupKey =
  | 'surface'
  | 'fibrous'
  | 'uvea'
  | 'optics'
  | 'retina'
  | 'outflow'
  | 'neural'
  | 'adnexa'

type OcularStructure = {
  label: string
  term: string
  ontology: string
  group: OcularGroupKey
  role: string
  inspection: string
}

type VisionPhase = {
  label: string
  structure: string
  mechanism: string
  output: string
}

const GROUPS: { key: OcularGroupKey; label: string; subtitle: string }[] = [
  { key: 'surface', label: 'Ocular surface', subtitle: 'Conjunctiva, cornea and limbal interface' },
  { key: 'fibrous', label: 'Fibrous coat', subtitle: 'Cornea, sclera and corneoscleral junction' },
  { key: 'uvea', label: 'Uvea', subtitle: 'Iris, ciliary body and choroid' },
  { key: 'optics', label: 'Optical media', subtitle: 'Aqueous, pupil, lens, zonule and vitreous' },
  { key: 'outflow', label: 'Aqueous outflow', subtitle: 'Trabecular meshwork and scleral venous sinus' },
  { key: 'retina', label: 'Retina & macula', subtitle: 'Retina, macula, fovea, optic disc and ora serrata' },
  { key: 'neural', label: 'Neural pathway', subtitle: 'Optic nerve → optic chiasm → central visual pathway context' },
  { key: 'adnexa', label: 'Adnexa & orbit', subtitle: 'Palpebral/bulbar conjunctiva and orbital context' },
]

const STRUCTURES: OcularStructure[] = [
  { label: 'Bulbar conjunctiva', term: 'bulbar conjunctiva', ontology: 'FMA:59028 / FMA:59029', group: 'surface', role: 'Ocular surface mucosa over the anterior sclera.', inspection: 'Surface continuity and relation to the corneoscleral junction.' },
  { label: 'Palpebral conjunctiva', term: 'palpebral conjunctiva', ontology: 'FMA:223074–223078', group: 'surface', role: 'Conjunctival lining of the eyelids.', inspection: 'Upper/lower lid surface relationship and fornix context.' },
  { label: 'Cornea', term: 'cornea', ontology: 'FMA:58239 / FMA:58240', group: 'surface', role: 'Transparent anterior refracting surface.', inspection: 'Anterior optical interface; keep separate from lens accommodation.' },
  { label: 'Corneoscleral junction', term: 'corneoscleral junction', ontology: 'FMA:58343 / FMA:58344', group: 'fibrous', role: 'Limbal transition between cornea and sclera.', inspection: 'Important landmark adjacent to aqueous outflow structures.' },
  { label: 'Sclera', term: 'sclera', ontology: 'FMA:58271 / FMA:58272', group: 'fibrous', role: 'Fibrous external coat maintaining globe form.', inspection: 'Outer coat and relation to optic nerve exit.' },
  { label: 'Iris', term: 'iris', ontology: 'FMA:58236 / FMA:58237', group: 'uvea', role: 'Anterior uveal diaphragm controlling pupil aperture.', inspection: 'Pupil margin and anterior segment relationship.' },
  { label: 'Pupil', term: 'pupil', ontology: 'UBERON:0010223 / UBERON:0010224', group: 'optics', role: 'Variable aperture governing retinal illumination and depth of field.', inspection: 'Aperture only; not a physical tissue layer.' },
  { label: 'Ciliary body', term: 'ciliary body', ontology: 'FMA:58296 / FMA:58297', group: 'uvea', role: 'Uveal structure involved in aqueous production and accommodation apparatus.', inspection: 'Relationship with iris root, ciliary muscle and lens zonule.' },
  { label: 'Ciliary muscle', term: 'ciliary muscle', ontology: 'FMA:49152 / FMA:49153', group: 'uvea', role: 'Smooth muscle component of accommodation.', inspection: 'Accommodation mechanism context; geometry is not deformed by the teaching slider.' },
  { label: 'Ciliary processes', term: 'ciliary processes', ontology: 'UBERON:0010427', group: 'uvea', role: 'Processes of the ciliary body associated with aqueous production and zonular attachment.', inspection: 'Fine anterior-segment structure available in HRA eye mapping.' },
  { label: 'Trabecular meshwork', term: 'trabecular meshwork', ontology: 'UBERON:0005969', group: 'outflow', role: 'Conventional aqueous outflow tissue at the iridocorneal angle.', inspection: 'Inspect with scleral venous sinus and corneoscleral junction.' },
  { label: 'Scleral venous sinus (Schlemm canal)', term: 'scleral venous sinus', ontology: 'FMA:51874 / FMA:51875', group: 'outflow', role: 'Collector channel of conventional aqueous drainage.', inspection: 'Outflow pathway context; no pressure value is inferred from geometry.' },
  { label: 'Aqueous humor', term: 'aqueous humor', ontology: 'FMA:58820 / FMA:58821', group: 'optics', role: 'Clear anterior-segment fluid in the optical path.', inspection: 'Media-refrakta context from cornea toward pupil/lens.' },
  { label: 'Lens', term: 'lens', ontology: 'FMA:58242 / FMA:58243', group: 'optics', role: 'Transparent variable-focus optical element.', inspection: 'Accommodation teaching uses optical formulae; source GLB itself remains unchanged.' },
  { label: 'Suspensory ligament / zonule', term: 'suspensory ligament of lens', ontology: 'FMA:58839 / FMA:58840', group: 'optics', role: 'Zonular apparatus coupling ciliary body to lens.', inspection: 'Mechanical linkage for accommodation context.' },
  { label: 'Vitreous humor', term: 'vitreous humor', ontology: 'FMA:261236 / FMA:261238', group: 'optics', role: 'Transparent posterior-segment gel in the optical path.', inspection: 'Posterior optical media between lens and retina.' },
  { label: 'Choroid', term: 'choroid', ontology: 'FMA:58299 / FMA:58300', group: 'uvea', role: 'Vascular uveal layer external to retina.', inspection: 'Retina–choroid anatomical relationship.' },
  { label: 'Retina', term: 'retina', ontology: 'FMA:58302 / FMA:58303', group: 'retina', role: 'Neural sensory tissue receiving the focused image.', inspection: 'Source geometry represents gross anatomy; cellular retinal lamination is not fabricated.' },
  { label: 'Macula lutea', term: 'macula lutea', ontology: 'FMA:58638 / FMA:58639', group: 'retina', role: 'Central retinal specialization associated with high-acuity vision.', inspection: 'Central retinal landmark.' },
  { label: 'Fovea centralis', term: 'fovea centralis', ontology: 'FMA:58661 / FMA:58663', group: 'retina', role: 'Central macular specialization for highest spatial acuity.', inspection: 'Fine mapped landmark; do not interpret size as patient biometry.' },
  { label: 'Optic disc', term: 'optic disc', ontology: 'FMA:58635 / FMA:58636', group: 'retina', role: 'Retinal exit point of ganglion-cell axons.', inspection: 'Transition from retina to optic nerve.' },
  { label: 'Ora serrata', term: 'ora serrata', ontology: 'FMA:58601 / FMA:58602', group: 'retina', role: 'Anterior limit of photosensitive retina.', inspection: 'Anterior retinal boundary.' },
  { label: 'Optic nerve', term: 'optic nerve', ontology: 'FMA:50875 / FMA:50878', group: 'neural', role: 'Axonal pathway carrying retinal output toward the brain.', inspection: 'Inspect globe–nerve continuity separately from retinal light capture.' },
  { label: 'Optic chiasm', term: 'optic chiasm', ontology: 'UBERON:0000959', group: 'neural', role: 'Midline partial decussation of optic pathways.', inspection: 'Binocular pathway context; requires brain source model rather than eye-only GLB.' },
]

const VISION_PHASES: VisionPhase[] = [
  { label: '01 · Light entry', structure: 'Cornea → aqueous', mechanism: 'Incoming light crosses the air–cornea interface and anterior optical media.', output: 'Optical path begins; no retinal signal exists yet.' },
  { label: '02 · Aperture', structure: 'Iris → pupil', mechanism: 'Pupil diameter changes retinal illuminance and depth-of-field context.', output: 'Amount and cone of admitted light change.' },
  { label: '03 · Accommodation', structure: 'Ciliary muscle → zonule → lens', mechanism: 'Near viewing requires increased accommodative optical demand; lens shape change is represented only as a schematic.', output: 'Optical focus is adjusted toward the retinal plane.' },
  { label: '04 · Posterior media', structure: 'Lens → vitreous', mechanism: 'Light traverses the posterior optical media toward the retina.', output: 'Focused bundle reaches the sensory surface.' },
  { label: '05 · Retinal reception', structure: 'Retina → macula/fovea', mechanism: 'Retinal photoreceptors initiate transduction; central retinal specializations support fine spatial vision.', output: 'Optical information becomes neural activity.' },
  { label: '06 · Neural output', structure: 'Optic disc → optic nerve', mechanism: 'Retinal ganglion-cell axons leave the globe through the optic disc.', output: 'Signal propagates toward central visual pathways.' },
  { label: '07 · Binocular integration', structure: 'Optic nerves → chiasm → cortex context', mechanism: 'Two-eye information supports binocular alignment, fusion and stereoscopic depth perception.', output: 'Integrated visual perception rather than a single-eye image.' },
]

const EXAM_MODULES = [
  { label: 'Visual acuity', detail: 'Snellen → if reduced, pinhole branch → refractive correction/media evaluation context.', source: 'Slides 6 & 13' },
  { label: 'Low-vision sequence', detail: 'Finger counting → hand movement → light projection / color perception when Snellen acuity is not measurable.', source: 'Slide 6' },
  { label: 'Color vision', detail: 'Ishihara screening; the source deck proceeds to Farnsworth Hue testing when red–green deficiency is suspected.', source: 'Slides 36–46' },
  { label: 'Stereoscopy', detail: 'Binocular three-dimensional vision is treated as one of the four components of normal/perfect vision.', source: 'Slides 2 & 47–52' },
  { label: 'Visual field', detail: 'Confrontation testing and campimetry/perimetry are included in the examination pathway.', source: 'Slides 56–63' },
]

const SOURCE_TERMS = [
  'eye', 'cornea', 'bulbar conjunctiva', 'palpebral conjunctiva', 'corneoscleral junction', 'sclera',
  'iris', 'pupil', 'ciliary body', 'ciliary muscle', 'ciliary processes', 'trabecular meshwork',
  'scleral venous sinus', 'aqueous humor', 'lens', 'suspensory ligament of lens', 'vitreous humor',
  'choroid', 'retina', 'macula lutea', 'fovea centralis', 'optic disc', 'ora serrata', 'optic nerve', 'optic chiasm',
]

function OpticsSchematic({ pupilMm, distanceM }: { pupilMm: number; distanceM: number }) {
  const { accommodationD, pupilHalf, lensRx } = ocularOpticsSchematic(pupilMm, distanceM)

  return (
    <figure className="min-w-0">
    <svg viewBox="0 0 760 270" className="h-auto w-full" role="img" aria-label="Educational ocular optics schematic">
      <defs>
        <linearGradient id="eye-globe" x1="0" x2="1"><stop offset="0" stopColor="#12202c"/><stop offset="1" stopColor="#071018"/></linearGradient>
        <linearGradient id="eye-lens" x1="0" x2="1"><stop offset="0" stopColor="#dbf8ff" stopOpacity=".5"/><stop offset=".5" stopColor="#fff" stopOpacity=".8"/><stop offset="1" stopColor="#8ddcff" stopOpacity=".45"/></linearGradient>
      </defs>
      <rect width="760" height="270" rx="28" fill="#05090d" />
      <text x="24" y="30" fill="#8ba2b5" fontSize="15" fontWeight="800">OPTICAL SCHEMATIC · EDUCATIONAL, NOT PATIENT BIOMETRY</text>
      <ellipse cx="495" cy="140" rx="205" ry="108" fill="url(#eye-globe)" stroke="#9db8c8" strokeOpacity=".35" strokeWidth="2" />
      <path d="M318 62 Q274 140 318 218" fill="none" stroke="#9fe8ff" strokeWidth="8" strokeOpacity=".82" />
      <line x1="365" y1="82" x2="365" y2={140 - pupilHalf} stroke="#5e7890" strokeWidth="12" strokeLinecap="butt" />
      <line x1="365" y1={140 + pupilHalf} x2="365" y2="198" stroke="#5e7890" strokeWidth="12" strokeLinecap="butt" />
      <ellipse cx="405" cy="140" rx={lensRx} ry="58" fill="url(#eye-lens)" stroke="#d5f4ff" strokeOpacity=".75" />
      <path d="M683 55 Q700 140 683 225" fill="none" stroke="#ff7f96" strokeWidth="5" strokeOpacity=".75" />
      <circle cx="673" cy="140" r="7" fill="#ffd66e" />
      <path d={`M34 82 L318 106 L365 ${140 - pupilHalf * .38} L405 119 L673 140`} fill="none" stroke="#ffe08a" strokeWidth="2.2" opacity=".9" />
      <path d={`M34 198 L318 174 L365 ${140 + pupilHalf * .38} L405 161 L673 140`} fill="none" stroke="#ffe08a" strokeWidth="2.2" opacity=".9" />
      <path d="M34 140 L673 140" fill="none" stroke="#75cfff" strokeWidth="1.4" strokeDasharray="7 7" opacity=".65" />
      <text x="300" y="246" textAnchor="end" fill="#d6e6f0" fontSize="18" fontWeight="700">cornea</text>
      <text x="365" y="246" textAnchor="middle" fill="#d6e6f0" fontSize="18" fontWeight="700">pupil</text>
      <text x="435" y="246" fill="#d6e6f0" fontSize="18" fontWeight="700">lens</text>
      <text x="654" y="246" fill="#d6e6f0" fontSize="18" fontWeight="700">retina</text>
      <text x="24" y="55" fill="#d6e6f0" fontSize="17" fontWeight="800">Target {distanceM.toFixed(distanceM < 1 ? 2 : 1)} m · pupil {pupilMm.toFixed(1)} mm</text>
      <text x="24" y="75" fill="#d6e6f0" fontSize="17" fontWeight="800">Accommodation demand ≈ {accommodationD.toFixed(2)} D</text>
    </svg>
    <figcaption className="mt-3 space-y-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-200">
      <p><strong>Diagram labels:</strong> cornea → pupil → lens → retina.</p>
      <p>Target {distanceM.toFixed(distanceM < 1 ? 2 : 1)} m · pupil {pupilMm.toFixed(1)} mm · accommodation demand ≈ {accommodationD.toFixed(2)} D.</p>
      <p className="text-neutral-500 dark:text-neutral-400">Educational schematic; dimensions are illustrative, not measured.</p>
    </figcaption>
    </figure>
  )
}

// This lesson is also loaded independently by the active Specialty labs eye module.
export function OcularOpticsLesson() {
  const controlsId = useId()
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [pupilMm, setPupilMm] = useState(4)
  const [distanceM, setDistanceM] = useState(6)
  const { accommodationD } = ocularOpticsSchematic(pupilMm, distanceM)
  const focalLengthM = 1 / accommodationD

  return (
      <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#080c10] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.17em] text-violet-700 dark:text-violet-300">4D visual physiology</div>
            <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">Light → focus → retina → neural integration</h3>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">The timeline explains sequence and mechanism. Near focus: ciliary contraction reduces zonular tension, allowing a thicker lens; distance focus reverses this relationship. It does not pretend that a static reference mesh is a live eye or patient-specific optical biometry.</p>
          </div>
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[9px] font-black text-neutral-500 dark:border-white/10 dark:bg-white/[.03] dark:text-neutral-300">Phase {phaseIndex + 1}/{VISION_PHASES.length}</span>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {VISION_PHASES.map((phase, index) => (
            <button key={phase.label} aria-pressed={phaseIndex === index} onClick={() => setPhaseIndex(index)} className={`min-w-[205px] shrink-0 rounded-2xl border p-3 text-left ${phaseIndex === index ? 'border-violet-300 bg-violet-50 dark:border-violet-300/30 dark:bg-violet-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <div className="text-[9px] font-black text-violet-700 dark:text-violet-300">{phase.label}</div>
              <div className="mt-1 text-[11px] font-black text-neutral-950 dark:text-white">{phase.structure}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,.7fr)]">
          <OpticsSchematic pupilMm={pupilMm} distanceM={distanceM} />
          <div className="space-y-3">
            <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
              <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Current phase</div>
              <div className="mt-1 text-[13px] font-black text-neutral-950 dark:text-white">{VISION_PHASES[phaseIndex].structure}</div>
              <p className="mt-2 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">{VISION_PHASES[phaseIndex].mechanism}</p>
              <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400"><strong>Output:</strong> {VISION_PHASES[phaseIndex].output}</p>
            </article>

            <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
              <label htmlFor={`${controlsId}-pupil`} className="flex items-center justify-between text-[9px] font-black uppercase tracking-wide text-neutral-500"><span>Pupil aperture</span><span>{pupilMm.toFixed(1)} mm</span></label>
              <input id={`${controlsId}-pupil`} type="range" min="2" max="8" step="0.5" value={pupilMm} onChange={(event) => setPupilMm(Number(event.target.value))} className="mt-2 w-full" />
              <label htmlFor={`${controlsId}-distance`} className="mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-wide text-neutral-500"><span>Target distance</span><span>{distanceM < 1 ? distanceM.toFixed(2) : distanceM.toFixed(1)} m</span></label>
              <input id={`${controlsId}-distance`} type="range" min="0.25" max="6" step="0.05" value={distanceM} onChange={(event) => setDistanceM(Number(event.target.value))} className="mt-2 w-full" />
            </article>

            <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
              <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Optics formulae</div>
              <p className="mt-2 text-[10px]">Schematic dimensions are illustrative, not measured. <a href="https://pubmed.ncbi.nlm.nih.gov/33491156/" target="_blank" rel="noreferrer" className="underline">Accommodation mechanism reference</a>. Source-checked correction; qualified human review pending.</p>
              <div className="mt-2 space-y-2 text-[10px] text-neutral-600 dark:text-neutral-300">
                <div><strong>A ≈ 1 / d(m)</strong> → displayed near-focus demand ≈ <strong>{accommodationD.toFixed(2)} D</strong>.</div>
                <div><strong>D = 1 / f(m)</strong> → optical power is the reciprocal of focal length in metres.</div>
                <div><strong>1/f = 1/dₒ + 1/dᵢ</strong> → thin-lens teaching relation.</div>
              </div>
              <p className="mt-2 text-[8px] leading-relaxed text-neutral-400">These are elementary geometric-optics relations. They are not a biometric schematic eye, refraction prescription, axial-length calculation, or clinical accommodation measurement. With A = 1/d, the reciprocal focal-length display is mathematically {Number.isFinite(focalLengthM) ? `${focalLengthM.toFixed(2)} m` : '∞'} for this simplified demand term.</p>
            </article>
          </div>
        </div>
      </section>
  )
}

export function Ocular4DAtlas() {
  const [groupKey, setGroupKey] = useState<OcularGroupKey>('optics')
  const [inspection, setInspection] = useState<1 | 20 | 200>(20)
  const [selectedStructure, setSelectedStructure] = useState('lens')

  const group = GROUPS.find((item) => item.key === groupKey) ?? GROUPS[0]
  const visibleStructures = useMemo(() => STRUCTURES.filter((item) => item.group === groupKey), [groupKey])
  const activeStructure = visibleStructures.find((item) => item.term === selectedStructure) ?? visibleStructures[0]

  function chooseGroup(next: OcularGroupKey) {
    setGroupKey(next)
    const first = STRUCTURES.find((item) => item.group === next)
    if (first) setSelectedStructure(first.term)
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#080c10]">
        <div className="border-b border-neutral-200 p-4 dark:border-white/10 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-sky-700 dark:text-sky-300">Panacea Eye 4D · source-backed ocular atlas</div>
              <h2 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-2xl">Globe → optical media → retina → optic pathway.</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">Gross anatomy is resolved from HuBMAP HRA source geometry and ontology mapping. Time is represented by explicit visual-physiology phases. No heartbeat-like animation, invented retinal scan, or patient diagnosis is generated.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-[9px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-300">
              <strong className="block text-neutral-900 dark:text-white">Inspection scale</strong>
              1× = system · 20× = structure · 200× = mapped fine-structure inspection. “200×” is teaching magnification, not a claim of histologic or metric reconstruction.
            </div>
          </div>

          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {GROUPS.map((item) => (
              <button key={item.key} aria-pressed={item.key === groupKey} onClick={() => chooseGroup(item.key)} className={`min-w-[170px] shrink-0 rounded-2xl border p-3 text-left transition ${item.key === groupKey ? 'border-sky-300 bg-sky-50 dark:border-sky-300/30 dark:bg-sky-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
                <div className="text-[11px] font-black text-neutral-950 dark:text-white">{item.label}</div>
                <div className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.subtitle}</div>
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {([1, 20, 200] as const).map((scale) => (
              <button key={scale} aria-pressed={inspection === scale} onClick={() => setInspection(scale)} className={`rounded-full border px-3 py-2 text-[9px] font-black ${inspection === scale ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300'}`}>{scale}× inspection</button>
            ))}
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="border-b border-neutral-200 p-3 dark:border-white/10 xl:border-b-0 xl:border-r">
            <div className="px-1 text-[9px] font-black uppercase tracking-[.15em] text-neutral-400">{group.label}</div>
            <div className="mt-2 space-y-1.5">
              {visibleStructures.map((item) => (
                <button key={item.term} onClick={() => setSelectedStructure(item.term)} className={`w-full rounded-2xl border p-3 text-left ${item.term === activeStructure?.term ? 'border-sky-300 bg-sky-50 dark:border-sky-300/30 dark:bg-sky-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.02]'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-black text-neutral-950 dark:text-white">{item.label}</span>
                    <span className="shrink-0 text-[7px] font-bold text-neutral-400">{item.ontology}</span>
                  </div>
                  <p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{inspection === 1 ? item.role : inspection === 20 ? item.inspection : `${item.role} ${item.inspection}`}</p>
                </button>
              ))}
            </div>
          </aside>

          <div className="p-3 sm:p-4">
            {activeStructure ? <HraResolvedAnatomyViewer
              key={`${groupKey}-${activeStructure.term}`}
              title={`${activeStructure.label} · HRA source geometry`}
              description={`Selected ontology: ${activeStructure.ontology}. Source model stays static; physiology controls below never deform the HRA mesh.`}
              terms={[activeStructure.term, 'eye']}
              maxResults={12}
            /> : <p role="status" className="p-4 text-sm text-neutral-600 dark:text-neutral-300">No selectable structures are configured in this group yet. Choose Ocular surface for the existing conjunctival entries. Dedicated adnexal and orbital coverage remains incomplete.</p>}
          </div>
        </div>
      </section>

      <HraContextBridge title="Mapped ocular source structures" terms={SOURCE_TERMS} maxResults={18} />

      <OcularOpticsLesson />

      <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#080c10] sm:p-5">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.17em] text-emerald-700 dark:text-emerald-300">Clinical examination bridge</div>
          <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">Perfect Human Vision → functional examination map</h3>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">The attached teaching deck defines normal/perfect vision using acuity, color vision, stereoscopy and visual field. Panacea keeps these as examination concepts rather than pretending a phone display replaces calibrated clinical equipment.</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {EXAM_MODULES.map((item) => (
            <article key={item.label} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
              <div className="text-[11px] font-black text-neutral-950 dark:text-white">{item.label}</div>
              <p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.detail}</p>
              <div className="mt-2 text-[8px] font-black uppercase tracking-wide text-neutral-400">Source deck · {item.source}</div>
            </article>
          ))}
        </div>
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[9px] leading-relaxed text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">Ishihara and standardized stereopsis/perimetry materials are not recreated as diagnostic tests here. Authentic testing depends on standardized plates, viewing conditions, calibrated devices and clinical interpretation.</div>
      </section>
    </div>
  )
}

export default Ocular4DAtlas
