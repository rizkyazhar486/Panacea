import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { compileBodyExperience, experienceCompilerSummary } from '../lib/bodyExperienceCompiler'
import { bodyTrillionSample, type BodyTrillionFeature } from '../lib/bodyTrillionFeatureFactory'

function FeatureButton({ feature, active, onClick }: { feature: BodyTrillionFeature; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[17px] border p-3 text-left transition ${active ? 'border-cyan-300/25 bg-cyan-300/[.07]' : 'border-white/[.06] bg-white/[.022] hover:border-white/[.11] hover:bg-white/[.04]'}`}
    >
      <div className="text-[7px] font-black uppercase tracking-[.14em] text-cyan-100/50">{feature.id}</div>
      <div className="mt-1 text-[10px] font-black leading-tight text-white/70">{feature.title}</div>
      <div className="mt-1 line-clamp-2 text-[8px] font-medium leading-relaxed text-white/28">{feature.summary}</div>
    </button>
  )
}

export default function BodyExperienceCompilerLab() {
  const reduceMotion = useReducedMotion()
  const [seed, setSeed] = useState('panaceamed-compiler')
  const [nonce, setNonce] = useState(0)
  const features = useMemo(() => bodyTrillionSample(`${seed}:${nonce}`, 14), [seed, nonce])
  const [selectedIndex, setSelectedIndex] = useState<bigint>(features[0]?.index ?? 0n)
  const selectedFeature = features.find((feature) => feature.index === selectedIndex) ?? features[0]
  const compiled = selectedFeature ? compileBodyExperience(selectedFeature) : undefined
  const summary = compiled ? experienceCompilerSummary(compiled) : undefined

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/[.08] bg-[#020407]/95 shadow-[0_28px_100px_rgba(0,0,0,.46)]" aria-labelledby="experience-compiler-title">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-[20%] top-[-40%] h-[520px] w-[520px] rounded-full bg-cyan-400/[.065] blur-[150px]" />
        <div className="absolute bottom-[-45%] right-[8%] h-[560px] w-[560px] rounded-full bg-violet-500/[.05] blur-[160px]" />
      </div>

      <header className="relative z-[2] border-b border-white/[.06] p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">Experience Compiler · Architecture Lab</div>
            <h3 id="experience-compiler-title" className="mt-2 text-2xl font-black tracking-[-.04em] text-white sm:text-3xl">Turn an impossible design coordinate into a finite runtime plan.</h3>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-white/46">The compiler resolves each experimental coordinate into modules, interaction layers, content queries, safety gates and a rendering budget. The goal is creative scale without runtime chaos.</p>
          </div>
          {summary && (
            <div className="grid grid-cols-3 gap-2 xl:w-[430px]">
              <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3 text-center"><div className="text-lg font-black text-white/80">{summary.modules}</div><div className="text-[7px] font-black uppercase tracking-[.12em] text-white/24">modules</div></div>
              <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3 text-center"><div className="text-lg font-black text-white/80">{summary.sceneLayers}</div><div className="text-[7px] font-black uppercase tracking-[.12em] text-white/24">scene layers</div></div>
              <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3 text-center"><div className="text-lg font-black text-cyan-100/70">{summary.targetFps}</div><div className="text-[7px] font-black uppercase tracking-[.12em] text-white/24">target fps</div></div>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-[2] grid xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="border-b border-white/[.06] p-4 xl:border-b-0 xl:border-r">
          <label className="block">
            <span className="text-[8px] font-black uppercase tracking-[.14em] text-white/26">Compiler seed</span>
            <input value={seed} onChange={(event) => setSeed(event.target.value)} className="mt-2 min-h-[40px] w-full rounded-[13px] border border-white/[.08] bg-black/30 px-3 text-[10px] font-bold text-white/62 outline-none focus:border-cyan-300/20" />
          </label>
          <button type="button" onClick={() => setNonce((value) => value + 1)} className="mt-2 min-h-[38px] w-full rounded-[13px] border border-cyan-300/15 bg-cyan-300/[.05] text-[9px] font-black text-cyan-100/62 hover:bg-cyan-300/[.085]">Sample new coordinates</button>

          <div className="mt-4 max-h-[650px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {features.map((feature) => <FeatureButton key={feature.id} feature={feature} active={feature.index === selectedFeature?.index} onClick={() => setSelectedIndex(feature.index)} />)}
          </div>
        </aside>

        {compiled ? (
          <div className="min-w-0 p-4 sm:p-5">
            <div className="rounded-[24px] border border-cyan-300/[.09] bg-[linear-gradient(145deg,rgba(34,211,238,.05),rgba(139,92,246,.035),rgba(236,72,153,.02))] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[8px] font-black uppercase tracking-[.15em] text-cyan-100/55">{compiled.feature.id}</span>
                <span className="rounded-full border border-white/[.07] bg-black/25 px-2 py-1 text-[7px] font-black text-white/26">{compiled.routeKey}</span>
              </div>
              <h4 className="mt-2 text-xl font-black tracking-[-.025em] text-white/84">{compiled.title}</h4>
              <p className="mt-2 text-[10px] font-medium leading-relaxed text-white/35">{compiled.subtitle}</p>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <section className="rounded-[22px] border border-white/[.065] bg-white/[.022] p-4">
                <div className="text-[8px] font-black uppercase tracking-[.15em] text-white/26">Module plan</div>
                <div className="mt-3 space-y-2">
                  {compiled.modules.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: reduceMotion ? 0 : index * .025 }}
                      className="rounded-[14px] border border-white/[.055] bg-black/25 p-3"
                    >
                      <div className="flex items-center justify-between gap-3"><span className="text-[9px] font-black text-white/62">{item.id}</span><span className="text-[7px] font-black uppercase tracking-[.12em] text-cyan-100/45">{item.priority}</span></div>
                      <div className="mt-1 text-[8px] font-medium leading-relaxed text-white/28">{item.reason} · {item.lazy ? 'lazy' : 'eager'}</div>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section className="rounded-[22px] border border-white/[.065] bg-white/[.022] p-4">
                <div className="text-[8px] font-black uppercase tracking-[.15em] text-white/26">Performance plan</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {Object.entries(compiled.performance).map(([key, value]) => (
                    <div key={key} className="rounded-[13px] border border-white/[.05] bg-black/22 p-2.5">
                      <div className="text-[7px] font-black uppercase tracking-[.12em] text-white/20">{key}</div>
                      <div className="mt-1 text-[9px] font-black text-white/55">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[22px] border border-white/[.065] bg-white/[.022] p-4">
                <div className="text-[8px] font-black uppercase tracking-[.15em] text-white/26">Scene layers</div>
                <div className="mt-3 space-y-1.5">
                  {compiled.sceneLayers.map((item, index) => <div key={item} className="flex items-center gap-3 rounded-[12px] border border-white/[.045] bg-black/18 px-3 py-2 text-[9px] font-bold text-white/38"><span className="w-5 text-right tabular-nums text-white/18">{index + 1}</span><span>{item}</span></div>)}
                </div>
              </section>

              <section className="rounded-[22px] border border-white/[.065] bg-white/[.022] p-4">
                <div className="text-[8px] font-black uppercase tracking-[.15em] text-white/26">Interaction stack</div>
                <div className="mt-3 flex flex-wrap gap-1.5">{compiled.interactionStack.map((item) => <span key={item} className="rounded-full border border-white/[.06] bg-black/25 px-2.5 py-1.5 text-[8px] font-bold text-white/34">{item}</span>)}</div>
                <div className="mt-4 text-[8px] font-black uppercase tracking-[.15em] text-white/26">Content queries</div>
                <div className="mt-2 space-y-1.5">{compiled.contentQueries.map((item) => <div key={item} className="rounded-[12px] bg-black/22 px-3 py-2 text-[8px] font-medium text-white/30">{item}</div>)}</div>
              </section>
            </div>

            <section className="mt-3 rounded-[22px] border border-amber-200/[.07] bg-amber-200/[.02] p-4">
              <div className="text-[8px] font-black uppercase tracking-[.15em] text-amber-100/38">Safety compilation</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(compiled.safety).map(([key, value]) => <div key={key} className="rounded-[13px] border border-white/[.045] bg-black/20 p-2.5"><div className="text-[7px] font-black uppercase tracking-[.1em] text-white/20">{key}</div><div className="mt-1 text-[9px] font-black text-white/48">{String(value)}</div></div>)}
              </div>
            </section>
          </div>
        ) : <div className="grid min-h-72 place-items-center p-6 text-xs font-bold text-white/25">No experience selected.</div>}
      </div>
    </section>
  )
}
