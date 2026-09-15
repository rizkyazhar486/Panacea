import { useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  NEUROVASCULAR_EVIDENCE,
  NEUROVASCULAR_NETWORK,
  NEUROVASCULAR_PERFUSION_BOUNDARY,
  NEUROVASCULAR_RELATIONSHIPS,
  buildAutoregulationTeachingCurve,
  simulateSyntheticNeurovascularState,
  type SyntheticNeurovascularInput,
} from '../../lib/neurovascularPerfusionLab'

const INPUT_META: Readonly<Record<keyof SyntheticNeurovascularInput, { label: string; hint: string }>> = {
  systemicPressureDrive: { label: 'Systemic pressure drive', hint: 'Normalized upstream arterial-pressure signal' },
  intracranialVolumeLoad: { label: 'Intracranial volume load', hint: 'Synthetic brain/blood/CSF volume pressure on compliance reserve' },
  baselineVascularResistance: { label: 'Baseline vascular resistance', hint: 'Synthetic cerebrovascular resistance before autoregulatory adjustment' },
  arterialOxygenContent: { label: 'Arterial O₂ content', hint: 'Normalized oxygen-carrying content; not SpO₂ or PaO₂' },
  metabolicDemand: { label: 'Neural metabolic demand', hint: 'Synthetic tissue substrate/oxygen demand' },
  autoregulatoryReserve: { label: 'Autoregulatory reserve', hint: 'Synthetic ability to change vascular resistance as pressure changes' },
}

const OUTPUT_META = {
  cerebralPerfusionPressureSignal: 'CPP signal',
  effectiveVascularResistanceSignal: 'Effective CVR signal',
  cerebralBloodFlowSignal: 'CBF signal',
  oxygenDeliverySignal: 'O₂-delivery signal',
  autoregulationStrainSignal: 'Autoregulation strain',
  intracranialComplianceStress: 'Compliance stress',
  metabolicMismatchSignal: 'Metabolic mismatch',
} as const

const LAYER_CLASS = {
  systemic: 'border-cyan-300/15 bg-cyan-300/[.04]',
  intracranial: 'border-rose-300/15 bg-rose-300/[.04]',
  vascular: 'border-violet-300/15 bg-violet-300/[.04]',
  delivery: 'border-emerald-300/15 bg-emerald-300/[.04]',
  metabolic: 'border-amber-300/15 bg-amber-300/[.04]',
} as const

function pct(value: number) {
  return `${Math.round(value * 100)}%`
}

interface NeurovascularPerfusionWorkbenchProps {
  selectedAtlasSystemId?: BodySystemId
}

export default function NeurovascularPerfusionWorkbench({ selectedAtlasSystemId }: NeurovascularPerfusionWorkbenchProps) {
  const [input, setInput] = useState<SyntheticNeurovascularInput>({
    systemicPressureDrive: 0.56,
    intracranialVolumeLoad: 0.18,
    baselineVascularResistance: 0.48,
    arterialOxygenContent: 0.68,
    metabolicDemand: 0.55,
    autoregulatoryReserve: 0.70,
  })

  const state = useMemo(() => simulateSyntheticNeurovascularState(input), [input])
  const curve = useMemo(
    () => buildAutoregulationTeachingCurve(input.baselineVascularResistance, input.intracranialVolumeLoad, input.autoregulatoryReserve),
    [input.baselineVascularResistance, input.intracranialVolumeLoad, input.autoregulatoryReserve],
  )

  if (selectedAtlasSystemId && selectedAtlasSystemId !== 'nervous') {
    return (
      <section data-neurovascular-perfusion-workbench="inactive" className="rounded-[24px] border border-white/[.08] bg-black/25 p-3.5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[8px] font-black uppercase tracking-[.18em] text-violet-200/60">Brain deep-dive · context locked</div>
            <div className="mt-1 text-sm font-black text-white/75">Neurovascular Perfusion & Intracranial Dynamics</div>
            <p className="mt-1 max-w-2xl text-[9px] leading-relaxed text-white/35">The full brain-specific perfusion workbench activates with the Nervous source-atlas system. This prevents CPP/ICP/autoregulation concepts from being attached to unrelated systems.</p>
          </div>
          <span className="rounded-full border border-violet-300/12 bg-violet-300/[.04] px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] text-violet-100/55">select nervous</span>
        </div>
      </section>
    )
  }

  const reset = () => setInput({
    systemicPressureDrive: 0.56,
    intracranialVolumeLoad: 0.18,
    baselineVascularResistance: 0.48,
    arterialOxygenContent: 0.68,
    metabolicDemand: 0.55,
    autoregulatoryReserve: 0.70,
  })

  const toX = (value: number) => 26 + value * 220
  const toY = (value: number) => 214 - value * 170
  const curvePath = curve.map((point, index) => `${index === 0 ? 'M' : 'L'} ${toX(point.pressureDrive)} ${toY(point.flowSignal)}`).join(' ')

  return (
    <section data-neurovascular-perfusion-workbench="v1" className="overflow-hidden rounded-[28px] border border-violet-300/14 bg-[linear-gradient(145deg,rgba(124,58,237,.055),rgba(2,6,12,.96)_42%,rgba(34,211,238,.04))] text-white shadow-[0_24px_90px_rgba(0,0,0,.3)]">
      <div className="relative overflow-hidden border-b border-white/[.08] p-4 sm:p-5">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(139,92,246,.15),transparent_32%),radial-gradient(circle_at_88%_4%,rgba(34,211,238,.1),transparent_28%)]" />
        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-violet-200/80">Body Exposure · brain / neurovascular deep-dive</div>
            <h3 className="mt-1.5 text-lg font-black tracking-[-.02em] sm:text-xl">Neurovascular Perfusion & Intracranial Dynamics Lab</h3>
            <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/45 sm:text-[11px]">Manipulate normalized systemic pressure, intracranial volume load, vascular resistance, oxygen content, metabolic demand and autoregulatory reserve to visualize how perfusion, flow and oxygen delivery stay coupled.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.12em]">
            <span className="rounded-full border border-violet-300/15 bg-violet-300/[.055] px-2.5 py-1 text-violet-100/75">autoregulation curve</span>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[.045] px-2.5 py-1 text-cyan-100/75">CPP · CBF · CVR</span>
            <span className="rounded-full border border-rose-300/15 bg-rose-300/[.045] px-2.5 py-1 text-rose-100/75">Monro–Kellie</span>
            <span className="rounded-full border border-amber-300/15 bg-amber-300/[.045] px-2.5 py-1 text-amber-100/75">synthetic only</span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="grid gap-3 2xl:grid-cols-[minmax(330px,.83fr)_minmax(0,1.17fr)]">
          <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Synthetic neurovascular inputs</div>
                <h4 className="mt-1 text-sm font-black">Pressure, resistance, oxygen and demand</h4>
              </div>
              <button type="button" onClick={reset} className="min-h-9 rounded-xl border border-white/[.09] bg-white/[.03] px-3 text-[8px] font-black text-white/50 hover:bg-white/[.07]">Reset</button>
            </div>

            <div className="mt-3 space-y-2.5">
              {(Object.keys(INPUT_META) as (keyof SyntheticNeurovascularInput)[]).map((key) => {
                const meta = INPUT_META[key]
                const value = input[key]
                return (
                  <label key={key} className="block rounded-2xl border border-white/[.07] bg-white/[.022] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[9px] font-black text-white/75">{meta.label}</div>
                        <div className="mt-0.5 text-[8px] leading-relaxed text-white/30">{meta.hint}</div>
                      </div>
                      <output className="rounded-full border border-violet-300/12 bg-violet-300/[.045] px-2 py-1 text-[8px] font-black text-violet-100/65">{pct(value)}</output>
                    </div>
                    <input
                      aria-label={meta.label}
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={value}
                      onChange={(event) => setInput((current) => ({ ...current, [key]: Number(event.target.value) }))}
                      className="mt-3 h-2 w-full cursor-pointer accent-violet-300"
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
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Autoregulation teaching curve</div>
                  <h4 className="mt-1 text-sm font-black">Pressure drive → buffered flow response</h4>
                </div>
                <div className="text-[8px] font-bold text-white/25">normalized axes · not a clinical autoregulation threshold</div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_230px]">
                <div className="relative min-h-[260px] overflow-hidden rounded-[18px] border border-white/[.07] bg-[radial-gradient(circle_at_55%_45%,rgba(139,92,246,.08),transparent_38%),#010409] p-2">
                  <svg viewBox="0 0 275 240" role="img" aria-label="Normalized synthetic cerebral autoregulation teaching curve" className="h-full w-full">
                    <defs>
                      <linearGradient id="neuro-curve-gradient" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="rgba(34,211,238,.88)" />
                        <stop offset="52%" stopColor="rgba(167,139,250,.95)" />
                        <stop offset="100%" stopColor="rgba(251,113,133,.88)" />
                      </linearGradient>
                    </defs>
                    <line x1="26" y1="214" x2="252" y2="214" stroke="rgba(255,255,255,.14)" strokeWidth="1" />
                    <line x1="26" y1="214" x2="26" y2="28" stroke="rgba(255,255,255,.14)" strokeWidth="1" />
                    {[54, 94, 134, 174].map((y) => <line key={y} x1="26" y1={y} x2="252" y2={y} stroke="rgba(255,255,255,.045)" strokeWidth="1" strokeDasharray="4 5" />)}
                    {[70, 114, 158, 202, 246].map((x) => <line key={x} x1={x} y1="28" x2={x} y2="214" stroke="rgba(255,255,255,.04)" strokeWidth="1" strokeDasharray="4 5" />)}
                    <path d={curvePath} fill="none" stroke="url(#neuro-curve-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {curve.map((point, index) => (
                      <circle key={point.pressureDrive} cx={toX(point.pressureDrive)} cy={toY(point.flowSignal)} r={index % 2 === 0 ? 3.2 : 2.2} fill="rgba(255,255,255,.85)" />
                    ))}
                    <circle cx={toX(input.systemicPressureDrive)} cy={toY(state.cerebralBloodFlowSignal)} r="6" fill="rgba(255,255,255,.95)" stroke="rgba(167,139,250,.95)" strokeWidth="2.5" />
                    <text x="139" y="234" textAnchor="middle" fill="rgba(255,255,255,.34)" fontSize="8">normalized systemic pressure drive →</text>
                    <text x="9" y="121" textAnchor="middle" fill="rgba(255,255,255,.34)" fontSize="8" transform="rotate(-90 9 121)">synthetic CBF signal →</text>
                  </svg>
                </div>

                <div className="space-y-2">
                  <div className="rounded-2xl border border-violet-300/10 bg-violet-300/[.03] p-3">
                    <div className="text-[8px] font-black uppercase tracking-[.13em] text-violet-100/50">Current synthetic state</div>
                    <div className="mt-2 grid gap-1.5 text-[8px]">
                      <div className="flex justify-between"><span className="text-white/35">Pressure drive</span><span className="font-black text-white/65">{pct(input.systemicPressureDrive)}</span></div>
                      <div className="flex justify-between"><span className="text-white/35">CBF signal</span><span className="font-black text-white/65">{pct(state.cerebralBloodFlowSignal)}</span></div>
                      <div className="flex justify-between"><span className="text-white/35">Autoreg reserve</span><span className="font-black text-white/65">{pct(input.autoregulatoryReserve)}</span></div>
                    </div>
                  </div>
                  <p className="rounded-2xl border border-amber-300/10 bg-amber-300/[.025] p-3 text-[8px] leading-relaxed text-amber-50/38">The curve visualizes directional buffering only. Real autoregulatory limits are patient- and context-dependent and are not represented by fixed cutoffs here.</p>
                </div>
              </div>
            </article>

            <article className="rounded-[22px] border border-white/[.08] bg-white/[.022] p-3.5 sm:p-4">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Neurovascular state</div>
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
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-emerald-200/65">Neurovascular systems chain</div>
              <h4 className="mt-1 text-sm font-black">Systemic pressure → intracranial context → vascular tone → delivery → metabolism</h4>
            </div>
            <div className="text-[8px] font-bold text-white/25">{NEUROVASCULAR_NETWORK.length} linked nodes</div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {NEUROVASCULAR_NETWORK.map((node, index) => (
              <div key={node.id} className={`rounded-[18px] border p-3 ${LAYER_CLASS[node.layer]}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-white/[.08] bg-black/20 text-[8px] font-black text-white/55">{index + 1}</span>
                  <span className="text-[7px] font-black uppercase tracking-[.12em] text-white/25">{node.layer}</span>
                </div>
                <div className="mt-2 text-[10px] font-black text-white/72">{node.label}</div>
                <p className="mt-1.5 text-[8px] leading-relaxed text-white/32">{node.role}</p>
              </div>
            ))}
          </div>
        </article>

        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
          <article className="rounded-[22px] border border-white/[.08] bg-white/[.02] p-3.5 sm:p-4">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-200/65">Formula ledger</div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {NEUROVASCULAR_RELATIONSHIPS.map((relationship) => (
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
              {NEUROVASCULAR_EVIDENCE.map((source) => (
                <a key={source.pmid} href={source.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/[.07] bg-black/20 p-3 transition hover:bg-white/[.035]">
                  <div className="text-[7px] font-black uppercase tracking-[.13em] text-cyan-100/45">PMID {source.pmid}</div>
                  <div className="mt-1 text-[9px] font-black leading-snug text-white/65">{source.title}</div>
                  <p className="mt-1.5 text-[8px] leading-relaxed text-white/30">{source.role}</p>
                </a>
              ))}
            </div>
          </article>
        </div>

        <p className="mt-3 rounded-2xl border border-rose-300/10 bg-rose-300/[.025] p-3 text-[8px] leading-relaxed text-rose-50/45"><span className="font-black text-rose-100/65">Boundary:</span> {NEUROVASCULAR_PERFUSION_BOUNDARY}</p>
      </div>
    </section>
  )
}
