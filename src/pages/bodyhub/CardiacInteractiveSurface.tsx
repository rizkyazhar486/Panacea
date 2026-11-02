import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { calculateCardiacWiggersCycle, type CardiacWiggersCycleState } from '../../lib/medical3DFrontier'

const CardioAtlas3D = lazy(() => import('../../components/CardioAtlas3D'))
const CardiacCycle3D = lazy(() => import('../../components/CardiacCycle3D'))

type CardiacView = 'anatomy' | 'cycle' | 'electrical' | 'wiggers'

const VIEW_META: Record<CardiacView, { label: string; eyebrow: string; description: string }> = {
  anatomy: {
    label: 'Anatomy',
    eyebrow: 'Source-backed cardiovascular atlas',
    description: 'Inspect the heart, valves and connected vessels in the same cardiovascular source geometry used elsewhere in Body Exposure.',
  },
  cycle: {
    label: 'Cardiac cycle',
    eyebrow: 'Structure + flow + phase',
    description: 'Watch filling and ejection against an adjustable teaching heart rate while preserving the source geometry.',
  },
  electrical: {
    label: 'Electrical',
    eyebrow: 'Conduction + ECG context',
    description: 'Relate the conduction sequence to a synchronized synthetic ECG teaching strip, then open the full electrophysiology simulator.',
  },
  wiggers: {
    label: 'Wiggers & Journey',
    eyebrow: 'Valvular dynamics + Prometheus learning journey',
    description: 'Phase-locked Wiggers pressure–volume cycle, valvular counter-phase kinetics, linked Prometheus case, and return to anatomy.',
  },
}

const CONDUCTION = [
  ['SA node', 'Atrial activation'],
  ['AV node', 'Physiologic delay'],
  ['His bundle', 'Ventricular entry'],
  ['Bundle branches', 'Septal conduction'],
  ['Purkinje network', 'Ventricular activation'],
] as const

const CLINICAL_VIGNETTE_OPTIONS = [
  {
    id: 'AS',
    label: 'Severe Aortic Stenosis',
    description: 'Fixed LV outflow obstruction producing transvalvular gradient > 40 mmHg and prolonged ejection peak.',
    isCorrect: true,
    bayesianPosterior: 0.94,
    explanation: 'Correct! Aortic stenosis delays peak systolic flow, elevates peak LV pressure markedly above aortic pressure, and causes a crescendo-decrescendo ejection systolic murmur radiating to carotids.',
  },
  {
    id: 'MR',
    label: 'Mitral Regurgitation',
    description: 'Holosystolic backflow into low-pressure left atrium throughout ventricular systole.',
    isCorrect: false,
    bayesianPosterior: 0.04,
    explanation: 'Incorrect. Mitral regurgitation creates a high-pitched holosystolic murmur radiating to the axilla without outflow tract pressure elevation.',
  },
  {
    id: 'AR',
    label: 'Aortic Regurgitation',
    description: 'Diastolic backflow into LV leading to wide pulse pressure and rapid runoff.',
    isCorrect: false,
    bayesianPosterior: 0.02,
    explanation: 'Incorrect. Aortic regurgitation produces an early diastolic decrescendo murmur and water-hammer pulse, not systolic ejection delay.',
  },
] as const

function ecgPath(hr: number) {
  const beats = Math.max(2, Math.min(5, Math.round(hr / 28)))
  const width = 720
  const baseline = 74
  const beatW = width / beats
  const points: Array<[number, number]> = [[0, baseline]]

  for (let i = 0; i < beats; i++) {
    const x = i * beatW
    points.push(
      [x + beatW * 0.08, baseline],
      [x + beatW * 0.14, baseline - 8],
      [x + beatW * 0.20, baseline],
      [x + beatW * 0.36, baseline],
      [x + beatW * 0.40, baseline + 8],
      [x + beatW * 0.43, baseline - 52],
      [x + beatW * 0.47, baseline + 22],
      [x + beatW * 0.52, baseline],
      [x + beatW * 0.68, baseline],
      [x + beatW * 0.78, baseline - 16],
      [x + beatW * 0.90, baseline],
      [x + beatW, baseline],
    )
  }

  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
}

function Loader({ label }: { label: string }) {
  return <div className="grid min-h-[360px] place-items-center text-[10px] font-bold text-white/35">Loading {label}…</div>
}

export default function CardiacInteractiveSurface() {
  const [view, setView] = useState<CardiacView>('cycle')
  const [hr, setHr] = useState(72)
  const [simTimeSeconds, setSimTimeSeconds] = useState(0.2)
  const [selectedVignetteOption, setSelectedVignetteOption] = useState<string | null>(null)
  const [progressSaved, setProgressSaved] = useState(false)

  const meta = VIEW_META[view]
  const period = 60 / hr
  const ecg = useMemo(() => ecgPath(hr), [hr])

  // Continuous animation loop for Wiggers simulation when view is 'wiggers'
  useEffect(() => {
    if (view !== 'wiggers') return
    let animId: number
    let lastStamp = performance.now()

    const step = (now: number) => {
      const deltaSec = (now - lastStamp) / 1000
      lastStamp = now
      setSimTimeSeconds((prev) => (prev + deltaSec) % period)
      animId = requestAnimationFrame(step)
    }

    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [view, period])

  const wiggersState: CardiacWiggersCycleState = useMemo(() => {
    return calculateCardiacWiggersCycle(simTimeSeconds, hr)
  }, [simTimeSeconds, hr])

  const handleSaveProgress = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          'panacea_cardiac_golden_journey_progress',
          JSON.stringify({
            stepIndex: 12,
            completedAt: new Date().toISOString(),
            concept: 'CARDIAC_WIGGERS_VALVULAR_DYNAMICS',
            assessmentPassed: selectedVignetteOption === 'AS',
          }),
        )
      }
    } catch {
      // Local storage fallback for restricted sandboxes
    }
    setProgressSaved(true)
    setTimeout(() => setProgressSaved(false), 2500)
  }

  const handleReturnToAnatomy = () => {
    setView('anatomy')
  }

  return (
    <section
      data-cardiac-interactive-surface="v1"
      className="dark overflow-hidden rounded-[28px] border border-white/[.09] bg-[#03070b] text-white"
      aria-labelledby="cardiac-interactive-title"
    >
      <header className="border-b border-white/[.08] px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[.20em] text-rose-200/65">Body Exposure · interactive heart</div>
            <h4 id="cardiac-interactive-title" className="mt-1 text-base font-black tracking-[-.02em] sm:text-lg">
              Anatomy, function and rhythm in one cardiac surface
            </h4>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-white/40">
              One heart model, multiple projections. Connects visual anatomy to Wiggers valvular hemodynamics and the Prometheus learning journey.
            </p>
          </div>

          <div className="flex min-w-0 gap-1.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="Interactive cardiac views">
            {(Object.keys(VIEW_META) as CardiacView[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`min-h-10 shrink-0 rounded-full border px-3 text-[9px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/55 ${
                  view === key
                    ? 'border-rose-200/35 bg-rose-200/[.12] text-white'
                    : 'border-white/[.07] text-white/45 hover:bg-white/[.04] hover:text-white/80'
                }`}
              >
                {VIEW_META[key].label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative min-w-0 border-b border-white/[.08] xl:border-b-0 xl:border-r">
          <div className="absolute left-3 top-3 z-[2] rounded-2xl border border-white/[.08] bg-black/65 px-3 py-2 backdrop-blur-xl">
            <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/35">{meta.eyebrow}</div>
            <div className="mt-1 max-w-[280px] text-[9px] leading-relaxed text-white/60">{meta.description}</div>
          </div>

          <div className="min-h-[420px] p-2 pt-[92px] sm:p-3 sm:pt-[88px]">
            {view === 'wiggers' ? (
              <div className="space-y-4 p-2 sm:p-4">
                {/* Wiggers Live Hemodynamic & Valvular Telemetry Panel */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[8px] font-mono uppercase text-neutral-400">Phase</div>
                    <div className="mt-1 text-xs font-bold text-rose-300">
                      {wiggersState.phase.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[8px] text-white/35">{(wiggersState.normalizedPhase * 100).toFixed(0)}% of cycle</div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[8px] font-mono uppercase text-neutral-400">LV Pressure</div>
                    <div className="mt-1 text-base font-bold text-emerald-400">
                      {wiggersState.lvPressureMmhg.toFixed(0)} <span className="text-[9px] text-neutral-400">mmHg</span>
                    </div>
                    <div className="text-[8px] text-white/35">Aortic: {wiggersState.aorticPressureMmhg.toFixed(0)} mmHg</div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[8px] font-mono uppercase text-neutral-400">Aortic Valve</div>
                    <div className="mt-1 text-xs font-bold text-sky-300">
                      {wiggersState.aorticValveOpenFraction > 0.05 ? 'OPEN' : 'SEALED'}
                    </div>
                    <div className="text-[8px] text-white/35">Leaflet: {(wiggersState.aorticValveOpenFraction * 100).toFixed(0)}%</div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[8px] font-mono uppercase text-neutral-400">Mitral Valve</div>
                    <div className="mt-1 text-xs font-bold text-amber-300">
                      {wiggersState.mitralValveOpenFraction > 0.05 ? 'OPEN' : 'SEALED'}
                    </div>
                    <div className="text-[8px] text-white/35">Leaflet: {(wiggersState.mitralValveOpenFraction * 100).toFixed(0)}%</div>
                  </div>
                </div>

                {/* Valve Counter-Phase Kinematic Invariant Badge */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-2.5 text-[9px] text-emerald-200">
                  <span className="font-bold">● Valvular Counter-Phase Invariant:</span> Mitral and Aortic valves move in strict counter-phase (never simultaneously open), preventing regurgitation during normal conduction.
                </div>

                {/* Physiological Explanation Breakdown */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-[10px] leading-relaxed text-white/70">
                  <div className="font-bold uppercase tracking-wider text-white/40 text-[9px]">Physiological Mechanism</div>
                  {wiggersState.phase === 'ISOVOLUMETRIC_CONTRACTION' && (
                    <p className="mt-1 text-rose-200">
                      <strong>Isovolumetric Contraction:</strong> Ventricular depolarisation triggers rapid myocyte cross-bridge cycling. Intraventricular pressure spikes steep above atrial pressure, snapping the mitral valve shut (S1 heart sound). Volume remains constant at End-Diastolic Volume (EDV).
                    </p>
                  )}
                  {wiggersState.phase === 'SYSTOLIC_EJECTION' && (
                    <p className="mt-1 text-sky-200">
                      <strong>Systolic Ejection:</strong> LV pressure exceeds aortic diastolic pressure (80 mmHg), forcing the aortic valve cusps open. Blood accelerates rapidly into the aorta, reducing ventricular volume toward End-Systolic Volume (ESV).
                    </p>
                  )}
                  {wiggersState.phase === 'ISOVOLUMETRIC_RELAXATION' && (
                    <p className="mt-1 text-amber-200">
                      <strong>Isovolumetric Relaxation:</strong> As repolarisation concludes, myocyte tension collapses. Aortic recoil forces the semilunar leaflets shut (S2 heart sound, creating the dicrotic notch / incisura). LV pressure plummets while volume stays frozen at ESV.
                    </p>
                  )}
                  {wiggersState.phase === 'DIASTOLIC_FILLING' && (
                    <p className="mt-1 text-emerald-200">
                      <strong>Ventricular Diastolic Filling:</strong> Ventricular pressure drops below left atrial pressure, opening the bicuspid mitral valve. Blood flows down the pressure gradient to replenish the ventricular chamber.
                    </p>
                  )}
                </div>

                {/* Prometheus Synthetic Clinical Vignette & Assessment */}
                <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-4 text-[10px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-indigo-300">
                      Prometheus Learning Journey · EDU-4 / EDU-6
                    </span>
                    <span className="rounded-full bg-indigo-400/10 px-2 py-0.5 text-[8px] text-indigo-300">
                      Synthetic Case
                    </span>
                  </div>

                  <p className="mt-2 text-white/80 leading-relaxed font-sans">
                    <strong>Vignette:</strong> A 68-year-old patient presents with exertional angina and syncope. Cardiac auscultation reveals a harsh crescendo-decrescendo systolic murmur at the right upper sternal border radiating to the carotids. Peak LV systolic pressure is elevated to 175 mmHg while aortic pressure is 115 mmHg.
                  </p>

                  <div className="mt-3 space-y-2">
                    <div className="text-[9px] font-bold text-neutral-300">Select the underlying valvular pathophysiology:</div>
                    {CLINICAL_VIGNETTE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedVignetteOption(opt.id)}
                        className={`w-full text-left rounded-xl border p-2.5 transition ${
                          selectedVignetteOption === opt.id
                            ? opt.isCorrect
                              ? 'border-emerald-400/60 bg-emerald-500/15 text-white'
                              : 'border-rose-400/60 bg-rose-500/15 text-white'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="font-bold text-xs">{opt.label}</div>
                        <div className="text-[9px] text-white/50 mt-0.5">{opt.description}</div>
                        {selectedVignetteOption === opt.id && (
                          <div className={`mt-2 text-[9px] p-2 rounded-lg ${opt.isCorrect ? 'bg-emerald-950/40 text-emerald-200' : 'bg-rose-950/40 text-rose-200'}`}>
                            {opt.explanation} (Bayesian Posterior: {(opt.bayesianPosterior * 100).toFixed(0)}%)
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Actions: Save Progress and Return to Anatomy */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleSaveProgress}
                      className="min-h-9 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3.5 text-[9px] font-black text-indigo-100 hover:bg-indigo-500/30 transition"
                    >
                      {progressSaved ? 'Progress Saved ✓' : 'Save Learning Progress'}
                    </button>

                    <button
                      type="button"
                      onClick={handleReturnToAnatomy}
                      className="min-h-9 rounded-full bg-white/10 border border-white/20 px-3.5 text-[9px] font-black text-white hover:bg-white/20 transition"
                    >
                      Return to Anatomical Context →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Suspense fallback={<Loader label="cardiac render" />}>
                {view === 'anatomy' ? (
                  <CardioAtlas3D hr={hr} />
                ) : (
                  <CardiacCycle3D hr={hr} tinggi={400} />
                )}
              </Suspense>
            )}
          </div>

          <div className="border-t border-white/[.07] bg-black/25 p-3">
            <div className="flex items-center justify-between gap-3 text-[8px]">
              <span className="font-black uppercase tracking-[.14em] text-white/30">Synthetic ECG teaching strip</span>
              <span className="font-mono text-rose-100/70">{hr} bpm · T = {period.toFixed(2)} s</span>
            </div>
            <svg viewBox="0 0 720 120" role="img" aria-label={`Synthetic ECG teaching strip at ${hr} beats per minute`} className="mt-2 h-24 w-full overflow-visible rounded-xl border border-white/[.06] bg-black/45">
              {Array.from({ length: 12 }).map((_, index) => (
                <line key={`v-${index}`} x1={index * 60} y1="0" x2={index * 60} y2="120" stroke="rgba(255,255,255,.035)" />
              ))}
              {Array.from({ length: 5 }).map((_, index) => (
                <line key={`h-${index}`} x1="0" y1={index * 30} x2="720" y2={index * 30} stroke="rgba(255,255,255,.035)" />
              ))}
              <path d={ecg} fill="none" stroke="rgba(251,113,133,.95)" strokeWidth="2.25" vectorEffect="non-scaling-stroke" />
            </svg>
            <p className="mt-1.5 text-[8px] leading-relaxed text-white/28">
              ECG trace is a schematic teaching signal synchronized to the selected rate; it is not generated from patient electrodes and is not diagnostic.
            </p>
          </div>
        </div>

        <aside className="space-y-3 p-3 sm:p-4">
          <div>
            <label htmlFor="cardiac-surface-hr" className="text-[8px] font-black uppercase tracking-[.14em] text-white/30">Teaching heart rate</label>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black tracking-[-.04em] text-white">{hr}</span>
              <span className="text-[9px] font-bold text-white/35">beats/min</span>
            </div>
            <input
              id="cardiac-surface-hr"
              type="range"
              min="40"
              max="160"
              step="1"
              value={hr}
              onChange={(event) => setHr(Number(event.target.value))}
              className="mt-2 w-full accent-rose-300"
            />
            <div className="mt-1 flex justify-between text-[7px] text-white/25"><span>40</span><span>160</span></div>
          </div>

          {view === 'electrical' && (
            <div className="rounded-2xl border border-amber-300/12 bg-amber-300/[.035] p-3">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-amber-100/55">Conduction sequence</div>
              <ol className="mt-2 space-y-2">
                {CONDUCTION.map(([name, role], index) => (
                  <li key={name} className="flex gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-amber-200/15 bg-amber-200/[.05] text-[7px] font-black text-amber-100/65">{index + 1}</span>
                    <div>
                      <div className="text-[9px] font-black text-white/70">{name}</div>
                      <div className="text-[8px] text-white/30">{role}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-[7px] leading-relaxed text-amber-50/35">Sequence is schematic; the dedicated electrophysiology lab contains the tissue-level simulation.</p>
            </div>
          )}

          {view === 'wiggers' && (
            <div className="rounded-2xl border border-rose-300/12 bg-rose-300/[.035] p-3">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-rose-100/55">Wiggers Sequence</div>
              <ul className="mt-2 space-y-1.5 text-[8px] text-white/60">
                <li>1. Isovolumetric Contraction (S1)</li>
                <li>2. Rapid Systolic Ejection</li>
                <li>3. Isovolumetric Relaxation (S2)</li>
                <li>4. Rapid Diastolic Inflow</li>
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-white/[.07] bg-white/[.02] p-3">
            <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/30">Same heart, deeper model</div>
            <p className="mt-1.5 text-[9px] leading-relaxed text-white/40">
              Continue from visual cardiac behavior into re-entry, conduction velocity, refractory period, pseudo-ECG, drug effects and ablation topology.
            </p>
            <Link
              to="/electrophysiology"
              className="mt-3 inline-flex min-h-9 items-center rounded-full border border-cyan-300/18 bg-cyan-300/[.055] px-3 text-[8px] font-black text-cyan-100/70 transition hover:bg-cyan-300/[.1]"
            >
              Open electrophysiology lab
            </Link>
          </div>

          <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[.025] p-3 text-[8px] leading-relaxed text-cyan-50/45">
            Formula: cycle period T = 60 / HR. Existing hemodynamics below retains CO = HR × SV, SV = EDV − ESV and pressure–volume teaching relationships with its evidence ledger.
          </div>
        </aside>
      </div>
    </section>
  )
}
