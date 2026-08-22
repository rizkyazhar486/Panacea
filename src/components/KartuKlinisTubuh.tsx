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
  ukur: 'diukur',
  hitung: 'dihitung',
  catat: 'dicatat',
}

function num(x: unknown): number | null {
  return typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : null
}

/** Golongan IMT. Dua-duanya disebut karena ambangnya memang berbeda. */
function golonganImt(imt: number): string {
  const who = imt < 18.5 ? 'kurang' : imt < 25 ? 'normal' : imt < 30 ? 'lebih' : 'obesitas'
  const asia = imt < 18.5 ? 'kurang' : imt < 23 ? 'normal' : imt < 27.5 ? 'lebih' : 'obesitas'
  return who === asia ? `${who} (WHO & Asia-Pasifik)` : `${who} menurut WHO, ${asia} menurut ambang Asia-Pasifik`
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
        label: 'IMT', nilai: imt.toFixed(1), satuan: 'kg/m²',
        asal: imtTersimpan ? 'ukur' : 'hitung',
        catatan: `${golonganImt(imt)}. IMT tidak membedakan otot dari lemak — pada orang berotot ia menyesatkan.`,
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
        label: 'BMR', nilai: Math.round(bmr).toLocaleString('id-ID'), satuan: 'kkal/hari',
        asal: bmrTimbangan ? 'ukur' : 'hitung',
        catatan: bmrTimbangan
          ? 'Dugaan timbangan bioimpedansi.'
          : 'Mifflin-St Jeor (1990), Am J Clin Nutr 51(2):241-7 — simpangan lazim ±10% pada orang sehat.',
      })
    }

    const lemak = num(v.bodyFatPct)
    if (lemak) out.push({
      label: 'Lemak tubuh', nilai: lemak.toFixed(1), satuan: '%', asal: 'ukur',
      catatan: 'Bioimpedansi: simpangan lazim 3–5 poin terhadap DXA. Bacalah arahnya pada alat yang sama.',
    })

    const otot = num(v.skeletalMuscleKg)
    if (otot) out.push({ label: 'Otot rangka', nilai: otot.toFixed(1), satuan: 'kg', asal: 'ukur' })

    const ototPct = num(v.skeletalMusclePct) ?? num(v.musclePct)
    if (ototPct) out.push({ label: 'Otot rangka', nilai: ototPct.toFixed(1), satuan: '% massa', asal: 'ukur' })

    const tanpaLemak = num(v.leanMassKg)
    if (tanpaLemak) out.push({ label: 'Massa tanpa lemak', nilai: tanpaLemak.toFixed(1), satuan: 'kg', asal: 'ukur' })

    const viseral = num(v.visceralFatLevel) ?? num(v.visceralFatIndex)
    if (viseral) out.push({
      label: 'Lemak viseral', nilai: String(Math.round(viseral)), satuan: 'tingkat', asal: 'ukur',
      catatan: 'Skala timbangan, bukan satuan fisik — tidak dapat dibandingkan antarmerek.',
    })

    const air = num(v.bodyWaterPct)
    if (air) out.push({ label: 'Air tubuh', nilai: air.toFixed(1), satuan: '%', asal: 'ukur' })

    const aktif = num(v.activeKcal)
    if (aktif) out.push({
      label: 'Kalori aktivitas', nilai: Math.round(aktif).toLocaleString('id-ID'), satuan: 'kkal', asal: 'ukur',
      catatan: 'Dugaan perangkat dari denyut dan gerak, bukan pengukuran kalorimetri.',
    })

    const menit = num(v.exerciseMin)
    if (menit) out.push({ label: 'Menit latihan', nilai: String(Math.round(menit)), satuan: 'mnt', asal: 'ukur' })

    if (kaloriMasuk > 0) {
      out.push({
        label: 'Kalori masuk', nilai: Math.round(kaloriMasuk).toLocaleString('id-ID'), satuan: 'kkal hari ini', asal: 'catat',
        catatan: 'Dari catatan makan Anda. Penakaran porsi sendiri lazim meleset 20% ke bawah.',
      })
      if (bmr) {
        const keluar = bmr + (aktif ?? 0)
        out.push({
          label: 'Selisih energi', nilai: `${kaloriMasuk - keluar >= 0 ? '+' : '−'}${Math.abs(Math.round(kaloriMasuk - keluar)).toLocaleString('id-ID')}`,
          satuan: 'kkal', asal: 'hitung',
          catatan: `Masuk ${Math.round(kaloriMasuk).toLocaleString('id-ID')} − (BMR ${Math.round(bmr).toLocaleString('id-ID')}${aktif ? ` + aktivitas ${Math.round(aktif).toLocaleString('id-ID')}` : ''}). Ketiganya perkiraan, jadi selisihnya mewarisi seluruh kesalahannya — jangan dibaca sebagai neraca.`,
        })
      }
    }

    return out
  }, [v, beratKg, tinggiCm, usia, jk, kaloriMasuk])

  if (!baris.length) return null

  return (
    <div className="kaca rounded-3xl p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-black text-ink dark:text-white">Komposisi tubuh &amp; energi</h2>
        <span className="text-[10px] text-neutral-500">{baris.length} angka</span>
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
        <b className="text-emerald-600 dark:text-emerald-400">Diukur</b> berasal dari alat,{' '}
        <b className="text-sky-600 dark:text-sky-400">dihitung</b> dari persamaan terbitan atas tinggi dan berat,{' '}
        <b className="text-amber-600 dark:text-amber-400">dicatat</b> dari catatan Anda sendiri. Ketiganya punya derajat
        kepercayaan yang berbeda jauh.
      </p>
    </div>
  )
}

export default KartuKlinisTubuh
