import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getWorkouts } from '../lib/workoutStore'
import { useStore } from '../lib/store'
import { ambilRiwayat } from '../lib/riwayatVitals'

// ─────────────────────────────────────────────────────────────────────────────
// Widget motivasi — DARI ANGKA SENDIRI, bukan dari kalimat semangat buatan.
//
// Kalimat semangat yang dikarang mesin ("Kamu hebat! Terus semangat!") terasa
// kosong justru pada hari yang buruk, karena ia diucapkan tanpa mengetahui apa
// pun tentang harinya. Yang menggerakkan orang adalah BUKTI bahwa usahanya
// tercatat: berapa hari berturut-turut, dan pekan ini dibanding pekan lalu.
// Keduanya fakta, dapat diperiksa, dan tidak berubah menjadi bohong pada hari
// ketika angkanya turun — pada hari itu ia memang menunjukkan penurunan.
//
// KUTIPANNYA DIKUTIP DENGAN ALAMAT, bukan "kata pepatah". Hanya kutipan yang
// dapat ditunjuk sumbernya secara persis yang dimuat; itu sebabnya daftarnya
// pendek. Kutipan tanpa alamat tidak dapat diperiksa, dan yang tidak dapat
// diperiksa tidak layak dipajang di aplikasi yang seluruh isinya bersumber.
// ─────────────────────────────────────────────────────────────────────────────

const KUTIPAN: { teks: string; sumber: string }[] = [
  { teks: 'Maka sesungguhnya bersama kesulitan ada kemudahan.', sumber: 'QS Al-Insyirah 94:5' },
  { teks: 'Allah tidak membebani seseorang melainkan sesuai kesanggupannya.', sumber: 'QS Al-Baqarah 2:286' },
  { teks: 'Allah tidak mengubah keadaan suatu kaum sehingga mereka mengubah apa yang ada pada diri mereka.', sumber: 'QS Ar-Ra’d 13:11' },
  { teks: 'Life is short, the art of medicine long, opportunity fleeting, experiment dangerous, judgement difficult.', sumber: 'Hippocrates, Aphorisms I.1' },
]

const HARI = 864e5

/** Hari berturut-turut dengan jejak apa pun, dihitung mundur dari hari ini. */
function rangkaianHari(tanggal: Set<string>): number {
  const kunci = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  let n = 0
  // Hari ini boleh belum terisi tanpa memutus rangkaian: harinya belum selesai.
  for (let i = tanggal.has(kunci(new Date())) ? 0 : 1; i < 400; i++) {
    if (!tanggal.has(kunci(new Date(Date.now() - i * HARI)))) break
    n += 1
  }
  return n
}

export function UbinMotivasi() {
  const { state } = useStore()

  const { rangkaian, pekanIni, pekanLalu, hariAktifPekan } = useMemo(() => {
    const kunci = (t: number) => {
      const d = new Date(t)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }
    const jejak = new Set<string>()
    for (const w of getWorkouts()) jejak.add(kunci(Date.parse(w.mulai)))
    for (const s of state.sleepLogs ?? []) if (s?.date) jejak.add(kunci(Date.parse(s.date)))
    for (const t of Object.keys(state.wellness ?? {})) jejak.add(kunci(Date.parse(t)))
    for (const h of ambilRiwayat()) if (h?.tanggal) jejak.add(kunci(Date.parse(h.tanggal)))

    let pekanIni = 0
    let pekanLalu = 0
    for (const w of getWorkouts()) {
      const umur = Date.now() - Date.parse(w.mulai)
      const menit = Math.round((w.durasi ?? 0) / 60)
      if (umur < 7 * HARI) pekanIni += menit
      else if (umur < 14 * HARI) pekanLalu += menit
    }
    let hariAktifPekan = 0
    for (let i = 0; i < 7; i++) {
      if (jejak.has(kunci(Date.now() - i * HARI))) hariAktifPekan += 1
    }
    return { rangkaian: rangkaianHari(jejak), pekanIni, pekanLalu, hariAktifPekan }
  }, [state.sleepLogs, state.wellness])

  const kutipan = KUTIPAN[Math.floor(Date.now() / HARI) % KUTIPAN.length]
  const ada = rangkaian > 0 || pekanIni > 0

  // Cincin tujuh hari: berapa hari dari tujuh terakhir yang meninggalkan jejak.
  const r = 22
  const keliling = 2 * Math.PI * r
  const terpakai = (hariAktifPekan / 7) * keliling

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">This week</h2>
        <Link to="/harian" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          Log →
        </Link>
      </div>

      <div className="kaca rounded-3xl p-3">
        <div className="flex items-center gap-3">
          <span className="relative grid h-14 w-14 shrink-0 place-items-center">
            <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
              <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" stroke="currentColor" className="text-neutral-200 dark:text-white/10" />
              <circle
                cx="28" cy="28" r={r} fill="none" strokeWidth="5" strokeLinecap="round" stroke="currentColor"
                className="text-brand cahaya-hijau" strokeDasharray={`${terpakai.toFixed(1)} ${keliling}`}
                transform="rotate(-90 28 28)"
              />
            </svg>
            <span className="absolute text-[15px] font-black tabular-nums text-ink dark:text-white">{hariAktifPekan}/7</span>
          </span>

          <div className="min-w-0 flex-1">
            {ada ? (
              <>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[24px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{rangkaian}</span>
                  <span className="t-mikro font-bold text-neutral-400">hari berturut-turut</span>
                </span>
                {/* Perbandingan dua pekan, digambar sebagai dua batang dengan
                    dasar nol dan pembagi yang sama — bukan sebagai persen.
                    Persen dari angka kecil membesar-besarkan: 20 menit menjadi
                    40 menit terbaca "+100%" padahal selisihnya satu sesi. */}
                <span className="mt-1.5 block">
                  {[
                    { l: 'This week', v: pekanIni, n: 'bg-brand' },
                    { l: 'Last week', v: pekanLalu, n: 'bg-neutral-400 dark:bg-white/30' },
                  ].map((x) => (
                    <span key={x.l} className="mt-0.5 flex items-center gap-1.5">
                      <span className="t-mikro w-[52px] shrink-0 text-neutral-400">{x.l}</span>
                      <span className="h-2 flex-1 rounded-full bg-neutral-200 dark:bg-white/10">
                        <span
                          className={`block h-full rounded-full ${x.n}`}
                          style={{ width: `${Math.max(x.v > 0 ? 4 : 0, (x.v / Math.max(1, pekanIni, pekanLalu)) * 100)}%` }}
                        />
                      </span>
                      <span className="t-mikro w-[46px] shrink-0 text-right tabular-nums text-neutral-500">{x.v} min</span>
                    </span>
                  ))}
                </span>
              </>
            ) : (
              <span className="t-kecil text-neutral-500">Nothing logged this week yet.</span>
            )}
          </div>
        </div>

        <p className="t-mikro mt-2.5 border-t border-neutral-100 pt-2 leading-snug text-neutral-500 dark:border-white/10 dark:text-neutral-400">
          {kutipan.teks} <span className="text-neutral-400">— {kutipan.sumber}</span>
        </p>
      </div>
    </section>
  )
}

export default UbinMotivasi
