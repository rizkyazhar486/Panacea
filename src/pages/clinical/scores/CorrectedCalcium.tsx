import { useState } from 'react'
import { Prosa } from '../../../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconActivity } from '../../../components/icons'
import { CopyNote } from '../../../components/CopyNote'
import { BatasKlaimSkorTerbit } from '../../../components/BatasKlaimSkorTerbit'
import { correctedCalcium, parseNumberField } from '../../../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// Corrected Calcium — Payne, R.B., et al. (1973), BMJ, 4(5893):643-646.
// Roughly half of serum calcium is protein-bound (mostly to albumin), so low
// albumin makes TOTAL calcium read falsely low even when the physiologically
// active ionized fraction is normal — a very common bedside pitfall,
// especially in hospitalized/malnourished/cirrhotic patients. Pure
// arithmetic, no external API.
//
// Corrected Ca (mg/dL) = Measured total Ca (mg/dL) + 0.8 x (4.0 - albumin g/dL)
// ─────────────────────────────────────────────────────────────────────────────

export function CorrectedCalcium() {
  // Kedua angka ini hasil laboratorium. Tidak ada nilai awal yang bisa
  // dibela untuk keduanya: halaman ini dahulu terbuka pada kalsium 8,0 dan
  // albumin 2,5 -- lalu langsung memasang label "Hypocalcemia" beserta
  // kalimat siap salin, untuk pasien yang tidak ada. Dan mengosongkan satu
  // kolom membuat nilainya 0, yang dijawab band() dengan "Severe
  // hypocalcemia": kolom kosong ditampilkan sebagai keadaan gawat.
  // Teks mentah: kolom kosong = NaN ("belum diisi"), bukan 0.
  const [totalText, setTotalCa] = useState('')
  const [albuminText, setAlbumin] = useState('')

  const totalCa = parseNumberField(totalText)
  const albumin = parseNumberField(albuminText)
  const hasil = correctedCalcium({ totalCa, albumin })
  const { corrected, totalBand, correctedBand } = hasil
  const lengkap = corrected !== null
  const changesCategory = hasil.changesCategory === true
  const belum = hasil.missing

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Corrected Calcium" subtitle="Published Payne corrected calcium (1973) — not a clinically validated Panacea decision" />
        <BatasKlaimSkorTerbit />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Sekitar separuh kalsium serum terikat protein (terutama albumin) — albumin yang rendah membuat kalsium total terbaca rendah palsu meskipun bagian yang aktif secara fisiologis (terionisasi) sebenarnya normal. Jebakan yang sangat lazim di sisi tempat tidur pada pasien rawat inap, kurang gizi, atau sirosis.</Prosa>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Measured total calcium (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={totalText} onChange={(e) => setTotalCa(e.target.value)} />
          </Field>
          <Field label="Serum albumin (g/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={albuminText} onChange={(e) => setAlbumin(e.target.value)} />
          </Field>
        </div>
        {hasil.invalid.length > 0 && (
          <p role="alert" className="mt-3 text-[12.5px] font-semibold text-red-600">{hasil.invalid.join('; ')}.</p>
        )}
      </Card>

      <Card className="!p-5">
        {lengkap && corrected !== null && totalBand !== null && correctedBand !== null ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Measured total Ca</div>
                <div className="mt-1 text-2xl font-black text-ink dark:text-ink">{totalCa.toFixed(1)}</div>
                <Badge tone={totalBand.tone}>{totalBand.label}</Badge>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Corrected Ca</div>
                <div className="mt-1 text-2xl font-black text-brand-dark">{corrected.toFixed(1)}</div>
                <Badge tone={correctedBand.tone}>{correctedBand.label}</Badge>
              </div>
            </div>
            {changesCategory && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                The correction changes the clinical category — acting on the uncorrected total calcium alone
                here would be misleading.
              </p>
            )}
            <p className="mt-3 text-[11px] text-neutral-500">
              When available and in critically ill or borderline cases, a directly measured ionized calcium
              is more reliable than either total or corrected calcium.
            </p>
            <CopyNote text={`Corrected Ca ${corrected.toFixed(1)} mg/dL (measured ${totalCa.toFixed(1)}, albumin ${albumin} g/dL) — ${correctedBand.label.toLowerCase()} [Payne 1973]`} />
          </>
        ) : hasil.invalid.length > 0 ? null : (
          <p className="text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            Nothing is calculated yet. Still needed: {belum.join(' and ')}.
            {' '}Both are laboratory results and neither has a default — an empty field is not a value of zero,
            and a category shown for a patient nobody described is worse than no category at all.
          </p>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Payne, R.B., et al. (1973). Interpretation of serum calcium in patients with abnormal serum
        proteins. <i>BMJ</i>, 4(5893), 643-646. Decision-support estimate, not a substitute for ionized
        calcium when clinically indicated.
      </div>
    </div>
  )
}

export default CorrectedCalcium
