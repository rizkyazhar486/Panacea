import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// Caprini Score (2005 version) — Caprini, J.A. (2005), Dis Mon, 51(2-3):70-78;
// validated in surgical cohorts by Bahl et al. (2010), Ann Surg 251:344-350.
// VTE risk assessment for SURGICAL patients (the medical-inpatient
// counterpart, the Padua score, is elsewhere in this app). Weighted
// checklist; ACCP/CHEST guidelines map the total to prophylaxis intensity.
// Pure checklist scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const GROUPS: { title: string; pts: number; items: { key: string; label: string }[] }[] = [
  {
    title: '1 point each',
    pts: 1,
    items: [
      { key: 'age41', label: 'Age 41-60 years' },
      { key: 'minorSurgery', label: 'Minor surgery planned' },
      { key: 'bmi25', label: 'BMI > 25' },
      { key: 'legSwelling', label: 'Swollen legs (current)' },
      { key: 'varicose', label: 'Varicose veins' },
      { key: 'pregnancy', label: 'Pregnancy or postpartum (<1 month)' },
      { key: 'ocp', label: 'Oral contraceptives or hormone replacement' },
      { key: 'sepsis', label: 'Sepsis (<1 month)' },
      { key: 'lungDisease', label: 'Serious lung disease incl. pneumonia (<1 month)' },
      { key: 'abnormalPft', label: 'Abnormal pulmonary function (COPD)' },
      { key: 'ami', label: 'Acute myocardial infarction' },
      { key: 'chf', label: 'Congestive heart failure (<1 month)' },
      { key: 'ibd', label: 'History of inflammatory bowel disease' },
      { key: 'bedRest', label: 'Medical patient currently at bed rest' },
      { key: 'miscarriage', label: 'History of unexplained stillbirth / recurrent miscarriage' },
    ],
  },
  {
    title: '2 points each',
    pts: 2,
    items: [
      { key: 'age61', label: 'Age 61-74 years' },
      { key: 'arthroscopy', label: 'Arthroscopic surgery' },
      { key: 'majorSurgery', label: 'Major open surgery (>45 minutes)' },
      { key: 'laparoscopy', label: 'Laparoscopic surgery (>45 minutes)' },
      { key: 'malignancy', label: 'Malignancy (present or previous)' },
      { key: 'bedRest72', label: 'Confined to bed (>72 hours)' },
      { key: 'cast', label: 'Immobilizing plaster cast (<1 month)' },
      { key: 'centralLine', label: 'Central venous access' },
    ],
  },
  {
    title: '3 points each',
    pts: 3,
    items: [
      { key: 'age75', label: 'Age ≥ 75 years' },
      { key: 'priorVte', label: 'History of DVT/PE' },
      { key: 'familyVte', label: 'Family history of VTE' },
      { key: 'factorV', label: 'Factor V Leiden' },
      { key: 'prothrombin', label: 'Prothrombin 20210A mutation' },
      { key: 'lupusAc', label: 'Lupus anticoagulant' },
      { key: 'anticardiolipin', label: 'Anticardiolipin antibodies' },
      { key: 'homocysteine', label: 'Elevated serum homocysteine' },
      { key: 'hit', label: 'Heparin-induced thrombocytopenia' },
      { key: 'otherThrombophilia', label: 'Other congenital/acquired thrombophilia' },
    ],
  },
  {
    title: '5 points each',
    pts: 5,
    items: [
      { key: 'stroke', label: 'Stroke (<1 month)' },
      { key: 'arthroplasty', label: 'Elective major lower-extremity arthroplasty' },
      { key: 'fracture', label: 'Hip, pelvis, or leg fracture (<1 month)' },
      { key: 'sci', label: 'Acute spinal cord injury / paralysis (<1 month)' },
      { key: 'trauma', label: 'Multiple trauma (<1 month)' },
    ],
  },
]

function band(score: number): { label: string; tone: 'brand' | 'low' | 'critical'; rec: string } {
  if (score === 0) return { label: 'Lowest risk', tone: 'brand', rec: 'Early ambulation only.' }
  if (score <= 2) return { label: 'Low risk', tone: 'brand', rec: 'Mechanical prophylaxis (intermittent pneumatic compression) is usually sufficient.' }
  if (score <= 4) return { label: 'Moderate risk', tone: 'low', rec: 'Pharmacologic (LMWH/heparin) OR mechanical prophylaxis, per bleeding risk.' }
  return { label: 'High risk', tone: 'critical', rec: 'Pharmacologic prophylaxis (plus mechanical), and consider extended-duration prophylaxis after major cancer/abdominopelvic surgery.' }
}

export function CapriniScore() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }))

  const score = GROUPS.reduce((s, g) => s + g.items.filter((it) => checked[it.key]).length * g.pts, 0)
  const result = band(score)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Caprini Score" subtitle="Surgical VTE risk assessment (Caprini 2005; validated Bahl 2010)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          VTE risk stratification for surgical patients, mapped to prophylaxis intensity per
          ACCP/CHEST guidance. For hospitalized medical (non-surgical) patients, use the Padua score
          instead. Check only the age band that applies.
        </p>
      </Card>

      {GROUPS.map((g) => (
        <Card key={g.title} className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{g.title}</div>
          <div className="mt-3 space-y-2">
            {g.items.map((c) => (
              <label key={c.key} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
                <input type="checkbox" className="h-4 w-4 rounded" checked={!!checked[c.key]} onChange={() => toggle(c.key)} />
                <span className="flex-1">{c.label}</span>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500 dark:bg-white/10">+{g.pts}</span>
              </label>
            ))}
          </div>
        </Card>
      ))}

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Total Caprini Score</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{score}</span>
          <Badge tone={result.tone}>{result.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-400">{result.rec}</p>
        <CopyNote text={`Caprini ${score} — ${result.label.toLowerCase()}: ${result.rec} [Caprini 2005]`} />
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Caprini, J.A. (2005). Thrombosis risk assessment as a guide to quality patient care.
        <i> Dis Mon</i>, 51(2-3), 70-78; validation: Bahl, V., et al. (2010), <i>Ann Surg</i>, 251(2),
        344-350. Decision-support estimate — always weigh individual bleeding risk before
        pharmacologic prophylaxis.
      </div>
    </div>
  )
}

export default CapriniScore
