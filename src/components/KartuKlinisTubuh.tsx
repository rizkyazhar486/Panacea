import { useMemo } from 'react'
import { getVitals } from '../lib/healthVitals'
import { getDemo } from '../lib/profile'
import { useStore } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Angka klinis komposisi tubuh dan energi.
//
// TIGA ASAL YANG BERBEDA, DAN ITU DITULIS. Sebagian angka di sini DIUKUR
// timbangan bioimpedansi (lemak, otot rangka, lemak viseral), sebagian
// DIHITUNG dari tinggi-berat dengan persamaan terbitan (IMT, BMR), dan
// sebagian DICATAT sendiri (kalori masuk dari catatan makan). Ketiganya punya
// derajat kepercayaan yang jauh berbeda, dan menyusunnya dalam satu kisi tanpa
// menyebut asalnya membuat tebakan terbaca seperti hasil ukur.
//
// BIA PUNYA BATAS YANG BESAR. Timbangan bioimpedansi menduga lemak tubuh dari
// hambatan listrik, dan hasilnya bergeser oleh cairan tubuh, waktu makan,
// olahraga terakhir, dan suhu kaki. Simpangannya terhadap DXA lazim 3-5 persen
// poin (Achamrah dkk., 2018, PLoS ONE 13:e0200465). Karena itu yang berguna
// adalah ARAH pada alat yang sama, bukan angka mutlaknya.
// ─────────────────────────────────────────────────────────────────────────────

interface Baris {
  label: string
  nilai: string
  satuan?: string
  asal: 'ukur' | 'hitung' | 'catat'
  catatan?: string
}

const WARNA_ASAL: Record<Baris['asal'], string> = {
  ukur: 'text-emerald-600 dark:text-emerald-400',
  hitung: 'text-sky-600 dark:text-sky-400',
  catat: 'text-amber-600 dark:text-amber-400',
}
const NAMA_ASAL: Record<Baris['asal'], string> = {
  ukur: 'measured',
  hitung: 'calculated',
  catat: 'logged',
}

function num(x: unknown): number | null {
  return typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : null
}

/** Golongan IMT. Dua-duanya disebut karena ambangnya memang berbeda. */
function golonganImt(imt: number): string {
  const who = imt < 18.5 ? 'underweight' : imt < 25 ? 'normal' : imt < 30 ? 'overweight' : 'obese'
  const asia = imt < 18.5 ? 'underweight' : imt < 23 ? 'normal' : imt < 27.5 ? 'overweight' : 'obese'
  return who === asia ? `${who} (WHO & Asia-Pacific)` : `${who} by WHO, ${asia} by the Asia-Pacific threshold`
}

export function KartuKlinisTubuh() {
  const { state } = useStore()
  const v = useMemo(() => getVitals(), [])
  const demo = useMemo(() => getDemo(), [])

  const beratKg = num(v.weightKg) ?? num(demo.weightKg)
  const tinggiCm = num(v.heightCm) ?? num(demo.heightCm)
  const usia = num(demo.age)
  const jk: 'M' | 'F' = demo.sex === 'F' ? 'F' : 'M'

  const hariIni = new Date().toISOString().slice(0, 10)
  const kaloriMasuk = (state.foods ?? [])
    .filter((f) => f.date === hariIni)
    .reduce((a, f) => a + (f.kcal ?? 0), 0)

  const baris = useMemo<Baris[]>(() => {
    const out: Baris[] = []

    const imtTersimpan = num(v.bmi)
    const imt = imtTersimpan ?? (beratKg && tinggiCm ? beratKg / (tinggiCm / 100) ** 2 : null)
    if (imt) {
      out.push({
        label: 'BMI', nilai: imt.toFixed(1), satuan: 'kg/m²',
        asal: imtTersimpan ? 'ukur' : 'hitung',
        catatan: `${golonganImt(imt)}. BMI does not distinguish muscle from fat — it is misleading in muscular people.`,
      })
    }

    // BMR: dipakai yang terukur bila ada; bila tidak, Mifflin-St Jeor.
    const bmrTimbangan = num(v.bmrKcal)
    const bmrHitung = beratKg && tinggiCm && usia
      ? 10 * beratKg + 6.25 * tinggiCm - 5 * usia + (jk === 'F' ? -161 : 5)
      : null
    const bmr = bmrTimbangan ?? bmrHitung
    if (bmr) {
      out.push({
        label: 'BMR', nilai: Math.round(bmr).toLocaleString('en-GB'), satuan: 'kcal/day',
        asal: bmrTimbangan ? 'ukur' : 'hitung',
        catatan: bmrTimbangan
          ? 'A bioimpedance scale’s estimate.'
          : 'Mifflin-St Jeor (1990), Am J Clin Nutr 51(2):241-7 — typical error ±10% in healthy people.',
      })
    }

    const lemak = num(v.bodyFatPct)
    if (lemak) out.push({
      label: 'Body fat', nilai: lemak.toFixed(1), satuan: '%', asal: 'ukur',
      catatan: 'Bioimpedance: typical error of 3–5 points against DXA. Read the direction, on the same device.',
    })

    const otot = num(v.skeletalMuscleKg)
    if (otot) out.push({ label: 'Skeletal muscle', nilai: otot.toFixed(1), satuan: 'kg', asal: 'ukur' })

    const ototPct = num(v.skeletalMusclePct) ?? num(v.musclePct)
    if (ototPct) out.push({ label: 'Skeletal muscle', nilai: ototPct.toFixed(1), satuan: '% mass', asal: 'ukur' })

    const tanpaLemak = num(v.leanMassKg)
    if (tanpaLemak) out.push({ label: 'Lean mass', nilai: tanpaLemak.toFixed(1), satuan: 'kg', asal: 'ukur' })

    const viseral = num(v.visceralFatLevel) ?? num(v.visceralFatIndex)
    if (viseral) out.push({
      label: 'Visceral fat', nilai: String(Math.round(viseral)), satuan: 'level', asal: 'ukur',
      catatan: 'A scale-specific index, not a physical unit — cannot be compared across brands.',
    })

    const air = num(v.bodyWaterPct)
    if (air) out.push({ label: 'Body water', nilai: air.toFixed(1), satuan: '%', asal: 'ukur' })

    const aktif = num(v.activeKcal)
    if (aktif) out.push({
      label: 'Activity calories', nilai: Math.round(aktif).toLocaleString('en-GB'), satuan: 'kcal', asal: 'ukur',
      catatan: 'A device estimate from heart rate and motion, not a calorimetry measurement.',
    })

    const menit = num(v.exerciseMin)
    if (menit) out.push({ label: 'Exercise minutes', nilai: String(Math.round(menit)), satuan: 'min', asal: 'ukur' })

    if (kaloriMasuk > 0) {
      out.push({
        label: 'Calories in', nilai: Math.round(kaloriMasuk).toLocaleString('en-GB'), satuan: 'kcal today', asal: 'catat',
        catatan: 'From your own food log. Self-estimated portions are typically 20% short.',
      })
      if (bmr) {
        const keluar = bmr + (aktif ?? 0)
        out.push({
          label: 'Energy balance', nilai: `${kaloriMasuk - keluar >= 0 ? '+' : '−'}${Math.abs(Math.round(kaloriMasuk - keluar)).toLocaleString('en-GB')}`,
          satuan: 'kcal', asal: 'hitung',
          catatan: `In ${Math.round(kaloriMasuk).toLocaleString('en-GB')} − (BMR ${Math.round(bmr).toLocaleString('en-GB')}${aktif ? ` + activity ${Math.round(aktif).toLocaleString('en-GB')}` : ''}). All three are estimates, so the difference inherits all their error — do not read it as a precise balance.`,
        })
      }
    }

    return out
  }, [v, beratKg, tinggiCm, usia, jk, kaloriMasuk])

  if (!baris.length) return null

  return (
    <div className="kaca rounded-3xl p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-black text-ink dark:text-white">Body composition &amp; energy</h2>
        <span className="text-[10px] text-neutral-500">{baris.length} figures</span>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-white/10">
        {baris.map((b) => (
          <div key={b.label + b.satuan} className="py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-[12px] font-semibold text-neutral-600 dark:text-neutral-300">{b.label}</span>
              <span className="flex shrink-0 items-baseline gap-1">
                <span className="text-[16px] font-black tabular-nums text-ink dark:text-white">{b.nilai}</span>
                {b.satuan && <span className="text-[10px] font-bold text-neutral-400">{b.satuan}</span>}
                <span className={`ml-1 text-[9px] font-black uppercase ${WARNA_ASAL[b.asal]}`}>{NAMA_ASAL[b.asal]}</span>
              </span>
            </div>
            {b.catatan && <p className="mt-0.5 text-[10.5px] leading-snug text-neutral-500">{b.catatan}</p>}
          </div>
        ))}
      </div>

      <p className="mt-2 text-[10.5px] leading-snug text-neutral-500">
        <b className="text-emerald-600 dark:text-emerald-400">Measured</b> comes from a device,{' '}
        <b className="text-sky-600 dark:text-sky-400">calculated</b> from a published equation over height and weight,{' '}
        <b className="text-amber-600 dark:text-amber-400">logged</b> from your own records. The three carry very
        different degrees of confidence.
      </p>
    </div>
  )
}

export default KartuKlinisTubuh
