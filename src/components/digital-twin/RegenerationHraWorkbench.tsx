import { useMemo, useState } from 'react'
import {
  AGING_HALLMARKS,
  FOUR_D_PHASES,
  ORGAN_AGING_PROFILES,
  REGENERATION_HYPOTHESES,
  hypothesisFitScore,
} from '../../lib/regenerationResearch'
import { HraResolvedAnatomyViewer } from './HraResolvedAnatomyViewer'

function pct(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`
}

function evidenceTone(value: string) {
  if (value === 'clinical-research') return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200'
  if (value === 'preclinical') return 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-300/20 dark:bg-violet-300/10 dark:text-violet-200'
  if (value === 'reference-biology') return 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200'
  return 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'
}

export function RegenerationHraWorkbench() {
  const [organId, setOrganId] = useState(ORGAN_AGING_PROFILES[0].id)
  const organ = ORGAN_AGING_PROFILES.find((item) => item.id === organId) ?? ORGAN_AGING_PROFILES[0]
  const relevantHallmarks = AGING_HALLMARKS.filter((item) => organ.hallmarkIds.includes(item.id))
  const [hallmarkId, setHallmarkId] = useState(relevantHallmarks[0]?.id ?? AGING_HALLMARKS[0].id)
  const hallmark = relevantHallmarks.find((item) => item.id === hallmarkId) ?? relevantHallmarks[0]
  const compatibleHypotheses = REGENERATION_HYPOTHESES.filter((item) => item.compatibleOrgans.includes(organ.id))
  const [hypothesisId, setHypothesisId] = useState(compatibleHypotheses[0]?.id ?? REGENERATION_HYPOTHESES[0].id)
  const hypothesis = compatibleHypotheses.find((item) => item.id === hypothesisId) ?? compatibleHypotheses[0]
  const [phaseIndex, setPhaseIndex] = useState(1)
  const phase = FOUR_D_PHASES[Math.min(phaseIndex, FOUR_D_PHASES.length - 1)]

  const anatomyTerms = useMemo(() => [...new Set([organ.label, ...organ.focusKeywords])].slice(0, 12), [organ])
  const ranked = useMemo(() => compatibleHypotheses
    .map((item) => ({ item, score: hypothesisFitScore(item, organ.id, hallmark?.id || '') }))
    .sort((a, b) => b.score - a.score), [compatibleHypotheses, organ.id, hallmark?.id])

  function chooseOrgan(id: string) {
    const next = ORGAN_AGING_PROFILES.find((item) => item.id === id) ?? ORGAN_AGING_PROFILES[0]
    const nextHallmarks = AGING_HALLMARKS.filter((item) => next.hallmarkIds.includes(item.id))
    const nextHypotheses = REGENERATION_HYPOTHESES.filter((item) => item.compatibleOrgans.includes(next.id))
    setOrganId(next.id)
    setHallmarkId(nextHallmarks[0]?.id ?? AGING_HALLMARKS[0].id)
    setHypothesisId(nextHypotheses[0]?.id ?? REGENERATION_HYPOTHESES[0].id)
    setPhaseIndex(1)
  }

  if (!hallmark || !hypothesis) return null

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-violet-700 dark:text-violet-300">Regeneration research · source-first</div>
            <h2 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white">Organ anatomy stays real; the recovery model stays explicit</h2>
            <p className="mt-1 max-w-4xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">HuBMAP HRA geometry is shown as a fixed anatomical reference. Aging hallmarks, hypotheses and time-state values are modeled separately and never deform or animate the source model to imply rejuvenation.</p>
          </div>
          <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-black text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">Research model · not rejuvenation measurement</div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {ORGAN_AGING_PROFILES.map((item) => (
            <button key={item.id} onClick={() => chooseOrgan(item.id)} className={`min-w-[190px] shrink-0 rounded-2xl border p-3 text-left ${item.id === organ.id ? 'border-violet-300 bg-violet-50 dark:border-violet-300/30 dark:bg-violet-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <div className="text-[11px] font-black text-neutral-950 dark:text-white">{item.label}</div>
              <div className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.subtitle}</div>
            </button>
          ))}
        </div>
      </section>

      <HraResolvedAnatomyViewer
        title={`${organ.label} · HRA source anatomy`}
        description={organ.note}
        terms={anatomyTerms}
      />

      <section className="grid gap-4 xl:grid-cols-[310px_minmax(0,1fr)_340px]">
        <aside className="space-y-4">
          <section className="rounded-[26px] border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.035]">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-neutral-400">Aging hallmark</div>
            <div className="mt-3 space-y-2">
              {relevantHallmarks.map((item) => (
                <button key={item.id} onClick={() => setHallmarkId(item.id)} className={`w-full rounded-2xl border p-3 text-left ${item.id === hallmark.id ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300/30 dark:bg-cyan-300/10' : 'border-neutral-200 dark:border-white/10'}`}>
                  <div className="text-[11px] font-black text-neutral-950 dark:text-white">{item.label}</div>
                  <div className="mt-1 line-clamp-3 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.description}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.035]">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-neutral-400">Measured readouts this hypothesis would need</div>
            <div className="mt-3 flex flex-wrap gap-1.5">{hallmark.readouts.map((item) => <span key={item} className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[9px] font-semibold text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">{item}</span>)}</div>
          </section>
        </aside>

        <main className="space-y-4">
          <section className="rounded-[26px] border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.035] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-violet-700 dark:text-violet-300">Research hypothesis</div>
                <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{hypothesis.label}</h3>
                <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{hypothesis.mechanism}</p>
              </div>
              <span className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase ${evidenceTone(hypothesis.evidence)}`}>{hypothesis.evidence.replace(/-/g, ' ')}</span>
            </div>

            <div className="mt-4 no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {ranked.map(({ item, score }) => (
                <button key={item.id} onClick={() => setHypothesisId(item.id)} className={`min-w-[220px] shrink-0 rounded-2xl border p-3 text-left ${item.id === hypothesis.id ? 'border-violet-300 bg-violet-50 dark:border-violet-300/30 dark:bg-violet-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
                  <div className="flex items-start justify-between gap-2"><div className="text-[10px] font-black text-neutral-950 dark:text-white">{item.label}</div><div className="text-[9px] font-black text-violet-700 dark:text-violet-300">{Math.round(score * 100)}</div></div>
                  <div className="mt-1 text-[8px] uppercase tracking-wide text-neutral-400">model fit score · not efficacy</div>
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {FOUR_D_PHASES.map((item, index) => (
                <button key={item.id} onClick={() => setPhaseIndex(index)} className={`rounded-2xl border p-3 text-left ${index === phaseIndex ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300/30 dark:bg-cyan-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
                  <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">t{index}</div>
                  <div className="mt-1 text-[10px] font-black text-neutral-950 dark:text-white">{item.label}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ['Hallmark burden', phase.hallmarkBurden, 'bg-amber-500'],
                ['Cellular stress', phase.cellularStress, 'bg-rose-500'],
                ['Function index', phase.functionIndex, 'bg-emerald-500'],
              ].map(([label, value, bar]) => {
                const numeric = value as number
                return <div key={label as string} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]"><div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wide text-neutral-400"><span>{label}</span><span>{pct(numeric)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10"><div className={`h-full rounded-full ${bar}`} style={{ width: pct(numeric) }} /></div></div>
              })}
            </div>
          </section>

          <section className="rounded-[26px] border border-neutral-200 bg-[#071019] p-4 text-white sm:p-5 dark:border-white/10">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-300">Mechanism chain</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {hypothesis.mechanismSteps.map((item, index) => <div key={item} className="flex items-center gap-2"><span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-2 text-[9px] font-bold text-white/75">{item}</span>{index < hypothesis.mechanismSteps.length - 1 && <span className="text-cyan-300">→</span>}</div>)}
            </div>
            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-[10px] leading-relaxed text-amber-100"><strong>Safety gate:</strong> {hypothesis.safetyGate}</div>
          </section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-[26px] border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.035]">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-neutral-400">Cell types represented conceptually</div>
            <div className="mt-3 space-y-2">{organ.cellTypes.map((item) => <div key={item} className="rounded-xl bg-neutral-50 px-3 py-2 text-[10px] font-semibold text-neutral-700 dark:bg-white/[.035] dark:text-neutral-300">{item}</div>)}</div>
          </section>
          <section className="rounded-[26px] border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.035]">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-neutral-400">Organ function readouts</div>
            <div className="mt-3 space-y-2">{organ.functionReadouts.map((item) => <div key={item} className="rounded-xl border border-neutral-200 px-3 py-2 text-[10px] font-semibold text-neutral-700 dark:border-white/10 dark:text-neutral-300">{item}</div>)}</div>
          </section>
          <section className="rounded-[26px] border border-violet-200 bg-violet-50 p-4 dark:border-violet-300/20 dark:bg-violet-300/[.07]">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-violet-800 dark:text-violet-200">Interpretation boundary</div>
            <p className="mt-2 text-[10px] leading-relaxed text-violet-950/75 dark:text-violet-100/70">The phase values are normalized educational states. A future patient-specific mode would require longitudinal omics, imaging, physiological and clinical measurements plus a validated organ-specific model. Panacea does not label a lower modeled burden as proven age reversal.</p>
          </section>
        </aside>
      </section>
    </div>
  )
}
