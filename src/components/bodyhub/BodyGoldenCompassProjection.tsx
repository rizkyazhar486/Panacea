import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import { useOptionalStore } from '../../lib/store'
import { useOptionalLongitudinalState } from '../../lib/useLongitudinalState'
import { getVitals } from '../../lib/healthVitals'
import {
  COMPASS_PIPELINE_STAGES,
  DEFAULT_WHAT_IF_PROFILE,
  WHAT_IF_PRESETS,
  evaluateBodyGoldenCompass,
  type CompassPipelineStageId,
  type Sim4DProjectionMode,
  type WhatIfActivityProfile,
} from '../../domains/body-exposure/engine/bodyGoldenCompassEngine'

export interface BodyGoldenCompassProjectionProps {
  selectedSystemId: BodySystemId
  onSelectSystem: (systemId: BodySystemId) => void
  onSimModeChange?: (mode: Sim4DProjectionMode) => void
  selectedStructureName?: string | null
  semanticScaleLabel: string
  relativeZoom: number
  structureEducation?: string
  onNavigateGoldenJourney: () => void
  isGoldenRestored?: boolean
}

function finitePos(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
}

function compassPoint(index: number, total: number, value0to100: number, cx = 150, cy = 132, maxR = 88) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / total
  const r = (value0to100 / 100) * maxR
  return {
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r,
    lx: cx + Math.cos(angle) * (maxR + 21),
    ly: cy + Math.sin(angle) * (maxR + 21),
  }
}

export function BodyGoldenCompassProjection({
  selectedSystemId,
  onSelectSystem,
  onSimModeChange,
  selectedStructureName = null,
  semanticScaleLabel,
  relativeZoom,
  structureEducation = '',
  onNavigateGoldenJourney,
  isGoldenRestored = false,
}: BodyGoldenCompassProjectionProps) {
  const store = useOptionalStore()
  const longitudinal = useOptionalLongitudinalState()
  const account = store?.account ?? null
  const appState = store?.state ?? null

  const [rev, setRev] = useState(0)
  const [stage, setStage] = useState<CompassPipelineStageId>('visualize')
  const [whatIf, setWhatIf] = useState<WhatIfActivityProfile>(DEFAULT_WHAT_IF_PROFILE)
  const [activePreset, setActivePreset] = useState<'guideline' | 'below' | 'custom'>('guideline')
  const [userSimulated, setUserSimulated] = useState(false)

  useEffect(() => {
    const refresh = () => setRev((x) => x + 1)
    window.addEventListener('panacea:health-updated', refresh)
    window.addEventListener('panacea:body-character-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('panacea:health-updated', refresh)
      window.removeEventListener('panacea:body-character-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const vitals = useMemo(() => {
    void rev
    return getVitals(account)
  }, [account, rev])

  const inputs = useMemo(() => {
    const labEvents = longitudinal?.state?.metricEventIds?.['lab.result']?.length ?? null
    const latestSleep = appState?.sleepLogs?.length ? appState.sleepLogs[appState.sleepLogs.length - 1]?.hours : null
    const latestVo2 = appState?.vo2maxLog?.length ? appState.vo2maxLog[appState.vo2maxLog.length - 1]?.value : null
    return {
      restingHrBpm: finitePos(vitals.restingHr) ?? finitePos(vitals.heartRate),
      systolicMmHg: finitePos(vitals.systolic),
      diastolicMmHg: finitePos(vitals.diastolic),
      spo2Pct: finitePos(vitals.spo2Pct),
      sleepHours: finitePos(vitals.sleepH) ?? finitePos(latestSleep),
      waterMl: finitePos(vitals.waterMl),
      weightKg: finitePos(vitals.weightKg),
      heightCm: finitePos(vitals.heightCm),
      vo2Max: finitePos(vitals.vo2max) ?? finitePos(latestVo2),
      labRecordCount: labEvents,
    }
  }, [vitals, appState, longitudinal])

  const evaluation = useMemo(() => evaluateBodyGoldenCompass(inputs, whatIf), [inputs, whatIf])

  useEffect(() => {
    if (!userSimulated) return
    onSimModeChange?.(evaluation.recommendedSim4DMode)
  }, [userSimulated, evaluation.recommendedSim4DMode, onSimModeChange])

  function applyPreset(presetKey: 'guideline' | 'below') {
    setUserSimulated(true)
    setActivePreset(presetKey)
    setWhatIf(WHAT_IF_PRESETS[presetKey])
  }

  function updateWhatIf(patch: Partial<WhatIfActivityProfile>) {
    setUserSimulated(true)
    setActivePreset('custom')
    setWhatIf((prev) => ({ ...prev, ...patch }))
  }

  const stageSpec = COMPASS_PIPELINE_STAGES.find((s) => s.id === stage) ?? COMPASS_PIPELINE_STAGES[5]

  const polygon = (value: (axis: (typeof evaluation.axes)[number]) => number) =>
    evaluation.axes
      .map((a, i) => {
        const p = compassPoint(i, evaluation.axes.length, value(a))
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
      })
      .join(' ')
  const coveragePoly = polygon((a) => a.coveragePct)
  const planPoly = polygon((a) => a.planAttainmentPct)

  return (
    <aside
      data-body-golden-compass="v1"
      className="dark flex flex-col gap-2.5 bg-[#040913] p-3 text-white sm:p-4"
      aria-label="Golden Compass unified body intelligence chart"
    >
      {/* Top 1-Line Identity + Live Horizon Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.16em] text-amber-200">
            Golden Compass · 1 Chart
          </div>
          <div className="mt-0.5 text-xs font-black text-white">{stageSpec.title}</div>
        </div>
        <span className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-2.5 py-1 font-mono text-[10px] font-black text-emerald-200">
          Plan meets {evaluation.targetsMet}/{evaluation.targets.length} targets
        </span>
      </div>

      {/* 7-Stage Pipeline Selector */}
      <div
        role="tablist"
        aria-label="Golden Compass data pipeline"
        className="no-scrollbar flex gap-1 overflow-x-auto pb-0.5"
      >
        {COMPASS_PIPELINE_STAGES.map((item) => {
          const active = item.id === stage
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              data-pmd-native="true"
              aria-selected={active}
              onClick={() => setStage(item.id)}
              className={`min-h-[44px] shrink-0 rounded-full border px-2.5 text-[10px] font-black transition ${
                active
                  ? 'border-amber-300 bg-amber-300 text-neutral-950'
                  : 'border-white/15 bg-white/[.05] text-slate-200 hover:border-white/30 hover:text-white'
              }`}
            >
              {item.index} {item.shortLabel}
            </button>
          )
        })}
      </div>

      {/* THE ONE UNIFIED GOLDEN COMPASS RADAR PROJECTION */}
      <div className="rounded-2xl border border-amber-300/20 bg-[radial-gradient(circle_at_50%_48%,rgba(251,191,36,0.08),rgba(16,185,129,0.04)_52%,rgba(2,5,12,0.95))] p-2.5">
        <svg
          viewBox="0 0 300 264"
          className="mx-auto h-auto w-full max-w-[300px]"
          role="img"
          aria-label="Golden Compass six-axis multi-system physiological chart"
        >
          {[25, 50, 75, 100].map((ring) => (
            <circle
              key={ring}
              cx={150}
              cy={132}
              r={(ring / 100) * 88}
              fill="none"
              stroke={ring === 75 ? 'rgba(251,191,36,0.22)' : 'rgba(255,255,255,0.10)'}
              strokeWidth={ring === 100 ? 1.1 : 0.75}
              strokeDasharray={ring === 50 ? '3 3' : undefined}
            />
          ))}

          {evaluation.axes.map((axis, idx) => {
            const outer = compassPoint(idx, evaluation.axes.length, 100)
            const isSelected = axis.systemId === selectedSystemId
            return (
              <g key={axis.id}>
                <line
                  x1={150}
                  y1={132}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={isSelected ? 'rgba(52,211,153,0.75)' : 'rgba(255,255,255,0.14)'}
                  strokeWidth={isSelected ? 1.8 : 0.8}
                />
                <text
                  x={outer.lx}
                  y={outer.ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isSelected ? '#6ee7b7' : '#e2e8f0'}
                  fontSize="9.5"
                  fontWeight={isSelected ? '800' : '700'}
                >
                  {axis.shortLabel}
                </text>
              </g>
            )
          })}

          {/* Cakupan data tercatat (cyan) dan rencana vs target pedoman (hijau). */}
          <polygon points={coveragePoly} fill="rgba(34,211,238,0.10)" stroke="rgba(34,211,238,0.8)" strokeWidth="1.5" />
          <polygon points={planPoly} fill="rgba(16,185,129,0.16)" stroke="#34d399" strokeWidth="2" strokeDasharray="5 3" />

          {evaluation.axes.map((axis, idx) => {
            const covPt = compassPoint(idx, evaluation.axes.length, axis.coveragePct)
            const planPt = compassPoint(idx, evaluation.axes.length, axis.planAttainmentPct)
            return (
              <g key={`pt-${axis.id}`}>
                <circle cx={planPt.x} cy={planPt.y} r={3.2} fill="#34d399" stroke="#022c22" strokeWidth="1" />
                <circle
                  cx={covPt.x}
                  cy={covPt.y}
                  r={axis.systemId === selectedSystemId ? 4.6 : 3.4}
                  fill="#22d3ee"
                  stroke="#040913"
                  strokeWidth="1.2"
                />
              </g>
            )
          })}

          <text x={150} y={128} textAnchor="middle" fill="#fde68a" fontSize="18" fontWeight="900" fontFamily="monospace">
            {evaluation.processed.completenessPct}%
          </text>
          <text x={150} y={142} textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontWeight="700" letterSpacing="1.2">
            DATA RECORDED
          </text>
        </svg>

        <div className="mt-1.5 flex items-center justify-center gap-3 text-[10px] font-bold text-slate-200">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Data recorded</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Plan vs guideline</span>
        </div>

        {/* 1-Tap Axis -> Live 3D System Binding */}
        <div className="mt-2 grid grid-cols-3 gap-1" role="group" aria-label="Compass system axes">
          {evaluation.axes.map((axis) => {
            const selected = axis.systemId === selectedSystemId
            return (
              <button
                key={axis.id}
                type="button"
                data-pmd-native="true"
                aria-pressed={selected}
                onClick={() => onSelectSystem(axis.systemId)}
                className={`min-h-[44px] rounded-xl border px-1.5 text-[10px] font-black transition ${
                  selected
                    ? 'border-emerald-300 bg-emerald-400 text-neutral-950'
                    : 'border-white/15 bg-white/[.04] text-slate-200 hover:border-white/30 hover:text-white'
                }`}
              >
                {axis.shortLabel} · {axis.coveragePct}%
              </button>
            )
          })}
        </div>
      </div>

      {/* Stage-Specific Dynamic Lens */}
      {stage === 'collect' && (
        <div className="rounded-2xl border border-white/15 bg-white/[.04] p-3 text-[11px]">
          <div className="flex items-center justify-between font-bold text-slate-200">
            <span>Canonical signal coverage</span>
            <span className="font-mono text-cyan-200">{evaluation.processed.observedCount}/{evaluation.processed.totalSignals} ({evaluation.processed.completenessPct}%)</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-cyan-400" style={{ width: `${evaluation.processed.completenessPct}%` }} />
          </div>
          <p className="mt-2 text-slate-300">{stageSpec.summary}</p>
          <Link
            to="/fitness-hub?view=health-data"
            className="mt-2.5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-500/15 px-3 text-xs font-black text-cyan-100 hover:bg-cyan-500/25"
          >
            Sync IoT &amp; Vitals →
          </Link>
        </div>
      )}

      {stage === 'process' && (
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-xl border border-white/15 bg-white/[.04] p-2.5">
            <div className="text-[10px] font-bold uppercase text-slate-300">BMI</div>
            <div className="mt-0.5 font-mono text-base font-black text-white">{evaluation.processed.bmi ?? '—'}</div>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/[.04] p-2.5">
            <div className="text-[10px] font-bold uppercase text-slate-300">MAP (mmHg)</div>
            <div className="mt-0.5 font-mono text-base font-black text-cyan-200">{evaluation.processed.mapMmHg ?? '—'}</div>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/[.04] p-2.5">
            <div className="text-[10px] font-bold uppercase text-slate-300">Pulse Press.</div>
            <div className="mt-0.5 font-mono text-base font-black text-white">{evaluation.processed.pulsePressureMmHg ?? '—'}</div>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/[.04] p-2.5">
            <div className="text-[10px] font-bold uppercase text-slate-300">Data Ready</div>
            <div className="mt-0.5 font-mono text-base font-black text-emerald-300">{evaluation.processed.completenessPct}%</div>
          </div>
        </div>
      )}

      {stage === 'interpret' && (
        <div className="space-y-1.5 rounded-2xl border border-white/15 bg-white/[.04] p-2.5 text-[11px]">
          {evaluation.axes.map((axis) => (
            <div key={`int-${axis.id}`} className="flex items-center justify-between gap-2">
              <span className="truncate font-bold text-slate-200">{axis.shortLabel}</span>
              <span className="font-mono text-slate-200">
                {axis.observedSignals}/{axis.expectedSignals.length} signals · plan <strong className="text-emerald-300">{axis.planAttainmentPct}%</strong>
              </span>
            </div>
          ))}
        </div>
      )}

      {stage === 'specialize' && (
        <div className="space-y-2 rounded-2xl border border-white/15 bg-white/[.04] p-2.5">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-300">Selected 3D Structure</div>
          <div className="truncate text-xs font-black text-cyan-100">{selectedStructureName ?? 'Tap any organ mesh in 3D'}</div>
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
            <span title="Relative zoom controls representation/LOD; it is not optical magnification">Scale: {semanticScaleLabel}</span>
            <span className="font-mono text-cyan-200">{relativeZoom.toFixed(1)}×</span>
          </div>
          {structureEducation && (
            <details className="border-t border-white/10 pt-1.5">
              <summary className="flex min-h-[44px] cursor-pointer items-center text-[10px] font-black uppercase tracking-[.12em] text-cyan-200">
                Explain structure
              </summary>
              <p className="mt-1 line-clamp-5 whitespace-pre-line text-[11px] leading-relaxed text-slate-200">{structureEducation}</p>
            </details>
          )}
        </div>
      )}

      {stage === 'coupling' && (
        <div className="space-y-1.5 rounded-2xl border border-white/15 bg-white/[.04] p-2.5">
          {evaluation.targets.map((target) => (
            <button
              key={target.id}
              type="button"
              data-pmd-native="true"
              onClick={() => onSelectSystem(target.targetSystemIds[0])}
              className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5 text-left text-[10px] transition hover:border-cyan-300/40"
            >
              <div className="min-w-0">
                <div className="truncate font-black text-white">
                  {target.label}: {target.planValue} / {target.minimum} {target.unit}
                </div>
                <div className="truncate text-slate-300">{target.source}</div>
              </div>
              <span className={`shrink-0 font-mono font-black uppercase ${target.met ? 'text-emerald-300' : 'text-amber-200'}`}>
                {target.met ? 'Met' : 'Below'}
              </span>
            </button>
          ))}
        </div>
      )}

      {stage === 'visualize' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="rounded-xl border border-white/15 bg-white/[.04] p-2.5">
              <div className="text-[10px] font-bold uppercase text-slate-300">Data Ready</div>
              <div className="mt-0.5 font-mono text-sm font-black text-cyan-200">{evaluation.processed.completenessPct}%</div>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/[.04] p-2.5">
              <div className="text-[10px] font-bold uppercase text-slate-300">Semantic Zoom</div>
              <div className="mt-0.5 truncate font-mono text-sm font-black text-white">{semanticScaleLabel} ({relativeZoom.toFixed(1)}×)</div>
            </div>
          </div>
          <button
            type="button"
            data-pmd-native="true"
            onClick={() => setStage('simulate')}
            className="min-h-[44px] w-full rounded-xl border border-emerald-300/45 bg-emerald-500/20 px-3 text-xs font-black text-emerald-100 hover:bg-emerald-500/30"
          >
            Compare a weekly plan with guidelines →
          </button>
        </div>
      )}

      {stage === 'simulate' && (
        <div className="space-y-2 rounded-2xl border border-emerald-300/25 bg-emerald-950/20 p-2.5">
          <div className="grid grid-cols-2 gap-1" role="group" aria-label="Plan presets">
            {([
              ['guideline', 'Guideline minimum'],
              ['below', 'Below guideline'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                data-pmd-native="true"
                aria-pressed={activePreset === key}
                onClick={() => applyPreset(key)}
                className={`min-h-[44px] rounded-xl border px-2 text-[10px] font-black transition ${
                  activePreset === key
                    ? 'border-emerald-300 bg-emerald-400 text-neutral-950'
                    : 'border-white/15 bg-black/40 text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="block text-[10px] font-bold text-slate-200">
            Sleep: <span className="font-mono text-emerald-300">{whatIf.sleepHoursPerNight.toFixed(1)} h/night</span>
            <input
              type="range"
              aria-label="Planned sleep hours per night"
              min={4}
              max={10}
              step={0.5}
              value={whatIf.sleepHoursPerNight}
              onChange={(e) => updateWhatIf({ sleepHoursPerNight: Number(e.target.value) })}
              className="mt-1 h-11 min-h-[44px] w-full accent-emerald-400"
            />
          </label>
          <label className="block text-[10px] font-bold text-slate-200">
            Moderate aerobic: <span className="font-mono text-cyan-200">{Math.round(whatIf.aerobicMinPerWeek)} min/week</span>
            <input
              type="range"
              aria-label="Planned moderate aerobic minutes per week"
              min={0}
              max={360}
              step={15}
              value={whatIf.aerobicMinPerWeek}
              onChange={(e) => updateWhatIf({ aerobicMinPerWeek: Number(e.target.value) })}
              className="mt-1 h-11 min-h-[44px] w-full accent-cyan-400"
            />
          </label>
          <label className="block text-[10px] font-bold text-slate-200">
            Muscle-strengthening: <span className="font-mono text-amber-200">{Math.round(whatIf.strengthDaysPerWeek)} days/week</span>
            <input
              type="range"
              aria-label="Planned muscle-strengthening days per week"
              min={0}
              max={7}
              step={1}
              value={whatIf.strengthDaysPerWeek}
              onChange={(e) => updateWhatIf({ strengthDaysPerWeek: Number(e.target.value) })}
              className="mt-1 h-11 min-h-[44px] w-full accent-amber-300"
            />
          </label>
          <p className="text-[10px] leading-relaxed text-slate-300">{evaluation.epistemicNotice}</p>
        </div>
      )}

      {/* Golden Journey 3D <-> Case Bridge */}
      <div className="rounded-2xl border border-cyan-300/25 bg-cyan-950/35 p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-[10px] font-black uppercase tracking-[.14em] text-cyan-200">
            Golden Journey (EDU-6)
          </span>
          {isGoldenRestored && (
            <span className="rounded-full border border-emerald-500 bg-emerald-950/90 px-2 py-0.5 text-[10px] font-extrabold text-emerald-200">
              ✓ Step 15 Restored
            </span>
          )}
        </div>
        <button
          type="button"
          data-pmd-native="true"
          onClick={onNavigateGoldenJourney}
          className="mt-2 min-h-[44px] w-full rounded-xl border border-cyan-300/45 bg-cyan-500/20 px-3 text-[11px] font-black text-cyan-100 hover:bg-cyan-500/30"
        >
          Launch Golden Educational Journey →
        </button>
      </div>

      <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[.07] p-2.5 text-[10px] leading-relaxed text-amber-100">
        Educational/reference simulation. Generic atlas geometry and synthetic models are not patient-specific anatomy, diagnosis, operative navigation or treatment advice.
      </div>
    </aside>
  )
}

export default BodyGoldenCompassProjection
