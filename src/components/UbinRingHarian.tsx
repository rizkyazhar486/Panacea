import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useJam } from '../lib/useJam'
import { getWorkouts } from '../lib/workoutStore'
import { getVitals } from '../lib/healthVitals'
import { getDemo } from '../lib/profile'
import { hrMaxFromAge } from '../lib/workoutImport'
import { deretMetrik, rentangPribadi } from '../lib/riwayatVitals'
import { kesiapan } from '../lib/trainingPhysiology'

// Label kesiapan dari trainingPhysiology adalah DATA berbahasa Indonesia yang
// dipakai juga di layar lain; dipetakan ke antarmuka di sini, bukan diubah di
// sumbernya.
const SIAP_EN: Record<string, string> = {
  Siap: 'Ready',
  'Adequate siap': 'Fairly ready',
  Sedang: 'Moderate',
  Rendah: 'Low',
  'Sangat rendah': 'Very low',
}
import { siapkan, bebanHarian } from '../lib/athlytic'

// ─────────────────────────────────────────────────────────────────────────────
// Ringkasan hari sebagai CINCIN, bukan sebagai kalimat.
//
// Empat pertanyaan yang ditanyakan tiap pagi dan tiap sore, dijawab oleh empat
// bentuk yang dapat dibaca tanpa dieja: seberapa pulih, seberapa berat hari
// ini, apakah cukup bergerak, dan apakah cukup tidur.
//
// TIAP CINCIN PUNYA PEMBANDINGNYA SENDIRI, DAN PEMBANDING ITU MILIK ORANG INI.
// Upaya hari ini dibandingkan dengan hari latihan Anda yang biasa, bukan
// dengan angka umum; tidur dibandingkan dengan sasaran Anda. Cincin yang
// penuh terhadap patokan orang lain tidak memberi tahu apa pun.
//
// CINCIN YANG DATANYA TIDAK ADA TIDAK DIGAMBAR SETENGAH — ia digambar sebagai
// cincin kosong dengan tanda hubung. Cincin yang terisi 0% terbaca sebagai
// "Anda tidak melakukan apa pun", padahal yang benar adalah "kami tidak tahu".
// ─────────────────────────────────────────────────────────────────────────────

function Cincin({
  label, nilai, dari, warna, tampil,
}: {
  label: string
  nilai: number | null
  dari: string
  warna: string
  tampil: string
}) {
  const pct = nilai == null ? 0 : Math.max(0, Math.min(100, nilai))
  const r = 26
  const keliling = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-[64px] w-[64px]">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className="stroke-neutral-200 dark:stroke-white/10" />
          {/* Busur digambar hanya bila panjangnya nyata. Dengan
              strokeLinecap "round", panjang nol tetap melukis satu titik
              bulat — dan titik itu terbaca sebagai kemajuan yang tidak ada. */}
          {nilai != null && pct > 0.5 && (
            <circle
              cx="32" cy="32" r={r} fill="none" strokeWidth="7" strokeLinecap="round"
              stroke={warna}
              strokeDasharray={`${(pct / 100) * keliling} ${keliling}`}
              style={{ filter: `drop-shadow(0 0 4px ${warna}aa)` }}
            />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="tinta-aksen text-[14px] font-black tabular-nums" style={{ ["--aksen" as string]: nilai == null ? undefined : warna }}>
            {tampil}
          </span>
        </span>
      </div>
      <span className="t-mikro font-black uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="t-mikro text-center leading-tight text-neutral-400">{dari}</span>
    </div>
  )
}

export function UbinRingHarian() {
  const sekarang = useJam()

  const d = useMemo(() => {
    const v = getVitals()
    const demo = getDemo()
    const usia = demo.age > 0 ? demo.age : 30
    const jk: 'M' | 'F' = demo.sex === 'F' ? 'F' : 'M'
    const workouts = getWorkouts()
    const k = {
      hrMax: workouts.reduce((a, w) => Math.max(a, w.maxHr ?? 0), 0) || hrMaxFromAge(usia, jk),
      hrRest: typeof v.restingHr === 'number' && v.restingHr > 0 ? v.restingHr : 60,
      sex: jk,
    }

    // PEMULIHAN — dari mesin kesiapan yang sudah ada, terhadap kebiasaan sendiri.
    const hrvDeret = deretMetrik('hrvMs', 60)
    const rhrDeret = deretMetrik('restingHr', 60)
    const rata = (l: { nilai: number }[]) => (l.length ? l.reduce((a, x) => a + x.nilai, 0) / l.length : undefined)
    const kes = kesiapan({
      tidurJam: typeof v.sleepH === 'number' ? v.sleepH : undefined,
      hrvMs: typeof v.hrvMs === 'number' ? v.hrvMs : undefined,
      hrvBaseline: rata(hrvDeret),
      restingHr: typeof v.restingHr === 'number' ? v.restingHr : undefined,
      restingBaseline: rata(rhrDeret),
    })
    const pemulihan = kes.faktor.length > 0 ? kes.skor : null

    // UPAYA — beban hari ini terhadap hari LATIHAN yang biasa, bukan terhadap
    // rata-rata semua hari (yang diturunkan oleh hari istirahat).
    let upaya: number | null = null
    let upayaTampil = '—'
    let upayaDari = 'no session logged'
    if (workouts.length >= 3) {
      const sesi = siapkan(workouts, k)
      const harian = bebanHarian(sesi, 60, sekarang)
      const hariIni = harian[harian.length - 1]?.beban ?? 0
      const berlatih = harian.slice(0, -1).filter((x) => x.beban > 0).map((x) => x.beban)
      if (berlatih.length >= 3) {
        const biasa = berlatih.reduce((a, b) => a + b, 0) / berlatih.length
        upaya = Math.round((hariIni / biasa) * 100)
        upayaTampil = String(Math.round(hariIni))
        upayaDari = `usual ${Math.round(biasa)}`
      } else if (hariIni > 0) {
        upayaTampil = String(Math.round(hariIni))
        upayaDari = 'not enough history'
      }
    }

    // LANGKAH — sasaran dari kebiasaan sendiri bila ada, kalau tidak 8.000.
    const langkahKini = typeof v.steps === 'number' ? v.steps : null
    const rentangLangkah = rentangPribadi('steps', langkahKini ?? undefined)
    const sasaranLangkah = rentangLangkah ? Math.round(rentangLangkah.atas) : 8000

    // TIDUR — terhadap 8 jam, batas atas anjuran umum dewasa.
    const tidur = typeof v.sleepH === 'number' ? v.sleepH : null

    return {
      pemulihan,
      pemulihanLabel: SIAP_EN[kes.label] ?? kes.label,
      upaya, upayaTampil, upayaDari,
      langkah: langkahKini,
      sasaranLangkah,
      tidur,
    }
  }, [sekarang])

  const adaSesuatu = d.pemulihan != null || d.upaya != null || d.langkah != null || d.tidur != null
  if (!adaSesuatu) return null

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Today</h2>
        <Link to="/athlete-board" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          Board →
        </Link>
      </div>

      <div className="kaca rounded-3xl p-3">
        <div className="grid grid-cols-4 gap-1">
          <Cincin
            label="Recovery"
            nilai={d.pemulihan}
            tampil={d.pemulihan == null ? '—' : String(d.pemulihan)}
            dari={d.pemulihan == null ? 'needs HRV or sleep' : d.pemulihanLabel}
            warna={d.pemulihan == null ? '#94a3b8' : d.pemulihan >= 65 ? '#34d399' : d.pemulihan >= 45 ? '#fbbf24' : '#f87171'}
          />
          <Cincin
            label="Exertion"
            nilai={d.upaya}
            tampil={d.upayaTampil}
            dari={d.upayaDari}
            warna="#fbbf24"
          />
          <Cincin
            label="Steps"
            nilai={d.langkah == null ? null : (d.langkah / d.sasaranLangkah) * 100}
            tampil={d.langkah == null ? '—' : d.langkah >= 1000 ? `${(d.langkah / 1000).toFixed(1)}k` : String(d.langkah)}
            dari={d.langkah == null ? 'no step data' : `of ${(d.sasaranLangkah / 1000).toFixed(0)}k`}
            warna="#38bdf8"
          />
          <Cincin
            label="Sleep"
            nilai={d.tidur == null ? null : (d.tidur / 8) * 100}
            tampil={d.tidur == null ? '—' : `${d.tidur.toFixed(1)}`}
            dari={d.tidur == null ? 'no sleep data' : 'of 8 h'}
            warna="#a78bfa"
          />
        </div>

        <p className="t-mikro mt-2 leading-snug text-neutral-400">
          Exertion and steps are measured against YOUR own usual, not a general target — a ring that is full against
          someone else&apos;s benchmark tells you nothing. An empty ring with a dash means the data is missing, which
          is not the same as a zero.
        </p>
      </div>
    </section>
  )
}

export default UbinRingHarian
