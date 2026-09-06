import { useMemo, useState } from 'react'
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
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">{label}</div>
      <div className="mt-1 text-xl font-black tabular-nums text-ink dark:text-white">{value}</div>
      <div className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">{detail}</div>
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
    <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950 p-5 text-white shadow-xl dark:border-white/10 md:p-7">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Panacea Knowledge Bridge</div>
        <h1 className="mt-2 max-w-4xl text-2xl font-black leading-tight md:text-4xl">Make the medical conversation understandable without making it less precise.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-300">
          One bridge between patient language, clinical language, evidence, choices, cost, consent and follow-up. The original source stays visible; simplification never becomes a new fact.
        </p>
        <div className="mt-4 grid gap-2 text-[11px] sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-3"><b className="block text-emerald-300">Patient side</b>Understand what happened, what matters, what to ask and what to do next.</div>
          <div className="rounded-xl bg-white/10 p-3"><b className="block text-emerald-300">Clinician side</b>Receive a structured story, preference map and comprehension gaps instead of a blank slate.</div>
          <div className="rounded-xl bg-white/10 p-3"><b className="block text-emerald-300">Trust layer</b>Every claim keeps provenance, uncertainty, time horizon and source context.</div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {KNOWLEDGE_BRIDGE_MODULES.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={active === item.key}
              onClick={() => setActive(item.key)}
              className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-bold transition ${active === item.key ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-white/5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-brand">Why the patient needs it</div>
            <p className="mt-1 text-sm leading-relaxed text-ink dark:text-white">{module.patientProblem}</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-white/5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-brand">Why the clinician needs it</div>
            <p className="mt-1 text-sm leading-relaxed text-ink dark:text-white">{module.clinicianValue}</p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Outputs</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {module.outputs.map((output) => <span key={output} className="rounded-full bg-brand/10 px-2.5 py-1 text-[10.5px] font-bold text-brand">{output}</span>)}
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
            <div className="text-[10px] font-bold uppercase tracking-wide">Truth boundary</div>
            <p className="mt-1 text-xs leading-relaxed">{module.truthBoundary}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Shared Decision Demo</div>
              <h2 className="text-lg font-black text-ink dark:text-white">Absolute risk before relative-risk headlines</h2>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold text-neutral-500 dark:bg-white/10">Teaching example · not treatment advice</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="rounded-xl bg-neutral-50 p-3 text-xs font-bold text-ink dark:bg-white/5 dark:text-white">
              Event risk without option: {controlPct}%
              <input className="mt-2 w-full accent-[var(--brand)]" type="range" min="1" max="80" value={controlPct} onChange={(e) => setControlPct(Number(e.target.value))} />
            </label>
            <label className="rounded-xl bg-neutral-50 p-3 text-xs font-bold text-ink dark:bg-white/5 dark:text-white">
              Event risk with option: {treatmentPct}%
              <input className="mt-2 w-full accent-[var(--brand)]" type="range" min="0" max="80" value={treatmentPct} onChange={(e) => setTreatmentPct(Number(e.target.value))} />
            </label>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Metric label="Absolute change" value={pct(risks.absoluteRiskReduction)} detail={`${risks.preventedPer1000} fewer events per 1,000 when positive`} />
            <Metric label="Relative change" value={risks.relativeRiskReduction === null ? '—' : pct(risks.relativeRiskReduction)} detail="Can look large even when the absolute change is small" />
            <Metric label="Natural frequency" value={`${risks.controlPer1000} → ${risks.treatmentPer1000}`} detail="Expected events per 1,000 in the source population" />
            <Metric label="NNT" value={risks.nnt ? risks.nnt.toFixed(1) : '—'} detail="Only meaningful when ARR is positive and source assumptions apply" />
          </div>

          <div className="mt-3 rounded-xl bg-neutral-950 p-3 font-mono text-[11px] leading-relaxed text-neutral-200">
            ARR = CER − EER = {pct(risks.controlRisk)} − {pct(risks.treatmentRisk)} = {pct(risks.absoluteRiskReduction)}<br />
            RRR = ARR / CER{risks.relativeRiskReduction !== null ? ` = ${pct(risks.relativeRiskReduction)}` : ''}<br />
            NNT = 1 / ARR{risks.nnt ? ` = ${risks.nnt.toFixed(1)}` : ' · undefined when no absolute benefit'}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Teach-Back Loop</div>
          <h2 className="text-lg font-black text-ink dark:text-white">Do not ask “Do you understand?”</h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">Ask the person to reconstruct the plan. Misunderstanding becomes visible before they leave.</p>
          <div className="mt-3 space-y-2">
            {DEFAULT_TEACH_BACK.map((item) => (
              <button key={item.id} type="button" onClick={() => toggleTeachBack(item.id)} className={`w-full rounded-xl border p-3 text-left transition ${teachBackDone.has(item.id) ? 'border-brand bg-brand/[0.05]' : 'border-neutral-200 dark:border-white/10'}`}>
                <div className="flex gap-2"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${teachBackDone.has(item.id) ? 'border-brand bg-brand text-white' : 'border-neutral-300 text-neutral-400 dark:border-white/20'}`}>{teachBackDone.has(item.id) ? '✓' : '?'}</span><div><div className="text-xs font-bold text-ink dark:text-white">{item.prompt}</div><div className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">{item.whyItMatters}</div></div></div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs font-bold text-brand">{teachBackDone.size}/{DEFAULT_TEACH_BACK.length} concepts checked</div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">System-level integrations to build next</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Record translator', 'EMR/FHIR note → original text + patient explanation + glossary + questions.'],
            ['Imaging bridge', 'Radiology report → annotated anatomy → plain explanation → original images/report provenance.'],
            ['Medication bridge', 'Prescription → why/how/monitoring/interactions/cost alternatives with source dates.'],
            ['Care graph', 'Referral → labs → imaging → specialist → procedure → pharmacy → home follow-up as one visible path.'],
            ['Visit packet', 'Symptoms + timeline + wearable/lab data → concise pre-visit brief and must-ask questions.'],
            ['Consent replay', 'Procedure risks/benefits/alternatives → visual simulation + teach-back checkpoint.'],
            ['Second-opinion export', 'One provenance-preserving packet containing reports, images, pathology, genomics and open questions.'],
            ['Language/culture layer', 'Medical meaning preserved across language, literacy level and culturally different ways of describing symptoms.'],
          ].map(([title, text]) => <div key={title} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5"><div className="text-xs font-black text-ink dark:text-white">{title}</div><p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">{text}</p></div>)}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Non-negotiable truth rules</div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {KNOWLEDGE_BRIDGE_TRUTH_RULES.map((rule, index) => <div key={rule} className="flex gap-2 rounded-xl bg-neutral-50 p-3 text-[11px] leading-relaxed text-neutral-600 dark:bg-white/5 dark:text-neutral-300"><span className="font-black text-brand">{index + 1}</span><span>{rule}</span></div>)}
        </div>
      </section>
    </div>
  )
}

export default KnowledgeBridge
