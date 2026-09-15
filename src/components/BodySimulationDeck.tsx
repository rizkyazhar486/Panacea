import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BODY_SIMULATION_FAMILIES,
  BODY_SIMULATION_SCENARIOS,
  simulationFamilyCounts,
  type SimulationFamily,
  type SimulationScenario,
} from '../lib/bodySimulationRegistry'

function defaultsFor(scenario: SimulationScenario) {
  return Object.fromEntries(scenario.controls.map((control) => [control.id, control.value]))
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

function syntheticSignal(scenario: SimulationScenario, values: Record<string, number>) {
  if (!scenario.controls.length) return .5
  const normalized = scenario.controls.map((control) => normalize(values[control.id] ?? control.value, control.min, control.max))
  const mean = normalized.reduce((sum, value) => sum + value, 0) / normalized.length
  const spread = Math.max(...normalized) - Math.min(...normalized)
  return Math.max(.05, Math.min(.95, mean * .72 + spread * .28))
}

export default function BodySimulationDeck() {
  const reduceMotion = useReducedMotion()
  const familyCounts = useMemo(() => simulationFamilyCounts(), [])
  const [family, setFamily] = useState<SimulationFamily | 'all'>('all')
  const initial = BODY_SIMULATION_SCENARIOS[0]
  const [scenarioId, setScenarioId] = useState(initial.id)
  const [values, setValues] = useState<Record<string, number>>(() => defaultsFor(initial))

  const visible = useMemo(
    () => family === 'all' ? BODY_SIMULATION_SCENARIOS : BODY_SIMULATION_SCENARIOS.filter((scenario) => scenario.family === family),
    [family],
  )
  const scenario = BODY_SIMULATION_SCENARIOS.find((item) => item.id === scenarioId) ?? visible[0] ?? initial
  const signal = syntheticSignal(scenario, values)

  function chooseScenario(next: SimulationScenario) {
    setScenarioId(next.id)
    setValues(defaultsFor(next))
  }

  function chooseFamily(next: SimulationFamily | 'all') {
    setFamily(next)
    const first = next === 'all' ? BODY_SIMULATION_SCENARIOS[0] : BODY_SIMULATION_SCENARIOS.find((item) => item.family === next)
    if (first) chooseScenario(first)
  }

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/[.08] bg-[#020407]/90 shadow-[0_24px_80px_rgba(0,0,0,.42)]" aria-labelledby="body-sim-deck-title">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-[-12%] top-[-30%] h-[420px] w-[420px] rounded-full bg-cyan-400/[.065] blur-[120px]" />
        <div className="absolute bottom-[-35%] right-[-8%] h-[480px] w-[480px] rounded-full bg-fuchsia-500/[.05] blur-[140px]" />
      </div>

      <header className="relative z-[2] border-b border-white/[.07] p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="text-[10px] font-black uppercase tracking-[.23em] text-cyan-200">Simulation Factory · Synthetic teaching environment</div>
            <h3 id="body-sim-deck-title" className="mt-2 text-2xl font-black tracking-[-.035em] text-white sm:text-3xl">Physiology, imaging, surgery and biomechanics as controllable worlds.</h3>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-white/50">
              Every scene is intentionally synthetic and educational. Controls produce visual teaching signals rather than patient predictions, diagnostic output, or validated treatment recommendations.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[.08] bg-white/[.035] px-4 py-3 text-right">
            <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">Scenario registry</div>
            <div className="mt-1 text-xl font-black text-white/90">{BODY_SIMULATION_SCENARIOS.length}</div>
            <div className="text-[9px] font-bold text-white/30">interactive concepts</div>
          </div>
        </div>
      </header>

      <div className="relative z-[2] border-b border-white/[.06] p-3 sm:p-4">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          <button
            type="button"
            onClick={() => chooseFamily('all')}
            className={`min-h-[38px] shrink-0 rounded-full border px-3 text-[10px] font-black transition ${family === 'all' ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100' : 'border-white/[.08] bg-white/[.025] text-white/45 hover:text-white/75'}`}
          >
            All · {BODY_SIMULATION_SCENARIOS.length}
          </button>
          {BODY_SIMULATION_FAMILIES.map((item) => {
            const count = familyCounts.find((entry) => entry.family === item)?.count ?? 0
            return (
              <button
                key={item}
                type="button"
                onClick={() => chooseFamily(item)}
                className={`min-h-[38px] shrink-0 rounded-full border px-3 text-[10px] font-black transition ${family === item ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100' : 'border-white/[.08] bg-white/[.025] text-white/45 hover:text-white/75'}`}
              >
                {item} · {count}
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative z-[2] grid xl:grid-cols-[330px_minmax(0,1fr)_360px]">
        <aside className="border-b border-white/[.06] p-3 xl:border-b-0 xl:border-r sm:p-4">
          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {visible.map((item) => {
              const active = item.id === scenario.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseScenario(item)}
                  className={`w-full rounded-[18px] border p-3 text-left transition ${active ? 'border-cyan-300/25 bg-[linear-gradient(135deg,rgba(34,211,238,.10),rgba(139,92,246,.07))]' : 'border-white/[.06] bg-white/[.025] hover:border-white/[.12] hover:bg-white/[.045]'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-200/55">{item.family}</span>
                    <span className="text-[8px] font-bold text-white/25">{item.controls.length} controls</span>
                  </div>
                  <div className="mt-1.5 text-[12px] font-black leading-tight text-white/82">{item.title}</div>
                  <div className="mt-1.5 line-clamp-2 text-[10px] font-medium leading-relaxed text-white/36">{item.description}</div>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="relative min-h-[560px] overflow-hidden border-b border-white/[.06] xl:border-b-0 xl:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.07),transparent_38%),radial-gradient(circle_at_65%_42%,rgba(139,92,246,.065),transparent_30%)]" aria-hidden />
          <div className="absolute inset-x-[8%] top-[9%] flex items-center justify-between text-[9px] font-black uppercase tracking-[.14em] text-white/25">
            <span>Live synthetic scene</span>
            <span>{scenario.family}</span>
          </div>

          <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 sm:h-[460px] sm:w-[460px]">
            <motion.div
              className="absolute inset-0 rounded-full border border-cyan-200/[.10]"
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-[12%] rounded-full border border-violet-200/[.10]"
              animate={reduceMotion ? undefined : { rotate: -360 }}
              transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-[23%] grid place-items-center rounded-full border border-white/[.10] bg-black/35 shadow-[0_0_100px_rgba(34,211,238,.10),inset_0_0_70px_rgba(139,92,246,.07)] backdrop-blur-xl"
              animate={reduceMotion ? undefined : { scale: [1, 1 + signal * .055, 1], boxShadow: ['0 0 70px rgba(34,211,238,.06)', '0 0 130px rgba(139,92,246,.13)', '0 0 70px rgba(34,211,238,.06)'] }}
              transition={{ duration: 3.2 - signal * 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="px-8 text-center">
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/60">Synthetic signal</div>
                <div className="mt-2 text-5xl font-black tracking-[-.06em] text-white/90">{Math.round(signal * 100)}</div>
                <div className="mt-1 text-[9px] font-bold text-white/28">relative visualization index</div>
              </div>
            </motion.div>

            {scenario.visualLayers.slice(0, 7).map((layer, index) => {
              const angle = (index / Math.min(scenario.visualLayers.length, 7)) * Math.PI * 2 - Math.PI / 2
              const radius = 43
              return (
                <motion.div
                  key={layer}
                  className="absolute left-1/2 top-1/2 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[.08] bg-black/55 px-3 py-2 text-center text-[8px] font-black text-white/55 backdrop-blur-xl"
                  style={{ marginLeft: `${Math.cos(angle) * radius}%`, marginTop: `${Math.sin(angle) * radius}%` }}
                  animate={reduceMotion ? undefined : { y: [0, index % 2 ? 5 : -5, 0], opacity: [.55, .9, .55] }}
                  transition={{ duration: 4 + index * .37, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {layer}
                </motion.div>
              )
            })}
          </div>

          <div className="absolute inset-x-[6%] bottom-[6%] rounded-[20px] border border-white/[.07] bg-black/40 p-3 backdrop-blur-xl sm:p-4">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200/55">{scenario.title}</div>
            <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-white/42">{scenario.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {scenario.outputs.map((output) => <span key={output} className="rounded-full border border-white/[.07] bg-white/[.035] px-2 py-1 text-[8px] font-bold text-white/34">{output}</span>)}
            </div>
          </div>
        </div>

        <aside className="p-4 sm:p-5">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/30">Control surface</div>
          <div className="mt-4 space-y-5">
            {scenario.controls.map((control) => {
              const value = values[control.id] ?? control.value
              const percent = normalize(value, control.min, control.max) * 100
              return (
                <label key={`${scenario.id}:${control.id}`} className="block">
                  <div className="flex items-center justify-between gap-3 text-[10px] font-bold">
                    <span className="text-white/55">{control.label}</span>
                    <span className="rounded-full bg-white/[.05] px-2 py-1 font-black tabular-nums text-cyan-100/70">{value}{control.unit ? ` ${control.unit}` : ''}</span>
                  </div>
                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={value}
                    onChange={(event) => setValues((current) => ({ ...current, [control.id]: Number(event.target.value) }))}
                    className="mt-2 h-2 w-full cursor-pointer accent-cyan-300"
                    aria-label={control.label}
                  />
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[.05]">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-300/70 via-violet-300/70 to-fuchsia-300/70" animate={{ width: `${percent}%` }} />
                  </div>
                </label>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setValues(defaultsFor(scenario))}
            className="mt-6 min-h-[42px] w-full rounded-[16px] border border-white/[.09] bg-white/[.035] text-[10px] font-black uppercase tracking-[.12em] text-white/50 transition hover:bg-white/[.06] hover:text-white/75"
          >
            Reset synthetic state
          </button>

          <div className="mt-5 rounded-[18px] border border-amber-200/[.08] bg-amber-200/[.025] p-3 text-[9px] font-medium leading-relaxed text-amber-50/36">
            These controls intentionally prioritize interaction prototyping. They are not calibrated clinical models and must not be used for patient-specific prediction, diagnosis, dosing, or treatment decisions.
          </div>
        </aside>
      </div>
    </section>
  )
}
