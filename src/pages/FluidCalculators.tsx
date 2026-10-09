import { useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { CopyNote } from '../components/CopyNote'
import { BatasKlaimSkorTerbit } from '../components/BatasKlaimSkorTerbit'
import { maintenanceFluid, resuscitation, correctedSodium, naCorrectionRate, potassiumDeficit, parseNumberField } from '../domains/clinical-calculators'
import type { ResusScenario } from '../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// Fluid & Electrolyte Calculators — maintenance (Holliday-Segar), fluid
// resuscitation (adult sepsis/shock + pediatric PALS boluses), and common
// electrolyte corrections (corrected sodium for hyperglycemia, Adrogue-Madias
// sodium correction rate, potassium deficit estimate). Pure arithmetic,
// standard published formulas, no external API. Bedside estimates only.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'maintenance' | 'resuscitation' | 'electrolytes'

/** Alasan penolakan masukan (bukan "belum diisi"), dipakai oleh semua sub-kalkulator. */
function Penolakan({ r }: { r: { ok: boolean; invalid?: readonly string[] } }) {
  return !r.ok && r.invalid && r.invalid.length > 0
    ? <p role="alert" className="mt-2 text-[12.5px] font-semibold text-red-600">{r.invalid.join('; ')}.</p>
    : null
}

function MaintenanceFluid() {
  // Berat badan tidak punya nilai awal yang bisa dibela di halaman yang
  // mengeluarkan mL/jam. 70 kg dahulu mencetak laju rumatan lengkap dengan
  // jatah natrium dan kalium harian, siap disalin.
  const [weightText, setWeightKg] = useState('')
  const weightKg = parseNumberField(weightText)
  const m = maintenanceFluid(weightKg)
  const adaBerat = m.ok
  const { dailyMl = 0, hourlyMl = 0, naMeq = 0, kMeq = 0 } = m.ok ? m : {}
  const summary = `Maintenance fluid (Holliday-Segar), BB ${weightKg}kg: ${dailyMl.toFixed(0)} mL/day (${hourlyMl.toFixed(1)} mL/hr). Na ~${naMeq.toFixed(0)} mEq/day, K ~${kMeq.toFixed(0)} mEq/day.`
  return (
    <Card className="!p-5">
      <Prosa kelas="text-[13px] text-neutral-500">Rumus Holliday-Segar "4-2-1" — kebutuhan cairan rumatan harian menurut berat badan, beserta perkiraan jatah elektrolit harian (2-3 mEq/kg Na, 1-2 mEq/kg K, dibatasi kasar menurut kelompok baku di bawah).</Prosa>
      <Field label="Weight (kg)">
        <input className={inputClass} type="number" min={1} step={0.1} value={weightText} onChange={(e) => setWeightKg(e.target.value)} />
      </Field>
      <Penolakan r={m} />
      {adaBerat ? (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-brand/10 p-3 text-center">
              <div className="text-[11px] font-bold text-neutral-500">Daily (100-50-20)</div>
              <div className="text-2xl font-black text-brand-dark">{dailyMl.toFixed(0)} mL</div>
            </div>
            <div className="rounded-xl bg-brand/10 p-3 text-center">
              <div className="text-[11px] font-bold text-neutral-500">Rate (4-2-1)</div>
              <div className="text-2xl font-black text-brand-dark">{hourlyMl.toFixed(1)} mL/hr</div>
            </div>
          </div>
          <div className="mt-3 flex justify-between text-[13px] text-neutral-600 dark:text-neutral-300">
            <span>Approx. daily Na allowance</span><b>{naMeq.toFixed(0)} mEq</b>
          </div>
          <div className="flex justify-between text-[13px] text-neutral-600 dark:text-neutral-300">
            <span>Approx. daily K allowance</span><b>{kMeq.toFixed(0)} mEq</b>
          </div>
        </>
      ) : (
        !m.ok && m.invalid.length > 0 ? null : <p className="mt-3 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          Enter a weight. A page that answers in mL/hr has no defensible starting body — 70 kg used to print a
          full maintenance rate with daily sodium and potassium allowances, ready to copy.
        </p>
      )}
      {adaBerat && <div className="mt-3"><CopyNote text={summary} /></div>}
    </Card>
  )
}

function FluidResuscitation() {
  // Sama: 70 kg dengan luas luka bakar 20% memberi Parkland 4 x 70 x 20 =
  // 5600 mL beserta laju per jam, untuk pasien yang tidak ada. Pilihan
  // skenario TETAP punya nilai awal -- ia memilih rumus mana yang dipakai,
  // bukan mengukur sesuatu tentang pasien.
  const [weightText, setWeightKg] = useState('')
  const [scenario, setScenario] = useState<'adult-sepsis' | 'peds-shock' | 'burns'>('adult-sepsis')
  const [tbsaText, setTbsaPct] = useState('')
  const weightKg = parseNumberField(weightText)
  const tbsaPct = parseNumberField(tbsaText)
  const r = resuscitation(scenario as ResusScenario, weightKg, tbsaPct)
  const adaBerat = !Number.isNaN(weightKg)
  const bisaHitung = r.ok
  const result = r.ok
    ? scenario === 'adult-sepsis'
      ? { label: '30 mL/kg crystalloid bolus (Surviving Sepsis Campaign) over the first 3h, reassess perfusion', ml: r.ml, extra: null as string | null }
      : scenario === 'peds-shock'
        ? { label: '20 mL/kg isotonic crystalloid bolus (PALS), reassess after each bolus, repeat as needed', ml: r.ml, extra: null }
        : { label: `Parkland formula: 4 mL x ${weightKg}kg x ${tbsaPct}% TBSA — first half over 8h from time of burn, remainder over next 16h`, ml: r.ml, extra: `First 8h: ${(r.first8hMl ?? 0).toFixed(0)} mL (${((r.first8hMl ?? 0) / 8).toFixed(0)} mL/hr) · Next 16h: ${(r.next16hMl ?? 0).toFixed(0)} mL (${((r.next16hMl ?? 0) / 16).toFixed(0)} mL/hr)` }
    : { label: '', ml: 0, extra: null as string | null }

  const summary = `Fluid resuscitation (${scenario}), BB ${weightKg}kg${scenario === 'burns' ? `, TBSA ${tbsaPct}%` : ''}: ${result.ml.toFixed(0)} mL total. ${result.label}${result.extra ? ' — ' + result.extra : ''}`

  return (
    <Card className="!p-5">
      <Prosa kelas="text-[13px] text-neutral-500">Crystalloid resuscitation volume by body weight for typical shock/burn scenarios. Always reassess perfusion (MAP, lactate, urine output, capillary refill time) between boluses — this is a starting-point estimate, not a fixed prescription.</Prosa>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setScenario('adult-sepsis')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${scenario === 'adult-sepsis' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Adult Sepsis/Shock</button>
        <button onClick={() => setScenario('peds-shock')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${scenario === 'peds-shock' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Pediatric Shock (PALS)</button>
        <button onClick={() => setScenario('burns')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${scenario === 'burns' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Burns (Parkland)</button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Weight (kg)">
          <input className={inputClass} type="number" min={1} step={0.1} value={weightText} onChange={(e) => setWeightKg(e.target.value)} />
        </Field>
        {scenario === 'burns' && (
          <Field label="TBSA burned (%)">
            <input className={inputClass} type="number" min={1} max={100} value={tbsaText} onChange={(e) => setTbsaPct(e.target.value)} />
          </Field>
        )}
      </div>
      <Penolakan r={r} />
      {bisaHitung ? (
        <div className="mt-3 rounded-xl bg-brand/10 p-3 text-center">
          <div className="text-[11px] font-bold text-neutral-500">{result.label}</div>
          <div className="mt-1 text-2xl font-black text-brand-dark">{result.ml.toFixed(0)} mL</div>
          {result.extra && <div className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300">{result.extra}</div>}
        </div>
      ) : !r.ok && r.invalid.length > 0 ? null : (
        <p className="mt-3 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {adaBerat ? 'Enter the burned surface area.' : 'Enter a weight.'}{' '}
          At 70 kg with 20% TBSA the Parkland formula gave 5600 mL and an hourly rate — a resuscitation volume for
          a patient nobody had weighed.
        </p>
      )}
      {bisaHitung && <div className="mt-3"><CopyNote text={summary} /></div>}
    </Card>
  )
}

type ElecTab = 'corrected-na' | 'na-correction-rate' | 'k-deficit'
function Electrolytes() {
  const [eTab, setETab] = useState<ElecTab>('corrected-na')

  // Ketiga sub-kalkulator di bawah masing-masing terbuka dengan hasilnya
  // sendiri: natrium terkoreksi dari Na 130 dan glukosa 400; laju koreksi
  // dari Na 120 menuju 130 pada 70 kg; dan defisit kalium dari K 3,0. Semua
  // itu nilai laboratorium.
  const [measuredNaText, setMeasuredNa] = useState('')
  const [glucoseText, setGlucose] = useState('')
  const measuredNa = parseNumberField(measuredNaText)
  const glucose = parseNumberField(glucoseText)
  const cna = correctedSodium(measuredNa, glucose)
  const adaNaTerkoreksi = cna.ok
  const correctedNa = cna.ok ? cna.correctedNa : 0

  const [currentNaText, setCurrentNa] = useState('')
  // Natrium target belum dipakai rumus mana pun (masukan lama dipertahankan apa adanya).
  const [targetNaText, setTargetNa] = useState('')
  const [weightRText, setWeightKgR] = useState('')
  const [sexR, setSexR] = useState<'M' | 'F'>('M')
  const currentNa = parseNumberField(currentNaText)
  const weightKgR = parseNumberField(weightRText)
  const rate = naCorrectionRate(currentNa, weightKgR, sexR)
  const adaLajuNa = rate.ok
  const { tbw = 0, naChangePerL = 0, litersFor10 = 0 } = rate.ok ? rate : {}

  const [currentKText, setCurrentK] = useState('')
  const [weightKText, setWeightKgK] = useState('')
  const currentK = parseNumberField(currentKText)
  const weightKgK = parseNumberField(weightKText)
  const kd = potassiumDeficit(currentK, weightKgK)
  const adaDefisitK = kd.ok
  const { lowMeq = 0, highMeq = 0 } = kd.ok ? kd : {}

  return (
    <Card className="!p-5">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setETab('corrected-na')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${eTab === 'corrected-na' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Corrected Sodium</button>
        <button onClick={() => setETab('na-correction-rate')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${eTab === 'na-correction-rate' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Na Correction Rate</button>
        <button onClick={() => setETab('k-deficit')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${eTab === 'k-deficit' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>K Deficit Estimate</button>
      </div>

      {eTab === 'corrected-na' && (
        <div className="mt-4">
          <p className="text-[13px] text-neutral-500">Adjusts measured sodium for hyperglycemia-driven osmotic dilution — Katz formula: +1.6 mEq/L Na for every 100 mg/dL glucose above 100.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Measured Na (mEq/L)"><input className={inputClass} type="number" value={measuredNaText} onChange={(e) => setMeasuredNa(e.target.value)} /></Field>
            <Field label="Glucose (mg/dL)"><input className={inputClass} type="number" value={glucoseText} onChange={(e) => setGlucose(e.target.value)} /></Field>
          </div>
          <Penolakan r={cna} />
          {adaNaTerkoreksi ? (
            <div className="mt-3 rounded-xl bg-brand/10 p-3 text-center">
              <div className="text-[11px] font-bold text-neutral-500">Corrected sodium</div>
              <div className="text-2xl font-black text-brand-dark">{correctedNa.toFixed(1)} mEq/L</div>
            </div>
          ) : <p className="mt-3 text-[12.5px] text-neutral-600 dark:text-neutral-300">Enter measured sodium and glucose.</p>}
          {adaNaTerkoreksi && <div className="mt-3"><CopyNote text={`Corrected Na = ${measuredNa} + 1.6 x ((${glucose}-100)/100) = ${correctedNa.toFixed(1)} mEq/L [Katz formula]`} /></div>}
        </div>
      )}

      {eTab === 'na-correction-rate' && (
        <div className="mt-4">
          <Prosa kelas="text-[13px] text-neutral-500">A simplified Adrogue-Madias estimate — how much serum Na rises per liter of 0.9% saline (Na 154 mEq/L) given. Correction of chronic hyponatremia must not exceed 8-10 mEq/L per 24 hours to avoid osmotic demyelination.</Prosa>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Current Na (mEq/L)"><input className={inputClass} type="number" value={currentNaText} onChange={(e) => setCurrentNa(e.target.value)} /></Field>
            <Field label="Target Na (mEq/L)"><input className={inputClass} type="number" value={targetNaText} onChange={(e) => setTargetNa(e.target.value)} /></Field>
            <Field label="Weight (kg)"><input className={inputClass} type="number" value={weightRText} onChange={(e) => setWeightKgR(e.target.value)} /></Field>
            <Field label="Sex">
              <select className={inputClass} value={sexR} onChange={(e) => setSexR(e.target.value as 'M' | 'F')}>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </Field>
          </div>
          <Penolakan r={rate} />
          {adaLajuNa ? (
            <div className="mt-3 rounded-xl bg-brand/10 p-3 text-center">
              <div className="text-[11px] font-bold text-neutral-500">Estimated rise per 1L of 0.9% saline</div>
              <div className="text-2xl font-black text-brand-dark">{naChangePerL.toFixed(2)} mEq/L</div>
              <div className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300">≈ {litersFor10.toFixed(2)} L to raise Na by 10 mEq/L — target ≤8-10 mEq/L per 24h</div>
            </div>
          ) : <p className="mt-3 text-[12.5px] text-neutral-600 dark:text-neutral-300">Enter current sodium and weight.</p>}
          {adaLajuNa && <div className="mt-3"><CopyNote text={`Estimated Na rise ≈ ${naChangePerL.toFixed(2)} mEq/L per 1L 0.9% saline (TBW ${tbw.toFixed(1)}L). Cap correction at 8-10 mEq/L/24h.`} /></div>}
        </div>
      )}

      {eTab === 'k-deficit' && (
        <div className="mt-4">
          <Prosa kelas="text-[13px] text-neutral-500">Rentang perkiraan defisit kalium total tubuh pada hipokalemia di bawah 4,0 mEq/L sebagai gambaran (hubungan defisit dengan K serum terkenal tidak linear — ini perkiraan kasar sebagai titik mulai perencanaan koreksi, bukan pengukuran yang tepat).</Prosa>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Current K (mEq/L)"><input className={inputClass} type="number" step={0.1} value={currentKText} onChange={(e) => setCurrentK(e.target.value)} /></Field>
            <Field label="Weight (kg)"><input className={inputClass} type="number" value={weightKText} onChange={(e) => setWeightKgK(e.target.value)} /></Field>
          </div>
          <Penolakan r={kd} />
          {adaDefisitK ? (
            <div className="mt-3 rounded-xl bg-brand/10 p-3 text-center">
              <div className="text-[11px] font-bold text-neutral-500">Estimated total-body deficit</div>
              <div className="text-2xl font-black text-brand-dark">{lowMeq.toFixed(0)}–{highMeq.toFixed(0)} mEq</div>
            </div>
          ) : <p className="mt-3 text-[12.5px] text-neutral-600 dark:text-neutral-300">Enter current potassium and weight.</p>}
          {adaDefisitK && <div className="mt-3"><CopyNote text={`Estimated K deficit ${lowMeq.toFixed(0)}-${highMeq.toFixed(0)} mEq (K ${currentK}, BB ${weightKgK}kg) — repletion estimate only, recheck levels serially during replacement.`} /></div>}
        </div>
      )}
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'maintenance', label: 'Maintenance Fluid' },
  { id: 'resuscitation', label: 'Fluid Resuscitation' },
  { id: 'electrolytes', label: 'Electrolytes' },
]

export function FluidCalculators() {
  const [tab, setTab] = useState<Tab>('maintenance')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Fluid & Electrolyte Calculators" subtitle="Maintenance, resuscitation & electrolyte correction in one place" />
        <BatasKlaimSkorTerbit />
        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{t.label}</button>
          ))}
        </div>
      </Card>

      {tab === 'maintenance' && <MaintenanceFluid />}
      {tab === 'resuscitation' && <FluidResuscitation />}
      {tab === 'electrolytes' && <Electrolytes />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Bedside estimates from standard published formulas (Holliday-Segar, Surviving Sepsis Campaign,
        PALS, Parkland, Katz, Adrogue-Madias) — always confirm against your institution's protocol and
        recheck labs serially during correction.
      </div>
    </div>
  )
}

export default FluidCalculators
