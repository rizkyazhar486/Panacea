import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDemo } from '../lib/profile'
import { useVitalField } from '../lib/useVitals'
import {
  hitungTdee,
  TUJUAN_GIZI,
  AKTIVITAS_GIZI,
  type TujuanGizi,
  type TingkatAktivitas,
} from '../lib/tdee'

// ─────────────────────────────────────────────────────────────────────────────
// Ubin TDEE — kalkulator kalori dan makro yang tinggal di beranda.
//
// Halaman Macro Lab sudah menghitung semuanya, tetapi angka yang harus dicari
// lewat tiga ketukan adalah angka yang tidak pernah dilihat. Yang menentukan
// pilihan makan adalah tahu sasaran kalori dan gram protein hari ini SEBELUM
// memilih, bukan sesudah.
//
// Rumusnya TIDAK disalin: ia dipanggil dari lib/tdee.ts yang sama dengan yang
// dipakai halaman. Dua salinan rumus pasti akan berbeda suatu hari, dan dua
// angka kalori yang bertentangan di aplikasi yang sama lebih buruk daripada
// tidak ada angka sama sekali.
//
// TUJUAN dan TINGKAT AKTIVITAS diubah langsung di ubin dan disimpan, sebab
// keduanya berubah jauh lebih sering daripada berat dan tinggi — dan menyuruh
// orang membuka halaman lain hanya untuk mengganti "defisit" menjadi "rawat"
// adalah cara paling pasti membuat angkanya menjadi usang.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd_tdee_pilihan_v1'

interface Pilihan {
  tujuan: TujuanGizi
  aktivitas: TingkatAktivitas
}

function muatPilihan(): Pilihan {
  try {
    const raw = localStorage.getItem(KUNCI)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Pilihan>
      const tujuan = TUJUAN_GIZI.some((t) => t.id === p.tujuan) ? (p.tujuan as TujuanGizi) : 'rawat'
      const aktivitas = AKTIVITAS_GIZI.some((a) => a.id === p.aktivitas)
        ? (p.aktivitas as TingkatAktivitas)
        : 'sedang'
      return { tujuan, aktivitas }
    }
  } catch {
    /* penyimpanan tidak tersedia — pakai bawaan */
  }
  return { tujuan: 'rawat', aktivitas: 'sedang' }
}

function simpanPilihan(p: Pilihan) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(p))
  } catch {
    /* abaikan */
  }
}

export function UbinTdee() {
  const demo = useMemo(() => getDemo(), [])
  const [berat] = useVitalField('weightKg', demo.weightKg || 0)
  const [tinggi] = useVitalField('heightCm', demo.heightCm || 0)
  const [pilihan, setPilihan] = useState<Pilihan>(muatPilihan)

  const umur = demo.age || 0

  // Tanpa berat dan tinggi, angkanya hanya akan menjadi tebakan yang tampak
  // seperti pengukuran. Lebih baik ubin ini meminta datanya daripada
  // menampilkan 70 kg milik orang lain.
  const lengkap = berat > 0 && tinggi > 0 && umur > 0

  const h = useMemo(
    () =>
      hitungTdee({
        beratKg: berat,
        tinggiCm: tinggi,
        umur,
        sex: demo.sex,
        tujuan: pilihan.tujuan,
        aktivitas: pilihan.aktivitas,
      }),
    [berat, tinggi, umur, demo.sex, pilihan],
  )

  function ubah(p: Partial<Pilihan>) {
    const baru = { ...pilihan, ...p }
    setPilihan(baru)
    simpanPilihan(baru)
  }

  if (!lengkap) {
    return (
      <section>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Daily energy</h2>
          <Link to="/profil" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
            Open →
          </Link>
        </div>
        <div className="kaca rounded-3xl p-3">
          <p className="t-kecil leading-snug text-neutral-500">
            Needs your weight, height, and age. Without all three this would be someone else&apos;s number wearing your
            name.
          </p>
        </div>
      </section>
    )
  }

  const bar = [
    { l: 'Protein', g: h.proteinG, pct: h.pctP, kelas: 'bg-emerald-500' },
    { l: 'Carbs', g: h.karboG, pct: h.pctK, kelas: 'bg-sky-500' },
    { l: 'Fat', g: h.lemakG, pct: h.pctL, kelas: 'bg-amber-500' },
  ]

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Daily energy</h2>
        <Link to="/macro-lab" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          Open →
        </Link>
      </div>

      <div className="kaca rounded-3xl p-3">
        {/* Tiga angka besar lebih dahulu — inilah yang dicari orang. */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { l: 'BMR', v: h.bmr },
            { l: 'TDEE', v: h.tdee },
            { l: 'Target', v: h.target },
          ].map((k) => (
            <div key={k.l} className="rounded-2xl bg-white/60 p-2 dark:bg-white/5">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-400">{k.l}</div>
              <div className="text-[19px] font-black leading-tight tabular-nums text-ink dark:text-white">
                {k.v.toLocaleString()}
              </div>
              <div className="t-mikro text-neutral-400">kcal</div>
            </div>
          ))}
        </div>

        {/* Satu batang bertumpuk: proporsi makro terbaca sekali lihat. */}
        <div className="mt-3">
          <span className="flex h-2.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
            {bar.map((b) => (
              <span key={b.l} className={b.kelas} style={{ width: `${b.pct}%` }} />
            ))}
          </span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {bar.map((b) => (
              <div key={b.l}>
                <div className="flex items-center gap-1">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${b.kelas}`} aria-hidden />
                  <span className="t-mikro font-bold text-neutral-500">{b.l}</span>
                </div>
                <div className="t-kecil font-black tabular-nums text-ink dark:text-white">{b.g} g</div>
                <div className="t-mikro tabular-nums text-neutral-400">{b.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-neutral-200 pt-2 dark:border-white/10">
          <span className="t-mikro font-bold text-neutral-500">Fibre {h.seratG} g</span>
          <span className="t-mikro font-bold text-neutral-500">Water {h.airL} L</span>
          <span className="t-mikro font-bold text-neutral-500">
            Protein {h.proteinLo}-{h.proteinHi} g
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {TUJUAN_GIZI.map((t) => (
            <button
              key={t.id}
              onClick={() => ubah({ tujuan: t.id })}
              aria-pressed={pilihan.tujuan === t.id}
              className={`t-mikro min-h-[36px] rounded-full px-2.5 font-bold ${
                pilihan.tujuan === t.id
                  ? 'bg-brand text-white'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {AKTIVITAS_GIZI.map((a) => (
            <button
              key={a.id}
              onClick={() => ubah({ aktivitas: a.id })}
              aria-pressed={pilihan.aktivitas === a.id}
              className={`t-mikro min-h-[36px] rounded-full px-2.5 font-bold ${
                pilihan.aktivitas === a.id
                  ? 'bg-brand text-white'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <p className="t-mikro mt-2 leading-snug text-neutral-400">
          Mifflin-St Jeor for BMR, then an activity factor. Both carry real error — the activity factor especially. Treat
          this as a starting point to adjust against your own weight trend, not a measurement.
        </p>
      </div>
    </section>
  )
}

export default UbinTdee
