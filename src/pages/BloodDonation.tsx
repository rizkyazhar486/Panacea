import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconDrop } from '../components/icons'
import { getDemo } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// Blood Donation Eligibility Checker — a quick pre-screen against the
// generic criteria used by most national blood services (WHO guidance /
// Indonesian Red Cross-PMI and similar), plus a next-eligible-date
// calculator from your last donation. This is a pre-screen, not a
// substitute for the actual health screening and hemoglobin check every
// blood bank performs on-site before every donation.
// Pure client-side logic + localStorage, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'pmd_blood_donation_v1'
const INTERVAL_WEEKS = 12 // typical minimum interval between whole-blood donations

interface Saved { lastDonation: string; weightKg: number; age: number }
function load(): Partial<Saved> {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw) } catch { /* ignore */ }
  return {}
}
function persist(s: Partial<Saved>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

export function BloodDonation() {
  const saved = load()
  const [age, setAge] = useState(() => saved.age ?? getDemo().age ?? 30)
  const [weightKg, setWeightKg] = useState(() => saved.weightKg ?? getDemo().weightKg ?? 60)
  const [lastDonation, setLastDonation] = useState(saved.lastDonation || '')
  const [pregnant, setPregnant] = useState(false)
  const [recentIllness, setRecentIllness] = useState(false)
  const [recentTattoo, setRecentTattoo] = useState(false)
  const [chronicCondition, setChronicCondition] = useState(false)

  const update = (patch: Partial<Saved>) => {
    const next = { age, weightKg, lastDonation, ...patch }
    persist(next)
  }

  const nextEligible = useMemo(() => {
    if (!lastDonation) return null
    const d = new Date(lastDonation)
    d.setDate(d.getDate() + INTERVAL_WEEKS * 7)
    return d
  }, [lastDonation])

  const daysUntilEligible = nextEligible ? Math.ceil((nextEligible.getTime() - Date.now()) / 86400000) : 0
  const intervalOk = !nextEligible || daysUntilEligible <= 0

  const blockers: string[] = []
  if (age < 17) blockers.push('Below the typical minimum donation age (17).')
  if (age > 65) blockers.push('Above the typical routine maximum age (65) — some blood banks still accept regular repeat donors older than this with a doctor\'s clearance.')
  if (weightKg < 50) blockers.push('Below the typical minimum weight (50 kg).')
  if (!intervalOk) blockers.push(`Too soon since your last donation — typically ${INTERVAL_WEEKS} weeks are required between whole-blood donations.`)
  if (pregnant) blockers.push('Currently pregnant or recently gave birth — donation is deferred during and for some months after pregnancy.')
  if (recentIllness) blockers.push('Currently feeling unwell, feverish, or on antibiotics — wait until fully recovered.')
  if (recentTattoo) blockers.push('Recent tattoo, piercing, or acupuncture (commonly a 3-6 month deferral, depending on local rules and whether it was done at a licensed/sterile facility).')
  if (chronicCondition) blockers.push('An uncontrolled chronic condition or one your clinician hasn\'t cleared you for — check with them first.')

  const likelyEligible = blockers.length === 0

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconDrop size={20} />} title="Blood Donation Eligibility" subtitle="A quick pre-screen, plus your next-eligible date" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          This checks the generic criteria most national blood services use — it is <b>not</b> the
          actual screening (hemoglobin check, brief health interview) every blood bank performs on-site
          before every donation. Always confirm with your local blood service; rules vary by country.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <input className={inputClass} type="number" min={0} max={120} value={age} onChange={(e) => { const v = Number(e.target.value) || 0; setAge(v); update({ age: v }) }} />
          </Field>
          <Field label="Weight (kg)">
            <input className={inputClass} type="number" min={0} max={250} value={weightKg} onChange={(e) => { const v = Number(e.target.value) || 0; setWeightKg(v); update({ weightKg: v }) }} />
          </Field>
        </div>
        <Field label="Date of your last whole-blood donation (leave blank if never / doesn't apply)">
          <input className={`${inputClass} mt-1`} type="date" value={lastDonation} onChange={(e) => { setLastDonation(e.target.value); update({ lastDonation: e.target.value }) }} max={new Date().toISOString().slice(0, 10)} />
        </Field>
        <div className="mt-3 space-y-2">
          {[
            ['Currently pregnant or gave birth in the last few months', pregnant, setPregnant],
            ['Feeling unwell, feverish, or on antibiotics right now', recentIllness, setRecentIllness],
            ['Recent tattoo, piercing, or acupuncture', recentTattoo, setRecentTattoo],
            ['An uncontrolled chronic condition not yet cleared by a clinician', chronicCondition, setChronicCondition],
          ].map(([label, val, setter]) => (
            <label key={label as string} className="flex items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-300">
              <input type="checkbox" checked={val as boolean} onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)} className="h-4 w-4 accent-brand" />
              {label as string}
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Result</div>
        <div className="mt-2 flex items-center gap-3">
          <Badge tone={likelyEligible ? 'brand' : 'critical'}>{likelyEligible ? 'Likely eligible' : 'Likely not eligible right now'}</Badge>
        </div>
        {blockers.length > 0 && (
          <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            {blockers.map((b) => <li key={b}>{b}</li>)}
          </ul>
        )}
        {nextEligible && !intervalOk && (
          <p className="mt-2 text-[12px] font-semibold text-neutral-500">
            Next eligible by interval: {nextEligible.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} (~{daysUntilEligible} days)
          </p>
        )}
        {likelyEligible && (
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
            You'll still go through the on-site health check and hemoglobin test — this just means
            nothing here rules you out in advance.
          </p>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Based on generic WHO/Red Cross-style donation criteria — specific age limits, weight
        thresholds, and deferral periods vary by country and blood service. Not medical advice; the
        blood bank's own screening always takes precedence.
      </div>
    </div>
  )
}

export default BloodDonation
