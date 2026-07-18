import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// PERC Rule (Pulmonary Embolism Rule-out Criteria) — Kline, J.A., et al.
// (2004), J Thromb Haemost, 2(8):1247-1255. Applies ONLY to patients a
// clinician has already judged low pretest probability for PE (gestalt
// <15%). If all 8 criteria are negative, the risk of missing a PE is low
// enough that no further testing (D-dimer, imaging) is needed. It is NOT a
// substitute for clinical gestalt and must not be applied to
// moderate/high-risk patients. Pure checklist scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const ITEMS = [
  { key: 'age', label: 'Age ≥ 50 years' },
  { key: 'hr', label: 'Heart rate ≥ 100 bpm' },
  { key: 'spo2', label: 'SpO₂ < 95% on room air' },
  { key: 'legSwelling', label: 'Unilateral leg swelling' },
  { key: 'hemoptysis', label: 'Hemoptysis' },
  { key: 'surgery', label: 'Recent surgery or trauma requiring hospitalization within the past 4 weeks' },
  { key: 'priorVte', label: 'Prior PE or DVT' },
  { key: 'hormones', label: 'Hormone use (oral contraceptives, HRT, or estrogen)' },
] as const

export function PercRule() {
  const [lowGestalt, setLowGestalt] = useState(true)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }))

  const positiveCount = Object.values(checked).filter(Boolean).length
  const percNegative = positiveCount === 0

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="PERC Rule" subtitle="Pulmonary Embolism Rule-out Criteria (Kline et al. 2004)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Applies only when a clinician has already judged the patient low pretest probability for PE
          (gestalt {'<'}15%). If all 8 criteria are negative in that context, further testing (D-dimer,
          CT-PA) can reasonably be omitted. It is not valid in moderate- or high-risk patients.
        </p>
        <label className="mt-3 flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
          <input type="checkbox" className="h-4 w-4 rounded" checked={lowGestalt} onChange={(e) => setLowGestalt(e.target.checked)} />
          Clinical gestalt for this patient is low pretest probability ({'<'}15%)
        </label>
      </Card>

      {!lowGestalt && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          PERC is only validated for low-pretest-probability patients — for moderate/high risk, use a
          formal score (e.g. Wells Score) plus D-dimer or imaging instead.
        </div>
      )}

      <Card className="!p-5">
        <div className="space-y-2">
          {ITEMS.map((c) => (
            <label key={c.key} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
              <input type="checkbox" className="h-4 w-4 rounded" checked={!!checked[c.key]} onChange={() => toggle(c.key)} />
              {c.label}
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Result</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-2xl font-black text-brand-dark">{positiveCount} / 8 positive</span>
          <Badge tone={percNegative && lowGestalt ? 'brand' : 'critical'}>
            {percNegative && lowGestalt ? 'PERC-negative' : percNegative ? 'PERC-negative, but gestalt not low-risk' : 'PERC-positive'}
          </Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">
          {percNegative && lowGestalt
            ? 'All criteria negative in a low-pretest-probability patient — PE can reasonably be excluded without further testing (false-negative rate <2%).'
            : percNegative
            ? 'All 8 criteria negative, but the rule only applies to patients already judged low-risk by gestalt — proceed with D-dimer/imaging per standard workup.'
            : 'One or more criteria positive — PERC cannot rule out PE; proceed with D-dimer and/or imaging per standard workup.'}
        </p>
        <CopyNote text={`PERC ${positiveCount}/8 positive${lowGestalt ? ', low pretest gestalt' : ', gestalt NOT low-risk'} — ${percNegative && lowGestalt ? 'PERC-negative: PE reasonably excluded without further testing' : 'PERC does not exclude PE: proceed with D-dimer/imaging'} [Kline 2004]`} />
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Kline, J.A., et al. (2004). Clinical criteria to prevent unnecessary diagnostic testing in
        emergency department patients with suspected pulmonary embolism. <i>J Thromb Haemost</i>,
        2(8), 1247-1255. Decision-support estimate — always applied in conjunction with clinical judgment.
      </div>
    </div>
  )
}

export default PercRule
