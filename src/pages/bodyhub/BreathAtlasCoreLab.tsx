import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  anatomySourceNodeOrigin,
  getEffectiveAnatomySourceNodeSnapshot,
  resolveAllAnatomySourceNodes,
  subscribeAnatomySourceNodes,
} from '../../lib/anatomySourceNodeRegistry'
import type { AtlasLayerKey, GeometryProvenance } from '../../lib/wholeBodyAtlasBlueprint'

interface Props {
  onHighlight?: (nodeHints: string[]) => void
  onFocusRegion?: (nodeHints: string[]) => void
  onEnableLayer?: (layer: AtlasLayerKey) => void
}

type BreathPhase = 'inspiration' | 'exchange' | 'expiration'

interface BreathTarget {
  id: string
  label: string
  layer: AtlasLayerKey
  nodeHints: string[]
  provenance: GeometryProvenance
  role: string
}

const FILE_BY_LAYER: Record<AtlasLayerKey, string> = {
  surface: 'surface.glb',
  skeletal: 'skeletal.glb',
  muscular: 'muscular.glb',
  cardiovascular: 'cardiovascular.glb',
  nervous: 'nervous.glb',
  visceral: 'visceral.glb',
  lymphoid: 'lymphoid.glb',
}

const TARGETS: BreathTarget[] = [
  {
    id: 'central-airway',
    label: 'Trachea → main bronchi',
    layer: 'visceral',
    nodeHints: ['trachea', 'main bronch', 'bronchus'],
    provenance: 'native-geometry',
    role: 'Conducting-airway orientation from trachea into the bronchial tree.',
  },
  {
    id: 'lungs',
    label: 'Right & left lungs',
    layer: 'visceral',
    nodeHints: ['right lung', 'left lung', 'lung'],
    provenance: 'native-geometry',
    role: 'Whole-organ spatial context for lobar and bronchopulmonary relationships.',
  },
  {
    id: 'diaphragm',
    label: 'Diaphragm',
    layer: 'muscular',
    nodeHints: ['diaphragm'],
    provenance: 'native-geometry',
    role: 'Primary muscle of quiet inspiration; contraction lowers the dome and enlarges thoracic volume.',
  },
  {
    id: 'intercostals',
    label: 'Intercostal muscles',
    layer: 'muscular',
    nodeHints: ['external intercostal', 'internal intercostal', 'intercostal'],
    provenance: 'adjacent-geometry',
    role: 'Respiratory chest-wall mechanics; external and internal layers have different mechanical roles.',
  },
  {
    id: 'thoracic-cage',
    label: 'Ribs · sternum · thoracic spine',
    layer: 'skeletal',
    nodeHints: ['rib', 'sternum', 'thoracic vertebra'],
    provenance: 'native-geometry',
    role: 'Rigid-but-mobile frame for pump-handle and bucket-handle chest-wall expansion.',
  },
  {
    id: 'pulmonary-vessels',
    label: 'Pulmonary vessels',
    layer: 'cardiovascular',
    nodeHints: ['pulmonary trunk', 'pulmonary artery', 'pulmonary vein'],
    provenance: 'native-geometry',
    role: 'Macrovascular context linking right-heart outflow, lung perfusion and left-heart return.',
  },
  {
    id: 'alveolar-capillary',
    label: 'Alveolar–capillary barrier',
    layer: 'visceral',
    nodeHints: [],
    provenance: 'not-represented',
    role: 'Gas exchange occurs across microscopic alveolar epithelium, interstitium and capillary endothelium; that microstructure is below the scale of this whole-body mesh.',
  },
]

const PHASES: Record<BreathPhase, {
  label: string
  kicker: string
  summary: string
  mechanics: string[]
  targetIds: string[]
}> = {
  inspiration: {
    label: 'Inspiration',
    kicker: 'Thoracic pump',
    summary: 'During quiet inspiration the diaphragm contracts and descends while the rib cage expands, lowering alveolar pressure transiently below atmospheric pressure so air flows inward.',
    mechanics: [
      'Diaphragm contraction increases vertical thoracic dimension.',
      'Pump-handle motion increases anteroposterior chest dimension.',
      'Bucket-handle motion increases transverse chest dimension.',
    ],
    targetIds: ['central-airway', 'lungs', 'diaphragm', 'intercostals', 'thoracic-cage'],
  },
  exchange: {
    label: 'Gas exchange',
    kicker: 'Macro → micro context',
    summary: 'At the alveolar–capillary barrier, oxygen diffuses from alveolar gas toward pulmonary capillary blood while carbon dioxide diffuses in the opposite direction.',
    mechanics: [
      'Ventilation brings fresh gas to the respiratory zone.',
      'Pulmonary perfusion brings mixed venous blood to alveolar capillaries.',
      'The whole-body GLB shows macro anatomy, not individual alveoli or the blood–gas barrier.',
    ],
    targetIds: ['lungs', 'pulmonary-vessels', 'alveolar-capillary'],
  },
  expiration: {
    label: 'Expiration',
    kicker: 'Elastic recoil',
    summary: 'Quiet expiration is largely passive: inspiratory muscles relax and elastic recoil of the lungs and chest wall drives air outward as alveolar pressure transiently rises above atmospheric pressure.',
    mechanics: [
      'The diaphragm relaxes and the domes ascend.',
      'The rib cage returns toward its resting configuration.',
      'Forced expiration is different: abdominal muscles and internal intercostals can actively contribute.',
    ],
    targetIds: ['central-airway', 'lungs', 'diaphragm', 'intercostals', 'thoracic-cage'],
  },
}

const AIRFLOW_PATH = [
  'Nasal / oral route',
  'Pharynx',
  'Larynx',
  'Trachea',
  'Main bronchi',
  'Lobar / segmental bronchi',
  'Bronchioles',
  'Alveoli',
]

function provenanceLabel(value: GeometryProvenance) {
  if (value === 'native-geometry') return 'source geometry'
  if (value === 'adjacent-geometry') return 'partial / adjacent geometry'
  return 'not represented at whole-body mesh scale'
}

export function BreathAtlasLab({ onHighlight, onFocusRegion, onEnableLayer }: Props) {
  const [phase, setPhase] = useState<BreathPhase>('inspiration')
  const [selectedId, setSelectedId] = useState('central-airway')
  const sourceBundles = useSyncExternalStore(
    subscribeAnatomySourceNodes,
    getEffectiveAnatomySourceNodeSnapshot,
    getEffectiveAnatomySourceNodeSnapshot,
  )

  const selected = TARGETS.find((target) => target.id === selectedId) ?? TARGETS[0]
  const phaseInfo = PHASES[phase]

  const resolvedById = useMemo(() => {
    const result = new Map<string, ReturnType<typeof resolveAllAnatomySourceNodes>>()
    for (const target of TARGETS) {
      if (target.provenance === 'not-represented') {
        result.set(target.id, [])
        continue
      }
      const file = FILE_BY_LAYER[target.layer]
      result.set(target.id, resolveAllAnatomySourceNodes(
        target.nodeHints,
        sourceBundles.filter((bundle) => bundle.file === file),
        6,
      ))
    }
    return result
  }, [sourceBundles])

  function exactNames(target: BreathTarget) {
    return [...new Set((resolvedById.get(target.id) ?? []).flatMap((match) => match.names))]
  }

  function inspect(target: BreathTarget) {
    setSelectedId(target.id)
    if (target.provenance === 'not-represented') {
      inspectExchangeContext()
      return
    }
    onEnableLayer?.(target.layer)
    const exact = exactNames(target)
    // Highlight only exact source nodes. Reviewed text hints may frame the camera,
    // but they never become substitute geometry when a source-name match is absent.
    onHighlight?.(exact)
    onFocusRegion?.(exact.length ? exact : target.nodeHints)
  }

  function inspectExchangeContext() {
    const lungs = TARGETS.find((target) => target.id === 'lungs')!
    const vessels = TARGETS.find((target) => target.id === 'pulmonary-vessels')!
    onEnableLayer?.('visceral')
    onEnableLayer?.('cardiovascular')
    const exact = [...new Set([...exactNames(lungs), ...exactNames(vessels)])]
    onHighlight?.(exact)
    onFocusRegion?.(exact.length ? exact : [...lungs.nodeHints, ...vessels.nodeHints])
  }

  function activatePhase(next: BreathPhase) {
    setPhase(next)
    const targets = PHASES[next].targetIds
      .map((id) => TARGETS.find((target) => target.id === id))
      .filter((target): target is BreathTarget => Boolean(target) && target!.provenance !== 'not-represented')
    for (const layer of new Set(targets.map((target) => target.layer))) onEnableLayer?.(layer)
    const exact = [...new Set(targets.flatMap(exactNames))]
    onHighlight?.(exact)
    const fallback = [...new Set(targets.flatMap((target) => target.nodeHints))]
    onFocusRegion?.(exact.length ? exact : fallback)
  }

  const selectedMatches = resolvedById.get(selected.id) ?? []
  const selectedNames = exactNames(selected)
  const selectedFile = FILE_BY_LAYER[selected.layer]
  const selectedOrigin = anatomySourceNodeOrigin(selectedFile)

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-neutral-950 text-white">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.18),transparent_40%),radial-gradient(circle_at_90%_0%,rgba(0,191,99,0.12),transparent_36%)] p-5">
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-300">Breath Atlas · source-aware respiratory anatomy</div>
            <h4 className="mt-2 max-w-2xl text-2xl font-black tracking-tight">Follow air, thoracic mechanics and pulmonary perfusion in the same shared Z-Anatomy viewer.</h4>
            <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-neutral-400">This is an independently implemented Panacea teaching layer. It uses Panacea-controlled source geometry and the runtime GLB node registry; it does not embed or copy third-party viewer code or assets.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-black">
              <a href="https://github.com/thebuggeddev/anatomy" target="_blank" rel="noreferrer" className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-neutral-200 transition hover:border-cyan-300/60 hover:text-cyan-200">thebuggeddev/anatomy ↗</a>
              <a href="https://breath-atlas.thebuggeddev.chatgpt.site/" target="_blank" rel="noreferrer" className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-cyan-200 transition hover:bg-cyan-300/15">Breath Atlas reference ↗</a>
              <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1.5 text-amber-100">interaction reference only · license check required</span>
            </div>
          </div>
          <div className="border-t border-white/10 bg-black/30 p-4 lg:border-l lg:border-t-0">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-neutral-500">Scientific boundary</div>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-300">The source body mesh is not deformed to fake breathing. There is no patient-specific ventilation map, V/Q map, SpO₂ prediction, tissue strain or respiratory diagnosis. Microscopic alveolar geometry is disclosed as unavailable at this scale.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-2 md:grid-cols-3">
        {(Object.keys(PHASES) as BreathPhase[]).map((key) => {
          const item = PHASES[key]
          return (
            <button key={key} type="button" aria-pressed={phase === key} onClick={() => activatePhase(key)} className={`rounded-2xl border p-4 text-left transition ${phase === key ? 'border-cyan-400/60 bg-cyan-400/[0.07] shadow-lg shadow-cyan-500/5' : 'border-neutral-200 hover:border-cyan-400/30 dark:border-white/10'}`}>
              <div className="text-[8px] font-black uppercase tracking-[0.16em] text-cyan-500">{item.kicker}</div>
              <div className="mt-1 text-sm font-black text-ink dark:text-white">{item.label}</div>
              <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">{item.summary}</p>
            </button>
          )
        })}
      </section>

      <section className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-500">{phaseInfo.kicker}</div>
            <h5 className="mt-1 text-lg font-black text-ink dark:text-white">{phaseInfo.label}</h5>
          </div>
          <div className="text-[9px] font-bold text-neutral-500">Mechanics are explanatory · source mesh remains geometrically unchanged</div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {phaseInfo.mechanics.map((item, index) => (
            <div key={item} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="text-[9px] font-black text-cyan-500">0{index + 1}</div>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10">
        <div className="border-b border-neutral-200 p-4 dark:border-white/10">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Airflow route · conceptual sequence</div>
          <div className="mt-3 flex min-w-max items-center gap-2 overflow-x-auto pb-1">
            {AIRFLOW_PATH.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span className="rounded-xl border border-cyan-300/30 bg-cyan-300/[0.05] px-3 py-2 text-[10px] font-black text-ink dark:text-white">{step}</span>
                {index < AIRFLOW_PATH.length - 1 && <span className="text-cyan-500">→</span>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">The sequence teaches conducting-to-respiratory anatomy. Distal bronchioles and individual alveoli are not promoted to source geometry unless they actually exist in the shipped whole-body GLB.</p>
        </div>

        <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-2 p-3 lg:border-r lg:border-neutral-200 dark:lg:border-white/10">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Respiratory structures</div>
            {TARGETS.map((target) => {
              const names = exactNames(target)
              const isSelected = selected.id === target.id
              return (
                <button key={target.id} type="button" onClick={() => inspect(target)} className={`w-full rounded-xl border p-3 text-left transition ${isSelected ? 'border-cyan-400/60 bg-cyan-400/[0.05]' : 'border-neutral-200 hover:border-cyan-400/30 dark:border-white/10'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black text-ink dark:text-white">{target.label}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black ${target.provenance === 'not-represented' ? 'border-amber-300/30 text-amber-600 dark:text-amber-200' : names.length ? 'border-brand/30 text-brand' : 'border-neutral-200 text-neutral-500 dark:border-white/10'}`}>{target.provenance === 'not-represented' ? 'micro context' : `${names.length} source nodes`}</span>
                  </div>
                  <div className="mt-1 text-[8px] font-bold uppercase tracking-wide text-neutral-400">{provenanceLabel(target.provenance)}</div>
                  <p className="mt-1 text-[9px] leading-relaxed text-neutral-500">{target.role}</p>
                </button>
              )
            })}
          </div>

          <div className="p-4">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-500">Selected respiratory target</div>
            <h5 className="mt-1 text-xl font-black text-ink dark:text-white">{selected.label}</h5>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">{selected.role}</p>

            {selected.provenance !== 'not-represented' ? (
              <>
                <div className="mt-3 flex flex-wrap gap-2 text-[8px] font-black">
                  <span className="rounded-full border border-neutral-200 px-2 py-1 text-neutral-500 dark:border-white/10">/{selectedFile}</span>
                  <span className="rounded-full border border-neutral-200 px-2 py-1 text-neutral-500 dark:border-white/10">{selectedOrigin === 'runtime' ? 'loaded runtime nodes' : 'generated GLB index'}</span>
                  <span className="rounded-full border border-neutral-200 px-2 py-1 text-neutral-500 dark:border-white/10">{selectedNames.length} resolved names</span>
                </div>
                <button type="button" onClick={() => inspect(selected)} className="mt-3 min-h-11 rounded-full bg-cyan-500 px-4 text-[10px] font-black text-neutral-950 shadow-lg shadow-cyan-500/10">Inspect source geometry →</button>
                {selectedMatches.length ? (
                  <div className="mt-4 space-y-2">
                    {selectedMatches.map((match) => (
                      <div key={`${match.file}:${match.hint}`} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-[8px] font-black text-cyan-600 dark:text-cyan-300">{match.file}</span>
                          <span className="text-[8px] text-neutral-400">hint: {match.hint}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {match.names.map((name) => <span key={name} className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 font-mono text-[8px] text-neutral-600 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300">{name}</span>)}
                        </div>
                      </div>
                    ))}
                    <p className="text-[8.5px] leading-relaxed text-neutral-500">Resolved names come from the loaded runtime layer when present, otherwise the generated index built from shipped GLB metadata. Name resolution does not imply patient-specific or procedural validation.</p>
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-neutral-200 p-3 text-[9px] leading-relaxed text-neutral-500 dark:border-white/10">No direct source-node name match was found. The reviewed anatomical concept remains valid, but Panacea does not fabricate substitute geometry.</p>
                )}
              </>
            ) : (
              <div className="mt-3 rounded-2xl border border-amber-300/25 bg-amber-300/[0.05] p-4">
                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-200">Microscopic boundary</div>
                <p className="mt-2 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">Individual alveoli, the thin blood–gas barrier and capillary membrane are not represented by this whole-body source mesh. Use the macro lung + pulmonary-vessel context without pretending that a whole-organ surface is microscopic tissue.</p>
                <button type="button" onClick={inspectExchangeContext} className="mt-3 min-h-11 rounded-full border border-amber-400 px-4 text-[10px] font-black text-amber-700 dark:text-amber-200">Show macro exchange context →</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Airflow</div>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">Conducting airways move gas toward respiratory units; this panel links the pathway to represented tracheobronchial and lung source nodes.</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Thoracic pump</div>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">Diaphragm and chest-wall mechanics change thoracic volume. The UI explains the kinematics but does not scale or warp anatomical meshes to imitate breathing.</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Perfusion & exchange</div>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">Pulmonary vessels provide macrovascular orientation; microscopic diffusion is taught as physiology context rather than fake 3D microanatomy.</p>
        </div>
      </section>
    </div>
  )
}

export default BreathAtlasLab
