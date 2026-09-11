import { useMemo, useState } from 'react'
import { MedicalEvidenceExplorer } from '../components/MedicalEvidenceExplorer'
import {
  DEFAULT_TEACH_BACK,
  KNOWLEDGE_BRIDGE_MODULES,
  KNOWLEDGE_BRIDGE_TRUTH_RULES,
  compareRisks,
  type BridgeModuleKey,
} from '../lib/knowledgeBridge'

function pct(value: number) {
  return `${(value * 100).toFixed(value * 100 < 10 ? 1 : 0)}%`
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.035]">
      <div className="text-[9px] font-black uppercase tracking-[.13em] text-neutral-400">{label}</div>
      <div className="mt-1 text-xl font-black tabular-nums text-neutral-950 dark:text-white">{value}</div>
      <div className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{detail}</div>
    </div>
  )
}

export function KnowledgeBridge() {
  const [active, setActive] = useState<BridgeModuleKey>('translator')
  const [controlPct, setControlPct] = useState(20)
  const [treatmentPct, setTreatmentPct] = useState(15)
  const [teachBackDone, setTeachBackDone] = useState<Set<string>>(() => new Set())

  const module = KNOWLEDGE_BRIDGE_MODULES.find((item) => item.key === active) ?? KNOWLEDGE_BRIDGE_MODULES[0]
  const risks = useMemo(() => compareRisks(controlPct / 100, treatmentPct / 100), [controlPct, treatmentPct])

  function toggleTeachBack(id: string) {
    setTeachBackDone((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <main className="mx-auto max-w-6xl space-y-4 pb-24">
      <section className="rounded-[30px] border border-neutral-200 bg-neutral-950 p-5 text-white shadow-[0_24px_70px_rgba(20,25,30,.18)] dark:border-white/10 sm:p-7">
        <div className="text-[9px] font-black uppercase tracking-[.2em] text-emerald-300">Panacea Knowledge Bridge</div>
        <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-[-.045em] sm:text-5xl">Start from a real source. Then explain it.</h1>
        <p className="mt-3 max-w-3xl text-[12px] leading-relaxed text-white/60">This page now searches live biomedical sources instead of pretending that a static concept card is a knowledge engine. Search a disease, drug, anatomy term, procedure or physiology concept and inspect the underlying ontology, literature, clinical trials and FDA label data.</p>
      </section>

      <MedicalEvidenceExplorer
        autoRun
        initialQuery="hypertension"
        title="Search the medical evidence layer"
        subtitle="One query fans out to Europe PMC, EMBL-EBI Ontology Lookup Service, ClinicalTrials.gov and openFDA. Results keep their source identity and external link."
      />

      <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.15em] text-neutral-400">Communication lens</div>
            <h2 className="mt-1 text-[18px] font-black tracking-tight text-neutral-950 dark:text-white">What should happen after you find the source?</h2>
          </div>
          <div className="text-[9px] font-semibold text-neutral-400">These are workflow lenses, not simulated API outputs.</div>
        </div>

        <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {KNOWLEDGE_BRIDGE_MODULES.map((item) => (
            <button key={item.key} type="button" aria-pressed={active === item.key} onClick={() => setActive(item.key)} className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-black transition ${active === item.key ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-[22px] bg-neutral-50 p-4 dark:bg-white/[.035]">
            <div className="text-[9px] font-black uppercase tracking-[.12em] text-emerald-700 dark:text-emerald-300">Patient problem</div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{module.patientProblem}</p>
          </div>
          <div className="rounded-[22px] bg-neutral-50 p-4 dark:bg-white/[.035]">
            <div className="text-[9px] font-black uppercase tracking-[.12em] text-sky-700 dark:text-sky-300">Clinical value</div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{module.clinicianValue}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">{module.outputs.map((output) => <span key={output} className="rounded-full bg-neutral-100 px-2.5 py-1.5 text-[9px] font-black text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{output}</span>)}</div>
        <div className="mt-3 rounded-[20px] border border-amber-200 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"><b>Truth boundary:</b> {module.truthBoundary}</div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035] sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div><div className="text-[9px] font-black uppercase tracking-[.14em] text-neutral-400">Working calculator</div><h2 className="mt-1 text-[18px] font-black text-neutral-950 dark:text-white">Absolute risk before relative-risk headlines</h2></div>
            <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-[9px] font-black text-neutral-500 dark:bg-white/10">Teaching calculation</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="rounded-[20px] bg-neutral-50 p-3 text-[11px] font-black text-neutral-800 dark:bg-white/[.04] dark:text-white">Control event risk: {controlPct}%<input className="mt-3 w-full accent-emerald-600" type="range" min="1" max="80" value={controlPct} onChange={(e) => setControlPct(Number(e.target.value))} /></label>
            <label className="rounded-[20px] bg-neutral-50 p-3 text-[11px] font-black text-neutral-800 dark:bg-white/[.04] dark:text-white">Treatment event risk: {treatmentPct}%<input className="mt-3 w-full accent-emerald-600" type="range" min="0" max="80" value={treatmentPct} onChange={(e) => setTreatmentPct(Number(e.target.value))} /></label>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Metric label="Absolute change" value={pct(risks.absoluteRiskReduction)} detail={`${risks.preventedPer1000} fewer events per 1,000 when positive`} />
            <Metric label="Relative change" value={risks.relativeRiskReduction === null ? '—' : pct(risks.relativeRiskReduction)} detail="Relative change must be read beside absolute change." />
            <Metric label="Natural frequency" value={`${risks.controlPer1000} → ${risks.treatmentPer1000}`} detail="Expected events per 1,000 in the source population." />
            <Metric label="NNT" value={risks.nnt ? risks.nnt.toFixed(1) : '—'} detail="Defined only when the absolute risk reduction is positive." />
          </div>

          <div className="mt-3 rounded-[20px] bg-neutral-950 p-3 font-mono text-[10px] leading-relaxed text-neutral-200">ARR = CER − EER = {pct(risks.controlRisk)} − {pct(risks.treatmentRisk)} = {pct(risks.absoluteRiskReduction)}<br />RRR = ARR / CER{risks.relativeRiskReduction !== null ? ` = ${pct(risks.relativeRiskReduction)}` : ''}<br />NNT = 1 / ARR{risks.nnt ? ` = ${risks.nnt.toFixed(1)}` : ' · undefined when no absolute benefit'}</div>
        </div>

        <div className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035] sm:p-5">
          <div className="text-[9px] font-black uppercase tracking-[.14em] text-neutral-400">Working comprehension loop</div>
          <h2 className="mt-1 text-[18px] font-black text-neutral-950 dark:text-white">Teach-back checklist</h2>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">Mark each concept only after the person can reconstruct it in their own words.</p>
          <div className="mt-3 space-y-2">
            {DEFAULT_TEACH_BACK.map((item) => (
              <button key={item.id} type="button" onClick={() => toggleTeachBack(item.id)} className={`w-full rounded-[18px] border p-3 text-left transition ${teachBackDone.has(item.id) ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-400/25 dark:bg-emerald-400/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.03]'}`}>
                <div className="flex gap-2"><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-black ${teachBackDone.has(item.id) ? 'bg-emerald-600 text-white' : 'border border-neutral-300 text-neutral-400 dark:border-white/20'}`}>{teachBackDone.has(item.id) ? '✓' : '?'}</span><div><div className="text-[11px] font-black text-neutral-900 dark:text-white">{item.prompt}</div><div className="mt-1 text-[9px] leading-relaxed text-neutral-500">{item.whyItMatters}</div></div></div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-[10px] font-black text-emerald-700 dark:text-emerald-300">{teachBackDone.size}/{DEFAULT_TEACH_BACK.length} checked</div>
        </div>
      </section>

      <details className="rounded-[24px] border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.035]">
        <summary className="cursor-pointer text-[11px] font-black text-neutral-700 dark:text-neutral-200">Source and truth rules</summary>
        <div className="mt-3 grid gap-2 md:grid-cols-2">{KNOWLEDGE_BRIDGE_TRUTH_RULES.map((rule, index) => <div key={rule} className="flex gap-2 rounded-[18px] bg-neutral-50 p-3 text-[10px] leading-relaxed text-neutral-600 dark:bg-white/[.035] dark:text-neutral-300"><span className="font-black text-emerald-700 dark:text-emerald-300">{index + 1}</span><span>{rule}</span></div>)}</div>
      </details>
    </main>
  )
}

export default KnowledgeBridge
