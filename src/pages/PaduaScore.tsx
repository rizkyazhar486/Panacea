import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// Padua Prediction Score — Barbar, S., et al. (2010), J Thromb Haemost,
// 8(11):2450-2457. VTE risk in hospitalized MEDICAL (non-surgical) patients:
// score ≥4 identifies high-risk patients for whom pharmacologic
// thromboprophylaxis is recommended (alongside a bleeding-risk assessment,
// e.g. IMPROVE). Endorsed in ACCP/CHEST guidelines. Pure checklist scoring,
// no external API.
// ─────────────────────────────────────────────────────────────────────────────

const ITEMS = [
  { key: 'cancer', label: 'Active cancer (local/distant metastases and/or chemo or radiotherapy in past 6 months)', pts: 3 },
  { key: 'priorVte', label: 'Previous VTE (excluding superficial vein thrombosis)', pts: 3 },
  { key: 'mobility', label: 'Reduced mobility (bedrest with bathroom privileges ≥3 days, anticipated)', pts: 3 },
  { key: 'thrombophilia', label: 'Known thrombophilic condition (e.g. antiphospholipid syndrome, factor V Leiden)', pts: 3 },
  { key: 'trauma', label: 'Recent (≤1 month) trauma and/or surgery', pts: 2 },
  { key: 'age', label: 'Age ≥ 70 years', pts: 1 },
  { key: 'heartResp', label: 'Heart and/or respiratory failure', pts: 1 },
  { key: 'miStroke', label: 'Acute MI or ischemic stroke', pts: 1 },
  { key: 'infection', label: 'Acute infection and/or rheumatologic disorder', pts: 1 },
  { key: 'obesity', label: 'Obesity (BMI ≥ 30)', pts: 1 },
  { key: 'hormonal', label: 'Ongoing hormonal treatment', pts: 1 },
] as const

export function PaduaScore() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }))

  const score = ITEMS.reduce((s, it) => s + (checked[it.key] ? it.pts : 0), 0)
  const high = score >= 4

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Padua Prediction Score" subtitle="VTE risk in hospitalized medical patients (Barbar et al. 2010)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Identifies which hospitalized medical (non-surgical) patients warrant pharmacologic VTE
          prophylaxis. Score ≥4 = high risk. Always pair with a bleeding-risk assessment before
          prescribing anticoagulant prophylaxis.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="space-y-2">
          {ITEMS.map((c) => (
            <label key={c.key} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
              <input type="checkbox" className="h-4 w-4 rounded" checked={!!checked[c.key]} onChange={() => toggle(c.key)} />
              <span className="flex-1">{c.label}</span>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500 dark:bg-white/10">+{c.pts}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Score</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{score} / 20</span>
          <Badge tone={high ? 'critical' : 'brand'}>{high ? 'High risk (≥4)' : 'Low risk (<4)'}</Badge>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-400">
          {high
            ? 'Pharmacologic thromboprophylaxis (e.g. LMWH) is recommended if bleeding risk permits — in the original cohort, ~11% of unprophylaxed high-risk patients developed VTE within 90 days vs 0.3% of low-risk.'
            : 'Routine pharmacologic prophylaxis is not indicated at this score — encourage early mobilization and reassess if the clinical picture changes.'}
        </p>
        <CopyNote text={`Padua ${score}/20 — ${high ? 'high VTE risk (>=4): pharmacologic prophylaxis recommended if bleeding risk permits' : 'low VTE risk (<4): routine prophylaxis not indicated'} [Barbar 2010]`} />
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Barbar, S., et al. (2010). A risk assessment model for the identification of hospitalized
        medical patients at risk for VTE: the Padua Prediction Score. <i>J Thromb Haemost</i>, 8(11),
        2450-2457. Decision-support estimate — for surgical patients use the Caprini score instead,
        and always weigh bleeding risk before prescribing prophylaxis.
      </div>
    </div>
  )
}

export default PaduaScore
