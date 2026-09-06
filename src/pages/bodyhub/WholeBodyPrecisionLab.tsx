import { useMemo, useState } from 'react'
import {
  ATLAS_REFERENCE_MODEL,
  MOVEMENT_PRIMITIVES,
  SPECIALTY_ATLAS_MODULES,
  WHOLE_BODY_REGIONS,
  type AtlasLayerKey,
  type AtlasRegionKey,
  type GeometryProvenance,
} from '../../lib/wholeBodyAtlasBlueprint'
import { calculateExternalLoad } from '../../lib/biomechanicsModel'

interface Props {
  onHighlight?: (nodeHints: string[]) => void
  onEnableLayer?: (layer: AtlasLayerKey) => void
  onSetUnfold?: (amount: number) => void
  onSetDissectionDepth?: (depth: number) => void
}

type Mode = 'unfolded' | 'specialty' | 'movement'

const PROVENANCE_LABEL: Record<GeometryProvenance, string> = {
  'native-geometry': 'Native geometry',
  'adjacent-geometry': 'Adjacent / partial geometry',
  'not-represented': 'Not directly represented',
}

function ProvenanceBadge({ value }: { value: GeometryProvenance }) {
  const cls = value === 'native-geometry'
    ? 'border-brand/30 bg-brand/10 text-brand'
    : value === 'adjacent-geometry'
      ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
      : 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
  return <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${cls}`}>{PROVENANCE_LABEL[value]}</span>
}

function MiniBodyMap({ region }: { region: AtlasRegionKey }) {
  const active = (key: AtlasRegionKey) => key === region
  const cell = (key: AtlasRegionKey, label: string) => (
    <div className={`rounded-xl border px-2 py-2 text-center text-[10px] font-black transition ${active(key) ? 'border-brand bg-brand text-white shadow-lg shadow-brand/20' : 'border-white/10 bg-white/5 text-neutral-400'}`}>
      {label}
    </div>
  )
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950 p-3 text-white">
      <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-brand">Whole-body navigator</div>
      <div className="mx-auto grid max-w-[220px] gap-1">
        {cell('head-neck', 'HEAD / NECK')}
        {cell('thorax', 'THORAX')}
        <div className="grid grid-cols-3 gap-1">
          {cell('upper-limb', 'UPPER LIMB')}
          {cell('abdomen', 'ABDOMEN')}
          {cell('spine-back', 'SPINE / BACK')}
        </div>
        {cell('pelvis-perineum', 'PELVIS / PERINEUM')}
        {cell('lower-limb', 'LOWER LIMBS')}
      </div>
      <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">Navigation scaffold only. Final agent pass should bind each region to camera presets, clipping volumes and exact mesh selections.</p>
    </div>
  )
}

function MovementDiagram({ chain }: { chain: string[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
      <div className="flex min-w-max items-center gap-2">
        {chain.map((step, index) => (
          <div key={`${step}-${index}`} className="flex items-center gap-2">
            <div className="rounded-xl border border-brand/30 bg-brand/5 px-3 py-2 text-[10px] font-black text-ink dark:text-white">{step}</div>
            {index < chain.length - 1 && <div className="text-brand">→</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function WholeBodyPrecisionLab({ onHighlight, onEnableLayer, onSetUnfold, onSetDissectionDepth }: Props) {
  const [mode, setMode] = useState<Mode>('unfolded')
  const [regionKey, setRegionKey] = useState<AtlasRegionKey>('thorax')
  const [specialtyId, setSpecialtyId] = useState(SPECIALTY_ATLAS_MODULES[0].id)
  const [movementId, setMovementId] = useState(MOVEMENT_PRIMITIVES[0].id)
  const [unfold, setUnfold] = useState(0.18)
  const [depth, setDepth] = useState(0)

  const region = WHOLE_BODY_REGIONS.find((item) => item.key === regionKey) ?? WHOLE_BODY_REGIONS[0]
  const specialty = SPECIALTY_ATLAS_MODULES.find((item) => item.id === specialtyId) ?? SPECIALTY_ATLAS_MODULES[0]
  const movement = MOVEMENT_PRIMITIVES.find((item) => item.id === movementId) ?? MOVEMENT_PRIMITIVES[0]

  const demoMechanics = useMemo(() => calculateExternalLoad({
    bodyMassKg: 70,
    supportedBodyMassFraction: 1,
    externalLoadKg: 20,
    verticalAccelerationMs2: 1.5,
    momentArmM: 0.35,
    angularDisplacementRad: Math.PI / 3,
    angularVelocityRadS: 1.8,
    contactTimeS: 0.3,
  }), [])

  function chooseRegion(key: AtlasRegionKey) {
    setRegionKey(key)
    const picked = WHOLE_BODY_REGIONS.find((item) => item.key === key)
    if (!picked) return
    const hints = picked.structures.flatMap((structure) => structure.nodeHints)
    onHighlight?.(hints)
    for (const layer of new Set(picked.structures.map((structure) => structure.layer))) onEnableLayer?.(layer)
  }

  function changeUnfold(value: number) {
    setUnfold(value)
    onSetUnfold?.(value)
  }

  function changeDepth(value: number) {
    setDepth(value)
    onSetDissectionDepth?.(value)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-4 text-white dark:border-white/10">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Panacea · Whole-body precision atlas scaffold</div>
        <h3 className="mt-1 text-xl font-black">Explode the body. Inspect every layer. Connect anatomy to surgery and movement.</h3>
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-400">Built as a production handoff for the next visual agent: the interaction model is explicit now, while final Blender-quality materials, region camera choreography, mesh cleanup and microanatomy overlays remain intentionally separable.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-[9px] font-bold uppercase tracking-wide text-brand">Visual target</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-300">{ATLAS_REFERENCE_MODEL.visualTarget}</p></div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-[9px] font-bold uppercase tracking-wide text-brand">Interaction target</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-300">{ATLAS_REFERENCE_MODEL.interactionTarget}</p></div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-[9px] font-bold uppercase tracking-wide text-brand">Truth rule</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-300">{ATLAS_REFERENCE_MODEL.truthRule}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
        {([['unfolded', 'Unfolded body'], ['specialty', 'Specialty atlas'], ['movement', 'Movement biomechanics']] as const).map(([key, label]) => (
          <button key={key} type="button" aria-pressed={mode === key} onClick={() => setMode(key)} className={`rounded-lg px-2 py-2 text-[11px] font-bold transition ${mode === key ? 'bg-white text-ink shadow-sm dark:bg-white/10 dark:text-white' : 'text-neutral-500'}`}>{label}</button>
        ))}
      </div>

      {mode === 'unfolded' && (
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[0.7fr_1.3fr]">
            <MiniBodyMap region={regionKey} />
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {WHOLE_BODY_REGIONS.map((item) => (
                  <button key={item.key} type="button" onClick={() => chooseRegion(item.key)} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${regionKey === item.key ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}>{item.label}</button>
                ))}
              </div>
              <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-wide text-brand">{region.landmark}</div>
                <h4 className="mt-1 text-lg font-black text-ink dark:text-white">{region.label}</h4>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {region.structures.map((structure) => (
                    <button key={structure.id} type="button" onClick={() => { onEnableLayer?.(structure.layer); onHighlight?.(structure.nodeHints) }} className="rounded-xl border border-neutral-200 p-3 text-left transition hover:border-brand/40 dark:border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black text-ink dark:text-white">{structure.label}</span><ProvenanceBadge value={structure.provenance} /></div>
                      <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-neutral-400">{structure.layer} · {structure.level}</div>
                      <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{structure.clinicalWhy}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="rounded-xl border border-neutral-200 p-3 text-xs font-bold text-ink dark:border-white/10 dark:text-white">Radial unfold · {Math.round((unfold / 0.35) * 100)}%
              <input type="range" min={0} max={0.35} step={0.005} value={unfold} onChange={(event) => changeUnfold(Number(event.target.value))} className="mt-2 w-full accent-[var(--brand,#00bf63)]" />
              <span className="mt-1 block text-[10px] font-normal leading-relaxed text-neutral-500">Final visual pass should preserve superior–inferior relationships and separate structures radially from the body axis.</span>
            </label>
            <label className="rounded-xl border border-neutral-200 p-3 text-xs font-bold text-ink dark:border-white/10 dark:text-white">Dissection depth · {depth}
              <input type="range" min={0} max={6} step={1} value={depth} onChange={(event) => changeDepth(Number(event.target.value))} className="mt-2 w-full accent-[var(--brand,#00bf63)]" />
              <span className="mt-1 block text-[10px] font-normal leading-relaxed text-neutral-500">Bind this to the existing Body3D depth model; absent fascial planes should be overlays, never invented anatomy meshes.</span>
            </label>
          </div>
        </div>
      )}

      {mode === 'specialty' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {SPECIALTY_ATLAS_MODULES.map((item) => <button key={item.id} type="button" onClick={() => setSpecialtyId(item.id)} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${specialty.id === item.id ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}>{item.label}</button>)}
          </div>
          <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wide text-brand">{specialty.specialty}</div>
            <h4 className="mt-1 text-lg font-black text-ink dark:text-white">{specialty.label}</h4>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{specialty.learningGoal}</p>
            <div className="mt-3 space-y-2">
              {specialty.layers.map((layer) => (
                <button key={`${specialty.id}-${layer.order}`} type="button" onClick={() => { onEnableLayer?.(layer.layer); changeDepth(Math.min(6, layer.order - 1)) }} className="grid w-full gap-2 rounded-xl border border-neutral-200 p-3 text-left md:grid-cols-[48px_1fr_1fr] dark:border-white/10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-black text-white">{layer.order}</div>
                  <div><div className="text-xs font-black text-ink dark:text-white">{layer.label}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-neutral-400">{layer.layer}</div></div>
                  <div><div className="text-[9px] font-bold uppercase tracking-wide text-red-500">Structures at risk</div><div className="mt-1 text-[10px] leading-relaxed text-neutral-500">{layer.structuresAtRisk.join(' · ')}</div></div>
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"><span className="font-black">Geometry contract: </span>{specialty.meshExpectation}</div>
          </div>
        </div>
      )}

      {mode === 'movement' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {MOVEMENT_PRIMITIVES.map((item) => <button key={item.id} type="button" onClick={() => setMovementId(item.id)} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${movement.id === item.id ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}>{item.label}</button>)}
          </div>
          <MovementDiagram chain={movement.chain} />
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-[9px] font-bold uppercase tracking-wide text-brand">Planes</div><p className="mt-1 text-xs font-black text-ink dark:text-white">{movement.planes.join(' · ')}</p><div className="mt-3 text-[9px] font-bold uppercase tracking-wide text-neutral-400">Key joints</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{movement.keyJoints.join(' · ')}</p></div>
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-[9px] font-bold uppercase tracking-wide text-brand">Key muscles</div><p className="mt-1 text-xs font-black text-ink dark:text-white">{movement.keyMuscles.join(' · ')}</p><p className="mt-3 text-[10px] leading-relaxed text-neutral-500">{movement.teachingPoint}</p></div>
          </div>
          <div className="rounded-2xl bg-neutral-950 p-4 text-white">
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-brand">Reusable mechanics engine · demonstration state</div>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              <div><div className="text-[9px] text-neutral-500">Force</div><div className="text-lg font-black">{demoMechanics.forceN.toFixed(0)} N</div></div>
              <div><div className="text-[9px] text-neutral-500">External torque</div><div className="text-lg font-black">{demoMechanics.torqueNm.toFixed(1)} N·m</div></div>
              <div><div className="text-[9px] text-neutral-500">Work</div><div className="text-lg font-black">{demoMechanics.workJ.toFixed(0)} J</div></div>
              <div><div className="text-[9px] text-neutral-500">Power</div><div className="text-lg font-black">{demoMechanics.powerW.toFixed(0)} W</div></div>
            </div>
            <div className="mt-3 grid gap-1 font-mono text-[10px] text-neutral-400 md:grid-cols-2"><div>F = m_eff·(g+a)</div><div>τ = F·r</div><div>W = τ·θ</div><div>P = τ·ω</div></div>
            <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">This is explicitly an external-load teaching model, not patient-specific inverse dynamics or internal joint-contact-force estimation.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default WholeBodyPrecisionLab
