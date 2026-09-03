import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { ambilRiwayat } from '../lib/riwayatVitals'
import { hariIni as tanggalHariIni } from '../lib/ukurBerkala'

// ─────────────────────────────────────────────────────────────────────────────
// Enam widget penutup: pemeriksaan penglihatan, waktu layar, peregangan,
// tekanan darah pagi-sore, rangkaian kebiasaan, dan penyesuaian jet lag.
//
// Semua yang tersisa dari daftar panjang yang datanya benar-benar dapat
// dikumpulkan aplikasi ini sendiri. Yang tidak dapat — kebisingan lingkungan,
// tekanan darah dari manset pintar, gelombang otak — tetap tidak dibuat,
// karena widget yang menampilkan angka yang tidak diukur selalu terlihat
// meyakinkan, dan justru itu bahayanya.
// ─────────────────────────────────────────────────────────────────────────────

const HARI = 864e5

function Kepala({ judul, ke, kanan }: { judul: string; ke?: string; kanan?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      {kanan ?? (ke ? <Link to={ke} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">Open →</Link> : null)}
    </div>
  )
}

function kunciHari(n: number): string {
  const d = new Date(Date.now() - n * HARI)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ── Amsler: pemeriksaan penglihatan sendiri ────────────────────────────────
//
// Kisi Amsler dipakai untuk memeriksa penglihatan tengah — garis yang tampak
// bengkok, kabur, atau ada bagian yang hilang. YANG TIDAK BOLEH DIJANJIKAN:
// ini bukan pemeriksaan mata, tidak mendiagnosis apa pun, dan tidak
// menggantikan pemeriksaan funduskopi. Ia hanya alat pemantauan mandiri yang
// memang lazim diberikan dokter mata kepada pasien tertentu untuk dipakai di
// rumah — dan gunanya satu: menyadari PERUBAHAN lebih awal, lalu memeriksakan.
const KUNCI_AMSLER = 'pmd_amsler_v1'

export function UbinAmsler() {
  const [buka, setBuka] = useState(false)
  const [riwayat, setRiwayat] = useState<{ tanggal: string; hasil: 'normal' | 'berubah' }[]>(() => {
    try { return JSON.parse(localStorage.getItem(KUNCI_AMSLER) || '[]') } catch { return [] }
  })

  const catat = (hasil: 'normal' | 'berubah') => {
    const baru = [...riwayat, { tanggal: tanggalHariIni(), hasil }].slice(-40)
    setRiwayat(baru)
    try { localStorage.setItem(KUNCI_AMSLER, JSON.stringify(baru)) } catch { /* kuota */ }
    setBuka(false)
  }

  const akhir = riwayat[riwayat.length - 1]
  const umur = akhir ? Math.floor((Date.now() - Date.parse(`${akhir.tanggal}T00:00:00`)) / HARI) : null

  return (
    <section>
      <Kepala
        judul="Amsler grid"
        kanan={
          <button onClick={() => setBuka((v) => !v)} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
            {buka ? 'Close' : 'Start'}
          </button>
        }
      />
      <div className="kaca rounded-3xl p-3">
        {buka ? (
          <>
            <p className="t-mikro leading-snug text-neutral-500 dark:text-neutral-400">
              Wear your reading glasses if you normally do. Cover one eye and look at the centre dot from your usual
              reading distance (about 30 cm), then take in the whole grid without moving your gaze. Repeat for the other eye.
            </p>
            {/* Kisi digambar sebagai SVG, bukan gambar: ia harus tajam pada
                layar kerapatan berapa pun, dan garis yang buram karena gambar
                diperbesar akan disangka kelainan penglihatan. */}
            <svg viewBox="0 0 200 200" className="mx-auto mt-2 block w-full max-w-[280px] rounded-xl bg-white" role="img" aria-label="Kisi Amsler">
              {Array.from({ length: 21 }, (_, i) => (
                <g key={i}>
                  <line x1={i * 10} y1="0" x2={i * 10} y2="200" stroke="#111" strokeWidth="0.5" />
                  <line x1="0" y1={i * 10} x2="200" y2={i * 10} stroke="#111" strokeWidth="0.5" />
                </g>
              ))}
              <circle cx="100" cy="100" r="3" fill="#111" />
            </svg>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button onClick={() => catat('normal')} className="t-kecil min-h-[44px] rounded-2xl bg-brand font-bold text-white">
                All lines straight
              </button>
              <button onClick={() => catat('berubah')} className="t-kecil min-h-[44px] rounded-2xl bg-amber-500 font-bold text-white">
                Something bent or missing
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className={`t-sedang font-black ${akhir?.hasil === 'berubah' ? 'text-amber-500' : 'text-ink dark:text-white'}`}>
                {akhir ? (akhir.hasil === 'berubah' ? 'Change noted' : 'Lines straight') : 'Never'}
              </span>
              {umur != null && (
                <span className="t-mikro ml-auto shrink-0 text-neutral-400">
                  {umur === 0 ? 'today' : `${umur} d ago`}
                </span>
              )}
            </div>
            {akhir?.hasil === 'berubah' && (
              <p className="t-kecil mt-1.5 leading-snug text-amber-600 dark:text-amber-400">
                A change on this grid is worth taking to an eye doctor rather than waiting out.
              </p>
            )}
          </>
        )}
        <p className="t-mikro mt-2 leading-snug text-neutral-400">
          A self-monitoring tool — not an eye examination and not a diagnosis. Its purpose is to notice a change early, then get it looked at.
        </p>
      </div>
    </section>
  )
}

// ── Waktu layar terfokus ───────────────────────────────────────────────────
//
// Yang dihitung BUKAN seluruh waktu memakai telepon — aplikasi web tidak dapat
// melihatnya, dan mengaku bisa berarti berbohong. Yang dihitung menit sesi
// fokus yang benar-benar dijalankan lewat widget Sesi Fokus, ditambah menit
// pewaktu 20-20-20 yang berjalan. Bedanya disebut supaya angkanya tidak
// disalahartikan sebagai laporan pemakaian layar.
const KUNCI_SESI_FOKUS = 'pmd_sesi_fokus_log_v1'

export function catatSesiFokus(menit: number): void {
  try {
    const semua = JSON.parse(localStorage.getItem(KUNCI_SESI_FOKUS) || '[]') as { tanggal: string; menit: number }[]
    semua.push({ tanggal: tanggalHariIni(), menit: Math.max(1, Math.round(menit)) })
    localStorage.setItem(KUNCI_SESI_FOKUS, JSON.stringify(semua.slice(-400)))
    window.dispatchEvent(new Event('panacea:sesi-fokus'))
  } catch { /* kuota */ }
}

export function UbinLayar() {
  const [versi, setVersi] = useState(0)
  useEffect(() => {
    const on = () => setVersi((v) => v + 1)
    window.addEventListener('panacea:sesi-fokus', on)
    return () => window.removeEventListener('panacea:sesi-fokus', on)
  }, [])

  const { hariIni, deret } = useMemo(() => {
    let semua: { tanggal: string; menit: number }[] = []
    try { semua = JSON.parse(localStorage.getItem(KUNCI_SESI_FOKUS) || '[]') } catch { /* abaikan */ }
    const perHari = new Map<string, number>()
    for (const s of semua) perHari.set(s.tanggal, (perHari.get(s.tanggal) ?? 0) + s.menit)
    const deret: number[] = []
    for (let i = 6; i >= 0; i--) deret.push(perHari.get(kunciHari(i)) ?? 0)
    return { hariIni: perHari.get(kunciHari(0)) ?? 0, deret }
  }, [versi])

  if (!deret.some((x) => x > 0)) return null
  const maks = Math.max(...deret, 1)
  const pekan = deret.reduce((a, b) => a + b, 0)

  return (
    <section>
      <Kepala judul="Focus sessions logged" ke="/harian" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{hariIni}</span>
          <span className="t-mikro font-bold text-neutral-400">minutes today</span>
          <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-400">{pekan} min / 7 days</span>
        </div>
        <span className="mt-2 flex h-10 items-end gap-[3px]" aria-hidden>
          {deret.map((v, i) => (
            <span key={i} className={`flex-1 rounded-sm ${v > 0 ? 'bg-brand' : 'bg-neutral-300 dark:bg-white/15'}`} style={{ height: v > 0 ? `${(v / maks) * 100}%` : '3px' }} />
          ))}
        </span>
        <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
          Only the focus sessions you run inside this app are counted — not your total screen time, which a web app genuinely cannot see.
        </p>
      </div>
    </section>
  )
}

// ── Peregangan tiga menit ──────────────────────────────────────────────────
const GERAK = [
  { nama: 'Upper-back rotation', detik: 40, isyarat: 'Sitting or standing, hips facing forward, only the chest turns.' },
  { nama: 'Doorway chest opener', detik: 40, isyarat: 'Forearms on the frame at shoulder height, step forward until you feel the stretch across the chest.' },
  { nama: 'Hip flexor stretch', detik: 40, isyarat: 'Half-kneeling, pelvis tucked forward, abdomen lightly braced.' },
  { nama: 'Hamstring stretch', detik: 40, isyarat: 'Heel on a low chair, back straight, hinge from the hips rather than the spine.' },
  { nama: 'Ankle rocks', detik: 20, isyarat: 'Knee travels past the toes, heel stays on the floor.' },
]

export function UbinPeregangan() {
  const [jalan, setJalan] = useState(false)
  const [mulai, setMulai] = useState(0)
  const [, paksa] = useState(0)
  const getar = useRef(-1)

  useEffect(() => {
    if (!jalan) return
    const id = window.setInterval(() => paksa((n) => n + 1), 250)
    return () => window.clearInterval(id)
  }, [jalan])

  const total = GERAK.reduce((a, g) => a + g.detik, 0)
  const lewat = jalan ? (Date.now() - mulai) / 1000 : 0
  const selesai = jalan && lewat >= total

  useEffect(() => {
    if (!selesai) return
    setJalan(false)
    try { navigator.vibrate?.([200, 100, 200]) } catch { /* — */ }
  }, [selesai])

  let idx = 0
  let sisa = 0
  if (jalan) {
    let t = lewat
    for (let i = 0; i < GERAK.length; i++) {
      if (t < GERAK[i].detik) { idx = i; sisa = GERAK[i].detik - t; break }
      t -= GERAK[i].detik
      idx = i
    }
    if (getar.current !== idx) {
      getar.current = idx
      try { navigator.vibrate?.(60) } catch { /* — */ }
    }
  }

  return (
    <section>
      <Kepala
        judul="3-minute stretch"
        kanan={jalan ? (
          <button onClick={() => setJalan(false)} className="t-kecil flex min-h-[40px] items-center font-bold text-neutral-500">Stop</button>
        ) : undefined}
      />
      <div className="kaca rounded-3xl p-3">
        {!jalan ? (
          <>
            <p className="t-kecil leading-snug text-neutral-600 dark:text-neutral-300">
              Five movements for the parts that stiffen most after long sitting.
            </p>
            <button
              onClick={() => { setMulai(Date.now()); getar.current = -1; setJalan(true) }}
              className="t-kecil mt-2 min-h-[44px] w-full rounded-2xl bg-brand font-bold text-white transition active:scale-[0.98]"
            >
              Start
            </button>
            <p className="t-mikro mt-2 leading-snug text-neutral-400">
              Stretching increases range of motion and feels good; what is not established is the claim that it prevents injury or removes muscle soreness after training.
            </p>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand text-[20px] font-black tabular-nums text-white cahaya-hijau">
              {Math.ceil(sisa)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="t-kecil block font-black text-ink dark:text-white">{GERAK[idx].nama}</span>
              <span className="t-mikro block leading-snug text-neutral-500 dark:text-neutral-400">{GERAK[idx].isyarat}</span>
              <span className="t-mikro mt-1 block text-neutral-400">{idx + 1} dari {GERAK.length}</span>
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Tekanan darah pagi vs sore ─────────────────────────────────────────────
export function UbinTekananPagiSore() {
  const { pagi, sore } = useMemo(() => {
    const pagi: number[] = []
    const sore: number[] = []
    for (const h of ambilRiwayat().slice(-30)) {
      const s = h.nilai?.systolic
      if (typeof s !== 'number') continue
      // Riwayat menyimpan satu baris per hari, jadi pemisahan pagi-sore hanya
      // dapat dilakukan bila jamnya ikut tercatat. Bila tidak, seluruh bacaan
      // masuk satu deret dan itu dinyatakan apa adanya di bawah.
      const jam = typeof h.nilai?.jamUkur === 'number' ? (h.nilai.jamUkur as number) : null
      if (jam == null) pagi.push(s)
      else if (jam < 12) pagi.push(s)
      else sore.push(s)
    }
    return { pagi, sore }
  }, [])

  if (pagi.length + sore.length < 3) return null
  const rata = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
  const semua = [...pagi, ...sore]
  const rentang = Math.max(...semua) - Math.min(...semua)

  return (
    <section>
      <Kepala judul="Blood pressure spread" ke="/tubuh" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{Math.round(rata(semua))}</span>
          <span className="t-mikro font-bold text-neutral-400">mmHg systolic, mean of {semua.length} readings</span>
        </div>
        <span className="mt-2 flex h-10 items-end gap-[2px]" aria-hidden>
          {semua.slice(-20).map((v, i) => {
            const min = Math.min(...semua) - 5
            const maks = Math.max(...semua) + 5
            return <span key={i} className="flex-1 rounded-sm bg-rose-400" style={{ height: `${Math.max(8, ((v - min) / Math.max(1, maks - min)) * 100)}%` }} />
          })}
        </span>
        <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
          A spread of {Math.round(rentang)} mmHg between readings. Swings of a dozen or more mmHg between occasions are normal — which is why a diagnosis of hypertension uses the mean of several readings on different days, not a single highest figure.
        </p>
      </div>
    </section>
  )
}

// ── Rangkaian kebiasaan ────────────────────────────────────────────────────
export function UbinRangkaian() {
  const { state } = useStore()

  const baris = useMemo(() => {
    const w = state.wellness ?? {}
    const hitung = (uji: (h: Record<string, unknown> | undefined) => boolean) => {
      let n = 0
      for (let i = uji(w[kunciHari(0)] as never) ? 0 : 1; i < 90; i++) {
        if (!uji(w[kunciHari(i)] as never)) break
        n += 1
      }
      return n
    }
    return [
      { label: 'Daily notes', n: hitung((h) => !!h) },
      { label: 'Morning light', n: hitung((h) => !!(h as { sunDone?: boolean })?.sunDone) },
      { label: 'Energy logged', n: hitung((h) => typeof (h as { tenaga?: number })?.tenaga === 'number') },
    ]
  }, [state.wellness])

  if (!baris.some((b) => b.n > 0)) return null
  const maks = Math.max(...baris.map((b) => b.n), 1)

  return (
    <section>
      <Kepala judul="Habit streaks" ke="/harian" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex flex-col gap-2">
          {baris.map((b) => (
            <span key={b.label} className="flex items-center gap-2">
              <span className="t-mikro w-[92px] shrink-0 truncate text-neutral-500">{b.label}</span>
              <span className="h-2.5 flex-1 rounded-full bg-neutral-200 dark:bg-white/10">
                <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(b.n > 0 ? 6 : 0, (b.n / maks) * 100)}%` }} />
              </span>
              <span className="t-kecil w-10 shrink-0 text-right font-black tabular-nums text-ink dark:text-white">{b.n}</span>
            </span>
          ))}
        </div>
        {/* TIDAK ADA HUKUMAN SAAT RANGKAIAN PUTUS. Angkanya mulai dari nol lagi
            dan itu saja — tanpa nyala merah, tanpa kalimat kecewa. Rangkaian
            yang menghukum membuat orang berhenti mencatat sama sekali sesudah
            satu hari terlewat, dan yang hilang bukan rangkaiannya melainkan
            datanya. */}
        <p className="t-mikro mt-2 text-neutral-400">Days in a row. Breaking one means starting from one again — nothing is lost except the count.</p>
      </div>
    </section>
  )
}

// ── Penyesuaian jet lag ────────────────────────────────────────────────────
//
// Aturan yang dipakai luas: jam biologis bergeser kira-kira satu jam per hari,
// dan arah geser menentukan alat bantunya — ke timur (hari menjadi lebih
// pendek) dibantu cahaya pagi di tujuan, ke barat dibantu cahaya sore. Yang
// TIDAK dilakukan: menganjurkan dosis melatonin. Itu obat, aturannya berbeda
// antar-orang dan antar-negara, dan menganjurkannya lewat widget berarti
// memberi resep tanpa mengetahui apa pun tentang pemakainya.
const KUNCI_JETLAG = 'pmd_jetlag_v1'

export function UbinJetLag() {
  const [selisih, setSelisih] = useState('0')
  const [tanggal, setTanggal] = useState('')

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(KUNCI_JETLAG) || 'null')
      if (d && typeof d.selisih === 'string') { setSelisih(d.selisih); setTanggal(d.tanggal ?? '') }
    } catch { /* abaikan */ }
  }, [])

  const simpan = (s: string, t: string) => {
    setSelisih(s); setTanggal(t)
    try { localStorage.setItem(KUNCI_JETLAG, JSON.stringify({ selisih: s, tanggal: t })) } catch { /* kuota */ }
  }

  const jam = Number(selisih) || 0
  const hariLagi = tanggal ? Math.ceil((Date.parse(`${tanggal}T00:00:00`) - Date.now()) / HARI) : null
  const perluHari = Math.abs(jam)
  const keTimur = jam > 0

  return (
    <section>
      <Kepala judul="Jet lag" ke="/harian" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex gap-1.5">
          <select
            value={selisih}
            onChange={(e) => simpan(e.target.value, tanggal)}
            aria-label="Destination hour difference"
            className="t-kecil min-w-0 flex-1 rounded-xl border border-neutral-200 bg-transparent px-2 py-2 text-ink dark:border-white/12 dark:text-white"
          >
            {Array.from({ length: 25 }, (_, i) => i - 12).map((n) => (
              <option key={n} value={String(n)}>{n === 0 ? 'Same' : n > 0 ? `+${n} h (east)` : `${n} h (west)`}</option>
            ))}
          </select>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => simpan(selisih, e.target.value)}
            aria-label="Departure date"
            className="t-kecil min-w-0 flex-1 rounded-xl border border-neutral-200 bg-transparent px-2 py-2 text-ink dark:border-white/12 dark:text-white"
          />
        </div>

        {jam === 0 ? (
          <p className="t-kecil mt-2 text-neutral-500">Enter the hour difference at your destination and your departure date.</p>
        ) : (
          <>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{perluHari}</span>
              <span className="t-mikro font-bold text-neutral-400">days to adjust</span>
              {hariLagi != null && (
                <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-400">
                  {hariLagi > 0 ? `departing in ${hariLagi} d` : 'already departed'}
                </span>
              )}
            </div>
            <p className="t-kecil mt-1.5 leading-snug text-neutral-600 dark:text-neutral-300">
              {keTimur
                ? `Heading east: bring your bedtime forward ${perluHari > 3 ? 'one hour per day' : `by an hour on ${perluHari} days`} before departure, and seek bright light in the morning once you arrive.`
                : `Heading west: push your bedtime later ${perluHari > 3 ? 'one hour per day' : `by an hour on ${perluHari} days`} before departure, and seek bright light in the afternoon once you arrive.`}
            </p>
            <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
              The body clock shifts roughly an hour a day, so a large difference genuinely cannot be closed at once. There is no melatonin advice here — that is a medicine, and how to use it is your doctor's call.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
