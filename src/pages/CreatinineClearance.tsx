import { useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { getDemoTersimpan } from '../lib/profile'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// Cockcroft-Gault Creatinine Clearance — Cockcroft, D.W. & Gault, M.H. (1976),
// Nephron, 16(1):31-41. Distinct from (and still used alongside) the CKD-EPI
// eGFR elsewhere in this app: many drug package inserts and dosing
// nomograms specify renal dose adjustment by Cockcroft-Gault CrCl
// specifically, not eGFR, so both have a real clinical role. Pure
// arithmetic, no external API.
//
// CrCl (mL/min) = [(140 - age) x weight(kg) x (0.85 if female)] / (72 x SCr mg/dL)
// Weight choice matters: actual body weight overestimates CrCl in obesity;
// many references recommend ideal body weight (or an adjusted weight) when
// actual weight is >20-30% above ideal.
// ─────────────────────────────────────────────────────────────────────────────

function idealBodyWeight(heightCm: number, sex: 'M' | 'F'): number {
  const heightIn = heightCm / 2.54
  const inchesOver5ft = Math.max(0, heightIn - 60)
  return (sex === 'M' ? 50 : 45.5) + 2.3 * inchesOver5ft
}

function band(crcl: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (crcl >= 90) return { label: 'Normal', tone: 'brand' }
  if (crcl >= 60) return { label: 'Mildly reduced', tone: 'brand' }
  if (crcl >= 30) return { label: 'Moderately reduced — many drugs need dose adjustment', tone: 'low' }
  if (crcl >= 15) return { label: 'Severely reduced — significant dose adjustment needed', tone: 'critical' }
  return { label: 'Kidney failure — many drugs contraindicated or need major adjustment', tone: 'critical' }
}

export function CreatinineClearance() {
  // Bacaan TERSIMPAN, bukan getDemo(). getDemo() memadukan DEMO_DEFAULT ke
  // profil kosong, sehingga halaman ini dahulu terbuka dengan usia 30, berat
  // 70 kg dan jenis kelamin laki-laki -- lalu, dengan kreatinin awal 1,0,
  // mencetak "107 mL/min - Normal" beserta kalimat siap salin untuk rekam
  // medis. Tidak satu pun angka itu berasal dari orang yang membacanya.
  const demo = getDemoTersimpan()
  const [age, setAge] = useState(demo.age && demo.age > 0 ? demo.age : 0)
  const [weightKg, setWeightKg] = useState(demo.weightKg && demo.weightKg > 0 ? demo.weightKg : 0)
  const [heightCm, setHeightCm] = useState(demo.heightCm && demo.heightCm > 0 ? demo.heightCm : 0)
  const [sex, setSex] = useState<'M' | 'F'>(demo.sex === 'F' ? 'F' : 'M')
  // Kreatinin serum TIDAK punya nilai awal yang bisa dibela. Ia hasil
  // laboratorium; satu-satunya jalan masuknya adalah diketik.
  const [scr, setScr] = useState(0)
  const [weightBasis, setWeightBasis] = useState<'actual' | 'ideal'>('actual')

  const ibw = heightCm > 0 ? idealBodyWeight(heightCm, sex) : 0
  const useWeight = weightBasis === 'ideal' ? ibw : weightKg
  // Kekosongan BUKAN nol. Sebelum ini, mengosongkan kolom kreatinin membuat
  // crcl menjadi 0, dan band(0) menjawab "Kidney failure -- many drugs
  // contraindicated": kolom kosong ditampilkan sebagai gagal ginjal berat,
  // lengkap dengan tombol menyalinnya ke catatan.
  const bisaHitung = scr > 0 && age > 0 && useWeight > 0
  const crcl = bisaHitung ? ((140 - age) * useWeight * (sex === 'F' ? 0.85 : 1)) / (72 * scr) : null
  const obese = weightKg > 0 && ibw > 0 && weightKg > ibw * 1.25
  const bandInfo = crcl !== null ? band(crcl) : null

  const belum: string[] = []
  if (!(age > 0)) belum.push('age')
  if (!(weightKg > 0)) belum.push('weight')
  if (weightBasis === 'ideal' && !(heightCm > 0)) belum.push('height')
  if (!(scr > 0)) belum.push('serum creatinine')

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Creatinine Clearance (Cockcroft-Gault)" subtitle="Fungsi ginjal untuk penghitungan dosis obat — berbeda dari eGFR CKD-EPI" />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Banyak brosur obat dan nomogram dosis menetapkan penyesuaian dosis ginjal justru dengan rumus ini, bukan dengan eGFR — keduanya punya perannya masing-masing dan tidak dapat saling menggantikan.</Prosa>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Age (years)">
            <input className={inputClass} type="number" min={18} value={age || ''} onChange={(e) => setAge(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Sex">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F')}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
          <Field label="Weight (kg)">
            <input className={inputClass} type="number" min={20} value={weightKg || ''} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Height (cm)">
            <input className={inputClass} type="number" min={100} value={heightCm || ''} onChange={(e) => setHeightCm(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Serum creatinine (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0.1} value={scr || ''} onChange={(e) => setScr(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Weight basis">
            <select className={inputClass} value={weightBasis} onChange={(e) => setWeightBasis(e.target.value as 'actual' | 'ideal')}>
              <option value="actual">Actual body weight</option>
              <option value="ideal">Ideal body weight</option>
            </select>
          </Field>
        </div>
        {obese && weightBasis === 'actual' && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Actual weight is {'>'}25% above ideal body weight ({ibw.toFixed(0)}kg) — actual-weight CrCl may
            overestimate renal function. Consider switching to ideal body weight above.
          </p>
        )}
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Result</div>
        {crcl !== null && bandInfo !== null ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black text-brand-dark">{crcl.toFixed(0)}</span>
              <span className="text-sm font-semibold text-neutral-500">mL/min</span>
              <Badge tone={bandInfo.tone}>{bandInfo.label}</Badge>
            </div>
            {ibw > 0 && <p className="mt-2 text-[12px] text-neutral-500">Ideal body weight (reference): {ibw.toFixed(1)} kg</p>}
            <CopyNote text={`CrCl (Cockcroft-Gault) ${crcl.toFixed(0)} mL/min using ${weightBasis} body weight (age ${age}, ${sex === 'M' ? 'male' : 'female'}, ${useWeight.toFixed(0)} kg, SCr ${scr} mg/dL) — ${bandInfo.label.toLowerCase()} [Cockcroft & Gault 1976]`} />
          </>
        ) : (
          <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            No clearance is shown yet. Still needed: {belum.join(', ')}.
            {' '}Serum creatinine has no default — it is a laboratory result, and an empty field is not a value.
            {' '}Nothing here is estimated on your behalf, because a number on this page can change a drug dose.
          </p>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Cockcroft, D.W. &amp; Gault, M.H. (1976). Prediction of creatinine clearance from serum
        creatinine. <i>Nephron</i>, 16(1), 31-41. Decision-support estimate — verify against the
        specific drug's package insert and consult a pharmacist for renal dose adjustment.
      </div>
    </div>
  )
}

export default CreatinineClearance
