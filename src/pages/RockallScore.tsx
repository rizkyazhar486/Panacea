import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Rockall Score — Rockall, T.A., et al. (1996), Gut, 38(3):316-321. Mortality
// risk after upper GI bleeding. The full (complete) score adds two
// post-endoscopy criteria to the three clinical ones, so it complements the
// pre-endoscopy Glasgow-Blatchford Score elsewhere in this app: Blatchford
// answers "who needs admission/intervention?", Rockall answers "how likely
// is rebleeding/death after endoscopy?". Pure dropdown scoring, no API.
// ─────────────────────────────────────────────────────────────────────────────

type Pts = 0 | 1 | 2 | 3

const AGE_OPTS: { label: string; pts: Pts }[] = [
  { label: '< 60 years', pts: 0 },
  { label: '60-79 years', pts: 1 },
  { label: '≥ 80 years', pts: 2 },
]
const SHOCK_OPTS: { label: string; pts: Pts }[] = [
  { label: 'No shock (SBP ≥100, HR <100)', pts: 0 },
  { label: 'Tachycardia (SBP ≥100, HR ≥100)', pts: 1 },
  { label: 'Hypotension (SBP <100)', pts: 2 },
]
const COMORBID_OPTS: { label: string; pts: Pts }[] = [
  { label: 'No major comorbidity', pts: 0 },
  { label: 'Heart failure, ischemic heart disease, or other major comorbidity', pts: 2 },
  { label: 'Renal failure, liver failure, or disseminated malignancy', pts: 3 },
]
const DIAGNOSIS_OPTS: { label: string; pts: Pts }[] = [
  { label: 'Mallory-Weiss tear, or no lesion + no stigmata of recent hemorrhage', pts: 0 },
  { label: 'All other diagnoses (e.g. peptic ulcer, esophagitis)', pts: 1 },
  { label: 'Malignancy of the upper GI tract', pts: 2 },
]
const STIGMATA_OPTS: { label: string; pts: Pts }[] = [
  { label: 'None, or dark spot only', pts: 0 },
  { label: 'Blood in upper GI tract, adherent clot, or visible/spurting vessel', pts: 2 },
]

function riskBand(score: number): { label: string; tone: 'brand' | 'low' | 'critical'; note: string } {
  if (score <= 2) return { label: 'Low risk', tone: 'brand', note: 'Rebleeding ~5%, mortality <1% — early discharge often appropriate.' }
  if (score <= 4) return { label: 'Intermediate risk', tone: 'low', note: 'Rebleeding ~11-14%, mortality ~5-11% — inpatient observation warranted.' }
  return { label: 'High risk', tone: 'critical', note: 'Rebleeding ~25%+, mortality ~17-40% — intensive monitoring, low threshold for repeat endoscopy.' }
}

function Picker({ label, options, value, onChange }: { label: string; options: { label: string; pts: Pts }[]; value: Pts; onChange: (v: Pts) => void }) {
  return (
    <Field label={label}>
      <select className={inputClass} value={value} onChange={(e) => onChange(Number(e.target.value) as Pts)}>
        {options.map((o) => (
          <option key={o.label} value={o.pts}>{o.label} ({o.pts} pt)</option>
        ))}
      </select>
    </Field>
  )
}

export function RockallScore() {
  const [age, setAge] = useState<Pts>(0)
  const [shock, setShock] = useState<Pts>(0)
  const [comorbid, setComorbid] = useState<Pts>(0)
  const [postEndoscopy, setPostEndoscopy] = useState(true)
  const [diagnosis, setDiagnosis] = useState<Pts>(1)
  const [stigmata, setStigmata] = useState<Pts>(0)

  const preScore = age + shock + comorbid
  const fullScore = preScore + (postEndoscopy ? diagnosis + stigmata : 0)
  const band = riskBand(postEndoscopy ? fullScore : preScore)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Rockall Score" subtitle="Mortality risk after upper GI bleeding (Rockall et al. 1996)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Complements the pre-endoscopy Glasgow-Blatchford Score: Blatchford answers "who needs
          admission/intervention?", Rockall answers "how likely is rebleeding or death?" — fully
          scored after endoscopy adds the diagnosis and stigmata criteria.
        </p>
      </Card>

      <Card className="!p-5 space-y-3">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Clinical (pre-endoscopy) criteria</div>
        <Picker label="Age" options={AGE_OPTS} value={age} onChange={setAge} />
        <Picker label="Shock" options={SHOCK_OPTS} value={shock} onChange={setShock} />
        <Picker label="Comorbidity" options={COMORBID_OPTS} value={comorbid} onChange={setComorbid} />
      </Card>

      <Card className="!p-5 space-y-3">
        <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={postEndoscopy} onChange={(e) => setPostEndoscopy(e.target.checked)} className="h-4 w-4 rounded" />
          Endoscopy performed (enables the full score)
        </label>
        {postEndoscopy && (
          <>
            <Picker label="Endoscopic diagnosis" options={DIAGNOSIS_OPTS} value={diagnosis} onChange={setDiagnosis} />
            <Picker label="Stigmata of recent hemorrhage" options={STIGMATA_OPTS} value={stigmata} onChange={setStigmata} />
          </>
        )}
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">
          {postEndoscopy ? 'Complete Rockall Score' : 'Clinical (pre-endoscopy) Rockall Score'}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{postEndoscopy ? fullScore : preScore} / {postEndoscopy ? 11 : 7}</span>
          <Badge tone={band.tone}>{band.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">{band.note}</p>
        {postEndoscopy && <p className="mt-2 text-[11px] text-neutral-400">Clinical component alone: {preScore} / 7.</p>}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Rockall, T.A., et al. (1996). Risk assessment after acute upper gastrointestinal haemorrhage.
        <i> Gut</i>, 38(3), 316-321. Decision-support estimate — risk bands from the original cohort;
        follow local UGIB protocols for disposition decisions.
      </div>
    </div>
  )
}

export default RockallScore
