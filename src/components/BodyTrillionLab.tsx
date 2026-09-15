import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BODY_TRILLION_COMBINATION_COUNT,
  bodyTrillionAxisStats,
  bodyTrillionFeatureAt,
  bodyTrillionFormatCount,
  bodyTrillionHumanCount,
  bodyTrillionSample,
  type BodyTrillionFeature,
} from '../lib/bodyTrillionFeatureFactory'

function FeatureSpecCard({ feature, active, onClick }: { feature: BodyTrillionFeature; active: boolean; onClick: () => void }) {
  const values = Object.entries(feature.selection)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[20px] border p-3 text-left transition ${active ? 'border-cyan-300/25 bg-cyan-300/[.075] shadow-[inset_0_1px_0_rgba(255,255,255,.10)]' : 'border-white/[.065] bg-white/[.025] hover:border-white/[.12] hover:bg-white/[.045]'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200/65">{feature.id}</span>
        <span className="text-[8px] font-black uppercase tracking-[.13em] text-white/25">experimental</span>
      </div>
      <div className="mt-2 text-[12px] font-black leading-tight text-white/82">{feature.title}</div>
      <p className="mt-1.5 line-clamp-3 text-[9px] font-medium leading-relaxed text-white/34">{feature.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {values.slice(0, 5).map(([key, value]) => (
          <span key={key} className="rounded-full bg-white/[.04] px-2 py-1 text-[7px] font-bold text-white/28">{String(value)}</span>
        ))}
      </div>
    </button>
  )
}

export default function BodyTrillionLab() {
  const reduceMotion = useReducedMotion()
  const axisStats = useMemo(() => bodyTrillionAxisStats(), [])
  const [seed, setSeed] = useState('panaceamed-body-exposure')
  const [sampleNonce, setSampleNonce] = useState(0)
  const [indexInput, setIndexInput] = useState('0')
  const samples = useMemo(() => bodyTrillionSample(`${seed}:${sampleNonce}`, 12), [seed, sampleNonce])
  const [selectedIndex, setSelectedIndex] = useState<bigint>(samples[0]?.index ?? 0n)
  const selected = bodyTrillionFeatureAt(selectedIndex)

  function jumpToIndex() {
    try {
      const raw = BigInt(indexInput || '0')
      setSelectedIndex(raw)
    } catch {
      setIndexInput(selected.index.toString())
    }
  }

  function select(feature: BodyTrillionFeature) {
    setSelectedIndex(feature.index)
    setIndexInput(feature.index.toString())
  }

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/[.08] bg-[#020305]/95 shadow-[0_30px_110px_rgba(0,0,0,.48)]" aria-labelledby="trillion-lab-title">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-[-240px] h-[520px] w-[780px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(circle,rgba(34,211,238,.10),rgba(139,92,246,.05)_45%,transparent_70%)] blur-2xl" />
        <motion.div
          className="absolute left-1/2 top-[44%] h-[580px] w-[580px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/[.055]"
          animate={reduceMotion ? undefined : { rotate: 360, scale: [1, 1.035, 1] }}
          transition={{ rotate: { duration: 64, repeat: Infinity, ease: 'linear' }, scale: { duration: 8, repeat: Infinity, ease: 'easeInOut' } }}
        />
      </div>

      <header className="relative z-[2] border-b border-white/[.065] p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[.23em] text-cyan-200">Trillion Space Factory</span>
              <span className="rounded-full border border-fuchsia-300/10 bg-fuchsia-300/[.035] px-2.5 py-1 text-[8px] font-black uppercase tracking-[.14em] text-fuchsia-100/55">mixed-radix design universe</span>
            </div>
            <h3 id="trillion-lab-title" className="mt-2 max-w-4xl text-2xl font-black tracking-[-.045em] text-white sm:text-3xl lg:text-4xl">{bodyTrillionHumanCount()}.</h3>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-white/48">
              Instead of allocating trillions of components, Panaceamed addresses each possible experience as a deterministic coordinate across anatomy, scale, modality, interaction, time, context, visual language, teaching mode, camera, overlays and fidelity.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:w-[430px]">
            <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/28">Combinations</div>
              <div className="mt-1 text-sm font-black text-white/85">{bodyTrillionFormatCount()}</div>
            </div>
            <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/28">Axes</div>
              <div className="mt-1 text-sm font-black text-white/85">{axisStats.length}</div>
            </div>
            <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3 sm:col-span-1 col-span-2">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/28">Allocation</div>
              <div className="mt-1 text-sm font-black text-cyan-100/80">Lazy indexed</div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-[2] grid xl:grid-cols-[minmax(0,.9fr)_minmax(420px,1.1fr)]">
        <div className="border-b border-white/[.06] p-4 xl:border-b-0 xl:border-r sm:p-5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
            {axisStats.map((axis) => (
              <div key={axis.key} className="rounded-[18px] border border-white/[.06] bg-white/[.022] p-3">
                <div className="text-[8px] font-black uppercase tracking-[.15em] text-white/28">Axis</div>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div className="text-[11px] font-black text-white/68">{axis.key}</div>
                  <div className="text-xl font-black text-cyan-100/70">{axis.count}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[22px] border border-white/[.07] bg-black/35 p-4">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">Deterministic sampling</div>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-[9px] font-bold text-white/35">Seed</span>
              <input value={seed} onChange={(event) => setSeed(event.target.value)} className="min-h-[42px] w-full rounded-[14px] border border-white/[.08] bg-white/[.03] px-3 text-[11px] font-bold text-white/70 outline-none focus:border-cyan-300/20" />
            </label>
            <button type="button" onClick={() => setSampleNonce((value) => value + 1)} className="mt-2 min-h-[40px] w-full rounded-[14px] border border-cyan-300/15 bg-cyan-300/[.055] text-[10px] font-black text-cyan-100/70 transition hover:bg-cyan-300/[.09]">Generate another deterministic constellation</button>
          </div>

          <div className="mt-3 rounded-[22px] border border-white/[.07] bg-black/35 p-4">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">Direct index jump</div>
            <div className="mt-3 flex gap-2">
              <input
                inputMode="numeric"
                value={indexInput}
                onChange={(event) => setIndexInput(event.target.value.replace(/[^0-9-]/g, ''))}
                onKeyDown={(event) => { if (event.key === 'Enter') jumpToIndex() }}
                className="min-h-[42px] min-w-0 flex-1 rounded-[14px] border border-white/[.08] bg-white/[.03] px-3 text-[11px] font-bold tabular-nums text-white/70 outline-none focus:border-cyan-300/20"
              />
              <button type="button" onClick={jumpToIndex} className="rounded-[14px] border border-white/[.09] bg-white/[.04] px-4 text-[10px] font-black text-white/55 hover:bg-white/[.07]">Jump</button>
            </div>
            <div className="mt-2 text-[8px] font-medium text-white/25">Valid address space wraps modulo {BODY_TRILLION_COMBINATION_COUNT.toString()}.</div>
          </div>
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="relative overflow-hidden rounded-[24px] border border-cyan-300/[.10] bg-[linear-gradient(145deg,rgba(34,211,238,.06),rgba(139,92,246,.045),rgba(236,72,153,.025))] p-4 sm:p-5">
            <div className="pointer-events-none absolute right-[-60px] top-[-80px] h-[220px] w-[220px] rounded-full bg-cyan-300/[.075] blur-[70px]" aria-hidden />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-[.17em] text-cyan-100/65">Selected coordinate · {selected.id}</span>
                <span className="rounded-full border border-white/[.08] bg-black/25 px-2 py-1 text-[8px] font-black text-white/30">index {selected.index.toString()}</span>
              </div>
              <h4 className="mt-3 text-xl font-black tracking-[-.025em] text-white/88">{selected.title}</h4>
              <p className="mt-2 text-[11px] font-medium leading-relaxed text-white/40">{selected.summary}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(selected.selection).map(([key, value], index) => (
                  <motion.div
                    key={key}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : index * .025 }}
                    className="rounded-[16px] border border-white/[.065] bg-black/25 p-3"
                  >
                    <div className="text-[7px] font-black uppercase tracking-[.15em] text-white/25">{key}</div>
                    <div className="mt-1 text-[10px] font-black text-white/62">{String(value)}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">Seed constellation</div>
              <div className="mt-1 text-[9px] font-medium text-white/22">Twelve deterministic coordinates; no trillion-object allocation.</div>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
            {samples.map((feature) => <FeatureSpecCard key={feature.id} feature={feature} active={feature.index === selected.index} onClick={() => select(feature)} />)}
          </div>
        </div>
      </div>

      <footer className="relative z-[2] border-t border-white/[.06] px-4 py-3 text-[9px] font-medium leading-relaxed text-white/28 sm:px-5">
        This factory defines experimental UI/simulation coordinates, not validated anatomy, physiology, clinical predictions, patient-specific recommendations, or autonomous surgical instructions.
      </footer>
    </section>
  )
}
