import { useState } from 'react'
import { hariIni } from '../../lib/tanggal'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../components/ui'
import { IconDrop } from '../../components/icons'
import { getDemoTersimpan } from '../../lib/profile'
import { bloodDonationScreen, parseNumberField } from '../../domains/clinical-calculators'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'

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
  // Profil TERSIMPAN, bukan getDemo(): getDemo() memadukan usia 30 / 60-70 kg bawaan sehingga halaman terbuka dengan "Likely
  // eligible" untuk orang yang belum mengisi apa pun. Teks mentah: kolom kosong = belum diisi, bukan usia 0.
  const profil = getDemoTersimpan()
  const awal = (n: number | undefined) => (typeof n === 'number' && n > 0 ? String(n) : '')
  const [ageText, setAgeText] = useState(() => awal(saved.age ?? profil.age))
  const [weightText, setWeightText] = useState(() => awal(saved.weightKg ?? profil.weightKg))
  const [lastDonation, setLastDonation] = useState(saved.lastDonation || '')
  const [pregnant, setPregnant] = useState(false)
  const [recentIllness, setRecentIllness] = useState(false)
  const [recentTattoo, setRecentTattoo] = useState(false)
  const [chronicCondition, setChronicCondition] = useState(false)

  const update = (patch: { age?: string; weightKg?: string; lastDonation?: string }) => {
    const num = (t: string) => { const n = parseNumberField(t); return Number.isFinite(n) ? n : undefined }
    persist({
      age: num(patch.age ?? ageText), weightKg: num(patch.weightKg ?? weightText),
      lastDonation: patch.lastDonation ?? lastDonation,
    })
  }

  const hasil = bloodDonationScreen({
    age: parseNumberField(ageText), weightKg: parseNumberField(weightText), lastDonation,
    now: new Date().toISOString(), pregnant, recentIllness, recentTattoo, chronicCondition,
  })
  const blockers = hasil.blockers
  const likelyEligible = hasil.likelyEligible === true
  const daysUntilEligible = hasil.daysUntilEligible ?? 0
  const nextEligible = hasil.nextEligibleDate ? new Date(`${hasil.nextEligibleDate}T00:00:00Z`) : null
  const intervalOk = daysUntilEligible <= 0

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconDrop size={20} />} title="Blood Donation Eligibility" subtitle="A short pre-screen, plus the date you can donate again" />
        <BatasKlaimKesehatan permukaan="wellness.blood-donation" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          This checks the generic criteria most national blood services use — it is <b>not</b> the
          actual screening (hemoglobin check, brief health interview) every blood bank performs on-site
          before every donation. Always confirm with your local blood service; rules vary by country.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <input className={inputClass} type="number" min={0} max={120} value={ageText} onChange={(e) => { setAgeText(e.target.value); update({ age: e.target.value }) }} />
          </Field>
          <Field label="Weight (kg)">
            <input className={inputClass} type="number" min={0} max={250} value={weightText} onChange={(e) => { setWeightText(e.target.value); update({ weightKg: e.target.value }) }} />
          </Field>
        </div>
        <Field label="Date of your last whole-blood donation (leave blank if never / not applicable)">
          <input className={`${inputClass} mt-1`} type="date" value={lastDonation} onChange={(e) => { setLastDonation(e.target.value); update({ lastDonation: e.target.value }) }} max={hariIni()} />
        </Field>
        {hasil.invalid.length > 0 && (
          <p role="alert" className="mt-3 text-[12.5px] font-semibold text-red-600">{hasil.invalid.join('; ')}.</p>
        )}
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
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Result</div>
        <div className="mt-2 flex items-center gap-3">
          {hasil.likelyEligible === null ? (
          <p className="text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">No result yet. {hasil.missing.length > 0 ? `Still needed: ${hasil.missing.join(', ')}.` : 'Check the highlighted values above.'} An empty field is not a value.</p>
        ) : (
          <Badge tone={likelyEligible ? 'brand' : 'critical'}>{likelyEligible ? 'Likely eligible' : 'Likely not eligible right now'}</Badge>
        )}
        </div>
        {blockers.length > 0 && (
          <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            {blockers.map((b) => <li key={b}>{b}</li>)}
          </ul>
        )}
        {nextEligible && !intervalOk && (
          <p className="mt-2 text-[12px] font-semibold text-neutral-500">
            Next eligible by interval: {nextEligible.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })} (~{daysUntilEligible} days)
          </p>
        )}
        {hasil.likelyEligible === true && (
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
            You'll still go through the on-site health check and hemoglobin test — this just means
            nothing here rules you out in advance.
          </p>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Based on generic WHO/Red Cross-style donation criteria — specific age limits, weight
        thresholds, and deferral periods vary by country and blood service. Not medical advice; the
        blood bank's own screening always takes precedence.
      </div>
    </div>
  )
}

export default BloodDonation
