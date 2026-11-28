import { useMemo, useState } from 'react'
import { BodyGoldenCompassProjection } from '../bodyhub/BodyGoldenCompassProjection'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  BIOMEDICAL_PHYSICS_CAE_CONTRACT,
  SURGICAL_100_LEVEL_CURRICULUM,
  evaluateEducationalSkillTelemetry,
  solveFickDiffusion,
  solveLinearElasticTissue,
  solvePoiseuilleStenosis,
} from '../../domains/body-exposure/engine/biomedicalPhysicsCaeCurriculumEngine'

export default function BodyScienceCaeCompassPanel() {
  const [subTab, setSubTab] = useState<'compass' | 'cae' | 'curriculum'>('compass')
  const [sysId, setSysId] = useState<BodySystemId>('cardiovascular')

  // Reduced-order CAE interactive sliders
  const [radiusMm, setRadiusMm] = useState(1.8)
  const [deltaPMmHg, setDeltaPMmHg] = useState(40)
  const [barrierUm, setBarrierUm] = useState(0.5)
  const [femurLoadN, setFemurLoadN] = useState(1800)
  const [activeBand, setActiveBand] = useState(6)

  const poiseuille = useMemo(
    () => solvePoiseuilleStenosis({ radiusMm, lengthMm: 25, deltaPMmHg }),
    [radiusMm, deltaPMmHg],
  )
  const fick = useMemo(
    () => solveFickDiffusion({ surfaceAreaM2: 70, deltaCMolPerM3: 0.12, thicknessUm: barrierUm }),
    [barrierUm],
  )
  const elastic = useMemo(
    () => solveLinearElasticTissue({ forceN: femurLoadN, crossSectionMm2: 450, youngsModulusGPa: 17 }),
    [femurLoadN],
  )
  const sampleEval = useMemo(
    () =>
      evaluateEducationalSkillTelemetry({
        bandIndex: activeBand,
        targetAccuracyPct: 92,
        motionEconomy01: 0.88,
        collisionCount: 1,
        workspaceViolations: 0,
        forceLimitViolations: 0,
      }),
    [activeBand],
  )

  return (
    <section
      data-body-science-cae-compass="v1"
      aria-label="Golden Compass Coverage, Biomedical Physics CAE and 100-Level Procedural Curriculum"
      className="dark space-y-3 rounded-2xl border border-amber-400/25 bg-[#040811] p-3.5 text-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex flex-wrap gap-1.5 font-mono text-[10px]" role="tablist">
          {([
            ['compass', 'Golden Compass · Recorded Coverage'],
            ['cae', 'Physics & Reduced-Order CAE (Poiseuille / Fick / Elastic)'],
            ['curriculum', '100-Level Robotics & Scope Curriculum'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={subTab === id}
              onClick={() => setSubTab(id)}
              className={`min-h-9 rounded-xl border px-3 font-black ${
                subTab === id ? 'border-amber-300 bg-amber-500/20 text-white' : 'border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[9px] text-cyan-200">
          {BIOMEDICAL_PHYSICS_CAE_CONTRACT.evidenceClass}
        </span>
      </div>

      {subTab === 'compass' && (
        <BodyGoldenCompassProjection
          selectedSystemId={sysId}
          onSelectSystem={setSysId}
          semanticScaleLabel="Whole Body → Multiscale"
          relativeZoom={1}
          onNavigateGoldenJourney={() => setSubTab('cae')}
        />
      )}

      {subTab === 'cae' && (
        <div className="grid gap-3 md:grid-cols-3 font-mono text-[10px]">
          {/* 1. Poiseuille Stenosis CAE */}
          <div className="space-y-2 rounded-xl border border-rose-400/25 bg-slate-950/90 p-3">
            <div className="font-black text-rose-200">HAGEN–POISEUILLE · R = 8μL / πr⁴</div>
            <label className="flex flex-col gap-1 text-slate-300">
              <span>Artery Radius: {radiusMm.toFixed(1)} mm</span>
              <input type="range" min={0.6} max={3.0} step={0.1} value={radiusMm} onChange={(e) => setRadiusMm(Number(e.target.value))} className="accent-rose-400" />
            </label>
            <label className="flex flex-col gap-1 text-slate-300">
              <span>ΔP: {deltaPMmHg} mmHg</span>
              <input type="range" min={10} max={90} step={5} value={deltaPMmHg} onChange={(e) => setDeltaPMmHg(Number(e.target.value))} className="accent-rose-400" />
            </label>
            <div className="rounded-lg bg-white/5 p-2 text-rose-100">
              Flow Q: <strong>{poiseuille.flowMlPerMin} mL/min</strong> · Re: <strong>{poiseuille.reynoldsNumber}</strong> · τw: <strong>{poiseuille.wallShearStressPa} Pa</strong>
              <div className="mt-0.5 text-[9px] text-amber-200">Regime: {poiseuille.flowRegime}</div>
            </div>
          </div>

          {/* 2. Fick Diffusion CAE */}
          <div className="space-y-2 rounded-xl border border-cyan-400/25 bg-slate-950/90 p-3">
            <div className="font-black text-cyan-200">FICK ALVEOLAR DIFFUSION · J = -DAΔC/Δx</div>
            <label className="flex flex-col gap-1 text-slate-300">
              <span>Barrier Δx: {barrierUm.toFixed(1)} µm</span>
              <input type="range" min={0.4} max={3.5} step={0.1} value={barrierUm} onChange={(e) => setBarrierUm(Number(e.target.value))} className="accent-cyan-400" />
            </label>
            <div className="rounded-lg bg-white/5 p-2 text-cyan-100">
              O₂ Flux J: <strong>{fick.fluxMmolPerMin} mmol/min</strong> · Conductance: <strong>{fick.relativeConductancePct}%</strong>
              <div className="mt-0.5 text-[9px] text-amber-200">{fick.barrierStatus}</div>
            </div>
          </div>

          {/* 3. Bone Elastic Stress-Strain CAE */}
          <div className="space-y-2 rounded-xl border border-emerald-400/25 bg-slate-950/90 p-3">
            <div className="font-black text-emerald-200">CORTICAL BONE · σ = F/A · ε = σ/E</div>
            <label className="flex flex-col gap-1 text-slate-300">
              <span>Axial Load F: {femurLoadN} N</span>
              <input type="range" min={400} max={6000} step={100} value={femurLoadN} onChange={(e) => setFemurLoadN(Number(e.target.value))} className="accent-emerald-400" />
            </label>
            <div className="rounded-lg bg-white/5 p-2 text-emerald-100">
              Stress σ: <strong>{elastic.stressMPa} MPa</strong> · Strain: <strong>{elastic.microstrain} µε</strong> · SF: <strong>{elastic.safetyFactor}×</strong>
              <div className="mt-0.5 text-[9px] text-amber-200">{elastic.regime}</div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'curriculum' && (
        <div className="space-y-2.5 font-mono text-[10px]">
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
            {SURGICAL_100_LEVEL_CURRICULUM.map((b) => (
              <button
                key={b.bandIndex}
                type="button"
                aria-pressed={b.bandIndex === activeBand}
                onClick={() => setActiveBand(b.bandIndex)}
                className={`rounded-xl border p-2 text-left transition ${
                  b.bandIndex === activeBand ? 'border-amber-300 bg-amber-500/20 text-white' : 'border-white/10 bg-slate-900/90 text-slate-300 hover:border-white/30'
                }`}
              >
                <div className="text-[9px] font-black text-amber-300">L{b.levelRange[0]}–{b.levelRange[1]}</div>
                <div className="font-bold text-white">{b.title}</div>
                <div className="mt-0.5 text-[9px] text-slate-400">Acc ≥{b.minTargetAccuracyPct}% · Max col {b.maxCollisions}</div>
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-[10.5px] text-slate-200">
            <strong className="text-amber-200">Sample Educational Telemetry (Band {activeBand}):</strong> Score {sampleEval.compositeScorePct}% — {sampleEval.feedback} (Educational training metric only; never clinical certification.)
          </div>
        </div>
      )}
    </section>
  )
}
