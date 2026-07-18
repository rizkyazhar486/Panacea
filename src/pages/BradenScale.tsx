import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Braden Scale — Bergstrom, N., Braden, B.J., et al. (1987), Nurs Res,
// 36(4):205-210. Pressure injury (pressure ulcer) risk assessment — the most
// widely used nursing tool for this worldwide. Six subscales scored 1-4
// (friction/shear 1-3); LOWER total = HIGHER risk. Total range 6-23.
// Pure dropdown scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Sub { key: string; label: string; options: { label: string; pts: number }[] }

const SUBSCALES: Sub[] = [
  {
    key: 'sensory', label: 'Sensory perception',
    options: [
      { label: 'Completely limited (unresponsive to painful stimuli)', pts: 1 },
      { label: 'Very limited (responds only to painful stimuli)', pts: 2 },
      { label: 'Slightly limited (responds to verbal commands, some deficit)', pts: 3 },
      { label: 'No impairment', pts: 4 },
    ],
  },
  {
    key: 'moisture', label: 'Moisture',
    options: [
      { label: 'Constantly moist', pts: 1 },
      { label: 'Very moist (linen changed ~once per shift)', pts: 2 },
      { label: 'Occasionally moist (~one extra linen change/day)', pts: 3 },
      { label: 'Rarely moist', pts: 4 },
    ],
  },
  {
    key: 'activity', label: 'Activity',
    options: [
      { label: 'Bedfast', pts: 1 },
      { label: 'Chairfast', pts: 2 },
      { label: 'Walks occasionally (short distances)', pts: 3 },
      { label: 'Walks frequently', pts: 4 },
    ],
  },
  {
    key: 'mobility', label: 'Mobility',
    options: [
      { label: 'Completely immobile', pts: 1 },
      { label: 'Very limited (occasional slight changes in position)', pts: 2 },
      { label: 'Slightly limited (frequent slight changes)', pts: 3 },
      { label: 'No limitation', pts: 4 },
    ],
  },
  {
    key: 'nutrition', label: 'Nutrition',
    options: [
      { label: 'Very poor (never eats a complete meal / NPO or clear liquids >5 days)', pts: 1 },
      { label: 'Probably inadequate (rarely eats a complete meal)', pts: 2 },
      { label: 'Adequate (eats over half of most meals, or on tube feeding/TPN meeting needs)', pts: 3 },
      { label: 'Excellent (eats most of every meal)', pts: 4 },
    ],
  },
  {
    key: 'friction', label: 'Friction & shear',
    options: [
      { label: 'Problem (requires moderate-maximum assistance moving; frequent sliding)', pts: 1 },
      { label: 'Potential problem (moves feebly or requires minimum assistance)', pts: 2 },
      { label: 'No apparent problem (moves independently, maintains position)', pts: 3 },
    ],
  },
]

function band(total: number): { label: string; tone: 'brand' | 'low' | 'critical'; rec: string } {
  if (total >= 19) return { label: 'Not at risk', tone: 'brand', rec: 'Routine skin care and reassessment per protocol.' }
  if (total >= 15) return { label: 'Mild risk', tone: 'brand', rec: 'Turning schedule, maximize mobility, protect heels, moisture management.' }
  if (total >= 13) return { label: 'Moderate risk', tone: 'low', rec: 'All mild-risk measures plus a pressure-redistribution support surface and positioning wedges.' }
  if (total >= 10) return { label: 'High risk', tone: 'critical', rec: 'Increase turning frequency, add small position shifts, pressure-redistribution surface, nutrition consult.' }
  return { label: 'Very high risk', tone: 'critical', rec: 'All high-risk measures; consider a specialty bed and address every modifiable subscale aggressively.' }
}

export function BradenScale() {
  const [vals, setVals] = useState<Record<string, number>>({ sensory: 4, moisture: 4, activity: 4, mobility: 4, nutrition: 4, friction: 3 })

  const total = SUBSCALES.reduce((s, sub) => s + (vals[sub.key] ?? 0), 0)
  const result = band(total)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Braden Scale" subtitle="Pressure injury risk assessment (Bergstrom & Braden 1987)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Six subscales, each scored 1-4 (friction/shear 1-3). A LOWER total means HIGHER risk —
          range 6-23, with ≤18 conventionally treated as "at risk" in adult inpatients.
        </p>
      </Card>

      <Card className="!p-5 space-y-3">
        {SUBSCALES.map((sub) => (
          <Field key={sub.key} label={sub.label}>
            <select className={inputClass} value={vals[sub.key]} onChange={(e) => setVals((v) => ({ ...v, [sub.key]: Number(e.target.value) }))}>
              {sub.options.map((o) => (
                <option key={o.pts} value={o.pts}>{o.label} ({o.pts})</option>
              ))}
            </select>
          </Field>
        ))}
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Total Braden Score</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{total} / 23</span>
          <Badge tone={result.tone}>{result.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">{result.rec}</p>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Bergstrom, N., Braden, B.J., et al. (1987). The Braden Scale for predicting pressure sore
        risk. <i>Nurs Res</i>, 36(4), 205-210. Decision-support estimate — reassess on admission,
        daily (or per shift in critical care), and with any change in condition.
      </div>
    </div>
  )
}

export default BradenScale
