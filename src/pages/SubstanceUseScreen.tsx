import { useState } from 'react'
import { Card, SectionTitle, Badge, Field, inputClass } from '../components/ui'
import { IconShield } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Alcohol & Tobacco Use Screening — two short, validated clinical instruments:
//   1. CAGE Questionnaire (Ewing, JAMA 1984) — 4-item alcohol use screen,
//      score >=2 is the standard cutoff suggesting further assessment.
//   2. Pack-Year Calculator — packs/day x years smoked, the standard unit for
//      lung cancer screening eligibility (USPSTF 2021: age 50-80, >=20
//      pack-years, current smoker or quit within 15 years -> annual low-dose
//      CT recommended).
// Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const CAGE_ITEMS = [
  'Have you ever felt you should Cut down on your drinking?',
  'Have people Annoyed you by criticizing your drinking?',
  'Have you ever felt Guilty about your drinking?',
  'Have you ever had a drink first thing in the morning (an "Eye-opener") to steady your nerves or get rid of a hangover?',
]

export function SubstanceUseScreen() {
  const [cage, setCage] = useState<boolean[]>(Array(4).fill(false))
  const cageScore = cage.filter(Boolean).length

  const [cigsPerDay, setCigsPerDay] = useState(0)
  const [yearsSmoked, setYearsSmoked] = useState(0)
  const [quitYearsAgo, setQuitYearsAgo] = useState(0)
  const [age, setAge] = useState(0)
  const packYears = (cigsPerDay / 20) * yearsSmoked
  const currentOrRecentQuitter = quitYearsAgo <= 15
  const screeningEligible = packYears >= 20 && age >= 50 && age <= 80 && currentOrRecentQuitter && cigsPerDay > 0

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="Alcohol & Tobacco Use Screening" subtitle="CAGE questionnaire + pack-year / lung-screening eligibility" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Two short, validated screens used routinely in primary care. Answer honestly — these tools
          exist to catch risk early, not to judge.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">CAGE Questionnaire (alcohol)</div>
        <div className="mt-3 space-y-2">
          {CAGE_ITEMS.map((text, i) => (
            <label key={i} className="flex items-start gap-3 rounded-xl border border-neutral-200 px-3.5 py-2.5 dark:border-white/10">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand" checked={cage[i]} onChange={(e) => setCage((c) => c.map((v, j) => (j === i ? e.target.checked : v)))} />
              <span className="text-sm text-neutral-700 dark:text-neutral-200">{text}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl font-black text-brand-dark">{cageScore}/4</span>
          <Badge tone={cageScore >= 2 ? 'critical' : 'brand'}>{cageScore >= 2 ? 'Score ≥2 — further assessment suggested' : 'Below screening cutoff'}</Badge>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Pack-Year Calculator (tobacco)</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Cigarettes per day (when smoking)">
            <input className={inputClass} type="number" min={0} value={cigsPerDay || ''} onChange={(e) => setCigsPerDay(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Years smoked">
            <input className={inputClass} type="number" min={0} value={yearsSmoked || ''} onChange={(e) => setYearsSmoked(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Current age">
            <input className={inputClass} type="number" min={0} value={age || ''} onChange={(e) => setAge(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Years since quitting (0 if still smoking)">
            <input className={inputClass} type="number" min={0} value={quitYearsAgo || ''} onChange={(e) => setQuitYearsAgo(Number(e.target.value) || 0)} />
          </Field>
        </div>
        {cigsPerDay > 0 && yearsSmoked > 0 && (
          <div className="mt-4 rounded-xl bg-neutral-50 p-4 dark:bg-white/5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-brand-dark">{packYears.toFixed(1)}</span>
              <span className="text-sm font-semibold text-neutral-500">pack-years</span>
            </div>
            {screeningEligible ? (
              <p className="mt-2 text-[13px] leading-relaxed text-rose-600 dark:text-rose-300">
                Meets USPSTF 2021 criteria for annual low-dose CT lung cancer screening (age 50-80,
                ≥20 pack-years, currently smoking or quit within 15 years) — worth discussing with a
                clinician if not already screening.
              </p>
            ) : (
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
                {packYears >= 20 ? 'Meets the pack-year threshold, but age or quit-date criteria are not yet met for USPSTF screening eligibility.' : 'Below the ≥20 pack-year threshold used for lung cancer screening eligibility — quitting still meaningfully reduces risk at any pack-year total.'}
              </p>
            )}
          </div>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Ewing, J.A. (1984). Detecting alcoholism: the CAGE questionnaire. <i>JAMA</i>, 252(14), 1905-1907.
        US Preventive Services Task Force (2021). Lung cancer screening recommendation. Screening tools
        only — not a diagnosis; discuss results with a clinician.
      </div>
    </div>
  )
}

export default SubstanceUseScreen
