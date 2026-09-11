import { lazy, Suspense, useMemo, useState } from 'react'
import { HraContextBridge } from './HraContextBridge'
import { HraResolvedAnatomyViewer } from './HraResolvedAnatomyViewer'

const Ocular4DAtlas = lazy(() =>
  import('./Ocular4DAtlas').then((module) => ({ default: module.Ocular4DAtlas })),
)

type GroupKey =
  | 'surface'
  | 'anterior'
  | 'uvea'
  | 'lens'
  | 'retina'
  | 'neural'
  | 'orbit'

type Structure = {
  id: string
  label: string
  term: string
  group: GroupKey
  relation: string
  ontology: string
}

const GROUPS: { key: GroupKey; label: string; detail: string }[] = [
  { key: 'surface', label: 'Surface', detail: 'Conjunctiva · cornea · limbus · sclera' },
  { key: 'anterior', label: 'Anterior segment', detail: 'Chambers · angle · trabecular outflow' },
  { key: 'uvea', label: 'Uvea', detail: 'Iris · ciliary body · choroid' },
  { key: 'lens', label: 'Lens apparatus', detail: 'Lens · capsule · zonule · ciliary muscle' },
  { key: 'retina', label: 'Retina', detail: 'Retina · macula · fovea · disc · ora serrata' },
  { key: 'neural', label: 'Neural pathway', detail: 'Optic nerve · chiasm · tract context' },
  { key: 'orbit', label: 'Orbit & adnexa', detail: 'Extraocular muscles · lacrimal apparatus · orbital context' },
]

const STRUCTURES: Structure[] = [
  { id: 'bulbar-conjunctiva', label: 'Bulbar conjunctiva', term: 'bulbar conjunctiva', group: 'surface', relation: 'Mucosal surface over anterior sclera, continuous with fornix and palpebral conjunctiva.', ontology: 'FMA:59028' },
  { id: 'palpebral-conjunctiva', label: 'Palpebral conjunctiva', term: 'palpebral conjunctiva', group: 'surface', relation: 'Lid conjunctiva lining the posterior eyelid surface.', ontology: 'FMA:223074' },
  { id: 'cornea', label: 'Cornea', term: 'cornea', group: 'surface', relation: 'Transparent anterior fibrous coat and principal refracting surface.', ontology: 'FMA:58239' },
  { id: 'limbus', label: 'Corneoscleral limbus', term: 'corneoscleral junction', group: 'surface', relation: 'Transition zone between cornea and sclera adjacent to angle/outflow anatomy.', ontology: 'FMA:58343' },
  { id: 'sclera', label: 'Sclera', term: 'sclera', group: 'surface', relation: 'Dense fibrous external coat surrounding most of the globe.', ontology: 'FMA:58271' },
  { id: 'anterior-chamber', label: 'Anterior chamber', term: 'anterior chamber of eye', group: 'anterior', relation: 'Space between posterior cornea and anterior iris/lens plane containing aqueous humor.', ontology: 'UBERON:0001774' },
  { id: 'posterior-chamber', label: 'Posterior chamber', term: 'posterior chamber of eye', group: 'anterior', relation: 'Narrow aqueous-filled compartment between posterior iris and anterior lens/ciliary body.', ontology: 'UBERON:0001802' },
  { id: 'trabecular-meshwork', label: 'Trabecular meshwork', term: 'trabecular meshwork', group: 'anterior', relation: 'Conventional aqueous outflow tissue at the iridocorneal angle.', ontology: 'UBERON:0005969' },
  { id: 'schlemm', label: 'Schlemm canal', term: 'scleral venous sinus', group: 'anterior', relation: 'Circumferential collector channel receiving conventional aqueous drainage.', ontology: 'FMA:51874' },
  { id: 'iris', label: 'Iris', term: 'iris', group: 'uvea', relation: 'Anterior uveal diaphragm forming the pupil margin.', ontology: 'FMA:58236' },
  { id: 'ciliary-body', label: 'Ciliary body', term: 'ciliary body', group: 'uvea', relation: 'Anterior choroidal continuation containing ciliary muscle and processes.', ontology: 'FMA:58296' },
  { id: 'ciliary-processes', label: 'Ciliary processes', term: 'ciliary processes', group: 'uvea', relation: 'Radial processes associated with aqueous production and zonular attachment.', ontology: 'UBERON:0010427' },
  { id: 'choroid', label: 'Choroid', term: 'choroid', group: 'uvea', relation: 'Vascular pigmented layer between sclera and retina.', ontology: 'FMA:58299' },
  { id: 'lens', label: 'Lens', term: 'lens', group: 'lens', relation: 'Transparent biconvex optical structure behind the iris.', ontology: 'FMA:58242' },
  { id: 'lens-capsule', label: 'Lens capsule', term: 'lens capsule', group: 'lens', relation: 'Elastic basement-membrane capsule surrounding the lens.', ontology: 'FMA:58831' },
  { id: 'zonule', label: 'Zonular fibers', term: 'suspensory ligament of lens', group: 'lens', relation: 'Fibers linking ciliary processes to the lens capsule.', ontology: 'FMA:58839' },
  { id: 'ciliary-muscle', label: 'Ciliary muscle', term: 'ciliary muscle', group: 'lens', relation: 'Smooth muscle ring controlling zonular tension during accommodation.', ontology: 'FMA:49152' },
  { id: 'vitreous', label: 'Vitreous body', term: 'vitreous humor', group: 'lens', relation: 'Transparent gel occupying the posterior segment behind the lens.', ontology: 'FMA:261236' },
  { id: 'retina', label: 'Retina', term: 'retina', group: 'retina', relation: 'Neurosensory tissue lining the posterior globe.', ontology: 'FMA:58302' },
  { id: 'macula', label: 'Macula lutea', term: 'macula lutea', group: 'retina', relation: 'Central retinal specialization for high-acuity vision.', ontology: 'FMA:58638' },
  { id: 'fovea', label: 'Fovea centralis', term: 'fovea centralis', group: 'retina', relation: 'Central macular pit with maximal cone density and spatial acuity.', ontology: 'FMA:58661' },
  { id: 'optic-disc', label: 'Optic disc', term: 'optic disc', group: 'retina', relation: 'Exit site for retinal ganglion-cell axons and retinal vessels.', ontology: 'FMA:58635' },
  { id: 'ora-serrata', label: 'Ora serrata', term: 'ora serrata', group: 'retina', relation: 'Anterior serrated limit of photosensitive retina.', ontology: 'FMA:58601' },
  { id: 'optic-nerve', label: 'Optic nerve', term: 'optic nerve', group: 'neural', relation: 'CN II carrying retinal ganglion-cell axons from globe toward the chiasm.', ontology: 'FMA:50875' },
  { id: 'optic-chiasm', label: 'Optic chiasm', term: 'optic chiasm', group: 'neural', relation: 'Partial decussation of nasal retinal fibers at the ventral diencephalon.', ontology: 'UBERON:0000959' },
  { id: 'optic-tract', label: 'Optic tract', term: 'optic tract', group: 'neural', relation: 'Post-chiasmal visual pathway toward lateral geniculate and related targets.', ontology: 'FMA:50877' },
  { id: 'superior-rectus', label: 'Superior rectus', term: 'superior rectus muscle', group: 'orbit', relation: 'Extraocular rectus muscle on the superior globe.', ontology: 'FMA:49035' },
  { id: 'inferior-rectus', label: 'Inferior rectus', term: 'inferior rectus muscle', group: 'orbit', relation: 'Extraocular rectus muscle on the inferior globe.', ontology: 'FMA:49037' },
  { id: 'medial-rectus', label: 'Medial rectus', term: 'medial rectus muscle', group: 'orbit', relation: 'Extraocular rectus muscle on the medial globe.', ontology: 'FMA:49039' },
  { id: 'lateral-rectus', label: 'Lateral rectus', term: 'lateral rectus muscle', group: 'orbit', relation: 'Extraocular rectus muscle on the lateral globe.', ontology: 'FMA:49041' },
  { id: 'superior-oblique', label: 'Superior oblique', term: 'superior oblique muscle', group: 'orbit', relation: 'Trochlea-reflected extraocular muscle inserting posterolaterally.', ontology: 'FMA:49043' },
  { id: 'inferior-oblique', label: 'Inferior oblique', term: 'inferior oblique muscle', group: 'orbit', relation: 'Extraocular muscle arising anteriorly and passing posterolaterally beneath the globe.', ontology: 'FMA:49045' },
  { id: 'lacrimal-gland', label: 'Lacrimal gland', term: 'lacrimal gland', group: 'orbit', relation: 'Tear-producing gland in the superolateral orbit.', ontology: 'FMA:59101' },
  { id: 'lacrimal-sac', label: 'Lacrimal sac', term: 'lacrimal sac', group: 'orbit', relation: 'Drainage reservoir between canaliculi and nasolacrimal duct.', ontology: 'FMA:59107' },
  { id: 'nasolacrimal-duct', label: 'Nasolacrimal duct', term: 'nasolacrimal duct', group: 'orbit', relation: 'Drainage duct from lacrimal sac into the inferior nasal meatus.', ontology: 'FMA:59111' },
]

function LoadingEye() {
  return (
    <div className="rounded-[22px] border border-neutral-200 bg-white p-8 text-center text-[12px] font-medium text-neutral-500 dark:border-white/10 dark:bg-white/[.035]">
      Loading ocular source anatomy…
    </div>
  )
}

export function OcularAnatomyAtlas() {
  const [mode, setMode] = useState<'anatomy' | 'later'>('anatomy')
  const [groupKey, setGroupKey] = useState<GroupKey>('surface')
  const visible = useMemo(() => STRUCTURES.filter((item) => item.group === groupKey), [groupKey])
  const [selectedId, setSelectedId] = useState('cornea')

  const selected = STRUCTURES.find((item) => item.id === selectedId && item.group === groupKey) ?? visible[0] ?? STRUCTURES[0]
  const group = GROUPS.find((item) => item.key === groupKey) ?? GROUPS[0]

  function chooseGroup(next: GroupKey) {
    setGroupKey(next)
    const first = STRUCTURES.find((item) => item.group === next)
    if (first) setSelectedId(first.id)
  }

  if (mode === 'later') {
    return (
      <div className="space-y-4">
        <section className="rounded-[22px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[8px] font-medium uppercase tracking-[.13em] text-neutral-400">Preserved module</div>
              <div className="mt-1 text-[14px] font-semibold text-neutral-950 dark:text-white">Visual physiology & examination</div>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">This existing Claude module remains available, but it is no longer mixed into the primary anatomy workflow.</p>
            </div>
            <button type="button" onClick={() => setMode('anatomy')} className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-[10px] font-semibold text-neutral-700 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-200">
              ← Back to eye anatomy
            </button>
          </div>
        </section>
        <Suspense fallback={<LoadingEye />}><Ocular4DAtlas /></Suspense>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d11]">
        <header className="border-b border-neutral-200 p-4 dark:border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <div className="text-[8px] font-medium uppercase tracking-[.13em] text-sky-700 dark:text-sky-300">Eye anatomy · source first</div>
              <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-neutral-950 dark:text-white">Specific ocular structures, not a generic toy eye</h2>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                Each selection resolves only the requested structure term. Panacea no longer falls back to a generic whole-eye model when a fine structure is not available.
              </p>
            </div>
            <button type="button" onClick={() => setMode('later')} className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-[9px] font-medium text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">
              Physiology & exam · later
            </button>
          </div>

          <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {GROUPS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => chooseGroup(item.key)}
                className={`min-w-[145px] shrink-0 rounded-xl border px-3 py-2.5 text-left ${
                  groupKey === item.key
                    ? 'border-sky-300 bg-sky-50 dark:border-sky-300/30 dark:bg-sky-300/10'
                    : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'
                }`}
              >
                <span className="block text-[10px] font-semibold text-neutral-950 dark:text-white">{item.label}</span>
                <span className="mt-1 block text-[8px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.detail}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="grid xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-neutral-200 p-3 dark:border-white/10 xl:border-b-0 xl:border-r">
            <div className="px-1 text-[8px] font-medium uppercase tracking-[.13em] text-neutral-400">{group.label}</div>
            <div className="mt-2 max-h-[560px] space-y-1.5 overflow-y-auto pr-1">
              {visible.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-xl border p-2.5 text-left ${
                    item.id === selected.id
                      ? 'border-sky-300 bg-sky-50 dark:border-sky-300/30 dark:bg-sky-300/10'
                      : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.02]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-semibold text-neutral-950 dark:text-white">{item.label}</span>
                    <span className="shrink-0 text-[7px] font-medium text-neutral-400">{item.ontology}</span>
                  </div>
                  <p className="mt-1 text-[8px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.relation}</p>
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-3 p-3 sm:p-4">
            <HraResolvedAnatomyViewer
              title={`${selected.label} · source geometry`}
              description={`${selected.relation} Requested term: "${selected.term}". If no specific GLB exists, the viewer reports that limitation instead of substituting decorative anatomy.`}
              terms={[selected.term]}
              maxResults={8}
            />
            <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
              <div className="text-[8px] font-medium uppercase tracking-[.12em] text-neutral-400">Anatomical relation</div>
              <div className="mt-1 text-[12px] font-semibold text-neutral-950 dark:text-white">{selected.label}</div>
              <p className="mt-1 text-[9px] leading-relaxed text-neutral-600 dark:text-neutral-300">{selected.relation}</p>
            </div>
          </div>
        </div>
      </section>

      <details className="rounded-[22px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035]">
        <summary className="cursor-pointer list-none text-[11px] font-semibold text-neutral-800 dark:text-white">Mapped ocular source coverage</summary>
        <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-white/10">
          <HraContextBridge title="Ocular source terms" terms={STRUCTURES.map((item) => item.term)} maxResults={20} />
        </div>
      </details>
    </div>
  )
}

export default OcularAnatomyAtlas
