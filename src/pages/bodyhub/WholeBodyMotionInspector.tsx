import { useMemo, useState, useSyncExternalStore } from 'react'
import type { AtlasLayerKey } from '../../lib/wholeBodyAtlasBlueprint'
import { consumeAnatomyContextHandoff } from '../../lib/anatomyContextHandoff'
import {
  filterAnatomySourceBundlesForAtlasRegion,
  getEffectiveAnatomySourceNodeSnapshot,
  resolveAllAnatomySourceNodes,
  subscribeAnatomySourceNodes,
  type AnatomySourceNodeBundle,
} from '../../lib/anatomySourceNodeRegistry'
import { coupledKinematicsFor } from '../../lib/biomechanicsCoupling'
import {
  WHOLE_BODY_BIOMECHANICS_DISCLOSURE,
  WHOLE_BODY_JOINT_PROFILES,
  classifyJointExcursion,
  normalizedJointExcursion,
  signedMotionLabel,
  type JointMotionProfile,
  type WholeBodyJointProfile,
} from '../../lib/wholeBodyBiomechanics'

interface Props {
  onHighlight?: (nodeHints: string[]) => void
  onFocusRegion?: (nodeHints: string[]) => void
  onEnableLayer?: (layer: AtlasLayerKey) => void
}

const BIOMECHANICS_SOURCE_FILES = new Set(['skeletal.glb', 'muscular.glb'])

function exactBiomechanicsSourceNames(
  joint: WholeBodyJointProfile,
  motion: JointMotionProfile,
  coupledStructures: readonly string[],
  sourceBundles: readonly AnatomySourceNodeBundle[],
) {
  const biomechanicsBundles = sourceBundles.filter((bundle) => BIOMECHANICS_SOURCE_FILES.has(bundle.file))
  const regionalBundles = filterAnatomySourceBundlesForAtlasRegion(biomechanicsBundles, joint.region)
  const hints = [...joint.nodeHints, ...motion.structureHints, ...coupledStructures]
  return [...new Set(
    resolveAllAnatomySourceNodes(hints, regionalBundles)
      .flatMap((match) => match.names),
  )]
}

function SourceBadge({ joint }: { joint: WholeBodyJointProfile }) {
  const native = joint.sourceGeometry === 'native-geometry'
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${native ? 'border-brand/30 bg-brand/10 text-brand' : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'}`}>
      {native ? 'Native source geometry' : 'Adjacent / partial geometry'}
    </span>
  )
}

function AxisDial({ progress, label }: { progress: number; label: string }) {
  const rotation = -75 + progress * 150
  return (
    <div className="relative mx-auto h-36 w-36 rounded-full border border-white/10 bg-black/40 shadow-inner shadow-black/50">
      <div className="absolute inset-3 rounded-full border border-dashed border-white/10" />
      <div className="absolute left-1/2 top-1/2 h-[2px] w-[52px] origin-left bg-brand transition-transform duration-150" style={{ transform: `rotate(${rotation}deg)` }} />
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand shadow-lg shadow-brand/40" />
      <div className="absolute inset-x-3 bottom-4 text-center text-[10px] font-black text-white">{label}</div>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] font-bold text-neutral-600">MIN</div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-bold text-neutral-600">MAX</div>
    </div>
  )
}

export function WholeBodyMotionInspector({ onHighlight, onFocusRegion, onEnableLayer }: Props) {
  const firstJoint = WHOLE_BODY_JOINT_PROFILES[0]
  const [incomingHandoff] = useState(() => consumeAnatomyContextHandoff('biomechanics'))
  const initialJoint = WHOLE_BODY_JOINT_PROFILES.find((item) => item.id === incomingHandoff?.movementJointId) ?? firstJoint
  const [jointId, setJointId] = useState(initialJoint.id)
  const [motionId, setMotionId] = useState(initialJoint.motions[0].id)
  const [angleDeg, setAngleDeg] = useState(initialJoint.motions[0].neutralDeg)
  const sourceBundles = useSyncExternalStore(
    subscribeAnatomySourceNodes,
    getEffectiveAnatomySourceNodeSnapshot,
    getEffectiveAnatomySourceNodeSnapshot,
  )

  const joint = WHOLE_BODY_JOINT_PROFILES.find((item) => item.id === jointId) ?? firstJoint
  const motion = joint.motions.find((item) => item.id === motionId) ?? joint.motions[0]
  const excursion = normalizedJointExcursion(motion, angleDeg)
  const excursionState = classifyJointExcursion(motion, angleDeg)
  const positionLabel = signedMotionLabel(motion, angleDeg)
  const coupled = coupledKinematicsFor(motion.id)
  const exactSourceNames = useMemo(
    () => exactBiomechanicsSourceNames(joint, motion, coupled?.structures ?? [], sourceBundles),
    [joint, motion, coupled, sourceBundles],
  )

  const groupedJoints = useMemo(() => {
    const groups = new Map<string, WholeBodyJointProfile[]>()
    for (const item of WHOLE_BODY_JOINT_PROFILES) {
      const bucket = groups.get(item.region) ?? []
      bucket.push(item)
      groups.set(item.region, bucket)
    }
    return [...groups.entries()]
  }, [])

  function representedNames(nextJoint: WholeBodyJointProfile, nextMotion: JointMotionProfile) {
    const nextCoupled = coupledKinematicsFor(nextMotion.id)
    return exactBiomechanicsSourceNames(nextJoint, nextMotion, nextCoupled?.structures ?? [], sourceBundles)
  }

  function inspectJoint(next: WholeBodyJointProfile) {
    const firstMotion = next.motions[0]
    const exactNames = representedNames(next, firstMotion)
    setJointId(next.id)
    setMotionId(firstMotion.id)
    setAngleDeg(firstMotion.neutralDeg)
    onEnableLayer?.('skeletal')
    onEnableLayer?.('muscular')
    onHighlight?.(exactNames)
    if (exactNames.length) onFocusRegion?.(exactNames)
  }

  function inspectMotion(nextMotionId: string) {
    const next = joint.motions.find((item) => item.id === nextMotionId)
    if (!next) return
    const exactNames = representedNames(joint, next)
    setMotionId(next.id)
    setAngleDeg(next.neutralDeg)
    onHighlight?.(exactNames)
    if (exactNames.length) onFocusRegion?.(exactNames)
  }

  function updateAngleFromRange(value: string) {
    const next = Number(value)
    if (!Number.isFinite(next)) return
    setAngleDeg(next)
  }

  function applyToViewer() {
    onEnableLayer?.('skeletal')
    onEnableLayer?.('muscular')
    onHighlight?.(exactSourceNames)
    if (exactSourceNames.length) onFocusRegion?.(exactSourceNames)
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-950 text-white dark:border-white/10">
      <div className="border-b border-white/10 bg-gradient-to-br from-brand/15 via-transparent to-blue-500/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Whole-body motion inspector</div>
            <h4 className="mt-1 text-lg font-black">Joint → axis → motion → contributing structures</h4>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-400">Reference-style joint inspection scaled across the body. Coupled kinematics appear below when the selected motion has an evidence-grounded secondary motion. The control does not warp anatomy or fabricate patient-specific force; it also does not reduce coupled joints to a fake single-axis hinge.</p>
          </div>
          <SourceBadge joint={joint} />
        </div>
        {incomingHandoff?.movementJointId && (
          <div className="mt-3 rounded-xl border border-blue-400/20 bg-blue-400/[0.06] p-3">
            <div className="text-[8px] font-black uppercase tracking-[0.16em] text-blue-300">From Z-Anatomy · curated biomechanics route</div>
            <div className="mt-1 text-xs font-black text-white">{incomingHandoff.structureLabel} → {incomingHandoff.movementJointId}</div>
            <p className="mt-1 text-[9px] leading-relaxed text-neutral-400">This one-shot context selects a repository-curated joint model. Source-mesh availability does not itself prove biomechanics applicability, qualified human review, or patient-specific mechanics.</p>
            {incomingHandoff.resolvedNodeNames.length > 0 && <p className="mt-1 font-mono text-[8px] text-neutral-500">Source nodes: {incomingHandoff.resolvedNodeNames.slice(0, 6).join(' · ')}</p>}
          </div>
        )}
      </div>

      <div className="grid gap-0 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b border-white/10 p-3 xl:border-b-0 xl:border-r">
          <div className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-neutral-500">Select joint</div>
          <div className="space-y-3">
            {groupedJoints.map(([region, joints]) => (
              <div key={region}>
                <div className="mb-1 text-[8px] font-black uppercase tracking-[0.14em] text-neutral-600">{region.replace('-', ' ')}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {joints.map((item) => (
                    <button key={item.id} type="button" aria-pressed={joint.id === item.id} onClick={() => inspectJoint(item)} className={`min-h-11 rounded-xl border px-2 py-2 text-left text-[10px] font-black transition ${joint.id === item.id ? 'border-brand bg-brand/15 text-white' : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:border-brand/40 hover:text-white'}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap gap-1.5">
            {joint.motions.map((item) => (
              <button key={item.id} type="button" aria-pressed={motion.id === item.id} onClick={() => inspectMotion(item.id)} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${motion.id === item.id ? 'border-brand bg-brand text-white' : 'border-white/10 text-neutral-400'}`}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <AxisDial progress={(angleDeg - motion.minDeg) / Math.max(1, motion.maxDeg - motion.minDeg)} label={positionLabel} />
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2"><div className="text-[8px] font-bold uppercase text-neutral-600">Plane</div><div className="mt-1 text-[11px] font-black">{motion.plane}</div></div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2"><div className="text-[8px] font-bold uppercase text-neutral-600">Axis</div><div className="mt-1 text-[11px] font-black">{motion.axis}</div></div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2"><div className="text-[8px] font-bold uppercase text-neutral-600">Excursion</div><div className="mt-1 text-[11px] font-black">{excursionState}</div></div>
              </div>

              <label className="block rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] font-black">
                {motion.label} · {angleDeg.toFixed(0)}°
                <input
                  type="range"
                  min={motion.minDeg}
                  max={motion.maxDeg}
                  step={1}
                  value={angleDeg}
                  onInput={(event) => updateAngleFromRange(event.currentTarget.value)}
                  onChange={(event) => updateAngleFromRange(event.currentTarget.value)}
                  className="mt-3 w-full accent-[var(--brand,#00bf63)]"
                />
                <div className="mt-1 flex justify-between text-[8px] font-bold text-neutral-600"><span>{motion.minDeg}°</span><span>neutral {motion.neutralDeg}°</span><span>{motion.maxDeg}°</span></div>
              </label>

              <div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full bg-brand transition-[width] duration-150" style={{ width: `${Math.max(2, excursion * 100)}%` }} /></div>
              <p className="text-[10px] leading-relaxed text-neutral-400">{motion.teachingNote}</p>
              <div className={`rounded-xl border p-2 text-[9px] leading-relaxed ${exactSourceNames.length ? 'border-brand/20 bg-brand/[0.05] text-neutral-300' : 'border-amber-400/20 bg-amber-400/[0.05] text-amber-200'}`}>
                <span className="font-black">Geometry correspondence. </span>
                {exactSourceNames.length
                  ? `${exactSourceNames.length} exact skeletal/muscular source nodes match this reviewed joint + motion context.`
                  : 'No exact regional skeletal/muscular source-node match. The biomechanics description remains educational text and is not projected onto substitute geometry.'}
              </div>
              <button type="button" disabled={!exactSourceNames.length} onClick={applyToViewer} className="min-h-11 rounded-full border border-brand px-4 text-[11px] font-black text-brand transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-neutral-600">{exactSourceNames.length ? `Inspect ${exactSourceNames.length} exact source nodes in shared 3D →` : 'No exact represented geometry to inspect'}</button>
            </div>
          </div>

          {coupled && (
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-3">
              <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-300">Coupled kinematics</div>
              <div className="mt-1 text-sm font-black text-white">{coupled.title}</div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-500">Primary motion</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-300">{coupled.primaryMotion}</p></div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-500">Coupled motion</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-300">{coupled.coupledMotion}</p></div>
              </div>
              <div className="mt-2 text-[9px] font-black uppercase tracking-wide text-cyan-300">Structures carrying the relationship</div>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-300">{coupled.structures.join(' · ')}</p>
              <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">{coupled.interpretation}</p>
              <p className="mt-2 text-[9px] leading-relaxed text-neutral-600">Evidence note: {coupled.source}</p>
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-xl border border-brand/20 bg-brand/[0.06] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-brand">Primary driver context</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-300">{motion.drivers.join(' · ')}</p></div>
            <div className="rounded-xl border border-blue-400/20 bg-blue-400/[0.05] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-blue-300">Opposing system</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-300">{motion.opposers.join(' · ')}</p></div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-amber-300">Passive restraint context</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-300">{motion.passiveRestraints.join(' · ')}</p></div>
          </div>

          <div className="rounded-xl border border-red-400/20 bg-red-400/[0.04] p-3 text-[9px] leading-relaxed text-neutral-400">
            <span className="font-black text-red-300">Scientific boundary. </span>{WHOLE_BODY_BIOMECHANICS_DISCLOSURE.rangeRule} {WHOLE_BODY_BIOMECHANICS_DISCLOSURE.forceRule}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WholeBodyMotionInspector
