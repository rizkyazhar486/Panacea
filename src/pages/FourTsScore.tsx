import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// 4Ts Score — Lo, G.K., et al. (2006), J Thromb Haemost, 4(4):759-765
// (Warkentin's original 4Ts concept). Pretest probability of heparin-induced
// thrombocytopenia (HIT) before confirmatory lab testing (HIT antibody /
// serotonin release assay). 4 categories, 0-2 points each. Pure checklist
// scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Pts = 0 | 1 | 2

const THROMBOCYTOPENIA: { label: string; pts: Pts }[] = [
  { label: '>50% platelet fall, and nadir ≥ 20 ×10³/µL', pts: 2 },
  { label: '30-50% fall, or nadir 10-19 ×10³/µL', pts: 1 },
  { label: '<30% fall, or nadir < 10 ×10³/µL', pts: 0 },
]
const TIMING: { label: string; pts: Pts }[] = [
  { label: 'Clear onset day 5-10, or fall ≤1 day with heparin exposure in past 30 days', pts: 2 },
  { label: 'Consistent but unclear (e.g. onset after day 10), or fall ≤1 day with exposure 30-100 days ago', pts: 1 },
  { label: 'Platelet fall <4 days without recent heparin exposure', pts: 0 },
]
const THROMBOSIS: { label: string; pts: Pts }[] = [
  { label: 'New thrombosis, skin necrosis, or acute systemic reaction after IV heparin bolus', pts: 2 },
  { label: 'Progressive/recurrent thrombosis, erythematous skin lesions, or suspected (unproven) thrombosis', pts: 1 },
  { label: 'None', pts: 0 },
]
const OTHER_CAUSES: { label: string; pts: Pts }[] = [
  { label: 'No other apparent cause for the platelet fall', pts: 2 },
  { label: 'Other possible cause present', pts: 1 },
  { label: 'Other definite cause present', pts: 0 },
]

function pretest(score: number): { label: string; tone: 'brand' | 'low' | 'critical'; prob: string } {
  if (score <= 3) return { label: 'Low probability', tone: 'brand', prob: '~<5% probability of HIT' }
  if (score <= 5) return { label: 'Intermediate probability', tone: 'low', prob: '~14% probability of HIT' }
  return { label: 'High probability', tone: 'critical', prob: '~64% probability of HIT' }
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

export function FourTsScore() {
  const [thrombo, setThrombo] = useState<Pts>(0)
  const [timing, setTiming] = useState<Pts>(0)
  const [thrombosis, setThrombosis] = useState<Pts>(0)
  const [otherCause, setOtherCause] = useState<Pts>(2)

  const score = thrombo + timing + thrombosis + otherCause
  const result = pretest(score)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="4Ts Score" subtitle="Heparin-induced thrombocytopenia pretest probability (Lo et al. 2006)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Estimates pretest probability of HIT before confirmatory lab testing (HIT antibody ELISA or
          serotonin release assay). A low score has a high negative predictive value — HIT is
          effectively excluded without needing further testing.
        </p>
      </Card>

      <Card className="!p-5 space-y-3">
        <Picker label="Thrombocytopenia" options={THROMBOCYTOPENIA} value={thrombo} onChange={setThrombo} />
        <Picker label="Timing of platelet fall" options={TIMING} value={timing} onChange={setTiming} />
        <Picker label="Thrombosis or other sequelae" options={THROMBOSIS} value={thrombosis} onChange={setThrombosis} />
        <Picker label="oTher causes for thrombocytopenia" options={OTHER_CAUSES} value={otherCause} onChange={setOtherCause} />
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Score</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{score} / 8</span>
          <Badge tone={result.tone}>{result.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">
          {result.prob}. {score <= 3
            ? 'A low score has a high negative predictive value — further HIT-specific testing is usually unnecessary.'
            : 'Consider stopping all heparin products and sending confirmatory HIT antibody testing while awaiting results.'}
        </p>
        <CopyNote text={`4Ts ${score}/8 — ${result.label.toLowerCase()} of HIT (${result.prob}) [Lo 2006]`} />
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Lo, G.K., et al. (2006). Evaluation of pretest clinical score for HIT in two clinical settings.
        <i> J Thromb Haemost</i>, 4(4), 759-765. Decision-support estimate — clinical judgment and
        confirmatory testing remain essential for a definitive HIT diagnosis.
      </div>
    </div>
  )
}

export default FourTsScore
