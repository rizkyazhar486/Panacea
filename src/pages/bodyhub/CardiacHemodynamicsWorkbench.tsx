import { useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  CARDIAC_HEMODYNAMICS_BOUNDARY,
  CARDIAC_HEMODYNAMICS_EVIDENCE,
  CARDIAC_PHASES,
  CARDIAC_TEACHING_RELATIONSHIPS,
  buildSyntheticPvLoop,
  simulateSyntheticCardiacHemodynamics,
  type SyntheticCardiacInput,
} from '../../lib/cardiacHemodynamicsLab'

const INPUT_META: Readonly<Record<keyof SyntheticCardiacInput, { label: string; hint: string }>> = {
  preload: { label: 'Preload', hint: 'Synthetic ventricular filling / end-diastolic loading signal' },
  afterload: { label: 'Afterload', hint: 'Synthetic resistance / pressure load against ejection' },
  contractility: { label: 'Contractility', hint: 'Synthetic intrinsic inotropic state' },
  heartRate: { label: 'Heart-rate drive', hint: 'Normalized rate drive; not beats per minute' },
  lusitropy: { label: 'Lusitropy', hint: 'Synthetic ventricular relaxation quality' },
}

const OUTPUT_META = {
  strokeVolumeSignal: 'Stroke-volume signal',
  fillingPressureSignal: 'Filling-pressure signal',
  ejectionPressureSignal: 'Ejection-pressure signal',
  cardiacOutputSignal: 'Cardiac-output signal',
  myocardialWorkSignal: 'Myocardial-work signal',
  diastolicPerfusionOpportunity: 'Diastolic-perfusion opportunity',
} as const

function pct(value: number) {
  return `${Math.round(value * 100)}%`
}

interface CardiacHemodynamicsWorkbenchProps {
  selectedAtlasSystemId?: BodySystemId
}

export default function CardiacHemodynamicsWorkbench({ selectedAtlasSystemId }: CardiacHemodynamicsWorkbenchProps) {
  const [input, setInput] = useState<SyntheticCardiacInput>({
    preload: 0.52,
    afterload: 0.48,
    contractility: 0.54,
    heartRate: 0.42,
    lusitropy: 0.55,
  })
  const state = useMemo(() => simulateSyntheticCardiacHemodynamics(input), [input])
  const pv = useMemo(() => buildSyntheticPvLoop(input), [input])

  if (selectedAtlasSystemId && selectedAtlasSystemId !== 'cardiovascular') {
    return (
      <section data-cardiac-hemodynamics-workbench="inactive" className="rounded-[24px] border border-white/[.08] bg-black/25 p-3.5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[8px] font-black uppercase tracking-[.18em] text-rose-200/60">Heart deep-dive · context locked</div>
            <div className="mt-1 text-sm font-black text-white/75">Cardiac Hemodynamics Lab</div>
            <p className="mt-1 max-w-2xl text-[9px] leading-relaxed text-white/35">This organ-specific workbench appears in full when the source-atlas system is Cardiovascular. Keeping it context-locked prevents unrelated body systems from inheriting cardiac physiology panels.</p>
          </div>
          <span className="rounded-full border border-rose-300/12 bg-rose-300/[.04] px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] text-rose-100/55">select cardiovascular</span>
        </div>
      </section>
    )
  }

  const reset = () => setInput({ preload: 0.52, afterload: 0.48, contractility: 0.54, heartRate: 0.42, lusitropy: 0.55 })
  const toX = (volume: number) => 18 + volume * 220
  const toY = (pressure: number) => 218 - pressure * 180
  const path = `${pv.map((point, index) => `${index === 0 ? 'M' : 'L'} ${toX(point.volume)} ${toY(point.pressure)}`).join(' ')} Z`

  return (
    <section data-cardiac-hemodynamics-workbench="v1" className="overflow-hidden rounded-[28px] border border-rose-300/15 bg-[linear-gradient(145deg,rgba(244,63,94,.055),rgba(2,6,12,.96)_42%,rgba(34,211,238,.035))] text-white shadow-[0_24px_90px_rgba(0,0,0,.3)]">
      <div className="relative overflow-hidden border-b border-white/[.08] p-4 sm:p-5">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(244,63,94,.14),transparent_32%),radial-gradient(circle_at_88%_4%,rgba(34,211,238,.09),transparent_28%)]" />
        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-rose-200/80">Body Exposure · heart / cardiovascular deep-dive</div>
            <h3 className="mt-1.5 text-lg font-black tracking-[-.02em] sm:text-xl">Cardiac Hemodynamics & Pressure–Volume Lab</h3>
            <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/45 sm:text-[11px]">Manipulate normalized preload, afterload, contractility, heart-rate drive and lusitropy to see directional pressure–volume behavior, valve phases and whole-heart coupling without turning the page into a patient calculator.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.12em]">
            <span className="rounded-full border border-rose-300/15 bg-rose-300/[.055] px-2.5 py-1 text-rose-100/75">PV loop</span>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[.045] px-2.5 py-1 text-cyan-100/75">4 cardiac phases</span>
            <span className="rounded-full border border-violet-300/15 bg-violet-300/[.045] px-2.5 py-1 text-violet-100/75">5 equations</span>
            <span className="rounded-full border border-amber-300/15 bg-amber-300/[.045] px-2.5 py-1 text-amber-100/75">synthetic signals only</span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="grid gap-3 2xl:grid-cols-[minmax(330px,.85fr)_minmax(0,1.15fr)]">
          <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Synthetic inputs</div>
                <h4 className="mt-1 text-sm font-black">Load, pump and relaxation</h4>
              </div>
              <button type="button" onClick={reset} className="min-h-9 rounded-xl border border-white/[.09] bg-white/[.03] px-3 text-[8px] font-black text-white/50 hover:bg-white/[.07]">Reset</button>
            </div>

            <div className="mt-3 space-y-2.5">
              {(Object.keys(INPUT_META) as (keyof SyntheticCardiacInput)[]).map((key) => {
                const meta = INPUT_META[key]
                const value = input[key]
                return (
                  <label key={key} className="block rounded-2xl border border-white/[.07] bg-white/[.022] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[9px] font-black text-white/75">{meta.label}</div>
                        <div className="mt-0.5 text-[8px] leading-relaxed text-white/30">{meta.hint}</div>
                      </div>
                      <output className="rounded-full border border-cyan-300/12 bg-cyan-300/[.045] px-2 py-1 text-[8px] font-black text-cyan-100/65">{pct(value)}</output>
                    </div>
                    <input
                      aria-label={meta.label}
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={value}
                      onChange={(event) => setInput((current) => ({ ...current, [key]: Number(event.target.value) }))}
                      className="mt-3 h-2 w-full cursor-pointer accent-cyan-300"
                    />
                  </label>
                )
              })}
            </div>
          </article>

          <div className="space-y-3">
            <article className="overflow-hidden rounded-[22px] border border-white/[.08] bg-[#02060b] p-3.5 sm:p-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-rose-200/65">Synthetic pressure–volume projection</div>
                  <h4 className="mt-1 text-sm font-black">Directional loop geometry</h4>
                </div>
                <div className="text-[8px] font-bold text-white/25">normalized axes · no mmHg · no mL</div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="relative min-h-[260px] overflow-hidden rounded-[18px] border border-white/[.07] bg-[radial-gradient(circle_at_55%_42%,rgba(244,63,94,.06),transparent_35%),#010409] p-2">
                  <svg viewBox="0 0 270 240" role="img" aria-label="Normalized synthetic ventricular pressure volume loop" className="h-full w-full">
                    <defs>
                      <linearGradient id="pv-loop-gradient" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(34,211,238,.9)" />
                        <stop offset="55%" stopColor="rgba(167,139,250,.92)" />
                        <stop offset="100%" stopColor="rgba(251,113,133,.9)" />
                      </linearGradient>
                      <linearGradient id="pv-loop-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(251,113,133,.13)" />
                        <stop offset="100%" stopColor="rgba(34,211,238,.02)" />
                      </linearGradient>
                    </defs>
                    <line x1="18" y1="218" x2="252" y2="218" stroke="rgba(255,255,255,.14)" strokeWidth="1" />
                    <line x1="18" y1="218" x2="18" y2="22" stroke="rgba(255,255,255,.14)" strokeWidth="1" />
                    {[58, 98, 138, 178].map((y) => <line key={y} x1="18" y1={y} x2="252" y2={y} stroke="rgba(255,255,255,.045)" strokeWidth="1" strokeDasharray="4 5" />)}
                    {[68, 118, 168, 218].map((x) => <line key={x} x1={x} y1="22" x2={x} y2="218" stroke="rgba(255,255,255,.04)" strokeWidth="1" strokeDasharray="4 5" />)}
                    <path d={path} fill="url(#pv-loop-fill)" stroke="url(#pv-loop-gradient)" strokeWidth="3" strokeLinejoin="round" />
                    {pv.map((point, index) => (
                      <g key={point.id}>
                        <circle cx={toX(point.volume)} cy={toY(point.pressure)} r="5" fill="rgba(255,255,255,.9)" stroke="rgba(34,211,238,.8)" strokeWidth="2" />
                        <text x={toX(point.volume) + (index < 2 ? 7 : -7)} y={toY(point.pressure) - 8} textAnchor={index < 2 ? 'start' : 'end'} fill="rgba(255,255,255,.55)" fontSize="8" fontWeight="700">{index + 1}</text>
                      </g>
                    ))}
                    <text x="135" y="236" textAnchor="middle" fill="rgba(255,255,255,.34)" fontSize="8">normalized ventricular volume →</text>
                    <text x="7" y="120" textAnchor="middle" fill="rgba(255,255,255,.34)" fontSize="8" transform="rotate(-90 7 120)">normalized pressure →</text>
                  </svg>
                </div>

                <div className="space-y-2">
                  {pv.map((point, index) => (
                    <div key={point.id} className="rounded-2xl border border-white/[.07] bg-white/[.022] p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded-full border border-cyan-300/15 bg-cyan-300/[.055] text-[7px] font-black text-cyan-100/70">{index + 1}</span>
                        <div className="text-[8px] font-black text-white/60">{point.label}</div>
                      </div>
                      <div className="mt-1 pl-7 font-mono text-[7px] text-white/25">V {pct(point.volume)} · P {pct(point.pressure)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-[22px] border border-white/[.08] bg-white/[.022] p-3.5 sm:p-4">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Network response</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {(Object.entries(OUTPUT_META) as [keyof typeof OUTPUT_META, string][]).map(([key, label]) => {
                  const value = state[key]
                  return (
                    <div key={key} className="rounded-2xl border border-white/[.07] bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[8px] font-black leading-tight text-white/50">{label}</div>
                        <div className="text-[9px] font-black text-white/75">{pct(value)}</div>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-rose-300 transition-[width] duration-300" style={{ width: pct(value) }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </article>
          </div>
        </div>

        <article className="mt-3 rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-emerald-200/65">Cardiac cycle state machine</div>
              <h4 className="mt-1 text-sm font-black">Valve states and chamber behavior</h4>
            </div>
            <div className="text-[8px] font-bold text-white/25">filling → iso-contraction → ejection → iso-relaxation</div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {CARDIAC_PHASES.map((phase, index) => (
              <div key={phase.id} className="rounded-[18px] border border-white/[.07] bg-white/[.022] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-rose-300/12 bg-rose-300/[.045] text-[8px] font-black text-rose-100/65">{index + 1}</span>
                  <span className="text-[7px] font-black uppercase tracking-[.12em] text-white/25">{phase.volumeDirection} volume</span>
                </div>
                <div className="mt-2 text-[10px] font-black text-white/72">{phase.label}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className={`rounded-full border px-2 py-1 text-[7px] font-black ${phase.mitralState === 'open' ? 'border-emerald-300/15 bg-emerald-300/[.05] text-emerald-100/65' : 'border-white/[.07] bg-white/[.025] text-white/35'}`}>Mitral {phase.mitralState}</span>
                  <span className={`rounded-full border px-2 py-1 text-[7px] font-black ${phase.aorticState === 'open' ? 'border-cyan-300/15 bg-cyan-300/[.05] text-cyan-100/65' : 'border-white/[.07] bg-white/[.025] text-white/35'}`}>Aortic {phase.aorticState}</span>
                </div>
                <p className="mt-2 text-[8px] leading-relaxed text-white/32">{phase.teachingPoint}</p>
              </div>
            ))}
          </div>
        </article>

        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
          <article className="rounded-[22px] border border-white/[.08] bg-white/[.02] p-3.5 sm:p-4">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-200/65">Formula ledger</div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {CARDIAC_TEACHING_RELATIONSHIPS.map((relationship) => (
                <div key={relationship.id} className="rounded-2xl border border-amber-300/10 bg-amber-300/[.025] p-3">
                  <div className="font-mono text-[10px] font-black leading-relaxed text-white/78">{relationship.expression}</div>
                  <p className="mt-1.5 text-[8px] leading-relaxed text-white/38">{relationship.meaning}</p>
                  <p className="mt-1.5 text-[7px] leading-relaxed text-amber-50/35">{relationship.boundary}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[22px] border border-cyan-300/10 bg-cyan-300/[.025] p-3.5">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Evidence anchors</div>
            <div className="mt-2 space-y-2">
              {CARDIAC_HEMODYNAMICS_EVIDENCE.map((source) => (
                <a key={source.pmid} href={source.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/[.07] bg-black/20 p-3 transition hover:bg-white/[.035]">
                  <div className="text-[7px] font-black uppercase tracking-[.13em] text-cyan-100/45">PMID {source.pmid}</div>
                  <div className="mt-1 text-[9px] font-black leading-snug text-white/65">{source.title}</div>
                  <p className="mt-1.5 text-[8px] leading-relaxed text-white/30">{source.role}</p>
                </a>
              ))}
            </div>
          </article>
        </div>

        <p className="mt-3 rounded-2xl border border-rose-300/10 bg-rose-300/[.025] p-3 text-[8px] leading-relaxed text-rose-50/45"><span className="font-black text-rose-100/65">Boundary:</span> {CARDIAC_HEMODYNAMICS_BOUNDARY}</p>
      </div>
    </section>
  )
}
