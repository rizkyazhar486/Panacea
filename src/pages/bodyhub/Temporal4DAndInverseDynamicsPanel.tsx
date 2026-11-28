import { useMemo, useState } from 'react'
import {
  LIFESPAN_STAGES,
  TEMPORAL_4D_BOUNDARY,
  evaluateCircadian24h,
  evaluateLifespanAge,
  sampleCircadianDayCurve,
  solveInverseDynamics,
} from '../../domains/body-exposure/engine/temporalPhysiology4DEngine'

export type TemporalPanelMode = 'temporal' | 'mechanics'

function polyline(values: readonly number[], maxVal: number, width = 220, height = 54): string {
  if (values.length < 2) return ''
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = height - Math.max(0, Math.min(1, v / maxVal)) * (height - 8) - 4
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export default function Temporal4DAndInverseDynamicsPanel({
  initialMode = 'temporal',
}: {
  initialMode?: TemporalPanelMode
}) {
  const [mode, setMode] = useState<TemporalPanelMode>(initialMode)
  const [hour, setHour] = useState<number>(7.5)
  const [ageYears, setAgeYears] = useState<number>(30)
  const [bodyMassKg, setBodyMassKg] = useState<number>(70)
  const [externalLoadKg, setExternalLoadKg] = useState<number>(10)
  const [elbowFlexionDeg, setElbowFlexionDeg] = useState<number>(90)
  const [kneeFlexionDeg, setKneeFlexionDeg] = useState<number>(60)
  const [trunkFlexionDeg, setTrunkFlexionDeg] = useState<number>(35)

  const dayCurve = useMemo(() => sampleCircadianDayCurve(), [])
  const circadian = useMemo(() => evaluateCircadian24h(hour), [hour])
  const lifespan = useMemo(() => evaluateLifespanAge(ageYears), [ageYears])
  const dynamics = useMemo(
    () => solveInverseDynamics({ bodyMassKg, externalLoadKg, elbowFlexionDeg, kneeFlexionDeg, trunkFlexionDeg }),
    [bodyMassKg, externalLoadKg, elbowFlexionDeg, kneeFlexionDeg, trunkFlexionDeg],
  )

  const melLine = useMemo(() => polyline(dayCurve.map((p) => p.melatoninPgMl), 75), [dayCurve])
  const cortLine = useMemo(() => polyline(dayCurve.map((p) => p.cortisolUgDl), 22), [dayCurve])
  const cursorX = (hour / 24) * 220

  return (
    <section
      data-temporal-4d-panel="v1"
      aria-label="4D Temporal Physiology and Newtonian Inverse-Dynamics Mechanics"
      className="dark space-y-3 rounded-2xl border border-cyan-400/25 bg-[#060b16] p-3.5 text-slate-100 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-cyan-300">
            4D Time Axis · Circadian · 0–100y Lifespan · Inverse Dynamics
          </p>
          <p className="text-xs text-slate-300">
            {TEMPORAL_4D_BOUNDARY.truthClass} · educational reference curves &amp; Newtonian static equilibrium
          </p>
        </div>
        <div className="flex gap-1.5" role="tablist" aria-label="4D temporal or biomechanics view">
          {([
            ['temporal', '4D Circadian & Lifespan'],
            ['mechanics', 'Inverse Dynamics (N·m)'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`min-h-9 rounded-full border px-3 text-xs font-bold transition ${
                mode === id
                  ? 'border-cyan-300/70 bg-cyan-400/20 text-white'
                  : 'border-white/15 bg-white/[.04] text-slate-300 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'temporal' ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2.5 rounded-xl border border-white/10 bg-black/35 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-indigo-300">
                24-Hour Circadian Oscillator
              </span>
              <span className="font-mono text-xs font-black text-white">
                {String(Math.floor(hour)).padStart(2, '0')}:{hour % 1 >= 0.5 ? '30' : '00'}
              </span>
            </div>
            <input
              type="range"
              aria-label="Circadian clock hour"
              min={0}
              max={23.5}
              step={0.5}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-full accent-indigo-400"
            />
            <svg viewBox="0 0 220 58" className="h-16 w-full rounded-lg bg-slate-950/90 p-1" role="img" aria-label="24-hour melatonin and cortisol curves">
              <polyline fill="none" stroke="#818cf8" strokeWidth="1.8" points={melLine} />
              <polyline fill="none" stroke="#fbbf24" strokeWidth="1.8" points={cortLine} />
              <line x1={cursorX} y1="2" x2={cursorX} y2="54" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="3 2" />
            </svg>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10.5px] sm:grid-cols-3">
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-indigo-300">Melatonin</span><div className="font-black text-white">{circadian.melatoninPgMl} pg/mL</div></div>
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-amber-300">Cortisol</span><div className="font-black text-white">{circadian.cortisolUgDl} µg/dL</div></div>
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-rose-300">Core Temp</span><div className="font-black text-white">{circadian.coreTempC} °C</div></div>
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-cyan-300">Rest HR</span><div className="font-black text-white">{circadian.restingHrBpm} bpm</div></div>
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-emerald-300">Renal GFR</span><div className="font-black text-white">{circadian.gfrMlMin} mL/m</div></div>
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">Phase</span><div className="truncate font-bold text-slate-200">{circadian.phaseLabel}</div></div>
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl border border-white/10 bg-black/35 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-emerald-300">
                0–100 Year Lifespan Trajectory
              </span>
              <span className="font-mono text-xs font-black text-white">
                {lifespan.ageYears} y · {lifespan.stage.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {LIFESPAN_STAGES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  aria-pressed={lifespan.stage.id === st.id}
                  onClick={() => setAgeYears(st.defaultAgeYears)}
                  className={`min-h-8 rounded-full border px-2.5 text-[10px] font-bold transition ${
                    lifespan.stage.id === st.id
                      ? 'border-emerald-300/70 bg-emerald-400/20 text-white'
                      : 'border-white/15 bg-white/[.03] text-slate-300 hover:text-white'
                  }`}
                >
                  {st.label} ({st.rangeLabel})
                </button>
              ))}
            </div>
            <input
              type="range"
              aria-label="Lifespan age in years"
              min={0.5}
              max={95}
              step={0.5}
              value={ageYears}
              onChange={(e) => setAgeYears(Number(e.target.value))}
              className="w-full accent-emerald-400"
            />
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10.5px] sm:grid-cols-3">
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">Rest HR</span><div className="font-black text-white">{lifespan.restingHrBpm} bpm</div></div>
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">Tanaka HRmax</span><div className="font-black text-white">{lifespan.maxHrBpm} bpm</div></div>
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">Ref eGFR</span><div className="font-black text-white">{lifespan.gfrMlMin} mL/m</div></div>
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">Bone Mass</span><div className="font-black text-cyan-200">{lifespan.boneDensityPctPeak}% peak</div></div>
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">FEV₁ Reserve</span><div className="font-black text-emerald-200">{lifespan.fev1PctPeak}% peak</div></div>
            </div>
            <p className="text-xs text-slate-300">{lifespan.stage.physiologicalFocus}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="space-y-2 rounded-xl border border-white/10 bg-black/35 p-3 font-mono text-[10.5px] lg:col-span-5">
            <label className="block">
              <span className="flex justify-between"><span>Body mass</span><strong>{bodyMassKg} kg</strong></span>
              <input type="range" min={35} max={130} step={1} value={bodyMassKg} onChange={(e) => setBodyMassKg(Number(e.target.value))} className="w-full accent-cyan-400" />
            </label>
            <label className="block">
              <span className="flex justify-between"><span>Handheld load</span><strong>{externalLoadKg} kg</strong></span>
              <input type="range" min={0} max={40} step={1} value={externalLoadKg} onChange={(e) => setExternalLoadKg(Number(e.target.value))} className="w-full accent-cyan-400" />
            </label>
            <label className="block">
              <span className="flex justify-between"><span>Elbow flexion</span><strong>{elbowFlexionDeg}°</strong></span>
              <input type="range" min={0} max={140} step={5} value={elbowFlexionDeg} onChange={(e) => setElbowFlexionDeg(Number(e.target.value))} className="w-full accent-cyan-400" />
            </label>
            <label className="block">
              <span className="flex justify-between"><span>Squat knee flexion</span><strong>{kneeFlexionDeg}°</strong></span>
              <input type="range" min={0} max={125} step={5} value={kneeFlexionDeg} onChange={(e) => setKneeFlexionDeg(Number(e.target.value))} className="w-full accent-cyan-400" />
            </label>
            <label className="block">
              <span className="flex justify-between"><span>Trunk forward bend</span><strong>{trunkFlexionDeg}°</strong></span>
              <input type="range" min={0} max={85} step={5} value={trunkFlexionDeg} onChange={(e) => setTrunkFlexionDeg(Number(e.target.value))} className="w-full accent-amber-400" />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:col-span-7">
            <div className="rounded-xl border border-cyan-400/25 bg-black/35 p-3 font-mono">
              <div className="text-[10px] font-black uppercase text-cyan-300">Elbow Lever (Στ = 0)</div>
              <div className="mt-1 text-2xl font-black text-white">{dynamics.bicepsForceN} N</div>
              <div className="text-[10.5px] text-slate-300">Biceps tendon tension</div>
              <div className="mt-1 text-[10px] text-slate-400">Torque {dynamics.elbowTorqueNm} N·m · r⊥ = 4.5 cm</div>
            </div>
            <div className="rounded-xl border border-indigo-400/25 bg-black/35 p-3 font-mono">
              <div className="text-[10px] font-black uppercase text-indigo-300">Patellofemoral Joint</div>
              <div className="mt-1 text-2xl font-black text-white">{dynamics.patellofemoralBw}× BW</div>
              <div className="text-[10.5px] text-slate-300">{dynamics.patellofemoralN} N compressive</div>
              <div className="mt-1 text-[10px] text-slate-400">Knee flexion {kneeFlexionDeg}°</div>
            </div>
            <div className={`rounded-xl border p-3 font-mono ${dynamics.l4l5LoadBand === 'ELEVATED_NIOSH_LIMIT' ? 'border-rose-400/50 bg-rose-950/35' : 'border-amber-400/25 bg-black/35'}`}>
              <div className="text-[10px] font-black uppercase text-amber-300">Lumbar L4–L5 Disc</div>
              <div className="mt-1 text-2xl font-black text-white">{dynamics.l4l5CompressionN} N</div>
              <div className="text-[10.5px] text-slate-300">Erector spinae {dynamics.erectorSpinaeN} N</div>
              <div className="mt-1 text-[10px] font-bold text-amber-200">{dynamics.l4l5LoadBand} (NIOSH ref 3,400 N)</div>
            </div>
          </div>
        </div>
      )}

      <p className="text-[10.5px] text-slate-400">{TEMPORAL_4D_BOUNDARY.note}</p>
    </section>
  )
}
