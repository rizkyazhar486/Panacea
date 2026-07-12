import { Card, SectionTitle, Badge } from '../components/ui'
import { IconShield, IconSparkle, IconEMR, IconBook, IconCheck } from '../components/icons'
import { WEIGHTS, S_THRESHOLD } from '../lib/cdss'

const MODULES = [
  ['EHR & Data Ingest', 'HL7/FHIR connectors — medication list, labs, allergies, vitals. Input normalization.'],
  ['Patient Context Engine', 'Socioeconomic factors, language, adherence history, medication availability & cost.'],
  ['Vertical Reasoner', 'Rule engine + guidelines: dosing, renal/hepatic adjustment, contraindications (Ministry of Health/WHO/NICE). Deterministic output + score.'],
  ['DDI & Pharmacovigilance', 'Curated interaction database + ML predictor (severity + evidence), real-time alerts.'],
  ['Biomedical Knowledge Graph', 'Structured drug–disease–lab–mechanism relationships for lateral association & traceability.'],
  ['Generative LLM Lateral', 'Domain-aligned LLM (Med-PaLM style) — differential diagnosis, alternative therapies, educational text, with provenance.'],
  ['Safety Filter / Hard Constraints', 'Rule-based gate rejects prescriptions that violate contraindications/DDI/dose margins. Overrides require justification & are logged.'],
  ['Ensemble & Scoring', 'Combines vertical + lateral outputs into a ranked plan (see formula).'],
  ['Explainability & Rationale', 'Explanations for clinicians (guideline citations) & a plain-language version for patients.'],
  ['Audit, Logging & M&M', 'Full traceability, model versioning, outcome tracking.'],
  ['Federated Learning Orchestrator', 'Cross-hospital model updates without sharing raw data (DP + secure aggregation).'],
  ['Clinician & Patient UI', 'SMART on FHIR embed for clinicians + patient education/reminder app.'],
]

const FLOW = [
  'Clinician opens the record → FHIR data goes to Data Ingest.',
  'Vertical Reasoner: guideline matching, dose calculation, renal/hepatic adjustment, allergy check → recommendation + risk flag.',
  'DDI Engine: checks current medications vs. proposed → severity + references.',
  'LLM Lateral: structured prompt (context + vertical output + KG) → alternatives & draft education + rationale.',
  'Ensemble & Scoring: combined ranking (formula below).',
  'Safety Filter: blocks unsafe candidates; clinician sees remaining options + explanation.',
  'Clinician selects/edits → AI records the decision, triggers patient education, schedules follow-up, logs audit trail.',
  'Federated Orchestrator: aggregates model updates across sites — raw data stays within the institution.',
]

const ROADMAP = [
  ['MVP · 0–6 mo', 'Vertical rule engine + DDI engine + clinician UI; audit logging; pilot at 1 hospital.', 'high'],
  ['Phase 2 · 6–12 mo', 'Lateral LLM (read-only suggestions) + explainability + RAG with KG & guideline DB.', 'normal'],
  ['Phase 3 · 12–24 mo', 'Federated learning, personalized patient education, regulatory submission, multi-site rollout.', 'brand'],
] as const

const METRICS = [
  ['Safety-first', 'Hard-constraint violations (target 0), DDI false negatives, contraindication-detection sensitivity.'],
  ['Clinical utility', 'Clinician acceptance rate, time-to-decision, guideline-concordant prescription rate.'],
  ['Patient outcomes', 'Adherence, ADE incidents, 30-day readmission.'],
  ['Trust/Explainability', 'Explanation usefulness score (Likert), post-deployment monitoring.'],
]

const REG = [
  'Clarify medical device status (Ministry of Health/BPOM) — register if required; label as "decision support," not autonomous prescribing.',
  'Audit logs, model cards, dataset cards.',
  'Local IRB for clinical validation; prospective pilot before production.',
  'Incident-reporting & M&M process for AI-related events.',
]

export function Architecture() {
  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          icon={<IconShield size={20} />}
          title="Hybrid CDSS Architecture — Lateral + Vertical"
          subtitle="Panaceamed.id's foundation: safe prescribing support (doctor-in-the-loop) + personalized patient education"
        />
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">Doctor-in-the-loop</Badge>
          <Badge tone="brand">SMART on FHIR</Badge>
          <Badge tone="brand">RAG + Knowledge Graph</Badge>
          <Badge tone="brand">Federated Learning + DP</Badge>
          <Badge tone="high">AI = decision support, not autonomous prescribing</Badge>
        </div>
      </Card>

      {/* Ensemble formula */}
      <Card className="border-2 border-brand/20">
        <SectionTitle icon={<IconSparkle size={18} />} title="Ensemble & Safety Gate" />
        <div className="rounded-2xl bg-ink p-5 text-center font-mono text-white">
          <div className="text-lg">
            CombinedScore<sub>i</sub> = α·V<sub>i</sub> + β·L<sub>i</sub> + γ·S<sub>i</sub>
          </div>
          <div className="mt-2 text-sm text-white/70">
            α={WEIGHTS.alpha} · β={WEIGHTS.beta} · γ={WEIGHTS.gamma}
          </div>
          <div className="mt-4 text-base">
            FinalScore<sub>i</sub> = CombinedScore<sub>i</sub> &nbsp;if&nbsp; S<sub>i</sub> ≥ {S_THRESHOLD};
            &nbsp; otherwise <span className="text-accent">BLOCKED</span>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Legend tag="V" title="Vertical" desc="Guideline concordance, dosing correctness; hard contraindication ⇒ V=0." color="#0b7a4b" />
          <Legend tag="L" title="Lateral" desc="Calibrated LLM confidence, context relevance, benefit of alternatives." color="#3b82f6" />
          <Legend tag="S" title="Safety" desc="DDI severity, allergies, renal/hepatic margin; absolute contraindication ⇒ S=0." color="#00BF63" />
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-neutral-900 p-4 text-xs leading-relaxed text-neutral-100">
{`function evaluate_candidate(plan, patient):
    V = compute_vertical_score(plan, patient)
    L = compute_lateral_score(plan, patient)
    S = compute_safety_score(plan, patient)   # DDI, allergy, renal/hepatic
    combined = α*V + β*L + γ*S
    if S < S_threshold:
        reject_with_reason("Safety gate: DDI/allergy/contraindication")
    else:
        return {score: combined, V, L, S, evidence: collate_evidence(plan)}
# Overriding a rejected plan ⇒ requires clinician justification (recorded in the audit log).`}
        </pre>
        <p className="mt-2 text-xs text-neutral-400">
          → Implemented directly in the <b>Planning</b> module (CDSS Safety Engine).
        </p>
      </Card>

      {/* Modules */}
      <Card>
        <SectionTitle icon={<IconEMR size={18} />} title="Modules (Microservices)" subtitle="12 core services" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map(([t, d], i) => (
            <div key={t} className="rounded-xl border border-neutral-100 p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand text-xs font-bold text-white">
                  {i + 1}
                </span>
                <h4 className="text-sm font-bold leading-tight">{t}</h4>
              </div>
              <p className="text-xs text-neutral-500">{d}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Data flow */}
      <Card>
        <SectionTitle title="Data Flow" subtitle="EHR → reasoning → DDI → lateral LLM → ensemble → safety gate → clinician" />
        <ol className="space-y-2">
          {FLOW.map((f, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-dark">
                {i + 1}
              </span>
              <span className="text-neutral-600">{f}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Roadmap */}
        <Card>
          <SectionTitle title="Roadmap MVP → Scale" />
          <div className="space-y-3">
            {ROADMAP.map(([phase, desc, tone]) => (
              <div key={phase} className="rounded-xl border border-neutral-100 p-3">
                <Badge tone={tone}>{phase}</Badge>
                <p className="mt-1.5 text-sm text-neutral-600">{desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Eval metrics */}
        <Card>
          <SectionTitle icon={<IconBook size={18} />} title="Evaluation Metrics" />
          <div className="space-y-2.5">
            {METRICS.map(([t, d]) => (
              <div key={t}>
                <div className="text-sm font-bold">{t}</div>
                <p className="text-xs text-neutral-500">{d}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Regulatory */}
      <Card>
        <SectionTitle icon={<IconShield size={18} />} title="Regulatory & Deployment Checklist" />
        <ul className="space-y-2">
          {REG.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-neutral-600">
              <IconCheck size={16} className="mt-0.5 shrink-0 text-brand" />
              {r}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-400">
          Privacy & training: federated learning for LLM adapter & DDI predictor updates; data stays
          local, combined with Differential Privacy & secure aggregation. Evaluated on a safety-focused
          test set before rollout, with versioning & rollback paths.
        </p>
      </Card>
    </div>
  )
}

function Legend({ tag, title, desc, color }: { tag: string; title: string; desc: string; color: string }) {
  return (
    <div className="rounded-xl border border-neutral-100 p-3">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: color }}>
          {tag}
        </span>
        <span className="text-sm font-bold">{title}</span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">{desc}</p>
    </div>
  )
}
