import { useState } from 'react'
import { Prosa } from '../../../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconActivity } from '../../../components/icons'
import { CopyNote } from '../../../components/CopyNote'
import { BatasKlaimSkorTerbit } from '../../../components/BatasKlaimSkorTerbit'
import { fena as hitungFena, parseNumberField } from '../../../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// Fractional Excretion of Sodium (FeNa) — Espinel, C.H. (1976), JAMA,
// 236(6):579-581. Distinguishes prerenal azotemia (kidneys appropriately
// conserving sodium) from intrinsic acute tubular necrosis in acute kidney
// injury. Not valid if the patient has already received diuretics — use
// FeUrea (not implemented here) in that setting instead.
//
// FeNa (%) = (Urine Na x Plasma Creatinine) / (Plasma Na x Urine Creatinine) x 100
// Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

export function FenaCalculator() {
  // Nilai lamanya -- UNa 20, PCr 2,0, PNa 140, UCr 60 -- menghasilkan
  // FeNa 0,48%, di bawah 1, sehingga halaman ini terbuka dengan sebuah
  // DIAGNOSIS BANDING: "Prerenal azotemia likely". Keempatnya hasil
  // laboratorium dari dua sampel yang harus diambil bersamaan.
  //
  // "Sedang memakai diuretik" tetap terjawab: tidak dicentang berarti tidak,
  // dan itu jawaban yang mengubah cara pembacaannya, bukan pengukuran.
  // Teks mentah: kolom kosong = NaN ("belum diisi"), bukan 0.
  const [urineNaText, setUrineNa] = useState('')
  const [plasmaCrText, setPlasmaCr] = useState('')
  const [plasmaNaText, setPlasmaNa] = useState('')
  const [urineCrText, setUrineCr] = useState('')
  const [onDiuretics, setOnDiuretics] = useState(false)

  const urineNa = parseNumberField(urineNaText)
  const plasmaCr = parseNumberField(plasmaCrText)
  const plasmaNa = parseNumberField(plasmaNaText)
  const urineCr = parseNumberField(urineCrText)
  const hasil = hitungFena({ urineNa, plasmaCr, plasmaNa, urineCr })
  const belum = hasil.missing
  const lengkap = hasil.fena !== null
  const fena = hasil.fena ?? 0
  const result = hasil.band

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Fractional Excretion of Sodium (FeNa)" subtitle="Prerenal azotemia vs. acute tubular necrosis (Espinel, 1976)" />
        <BatasKlaimSkorTerbit />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Pada cedera ginjal akut, FeNa yang rendah menunjukkan ginjal masih menahan natrium sebagaimana mestinya (sebab prarenal, mis. hipovolemia); FeNa yang tinggi menunjukkan kerusakan tubulus intrinsik. Memerlukan sampel urin dan plasma yang diambil bersamaan.</Prosa>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Urine sodium (mEq/L)">
            <input className={inputClass} type="number" min={0} value={urineNaText} onChange={(e) => setUrineNa(e.target.value)} />
          </Field>
          <Field label="Plasma sodium (mEq/L)">
            <input className={inputClass} type="number" min={0} value={plasmaNaText} onChange={(e) => setPlasmaNa(e.target.value)} />
          </Field>
          <Field label="Urine creatinine (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={urineCrText} onChange={(e) => setUrineCr(e.target.value)} />
          </Field>
          <Field label="Plasma creatinine (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={plasmaCrText} onChange={(e) => setPlasmaCr(e.target.value)} />
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={onDiuretics} onChange={(e) => setOnDiuretics(e.target.checked)} className="h-4 w-4 rounded" />
          Patient has received diuretics recently
        </label>
        {hasil.invalid.length > 0 && (
          <p role="alert" className="mt-3 text-[12.5px] font-semibold text-red-600">{hasil.invalid.join('; ')}.</p>
        )}
        {onDiuretics && (
          <Prosa kelas="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">FeNa tidak dapat diandalkan sesudah pemakaian diuretik (diuretik memaksa pembuangan natrium apa pun sebabnya). Fractional Excretion of Urea adalah pilihan yang lebih tepat dalam keadaan itu.</Prosa>
        )}
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">FeNa</div>
        {lengkap && result !== null ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black text-brand-dark">{fena.toFixed(2)}%</span>
              <Badge tone={result.tone}>{result.label}</Badge>
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">Reference: FeNa {'<'}1% prerenal · 1-2% indeterminate · {'>'}2% intrinsic renal.</p>
            <CopyNote text={`FeNa ${fena.toFixed(2)}% (UNa ${urineNa}, PCr ${plasmaCr}, PNa ${plasmaNa}, UCr ${urineCr}${onDiuretics ? '; on diuretics — interpret cautiously' : ''}) — ${result.label} [Espinel 1976]`} />
          </>
        ) : hasil.invalid.length > 0 ? null : (
          <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            No FeNa yet. Still needed: {belum.join(', ')}.
            {' '}All four come from a paired urine and plasma sample. The old starting values gave 0.48%, so this page
            used to open on a differential diagnosis — "prerenal azotemia likely" — for a patient nobody had sampled.
          </p>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Espinel, C.H. (1976). The FENa test. <i>JAMA</i>, 236(6), 579-581. Decision-support estimate —
        interpret alongside clinical context, urinalysis, and imaging.
      </div>
    </div>
  )
}

export default FenaCalculator
