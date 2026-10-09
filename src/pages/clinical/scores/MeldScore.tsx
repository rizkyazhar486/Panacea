import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconActivity } from '../../../components/icons'
import { ScoreTrend } from '../../../components/ScoreTrend'
import { CopyNote } from '../../../components/CopyNote'
import { BatasKlaimSkorTerbit } from '../../../components/BatasKlaimSkorTerbit'
import { meldNa as hitungMeld, parseNumberField } from '../../../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// MELD-Na Score — end-stage liver disease severity & transplant priority.
//   Kamath, P.S., et al. (2001), Hepatology, 33(2):464-470 (original MELD)
//   Kim, W.R., et al. (2008), NEJM, 359(10):1018-1026 (MELD-Na)
//   OPTN/UNOS policy (2016) — current allocation formula, bounds below.
//
// MELD = 3.78·ln(bilirubin) + 11.2·ln(INR) + 9.57·ln(creatinine) + 6.43
//   Creatinine bounded [1.0, 4.0] mg/dL (also set to 4.0 if on dialysis
//   ≥2x in the past week); all lab inputs <1.0 are floored to 1.0.
// MELD-Na (applied only when MELD > 11):
//   = MELD + 1.32·(137 − Na) − [0.033·MELD·(137 − Na)]
//   Na bounded [125, 137] mEq/L.
// Final score bounded [6, 40]. Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

export function MeldScore() {
  // Keempat angka ini hasil laboratorium, dan tidak satu pun punya nilai awal
  // yang bisa dibela. Halaman ini dahulu terbuka pada bilirubin 2,0 / INR 1,5
  // / kreatinin 1,2 / Na 135 -- nilai yang terbaca persis seperti hasil lab
  // seseorang -- lalu mencetak skor MELD-Na, sebuah pita prioritas transplan,
  // sebuah angka kematian tiga bulan, kalimat siap salin, DAN satu titik pada
  // grafik tren yang tersimpan di perangkat.
  //
  // Lantai rumusnya memperburuk keadaan: Math.max(x, 1.0) mengubah kolom
  // kosong menjadi 1,0, sehingga halaman kosong menghasilkan MELD 6 --
  // "Low priority, ~2% 3-month mortality". Kekosongan tampil sebagai kabar
  // baik yang spesifik.
  // Teks mentah: kolom kosong = NaN ("belum diisi"), bukan 0.
  const [bilirubinText, setBilirubin] = useState('')
  const [inrText, setInr] = useState('')
  const [creatinineText, setCreatinine] = useState('')
  const [sodiumText, setSodium] = useState('')
  const [dialysis, setDialysis] = useState(false)

  const bilirubin = parseNumberField(bilirubinText)
  const inr = parseNumberField(inrText)
  const creatinine = parseNumberField(creatinineText)
  const sodium = parseNumberField(sodiumText)
  const hasil = hitungMeld({ bilirubin, inr, creatinine, sodium, dialysis })
  const belum = hasil.missing
  const lengkap = hasil.meldNa !== null
  const meld = hasil.meld ?? 0
  const meldNa = hasil.meldNa ?? 0
  const bandInfo = hasil.band

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="MELD-Na Score" subtitle="End-stage liver disease severity — transplant allocation priority" />
        <BatasKlaimSkorTerbit />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Model for End-Stage Liver Disease, sodium-adjusted (current UNOS/OPTN organ allocation
          formula). Higher scores mean higher short-term mortality and higher transplant priority.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Total bilirubin (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={bilirubinText} onChange={(e) => setBilirubin(e.target.value)} />
          </Field>
          <Field label="INR">
            <input className={inputClass} type="number" step="0.1" min={0} value={inrText} onChange={(e) => setInr(e.target.value)} />
          </Field>
          <Field label="Creatinine (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={creatinineText} onChange={(e) => setCreatinine(e.target.value)} disabled={dialysis} />
          </Field>
          <Field label="Sodium (mEq/L)">
            <input className={inputClass} type="number" min={100} value={sodiumText} onChange={(e) => setSodium(e.target.value)} />
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={dialysis} onChange={(e) => setDialysis(e.target.checked)} className="h-4 w-4 rounded" />
          On dialysis ≥2x in the past week (or ≥24h continuous CRRT)
        </label>
        {hasil.invalid.length > 0 && (
          <p role="alert" className="mt-3 text-[12.5px] font-semibold text-red-600">{hasil.invalid.join('; ')}.</p>
        )}
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">MELD-Na Score</div>
        {lengkap && bandInfo !== null ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black text-brand-dark">{meldNa.toFixed(0)}</span>
              <Badge tone={bandInfo.tone}>{bandInfo.label}</Badge>
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">Estimated {bandInfo.mortality} (population-level estimate, not individual prognosis).</p>
            <p className="mt-2 text-[12px] text-neutral-500">Unadjusted MELD (pre-sodium): {meld.toFixed(0)}</p>
            <CopyNote text={`MELD-Na ${meldNa.toFixed(0)} (bilirubin ${bilirubin} mg/dL, INR ${inr}, creatinine ${dialysis ? '4.0 [on dialysis]' : creatinine + ' mg/dL'}, Na ${sodium} mEq/L) — ${bandInfo.label.toLowerCase()}, est. ${bandInfo.mortality} [Kamath 2001; Kim 2008; OPTN 2016]`} />
          </>
        ) : hasil.invalid.length > 0 ? null : (
          <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            No score yet. Still needed: {belum.join(', ')}.
            {' '}These are laboratory results; none of them has a default. The formula floors each value at 1.0,
            so an empty page would otherwise score 6 and read as low priority with a specific mortality figure —
            and record that figure to your trend.
          </p>
        )}
      </Card>

      {lengkap && (
        <ScoreTrend
          storageKey="pmd_meldna_trend_v1"
          scoreName="MELD-Na"
          total={Math.round(meldNa)}
          maxScore={40}
          detail={`Bili ${bilirubin}, INR ${inr}, Cr ${dialysis ? '4.0 (dialysis)' : creatinine}, Na ${sodium}`}
        />
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Kamath, P.S., et al. (2001). <i>Hepatology</i>, 33(2), 464-470. Kim, W.R., et al. (2008). <i>NEJM</i>,
        359(10), 1018-1026. OPTN/UNOS allocation policy (2016). Decision-support estimate — actual
        transplant allocation uses laboratory values verified per UNOS policy, not this tool.
      </div>
    </div>
  )
}

export default MeldScore
