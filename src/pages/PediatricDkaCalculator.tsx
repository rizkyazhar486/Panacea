import { useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// Pediatric Diabetic Ketoacidosis (DKA) fluid, electrolyte & insulin
// calculator — standard pediatric DKA protocol (e.g. ISPAD/PALS-aligned):
//   1. Resuscitation bolus (if shock): 20 mL/kg NaCl 0.9%/RL
//      Partial/no shock: 10 mL/kg over 1-2h
//   2. Rehydration deficit: dehydration% x weight(kg) x 1000 mL
//   3. Maintenance (Holliday-Segar 100-50-20 rule, per 48h = x2 daily rate)
//   4. Total 48h fluid = deficit + maintenance, minus any bolus already given
//      Rate (mL/hr) = total / 48
//   5. Potassium: added once patient is not anuric/hyperkalemic (typically
//      20-40 mEq/L split KCl/KPO4, halved if K already low/high — this tool
//      offers the common 20+20 normokalemic split as the default)
//   6. Insulin infusion: 0.05-0.1 U/kg/hr IV (no bolus in current pediatric
//      protocols), this tool uses the low-dose 0.05 U/kg/hr default shown
//      in the reference case, adjustable.
// Pure arithmetic — a bedside estimate only, always confirm against your
// institution's protocol and a supervising clinician.
// ─────────────────────────────────────────────────────────────────────────────

function holliday(weightKg: number): number {
  if (weightKg <= 10) return 100 * weightKg
  if (weightKg <= 20) return 1000 + 50 * (weightKg - 10)
  return 1500 + 20 * (weightKg - 20)
}

export function PediatricDkaCalculator() {
  // Halaman ini mengeluarkan DOSIS, bukan sekadar skor.
  //
  // Ia dahulu terbuka pada berat 18 kg -- seorang anak berusia sekitar empat
  // tahun yang tidak ada -- dengan dehidrasi 10% dan kalium 3,5 mEq/L, lalu
  // langsung mencetak laju infus dalam mL/jam, laju insulin dalam unit/jam
  // IV, satu pita kalium yang dapat berbunyi "hold insulin", dan sebuah
  // ringkasan siap salin yang berbentuk lembar kerja DKA yang sudah selesai
  // diisi. Setiap angka di bawahnya adalah dosis untuk anak khayalan itu.
  //
  // Berat, dehidrasi dan kalium karena itu dimulai kosong.
  //
  // DUA HAL TIDAK DIUBAH, dan bedanya disengaja. "Tidak syok" adalah
  // penilaian klinis yang memang dijawab, seperti kotak centang yang tidak
  // dicentang. Dan 0,05 U/kg/jam bukan pengukuran tentang pasien melainkan
  // PILIHAN PROTOKOL antara 0,05 dan 0,1 -- sebuah setelan, dengan nilai
  // awal yang sah.
  const [weightKg, setWeightKg] = useState(0)
  const [shock, setShock] = useState(false)
  const [dehydrationPct, setDehydrationPct] = useState(0)
  const [potassiumMeq, setPotassiumK] = useState(0)
  const [insulinRateUKgHr, setInsulinRate] = useState(0.05)

  const belum: string[] = []
  if (!(weightKg > 0)) belum.push('weight')
  if (!(dehydrationPct > 0)) belum.push('dehydration estimate')
  const bisaCairan = belum.length === 0
  const adaKalium = potassiumMeq > 0

  const bolusMlPerKg = shock ? 20 : 10
  const bolusMl = bolusMlPerKg * weightKg

  const dailyMaintenanceMl = holliday(weightKg)
  const maintenance48hMl = dailyMaintenanceMl * 2
  const deficitMl = (dehydrationPct / 100) * weightKg * 1000
  const total48hMl = deficitMl + maintenance48hMl
  const netAfterBolusMl = Math.max(0, total48hMl - bolusMl)
  const ratePerHr = netAfterBolusMl / 48

  const insulinRateUHr = insulinRateUKgHr * weightKg

  const kBand = useMemo(() => {
    if (!(potassiumMeq > 0)) return null
    if (potassiumMeq < 3.5) return { label: 'Hypokalemic — hold insulin until K rechecked / replete first', tone: 'critical' as const }
    if (potassiumMeq > 5.5) return { label: 'Hyperkalemic — hold added KCl/KPO4 until urine output confirmed & K falls', tone: 'critical' as const }
    return { label: 'Normokalemic — standard 20 mEq/L KCl + 20 mEq/L KPO4 split', tone: 'brand' as const }
  }, [potassiumMeq])

  const summary = `Pediatric DKA fluids: BB ${weightKg}kg, ${shock ? 'shock' : 'no shock'} → bolus ${bolusMlPerKg}mL/kg = ${bolusMl.toFixed(0)}mL; deficit ${dehydrationPct}% x ${weightKg}kg x 1000 = ${deficitMl.toFixed(0)}mL; maintenance (Holliday-Segar) x2 = ${maintenance48hMl.toFixed(0)}mL; total 48h = ${total48hMl.toFixed(0)}mL − bolus = ${netAfterBolusMl.toFixed(0)}mL → rate ${ratePerHr.toFixed(1)} mL/hr. K: ${kBand ? kBand.label : 'not measured'}. Insulin: ${insulinRateUKgHr} U/kg/hr = ${insulinRateUHr.toFixed(2)} U/hr IV.`

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Pediatric DKA Fluid & Insulin Calculator" subtitle="Resuscitation, rehydration, maintenance, potassium & insulin — standard pediatric DKA protocol" />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Mimics the standard bedside pediatric DKA fluid worksheet: bolus (if shock) → 48-hour deficit + maintenance fluid → hourly rate → potassium bracket → insulin infusion rate. A calculation aid only — always confirm against your institution's protocol.</Prosa>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Weight (kg)">
            <input className={inputClass} type="number" min={1} step={0.1} value={weightKg || ''} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Dehydration estimate (%)">
            <input className={inputClass} type="number" min={0} max={15} step={1} value={dehydrationPct || ''} onChange={(e) => setDehydrationPct(Number(e.target.value) || 0)} />
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={shock} onChange={(e) => setShock(e.target.checked)} className="h-4 w-4 rounded" />
          Shock present (hypotension / poor perfusion)
        </label>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">1. Resuscitation</div>
        {bisaCairan ? (
          <>
            <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-300">
              NaCl 0.9% or RL — {shock ? 'shock' : 'no shock / partially corrected'} → <b>{bolusMlPerKg} mL/kg</b> {shock ? 'bolus' : 'over 1-2h'}
            </p>
            <div className="mt-1 text-2xl font-black text-brand-dark">{bolusMl.toFixed(0)} mL</div>

            <div className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">2. Fluid &amp; Electrolytes (48h)</div>
            <div className="mt-2 space-y-1 text-[13px] text-neutral-600 dark:text-neutral-300">
              <div className="flex justify-between"><span>Deficit: {dehydrationPct}% x {weightKg}kg x 1000mL</span><b>{deficitMl.toFixed(0)} mL</b></div>
              <div className="flex justify-between"><span>Maintenance (Holliday-Segar) x 2</span><b>{maintenance48hMl.toFixed(0)} mL</b></div>
              <div className="flex justify-between border-t border-neutral-100 pt-1 dark:border-white/10"><span>Total: (deficit + maintenance) − bolus</span><b>{netAfterBolusMl.toFixed(0)} mL</b></div>
            </div>
            <div className="mt-3 rounded-xl bg-brand/10 px-3 py-2 text-center">
              <div className="text-[11px] font-bold text-neutral-500">Infusion rate over 48h</div>
              <div className="text-3xl font-black text-brand-dark">{ratePerHr.toFixed(1)} mL/hr</div>
            </div>
          </>
        ) : (
          <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            No volumes or rates yet. Still needed: {belum.join(' and ')}.
            {' '}Every figure on this page is a dose. A starting weight of 18 kg is a four-year-old who is not here,
            and leaving it in place would print millilitres per hour and units per hour for that child instead of yours.
          </p>
        )}

        <div className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">3. Potassium</div>
        <Field label="Measured serum K (mEq/L)">
          <input className={inputClass} type="number" step={0.1} min={0} value={potassiumMeq || ''} onChange={(e) => setPotassiumK(Number(e.target.value) || 0)} />
        </Field>
        <div className="mt-2">
          {kBand !== null
            ? <Badge tone={kBand.tone}>{kBand.label}</Badge>
            : <span className="text-[12.5px] text-neutral-600 dark:text-neutral-300">No potassium bracket until a measured serum K is entered — the bracket decides whether insulin is held.</span>}
        </div>

        <div className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">4. Insulin (IV infusion, no bolus)</div>
        <Field label="Insulin rate (U/kg/hr)">
          <input className={inputClass} type="number" step={0.01} min={0.01} max={0.1} value={insulinRateUKgHr || ''} onChange={(e) => setInsulinRate(Number(e.target.value) || 0)} />
        </Field>
        {bisaCairan
          ? <div className="mt-1 text-2xl font-black text-brand-dark">{insulinRateUHr.toFixed(2)} U/hr IV</div>
          : <div className="mt-1 text-[12.5px] text-neutral-600 dark:text-neutral-300">U/hr cannot be shown without a weight; the rate above is per kilogram.</div>}

        {bisaCairan && adaKalium && <div className="mt-4"><CopyNote text={summary} /></div>}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Standard pediatric DKA fluid/insulin worksheet (Holliday-Segar maintenance + deficit replacement
        over 48h). A calculation aid, not a substitute for institutional protocol, PICU/pediatric
        endocrine consultation, or clinical judgment — insulin and potassium dosing must be individually
        titrated against hourly glucose, electrolytes, and urine output.
      </div>
    </div>
  )
}

export default PediatricDkaCalculator
