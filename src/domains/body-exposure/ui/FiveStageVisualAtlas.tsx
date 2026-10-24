import { useEffect, useMemo, useRef, useState } from 'react'
import type { BodySemanticScale } from '../../../lib/bodySemanticZoom'
import type { BodySystemId } from '../../../lib/bodySystemSourceWave'
import {
  ATLAS_LITERATURE_SOURCES,
  depth01ForStageId,
  evaluateFiveStagePhysiology,
  FIVE_STAGE_DEFAULTS,
  stageIdForSemanticScale,
  VISUAL_ATLAS_STAGES,
  type AtlasSimulationDomainTarget,
  type FiveStageSimulationInput,
  type VisualAtlasStageId,
} from '../engine/fiveStageVisualAtlas'

export interface FiveStageVisualAtlasProps {
  selectedSystemId: BodySystemId
  semanticScale: BodySemanticScale
  selectedStructureName?: string | null
  defaultExpanded?: boolean
  onOpenScale?: (scale: BodySemanticScale) => void
  onSelectDomain?: (domain: AtlasSimulationDomainTarget) => void
  onSelectStructure?: (name: string) => void
}

export function FiveStageVisualAtlas({
  selectedSystemId,
  semanticScale,
  selectedStructureName = null,
  defaultExpanded = false,
  onOpenScale,
  onSelectDomain,
  onSelectStructure,
}: FiveStageVisualAtlasProps) {
  const [atlasExpanded, setAtlasExpanded] = useState(defaultExpanded)
  const [scenario, setScenario] = useState<FiveStageSimulationInput>(() => ({
    ...FIVE_STAGE_DEFAULTS,
    depth01: depth01ForStageId(stageIdForSemanticScale(semanticScale)),
  }))
  const [phase01, setPhase01] = useState(0.35)
  const doomScrollRef = useRef<HTMLDivElement | null>(null)
  const syncingScrollRef = useRef(false)

  useEffect(() => {
    const mappedStage = stageIdForSemanticScale(semanticScale)
    const nextDepth = depth01ForStageId(mappedStage)
    setScenario((current) => {
      const currentStageIndex = Math.min(4, Math.floor(current.depth01 * 5))
      const targetStageIndex = VISUAL_ATLAS_STAGES.findIndex((s) => s.id === mappedStage)
      if (currentStageIndex === targetStageIndex) return current
      return { ...current, depth01: nextDepth }
    })
  }, [semanticScale])

  const evaluation = useMemo(
    () => evaluateFiveStagePhysiology(selectedSystemId, scenario),
    [selectedSystemId, scenario],
  )

  function selectStage(stageId: VisualAtlasStageId, index: number) {
    const nextDepth = depth01ForStageId(stageId)
    setScenario((current) => ({ ...current, depth01: nextDepth }))
    const stageSpec = VISUAL_ATLAS_STAGES[index]
    if (stageSpec) {
      onOpenScale?.(stageSpec.semanticScale)
      onSelectDomain?.(stageSpec.domainTarget)
    }
    const scroller = doomScrollRef.current
    if (scroller) {
      const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      if (maxScroll > 0) {
        syncingScrollRef.current = true
        scroller.scrollTo({ top: nextDepth * maxScroll, behavior: 'smooth' })
        setTimeout(() => {
          syncingScrollRef.current = false
        }, 250)
      }
    }
  }

  function handleDoomScroll() {
    if (syncingScrollRef.current) return
    const scroller = doomScrollRef.current
    if (!scroller) return
    const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight)
    const ratio = Math.min(1, Math.max(0, scroller.scrollTop / maxScroll))
    const rounded = Math.round(ratio * 100) / 100
    setScenario((current) => (Math.abs(current.depth01 - rounded) < 0.01 ? current : { ...current, depth01: rounded }))
    setPhase01((prev) => Math.round(((prev + 0.03) % 1) * 100) / 100)
  }

  const activeStageId: VisualAtlasStageId = evaluation.ok
    ? evaluation.scroll.activeStageId
    : 'macro-body'
  const activeStageSpec = evaluation.ok
    ? evaluation.scroll.activeStage
    : VISUAL_ATLAS_STAGES[0]!

  return (
    <section
      data-five-stage-visual-atlas="v1"
      data-active-atlas-stage={activeStageId}
      aria-label="5-stage multiscale visual physiology atlas"
      className="dark border-t border-white/[.08] bg-[#03070c] p-3 sm:p-4"
    >
      <button
        type="button"
        aria-expanded={atlasExpanded}
        data-five-stage-atlas-drawer="v1"
        onClick={() => setAtlasExpanded((prev) => !prev)}
        className="dark flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border border-cyan-300/30 bg-[#07131e] px-3.5 py-2.5 text-sm font-black text-white"
      >
        <span>5-Stage Atlas</span>
        <span className="font-mono text-sm font-bold text-cyan-200">
          1.7m → 2nm
        </span>
      </button>
      {atlasExpanded && (
        <div className="mt-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200/75">
                5-Stage Next-Gen Visual Atlas · Textbook &amp; Journal Coupled
              </div>
              <h4 className="mt-0.5 truncate text-sm font-black tracking-[-.02em] text-white sm:text-base">
                Whole Body → Organ Conduit → Tissue Microvessel → Cell → Molecular Gene
              </h4>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 text-[10px] font-bold">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/[.08] px-2.5 py-1 text-cyan-100">
                Scale: {evaluation.ok ? evaluation.scroll.characteristicLengthLabel : '1.70 m'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-white/75">
                LOD: {evaluation.ok ? `${evaluation.scroll.effectiveRelativeZoom.toFixed(1)}×` : '1.0×'}
              </span>
            </div>
          </div>

      {/* 5-Stage Interactive Continuum Rail */}
      <div
        className="no-scrollbar mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5"
        role="tablist"
        aria-label="Five biological atlas stages"
      >
        {VISUAL_ATLAS_STAGES.map((stage, idx) => {
          const active = stage.id === activeStageId
          return (
            <button
              key={stage.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-atlas-stage-button={stage.id}
              onClick={() => selectStage(stage.id, idx)}
              className={
                'min-h-[54px] min-w-0 rounded-2xl border p-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ' +
                (active
                  ? 'border-cyan-300/45 bg-cyan-300/[.12] text-white'
                  : 'border-white/[.08] bg-white/[.02] text-white/55 hover:border-white/15 hover:bg-white/[.05] hover:text-white/85')
              }
            >
              <div className="flex items-center justify-between gap-1 text-[9px] font-black uppercase tracking-[.12em]">
                <span className={active ? 'text-cyan-200' : 'text-white/40'}>
                  Stage 0{stage.index}
                </span>
                <span className="truncate font-mono text-[8px] text-cyan-200/70">
                  {stage.scaleRangeLabel.split('·')[0]?.trim()}
                </span>
              </div>
              <div className="mt-1 truncate text-[11px] font-black">{stage.shortLabel}</div>
            </button>
          )
        })}
      </div>

      {/* Main Cinema Viewport + Doom-Scroll Track & Hands-On Coupling Controls */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Left: Visual Physiology SVG Cinema + Doom-Scroll Track */}
        <div className="min-w-0 rounded-2xl border border-white/[.08] bg-[#050b12] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-[.15em] text-cyan-200/70">
                Stage 0{activeStageSpec.index} · {activeStageSpec.scaleRangeLabel}
              </div>
              <div className="truncate text-xs font-black text-white sm:text-sm">
                {activeStageSpec.title}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPhase01((p) => Math.round(((p + 0.18) % 1) * 100) / 100)}
              className="min-h-[44px] rounded-xl border border-cyan-300/25 bg-cyan-300/[.08] px-3 text-[10px] font-black text-cyan-100 hover:bg-cyan-300/[.15]"
            >
              Pulse cycle ({Math.round(phase01 * 100)}%)
            </button>
          </div>

          {evaluation.ok ? (
            <>
              <div className="mt-2.5 overflow-hidden rounded-xl border border-white/[.07] bg-[#02060a] p-2">
                <StageCinemaSvg
                  activeStageId={activeStageId}
                  stageProgress01={evaluation.scroll.stageLocalProgress01}
                  phase01={phase01}
                  systemLabel={evaluation.system.systemLabel}
                  selectedStructureName={selectedStructureName}
                  metrics={evaluation.metrics}
                />
              </div>

              <p className="mt-2.5 text-[11px] leading-relaxed text-white/70">
                {evaluation.system.stageNarratives[activeStageId]}
              </p>

              {/* Landmarks at this stage that bind directly to the 3D/micro projector */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-[.12em] text-white/40">
                  Stage landmarks:
                </span>
                {evaluation.system.stageLandmarks[activeStageId].map((landmark) => (
                  <button
                    key={landmark}
                    type="button"
                    onClick={() => onSelectStructure?.(landmark)}
                    className="min-h-[44px] rounded-full border border-white/10 bg-white/[.03] px-3 text-[10px] font-bold text-cyan-100/85 hover:border-cyan-300/35 hover:bg-cyan-300/[.10]"
                  >
                    {landmark}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p
              role="status"
              className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/[.06] p-3 text-xs text-amber-100"
            >
              Unsupported physiology scenario: {evaluation.detail}
            </p>
          )}

          {/* Continuous Doom-Scroll Journey Deck */}
          <div className="mt-3 border-t border-white/[.07] pt-2.5">
            <div className="flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[.14em] text-white/45">
              <span>Doom-scroll multiscale stream (scroll or tap to descend)</span>
              <span className="font-mono text-cyan-200/75">
                {Math.round(scenario.depth01 * 100)}% depth
              </span>
            </div>
            <div
              ref={doomScrollRef}
              onScroll={handleDoomScroll}
              data-atlas-doom-scroll-stream="v1"
              tabIndex={0}
              aria-label="Scrollable five-stage human body to molecular stream"
              className="mt-1.5 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-white/[.06] bg-black/40 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              {VISUAL_ATLAS_STAGES.map((stage, idx) => {
                const isCurrent = stage.id === activeStageId
                const profile = evaluation.ok ? evaluation.system : null
                return (
                  <div
                    key={stage.id}
                    data-doom-scroll-card={stage.id}
                    className={
                      'rounded-xl border p-2.5 transition ' +
                      (isCurrent
                        ? 'border-cyan-300/40 bg-cyan-300/[.08]'
                        : 'border-white/[.06] bg-white/[.015]')
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-cyan-100">
                        0{stage.index} · {stage.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => selectStage(stage.id, idx)}
                        className="min-h-[44px] shrink-0 rounded-lg border border-white/10 bg-white/[.04] px-2.5 text-[9px] font-black text-white/80 hover:border-cyan-300/35 hover:text-white"
                      >
                        Focus stage 0{stage.index}
                      </button>
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-white/55">
                      {profile ? profile.stageNarratives[stage.id] : stage.summary}
                    </p>
                    <div className="mt-1 font-mono text-[9px] text-cyan-200/70">
                      {stage.primaryLaw}: {stage.primaryEquation}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Hands-On Physiological Controls & Coupled Readouts */}
        <div className="min-w-0 space-y-3 rounded-2xl border border-white/[.08] bg-[#050b12] p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.15em] text-cyan-200/70">
                Hands-on physiological controls
              </div>
              <div className="text-xs font-black text-white">
                Coupled macro-to-molecular state
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setScenario({ ...FIVE_STAGE_DEFAULTS })
                setPhase01(0.35)
              }}
              className="min-h-[44px] rounded-xl border border-white/15 bg-white/[.03] px-3 text-[10px] font-black text-white/80 hover:bg-white/[.08] hover:text-white"
            >
              Reset atlas
            </button>
          </div>

          <div className="space-y-2.5">
            <label className="block min-w-0 rounded-xl border border-white/[.07] bg-white/[.02] p-2.5 text-[11px] text-white/75">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">Continuous zoom depth (1.7 m → 2 nm)</span>
                <output className="font-mono text-xs font-black text-cyan-200">
                  {Math.round(scenario.depth01 * 100)}%
                </output>
              </div>
              <input
                type="range"
                aria-label="Atlas continuous zoom depth"
                min={0}
                max={1}
                step={0.02}
                value={scenario.depth01}
                onChange={(e) => {
                  const nextDepth = Number(e.target.value)
                  setScenario((current) => ({ ...current, depth01: nextDepth }))
                }}
                className="mt-2 block min-h-[44px] w-full cursor-pointer accent-cyan-300"
              />
            </label>

            <label className="block min-w-0 rounded-xl border border-white/[.07] bg-white/[.02] p-2.5 text-[11px] text-white/75">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">Systemic metabolic drive (rest → peak)</span>
                <output className="font-mono text-xs font-black text-cyan-200">
                  {scenario.metabolicDriveFold.toFixed(1)}×
                </output>
              </div>
              <input
                type="range"
                aria-label="Atlas metabolic drive fold"
                min={0.5}
                max={3.0}
                step={0.1}
                value={scenario.metabolicDriveFold}
                onChange={(e) =>
                  setScenario((current) => ({
                    ...current,
                    metabolicDriveFold: Number(e.target.value),
                  }))
                }
                className="mt-2 block min-h-[44px] w-full cursor-pointer accent-cyan-300"
              />
            </label>

            <label className="block min-w-0 rounded-xl border border-white/[.07] bg-white/[.02] p-2.5 text-[11px] text-white/75">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">Inspired O₂ fraction (FiO₂)</span>
                <output className="font-mono text-xs font-black text-cyan-200">
                  {(scenario.oxygenFraction * 100).toFixed(0)}%
                </output>
              </div>
              <input
                type="range"
                aria-label="Atlas inspired oxygen fraction"
                min={0.12}
                max={1.0}
                step={0.01}
                value={scenario.oxygenFraction}
                onChange={(e) =>
                  setScenario((current) => ({
                    ...current,
                    oxygenFraction: Number(e.target.value),
                  }))
                }
                className="mt-2 block min-h-[44px] w-full cursor-pointer accent-cyan-300"
              />
            </label>
          </div>

          {evaluation.ok && (
            <dl
              aria-live="polite"
              data-five-stage-readouts="v1"
              className="grid grid-cols-2 gap-2"
            >
              <div className="rounded-xl border border-white/[.08] bg-white/[.02] p-2.5">
                <dt className="text-[9px] font-black uppercase tracking-[.12em] text-white/45">
                  01 · Whole-body perfusion
                </dt>
                <dd className="mt-1 font-mono text-xs font-black text-cyan-100">
                  {evaluation.metrics.stage1Macro.systemPerfusionMlMin} mL/min
                  <span className="block text-[9px] font-normal text-white/45">
                    CO {evaluation.metrics.stage1Macro.cardiacOutputLMin.toFixed(1)} L/min ({evaluation.metrics.stage1Macro.systemFlowSharePct}%)
                  </span>
                </dd>
              </div>

              <div className="rounded-xl border border-white/[.08] bg-white/[.02] p-2.5">
                <dt className="text-[9px] font-black uppercase tracking-[.12em] text-white/45">
                  02 · Organ conduit ΔP
                </dt>
                <dd className="mt-1 font-mono text-xs font-black text-cyan-100">
                  {evaluation.metrics.stage2Organ.drivingPressureMmHg} mmHg
                  <span className="block truncate text-[9px] font-normal text-white/45">
                    {evaluation.metrics.stage2Organ.organThroughputValue} {evaluation.metrics.stage2Organ.organThroughputUnit}
                  </span>
                </dd>
              </div>

              <div className="rounded-xl border border-white/[.08] bg-white/[.02] p-2.5">
                <dt className="text-[9px] font-black uppercase tracking-[.12em] text-white/45">
                  03 · Krogh capillary PO₂
                </dt>
                <dd className="mt-1 font-mono text-xs font-black text-cyan-100">
                  {evaluation.metrics.stage3Tissue.kroghArterialPo2MmHg} → {evaluation.metrics.stage3Tissue.kroghVenousPo2MmHg} mmHg
                  <span className="block text-[9px] font-normal text-white/45">
                    R = {evaluation.metrics.stage3Tissue.effectiveDiffusionRadiusUm} µm · barrier {evaluation.metrics.stage3Tissue.barrierThicknessUm} µm
                  </span>
                </dd>
              </div>

              <div className="rounded-xl border border-white/[.08] bg-white/[.02] p-2.5">
                <dt className="text-[9px] font-black uppercase tracking-[.12em] text-white/45">
                  04 · Cellular Vm &amp; [Ca²⁺]
                </dt>
                <dd className="mt-1 font-mono text-xs font-black text-cyan-100">
                  {evaluation.metrics.stage4Cellular.restingMembranePotentialMv} mV · {evaluation.metrics.stage4Cellular.cytosolicCalciumUm} µM
                  <span className="block truncate text-[9px] font-normal text-white/45">
                    {evaluation.metrics.stage4Cellular.dominantCellType}
                  </span>
                </dd>
              </div>

              <div className="col-span-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.05] p-2.5">
                <dt className="text-[9px] font-black uppercase tracking-[.12em] text-cyan-200/75">
                  05 · Subcellular Δp, ATP turnover &amp; genomic anchor
                </dt>
                <dd className="mt-1 flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs font-black text-white">
                  <span>
                    Δp {evaluation.metrics.stage5Molecular.protonMotiveForceMv} mV · ATP {evaluation.metrics.stage5Molecular.atpTurnoverMmolKgMin} mmol/kg/min
                  </span>
                  <span className="text-[10px] text-cyan-200">
                    {evaluation.metrics.stage5Molecular.keyGeneOrProteinSymbol} · PubChem CID {evaluation.metrics.stage5Molecular.pubchemAnchorCid}
                  </span>
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      {/* Progressive Disclosure: Dense Textbook & Peer-Reviewed Journal Provenance */}
      <details
        data-five-stage-sources="v1"
        className="mt-3 rounded-2xl border border-white/[.08] bg-white/[.015] p-3"
      >
        <summary className="flex min-h-[44px] cursor-pointer items-center justify-between gap-2 text-xs font-black text-cyan-100">
          <span>Textbook &amp; peer-reviewed journal sources · governing multiscale equations</span>
          <span className="text-[9px] font-bold uppercase tracking-[.14em] text-white/45">
            {ATLAS_LITERATURE_SOURCES.length} verified references
          </span>
        </summary>
        <div className="mt-3 space-y-2.5 border-t border-white/[.07] pt-3 text-[11px] leading-relaxed text-white/65">
          {evaluation.ok && (
            <p className="rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-2.5 text-[10px] text-amber-100/80">
              {evaluation.boundaryNote}
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {ATLAS_LITERATURE_SOURCES.map((source) => (
              <div
                key={source.id}
                className="rounded-xl border border-white/[.08] bg-black/30 p-2.5"
              >
                <div className="text-[10px] font-black text-white/90">
                  {source.authors} ({source.year}) · {source.title}
                </div>
                <div className="mt-0.5 text-[9px] font-bold text-cyan-200/75">
                  {source.publication} · {source.pmidOrDoi}
                </div>
                <div className="mt-1 text-[10px] text-white/60">{source.quantitativeLaw}</div>
                <div className="mt-1 rounded bg-white/[.04] px-2 py-1 font-mono text-[9px] text-cyan-100">
                  {source.equation}
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex min-h-[44px] items-center text-[10px] font-bold text-cyan-200 underline"
                >
                  Open source reference ({source.id})
                </a>
              </div>
            ))}
          </div>
        </div>
      </details>
        </div>
      )}
    </section>
  )
}

interface StageCinemaSvgProps {
  activeStageId: VisualAtlasStageId
  stageProgress01: number
  phase01: number
  systemLabel: string
  selectedStructureName: string | null
  metrics: Extract<ReturnType<typeof evaluateFiveStagePhysiology>, { ok: true }>['metrics']
}

function StageCinemaSvg({
  activeStageId,
  stageProgress01,
  phase01,
  systemLabel,
  selectedStructureName,
  metrics,
}: StageCinemaSvgProps) {
  const pulseRadius = 14 + Math.sin(phase01 * Math.PI * 2) * 3.5
  const waveOffset = Math.round(phase01 * 48)

  return (
    <svg
      viewBox="0 0 520 210"
      className="h-48 w-full select-none sm:h-52"
      role="img"
      aria-label={`${systemLabel} ${activeStageId} physiological schematic`}
    >
      <defs>
        <radialGradient id="pmdAtlasGlow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.24" />
          <stop offset="70%" stopColor="#0ea5e9" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#02060a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pmdArterialVenous" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#a855f7" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      <rect width="520" height="210" rx="12" fill="#030810" />
      <circle cx="260" cy="105" r="95" fill="url(#pmdAtlasGlow)" />

      {/* Background semantic coordinate grid */}
      <g stroke="rgba(148,163,184,0.10)" strokeWidth="1">
        <line x1="0" y1="52" x2="520" y2="52" />
        <line x1="0" y1="105" x2="520" y2="105" />
        <line x1="0" y1="158" x2="520" y2="158" />
        <line x1="130" y1="0" x2="130" y2="210" />
        <line x1="260" y1="0" x2="260" y2="210" />
        <line x1="390" y1="0" x2="390" y2="210" />
      </g>

      {activeStageId === 'macro-body' && (
        <g>
          <ellipse cx="260" cy="36" rx="18" ry="20" fill="none" stroke="#67e8f9" strokeWidth="2" />
          <rect x="232" y="60" width="56" height="78" rx="18" fill="rgba(34,211,238,0.08)" stroke="#67e8f9" strokeWidth="2" />
          <line x1="232" y1="70" x2="195" y2="128" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
          <line x1="288" y1="70" x2="325" y2="128" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
          <line x1="246" y1="138" x2="236" y2="196" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
          <line x1="274" y1="138" x2="284" y2="196" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" />
          <path d="M 260 88 C 165 55, 145 155, 260 132" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="6 4" strokeDashoffset={-waveOffset} />
          <path d="M 260 88 C 355 55, 375 155, 260 132" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="6 4" strokeDashoffset={waveOffset} />
          <circle cx="260" cy="92" r={pulseRadius} fill="rgba(244,63,94,0.28)" stroke="#fda4af" strokeWidth="2" />
          <text x="18" y="28" fill="#e2e8f0" fontSize="11" fontWeight="700">
            01 · Whole Body Homeostasis ({systemLabel})
          </text>
          <text x="18" y="46" fill="#67e8f9" fontSize="10" fontFamily="monospace">
            CO {metrics.stage1Macro.cardiacOutputLMin.toFixed(2)} L/min · Organ flow {metrics.stage1Macro.systemPerfusionMlMin} mL/min
          </text>
        </g>
      )}

      {activeStageId === 'organ-conduit' && (
        <g>
          <path d="M 45 72 C 180 52, 340 52, 475 72 L 475 138 C 340 158, 180 158, 45 138 Z" fill="rgba(14,165,233,0.10)" stroke="#38bdf8" strokeWidth="2.5" />
          <path d="M 65 92 Q 260 72 455 92" fill="none" stroke="#f43f5e" strokeWidth="3" strokeDasharray="10 6" strokeDashoffset={-waveOffset} />
          <path d="M 65 105 Q 260 105 455 105" fill="none" stroke="#67e8f9" strokeWidth="3.5" strokeDasharray="12 6" strokeDashoffset={-waveOffset * 1.2} />
          <path d="M 65 118 Q 260 138 455 118" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="10 6" strokeDashoffset={-waveOffset} />
          <circle cx={120 + stageProgress01 * 280} cy="105" r={pulseRadius} fill="rgba(34,211,238,0.22)" stroke="#a5f3fc" strokeWidth="2" />
          <text x="18" y="28" fill="#e2e8f0" fontSize="11" fontWeight="700">
            02 · {metrics.stage2Organ.conduitName}
          </text>
          <text x="18" y="46" fill="#67e8f9" fontSize="10" fontFamily="monospace">
            ΔP {metrics.stage2Organ.drivingPressureMmHg} mmHg · {metrics.stage2Organ.organThroughputValue} {metrics.stage2Organ.organThroughputUnit}
          </text>
        </g>
      )}

      {activeStageId === 'tissue-microvasculature' && (
        <g>
          <rect x="55" y="48" width="410" height="114" rx="22" fill="rgba(168,85,247,0.08)" stroke="rgba(192,132,252,0.45)" strokeWidth="1.5" strokeDasharray="5 3" />
          <rect x="55" y="82" width="410" height="46" rx="12" fill="url(#pmdArterialVenous)" fillOpacity="0.28" stroke="#fda4af" strokeWidth="2" />
          {[0, 1, 2, 3, 4].map((idx) => {
            const cx = 95 + ((idx * 78 + waveOffset * 1.5) % 340)
            return (
              <g key={idx}>
                <ellipse cx={cx} cy="105" rx="13" ry="8" fill="#f43f5e" stroke="#fecdd3" strokeWidth="1.5" />
                <line x1={cx} y1="82" x2={cx} y2="56" stroke="#67e8f9" strokeWidth="1.5" strokeDasharray="3 2" />
                <line x1={cx} y1="128" x2={cx} y2="154" stroke="#67e8f9" strokeWidth="1.5" strokeDasharray="3 2" />
              </g>
            )
          })}
          <text x="18" y="28" fill="#e2e8f0" fontSize="11" fontWeight="700">
            03 · {metrics.stage3Tissue.tissueBarrierName}
          </text>
          <text x="18" y="44" fill="#67e8f9" fontSize="10" fontFamily="monospace">
            Krogh PO₂: {metrics.stage3Tissue.kroghArterialPo2MmHg} → {metrics.stage3Tissue.kroghVenousPo2MmHg} mmHg (min tissue {metrics.stage3Tissue.kroghMinTissuePo2MmHg} mmHg)
          </text>
        </g>
      )}

      {activeStageId === 'cellular-architecture' && (
        <g>
          <ellipse cx="215" cy="112" rx="135" ry="68" fill="rgba(6,182,212,0.09)" stroke="#22d3ee" strokeWidth="3" />
          <ellipse cx="215" cy="112" rx="129" ry="62" fill="none" stroke="rgba(165,243,252,0.35)" strokeWidth="1" strokeDasharray="4 3" />
          <circle cx="190" cy="112" r="28" fill="rgba(139,92,246,0.25)" stroke="#c4b5fd" strokeWidth="2" />
          <ellipse cx="268" cy="96" rx="22" ry="11" fill="rgba(251,191,36,0.22)" stroke="#fde68a" strokeWidth="1.8" />
          <ellipse cx="258" cy="130" rx="20" ry="10" fill="rgba(251,191,36,0.22)" stroke="#fde68a" strokeWidth="1.8" />
          <polyline
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2.5"
            points="365,145 385,145 398,62 412,125 435,132 455,152 495,145"
          />
          <text x="18" y="28" fill="#e2e8f0" fontSize="11" fontWeight="700">
            04 · {metrics.stage4Cellular.dominantCellType}
          </text>
          <text x="18" y="44" fill="#67e8f9" fontSize="10" fontFamily="monospace">
            Vm {metrics.stage4Cellular.restingMembranePotentialMv} mV · [Ca²⁺]i {metrics.stage4Cellular.cytosolicCalciumUm} µM · {metrics.stage4Cellular.excitationFrequencyHz} Hz
          </text>
        </g>
      )}

      {activeStageId === 'subcellular-molecular' && (
        <g>
          <path d="M 45 118 Q 105 68, 165 118 T 285 118 T 405 118" fill="none" stroke="#38bdf8" strokeWidth="3" />
          <path d="M 45 136 Q 105 86, 165 136 T 285 136 T 405 136" fill="none" stroke="#818cf8" strokeWidth="2" />
          <rect x="246" y="92" width="28" height="36" rx="6" fill="#0284c7" stroke="#bae6fd" strokeWidth="2" />
          <circle cx="260" cy="74" r={pulseRadius * 1.15} fill="rgba(251,191,36,0.28)" stroke="#fde047" strokeWidth="2.5" />
          <path d="M 380 62 C 410 82, 410 142, 440 162 C 470 182, 470 62, 495 82" fill="none" stroke="#c084fc" strokeWidth="2.5" />
          <text x="18" y="28" fill="#e2e8f0" fontSize="11" fontWeight="700">
            05 · {metrics.stage5Molecular.subcellularAnchorName}
          </text>
          <text x="18" y="44" fill="#fde047" fontSize="10" fontFamily="monospace">
            Δp {metrics.stage5Molecular.protonMotiveForceMv} mV · ATP {metrics.stage5Molecular.atpTurnoverMmolKgMin} mmol/kg/min · {metrics.stage5Molecular.keyGeneOrProteinSymbol}
          </text>
        </g>
      )}

      {selectedStructureName && (
        <text x="18" y="198" fill="#a5f3fc" fontSize="10" fontFamily="monospace">
          Focused mesh: {selectedStructureName}
        </text>
      )}
    </svg>
  )
}

export default FiveStageVisualAtlas
