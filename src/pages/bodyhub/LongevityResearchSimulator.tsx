import { useMemo, useState } from 'react'
import {
  LONGEVITY_COMMERCIALIZATION_BOTTLENECKS,
  LONGEVITY_RESEARCH_BOUNDARY,
  LONGEVITY_RESEARCH_CHALLENGES,
  type LongevityChallengeId,
} from '../../lib/anatomy/longevityResearchChallenges'

const READINESS_LABEL = {
  conceptual: 'Conceptual',
  preclinical: 'Preclinical',
  'translational-bottleneck': 'Translational bottleneck',
} as const

export default function LongevityResearchSimulator() {
  const [challengeId, setChallengeId] = useState<LongevityChallengeId>('epigenetic-drift')
  const [leverId, setLeverId] = useState('pulsed-reprogramming')
  const [intensity, setIntensity] = useState(50)

  const challenge = LONGEVITY_RESEARCH_CHALLENGES.find((item) => item.id === challengeId) ?? LONGEVITY_RESEARCH_CHALLENGES[0]
  const lever = challenge.levers.find((item) => item.id === leverId) ?? challenge.levers[0]

  const synthetic = useMemo(() => {
    const normalized = intensity / 100
    const benefit = Math.round(20 + normalized * 55)
    const uncertainty = Math.round(75 - normalized * 20)
    const safetyMargin = Math.round(80 - normalized * 45)
    return { benefit, uncertainty, safetyMargin }
  }, [intensity])

  function chooseChallenge(id: LongevityChallengeId) {
    const next = LONGEVITY_RESEARCH_CHALLENGES.find((item) => item.id === id)
    if (!next) return
    setChallengeId(id)
    setLeverId(next.levers[0].id)
    setIntensity(50)
  }

  return (
    <section data-longevity-research-simulator="v1" className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-300/20 dark:bg-emerald-300/[.04]" aria-label="Longevity research frontier simulator">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Research frontier · educational simulation</div>
          <h5 className="mt-1 text-sm font-black text-neutral-950 dark:text-white">Systemic aging problem-solving map</h5>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">Explore how a hypothetical research strategy changes one aging bottleneck while exposing tradeoffs, uncertainty, delivery constraints and commercialization barriers. Values below are synthetic teaching signals, not biological predictions.</p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[9px] font-black text-emerald-700 dark:border-emerald-300/20 dark:bg-white/5 dark:text-emerald-200">No immortality claim</span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {LONGEVITY_RESEARCH_CHALLENGES.map((item) => {
          const active = item.id === challenge.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => chooseChallenge(item.id)}
              className={`min-h-20 rounded-xl border p-3 text-left transition ${active ? 'border-emerald-500 bg-white shadow-sm dark:bg-white/10' : 'border-neutral-200 bg-white/70 hover:border-emerald-300 dark:border-white/10 dark:bg-white/[.03]'}`}
            >
              <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">{item.scale}</div>
              <div className="mt-1 text-[11px] font-black text-neutral-900 dark:text-white">{item.label}</div>
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-neutral-200 bg-white/80 p-3 dark:border-white/10 dark:bg-black/10">
          <div className="text-[9px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Core problem</div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-300">{challenge.problem}</p>

          <div className="mt-3 text-[9px] font-black uppercase tracking-wide text-neutral-500">Research lever</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {challenge.levers.map((item) => (
              <button key={item.id} type="button" aria-pressed={item.id === lever.id} onClick={() => setLeverId(item.id)} className={`min-h-9 rounded-full border px-3 text-[9px] font-black ${item.id === lever.id ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] font-black text-neutral-900 dark:text-white">{lever.label}</div>
              <span className="rounded-full bg-neutral-100 px-2 py-1 text-[8px] font-black text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{READINESS_LABEL[lever.readiness]}</span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">{lever.mechanism}</p>
            <p className="mt-2 text-[9px] leading-relaxed text-amber-700 dark:text-amber-300"><strong>Tradeoff:</strong> {lever.primaryTradeoff}</p>
          </div>

          <label className="mt-3 block text-[9px] font-black uppercase tracking-wide text-neutral-500" htmlFor="longevity-hypothesis-intensity">Hypothetical intervention intensity · {intensity}%</label>
          <input id="longevity-hypothesis-intensity" className="mt-2 w-full" type="range" min="0" max="100" step="5" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} />
          <p className="mt-1 text-[8px] leading-relaxed text-neutral-400">This slider changes only a synthetic teaching model. It is not a dose, protocol, clinical recommendation or quantitative biological forecast.</p>
        </div>

        <div className="space-y-2">
          <div className="rounded-xl border border-neutral-200 bg-white/80 p-3 dark:border-white/10 dark:bg-black/10">
            <div className="text-[9px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Synthetic systems response</div>
            <div className="mt-3 space-y-3" aria-label="Synthetic longevity research response meters">
              {[
                ['Potential mechanism signal', synthetic.benefit],
                ['Safety margin', synthetic.safetyMargin],
                ['Residual uncertainty', synthetic.uncertainty],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <div className="flex justify-between text-[9px] font-bold text-neutral-600 dark:text-neutral-300"><span>{label}</span><span>{value}%</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10"><div className="h-full rounded-full bg-current text-emerald-500" style={{ width: `${value}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {challenge.readouts.map((readout) => <span key={readout} className="rounded-full border border-neutral-200 px-2 py-1 text-[8px] font-bold text-neutral-500 dark:border-white/10 dark:text-neutral-300">{readout}</span>)}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white/80 p-3 dark:border-white/10 dark:bg-black/10">
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-500">Commercialization bottlenecks</div>
            <div className="mt-2 space-y-2">
              {LONGEVITY_COMMERCIALIZATION_BOTTLENECKS.map((item) => (
                <article key={item.dimension} className="rounded-lg border border-neutral-100 p-2 dark:border-white/10">
                  <div className="text-[9px] font-black text-neutral-800 dark:text-neutral-200">{item.dimension}</div>
                  <p className="mt-1 text-[8.5px] leading-relaxed text-neutral-500">{item.bottleneck}</p>
                  <p className="mt-1 text-[8.5px] leading-relaxed text-neutral-400">{item.reality}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">{LONGEVITY_RESEARCH_BOUNDARY}</p>
    </section>
  )
}
