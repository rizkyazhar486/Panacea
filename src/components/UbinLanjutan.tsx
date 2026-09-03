import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWorkouts } from '../lib/workoutStore'
import { hitungSesi } from '../lib/trainingPhysiology'
import { sesiDariWorkout } from '../lib/analisisPro'
import { hrMaxFromAge } from '../lib/workoutImport'
import { getDemo } from '../lib/profile'
import { getVitals } from '../lib/healthVitals'
import { deretMetrik, ambilRiwayat } from '../lib/riwayatVitals'
import { useStore } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Widget lanjutan — yang bisa dihitung JUJUR dari data yang sudah masuk.
//
// Berkas ini lahir dari satu daftar berisi 210 widget yang diinginkan. Yang
// dikerjakan di sini hanya yang datanya benar-benar ada di aplikasi ini, dan
// tiap widget menyebut dari mana angkanya. Yang menuntut alat yang belum
// tersambung (CGM, EEG, dinamometer) atau yang bentuknya ramalan gabungan
// (usia biologis, perkiraan sisa umur) sengaja TIDAK dibuat: widget yang
// menampilkan angka yang tidak diukur akan selalu terlihat meyakinkan, dan di
// aplikasi kesehatan itu justru bahayanya.
// ─────────────────────────────────────────────────────────────────────────────

const HARI = 864e5

function Kepala({ judul, ke, kanan }: { judul: string; ke?: string; kanan?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      {kanan ?? (ke ? (
        <Link to={ke} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">Open →</Link>
      ) : null)}
    </div>
  )
}

function median(a: number[]): number {
  if (!a.length) return 0
  const s = [...a].sort((x, y) => x - y)
  const t = Math.floor(s.length / 2)
  return s.length % 2 ? s[t] : (s[t - 1] + s[t]) / 2
}

function konteksLatihan() {
  const sesi = getWorkouts()
  const demo = getDemo()
  const usia = demo.age > 0 ? demo.age : 30
  const jk: 'M' | 'F' = demo.sex === 'F' ? 'F' : 'M'
  const v = getVitals()
  return {
    sesi,
    k: {
      hrMax: sesi.reduce((a, w) => Math.max(a, w.maxHr ?? 0), 0) || hrMaxFromAge(usia, jk),
      hrRest: typeof v.restingHr === 'number' && v.restingHr > 0 ? v.restingHr : 60,
      sex: jk,
    },
  }
}

// ── Zona 2 sepekan ─────────────────────────────────────────────────────────
//
// Menit di zona 2 (60-70% denyut maksimal) selama tujuh hari terakhir, dihitung
// dari deret denyut tiap sesi — bukan dari jenis olahraganya. Anjuran yang
// paling sering dikutip adalah 150-180 menit sepekan; yang ditampilkan di sini
// adalah menitnya sendiri beserta garis anjuran itu, bukan nilai lulus/gagal.
export function UbinZona2() {
  const { sesi, k } = useMemo(konteksLatihan, [])
  const menit = useMemo(() => {
    const pekan = sesi.filter((w) => Date.now() - Date.parse(w.mulai) < 7 * HARI && w.hr.length >= 2)
    if (!pekan.length) return null
    const terhitung = hitungSesi(pekan.map(sesiDariWorkout), k)
    return terhitung.reduce((a, s) => a + (s.zona.find((z) => z.z === 2)?.menit ?? 0), 0)
  }, [sesi, k])

  if (menit == null) return null
  const sasaran = 150

  return (
    <section>
      <Kepala judul="Zone 2 · 7 days" ke="/latihan?t=analisis" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{Math.round(menit)}</span>
          <span className="t-mikro font-bold text-neutral-400">minutes at 60–70% of max HR</span>
        </div>
        {/* Bilah dengan penanda anjuran pada 150 menit. Bilah dipotong pada
            200 menit supaya menit di atas anjuran tetap terlihat sebagai
            kelebihan, bukan menempel di ujung tanpa keterangan. */}
        <span className="relative mt-2 block h-2.5 w-full rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
          <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (menit / 200) * 100)}%` }} />
          <span className="absolute inset-y-0 w-px bg-neutral-500 dark:bg-white/50" style={{ left: `${(sasaran / 200) * 100}%` }} />
        </span>
        <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
          The line marks 150 min/week, the WHO moderate-activity recommendation. Calculated from each session's heart-rate series, not from the sport you picked.
        </p>
      </div>
    </section>
  )
}

// ── Pemulihan denyut satu menit ────────────────────────────────────────────
//
// Turunnya denyut pada menit pertama sesudah sesi berakhir (HRR1). Sudah
// dihitung saat impor dari deret nyata; di sini hanya dikumpulkan. Penurunan
// yang lebih besar umumnya menyertai kebugaran yang lebih baik, tetapi ANGKA
// AMBANG tidak ditulis: batas "≤12 bpm" berasal dari uji treadmill dengan
// pendinginan terkendali, dan sesi lapangan tidak memenuhi syarat itu.
export function UbinPemulihanDenyut() {
  const deret = useMemo(() => {
    return getWorkouts()
      .filter((w) => typeof w.hrr1 === 'number' && w.hrr1 > 0)
      .sort((a, b) => Date.parse(a.mulai) - Date.parse(b.mulai))
      .slice(-10)
      .map((w) => ({ nilai: w.hrr1 as number, tanggal: w.mulai }))
  }, [])

  if (deret.length < 2) return null
  const akhir = deret[deret.length - 1].nilai
  const maks = Math.max(...deret.map((d) => d.nilai))

  return (
    <section>
      <Kepala judul="1-minute heart rate recovery" ke="/latihan?t=analisis" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">−{akhir}</span>
          <span className="t-mikro font-bold text-neutral-400">bpm, last session</span>
          <span className="t-mikro ml-auto shrink-0 text-neutral-400">{deret.length} sesi</span>
        </div>
        <span className="mt-2 flex h-10 items-end gap-[3px]" aria-hidden>
          {deret.map((d, i) => (
            <span key={i} className="flex-1 rounded-sm bg-rose-400" style={{ height: `${Math.max(10, (d.nilai / maks) * 100)}%` }} />
          ))}
        </span>
        <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
          The drop between your heart rate at the end of a session and one minute later. Read the direction; no standard threshold is quoted here, because those come from controlled treadmill testing rather than field sessions.
        </p>
      </div>
    </section>
  )
}

// ── Utang tidur ────────────────────────────────────────────────────────────
//
// Selisih tujuh malam terakhir terhadap KEBIASAAN SENDIRI, bukan terhadap
// delapan jam. Kebutuhan tidur berbeda tiap orang, dan menagih semua orang
// dengan angka yang sama membuat sebagian merasa gagal setiap hari.
export function UbinUtangTidur() {
  const { state } = useStore()
  const { utang, malam, biasa } = useMemo(() => {
    const peta = new Map<string, number>()
    for (const t of deretMetrik('sleepH')) peta.set(t.tanggal, t.nilai)
    for (const s of state.sleepLogs ?? []) if (s?.date && s.hours > 0) peta.set(s.date, s.hours)
    const kunci = (n: number) => {
      const d = new Date(Date.now() - n * HARI)
      const p = (x: number) => String(x).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
    }
    const semua = [...peta.values()]
    const biasa = median(semua)
    const malam: number[] = []
    for (let i = 6; i >= 0; i--) malam.push(peta.get(kunci(i)) ?? 0)
    const tercatat = malam.filter((x) => x > 0)
    const utang = tercatat.length ? tercatat.reduce((a, b) => a + (b - biasa), 0) : null
    return { utang, malam, biasa }
  }, [state.sleepLogs])

  if (utang == null || biasa <= 0) return null

  return (
    <section>
      <Kepala judul="Sleep debt, 7 nights" ke="/pola-tidur" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-[26px] font-black leading-none tabular-nums ${utang < 0 ? 'text-rose-500' : 'text-brand'}`}>
            {utang >= 0 ? '+' : '−'}{Math.abs(utang).toFixed(1)}
          </span>
          <span className="t-mikro font-bold text-neutral-400">h against your usual</span>
        </div>
        {/* Batang selisih terhadap garis tengah: yang lebih panjang dari
            kebiasaan tumbuh KE ATAS garis, yang lebih pendek ke bawah.
            Percobaan pertama memakai margin otomatis untuk menempelkannya ke
            garis, dan pada tangkapan layar batangnya melayang tidak menyentuh
            garis sama sekali — sekarang tiap batang dipatok mutlak pada garis
            tengah kolomnya sendiri, sehingga tidak dapat meleset. */}
        <span className="mt-2 flex h-12 gap-[3px]" aria-hidden>
          {malam.map((v, i) => {
            const d = v > 0 ? v - biasa : 0
            const tinggi = v === 0 ? 3 : Math.max(4, Math.min(24, (Math.abs(d) / Math.max(0.5, biasa * 0.4)) * 24))
            return (
              <span key={i} className="relative h-full flex-1">
                <span className="absolute inset-x-0 top-1/2 h-px bg-neutral-300 dark:bg-white/20" />
                <span
                  className={`absolute inset-x-0 rounded-sm ${v === 0 ? 'bg-neutral-300 dark:bg-white/15' : d < 0 ? 'bg-rose-400' : 'bg-brand'}`}
                  style={d < 0 ? { top: '50%', height: tinggi } : { bottom: '50%', height: tinggi }}
                />
              </span>
            )
          })}
        </span>
        <p className="t-mikro mt-1.5 text-neutral-400">
          Your baseline is {biasa.toFixed(1)} h · above the line is longer, below is shorter
        </p>
      </div>
    </section>
  )
}

// ── Tekanan darah ──────────────────────────────────────────────────────────
export function UbinTekanan() {
  const { sis, dia, deret } = useMemo(() => {
    const v = getVitals()
    const riwayat = ambilRiwayat()
      .filter((h) => typeof h.nilai?.systolic === 'number' && typeof h.nilai?.diastolic === 'number')
      .slice(-14)
      .map((h) => ({ s: h.nilai.systolic as number, d: h.nilai.diastolic as number }))
    return {
      sis: typeof v.systolic === 'number' ? v.systolic : null,
      dia: typeof v.diastolic === 'number' ? v.diastolic : null,
      deret: riwayat,
    }
  }, [])

  if (sis == null || dia == null) return null

  return (
    <section>
      <Kepala judul="Blood pressure" ke="/tubuh" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{sis}/{dia}</span>
          <span className="t-mikro font-bold text-neutral-400">mmHg</span>
        </div>
        {deret.length >= 3 && (
          /* Dua garis pada satu sumbu, bukan dua grafik: sistolik dan
             diastolik hanya bermakna dibaca berpasangan. */
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="mt-2 h-12 w-full" role="img" aria-label="Blood pressure, last 14 readings">
            {(['s', 'd'] as const).map((kunci, idx) => {
              const nilai = deret.map((p) => p[kunci])
              const semua = [...deret.map((p) => p.s), ...deret.map((p) => p.d)]
              const min = Math.min(...semua) - 5
              const maks = Math.max(...semua) + 5
              const titik = nilai
                .map((v, i) => `${(i / Math.max(1, nilai.length - 1)) * 100},${40 - ((v - min) / Math.max(1, maks - min)) * 38}`)
                .join(' ')
              return (
                <polyline
                  key={kunci}
                  points={titik}
                  fill="none"
                  strokeWidth="1.6"
                  vectorEffect="non-scaling-stroke"
                  stroke="currentColor"
                  className={idx === 0 ? 'text-rose-400' : 'text-sky-400'}
                />
              )
            })}
          </svg>
        )}
        <p className="t-mikro mt-1 leading-snug text-neutral-400">
          A single reading is not a diagnosis: hypertension is established from the average of several readings on different days, each after five minutes of rest.
        </p>
      </div>
    </section>
  )
}

// ── Napas 2 menit (physiological sigh) ─────────────────────────────────────
//
// Panduan napas satu ketukan: tarik, tarik pendek lagi, lalu buang panjang.
// Yang dijanjikan hanya efek SESAAT pada rasa tenang dan laju napas — itulah
// yang diukur pada percobaan terkendalinya. Tidak ada klaim menurunkan
// tekanan darah jangka panjang atau memperbaiki HRV semalaman.
const POLA: { label: string; detik: number }[] = [
  { label: 'Inhale through the nose', detik: 4 },
  { label: 'One more short inhale', detik: 1 },
  { label: 'Long exhale through the mouth', detik: 7 },
]

export function UbinNapas() {
  const [jalan, setJalan] = useState(false)
  const [mulai, setMulai] = useState(0)
  const [, paksa] = useState(0)
  const getarTerakhir = useRef(-1)

  useEffect(() => {
    if (!jalan) return
    const id = window.setInterval(() => paksa((n) => n + 1), 200)
    return () => window.clearInterval(id)
  }, [jalan])

  const putaranDetik = POLA.reduce((a, p) => a + p.detik, 0)
  const lewat = jalan ? (Date.now() - mulai) / 1000 : 0
  const selesai = jalan && lewat >= 120

  useEffect(() => { if (selesai) { setJalan(false); try { navigator.vibrate?.([200, 100, 200]) } catch { /* — */ } } }, [selesai])

  let fase = POLA[0]
  let sisaFase = 0
  if (jalan) {
    let t = lewat % putaranDetik
    for (const p of POLA) {
      if (t < p.detik) { fase = p; sisaFase = p.detik - t; break }
      t -= p.detik
    }
    const idx = POLA.indexOf(fase)
    if (getarTerakhir.current !== idx) {
      getarTerakhir.current = idx
      try { navigator.vibrate?.(idx === 2 ? 120 : 45) } catch { /* — */ }
    }
  }

  return (
    <section>
      <Kepala
        judul="2-minute breathing"
        kanan={jalan ? (
          <button onClick={() => setJalan(false)} className="t-kecil flex min-h-[40px] items-center font-bold text-neutral-500">Stop</button>
        ) : undefined}
      />
      <div className="kaca rounded-3xl p-3">
        {!jalan ? (
          <>
            <p className="t-kecil leading-snug text-neutral-600 dark:text-neutral-300">
              Inhale — a second short inhale — then a long exhale. Repeated for two minutes.
            </p>
            <button
              onClick={() => { setMulai(Date.now()); getarTerakhir.current = -1; setJalan(true) }}
              className="t-kecil mt-2 min-h-[44px] w-full rounded-2xl bg-brand font-bold text-white transition active:scale-[0.98]"
            >
              Start
            </button>
            <p className="t-mikro mt-2 leading-snug text-neutral-400">
              What the trials measured is a short-term effect on calm and breathing rate — not a lasting improvement in blood pressure.
            </p>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span
              className="grid shrink-0 place-items-center rounded-full bg-brand text-white transition-all duration-500 cahaya-hijau"
              style={{ width: fase.label.startsWith('Long exhale') ? 56 : 84, height: fase.label.startsWith('Long exhale') ? 56 : 84 }}
            >
              <span className="text-[18px] font-black tabular-nums">{Math.ceil(sisaFase)}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="t-kecil block font-black text-ink dark:text-white">{fase.label}</span>
              <span className="t-mikro block text-neutral-400">{Math.max(0, Math.ceil(120 - lewat))} seconds left</span>
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Terlalu lama duduk ─────────────────────────────────────────────────────
//
// Pengingat berdiri tiap 30 menit. Yang dihitung adalah waktu sejak terakhir
// kali tombol "sudah berdiri" ditekan — bukan gerak yang terdeteksi sensor,
// karena aplikasi web tidak dapat melihatnya. Ditulis begitu supaya tidak
// dikira alat pendeteksi.
const KUNCI_DUDUK = 'pmd_duduk_v1'

export function UbinDuduk() {
  const [sejak, setSejak] = useState<number>(() => {
    const v = Number(localStorage.getItem(KUNCI_DUDUK) || 0)
    return Number.isFinite(v) && v > 0 ? v : Date.now()
  })
  const [, paksa] = useState(0)
  const sudahGetar = useRef(false)

  useEffect(() => {
    const id = window.setInterval(() => paksa((n) => n + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const menit = (Date.now() - sejak) / 60_000
  useEffect(() => {
    if (menit >= 30 && !sudahGetar.current) {
      sudahGetar.current = true
      try { navigator.vibrate?.([200, 120, 200]) } catch { /* — */ }
    }
    if (menit < 30) sudahGetar.current = false
  }, [menit])

  const tandai = () => {
    const t = Date.now()
    try { localStorage.setItem(KUNCI_DUDUK, String(t)) } catch { /* kuota */ }
    sudahGetar.current = false
    setSejak(t)
  }

  return (
    <section>
      <Kepala
        judul="Sitting"
        kanan={<button onClick={tandai} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">Stood up</button>}
      />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-[26px] font-black leading-none tabular-nums ${menit >= 30 ? 'text-rose-500' : 'text-ink dark:text-white'}`}>
            {Math.floor(menit)}
          </span>
          <span className="t-mikro font-bold text-neutral-400">minutes since you last stood up</span>
        </div>
        <span className="mt-2 block h-2.5 w-full rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
          <span
            className={`block h-full rounded-full ${menit >= 30 ? 'bg-rose-500' : 'bg-brand'}`}
            style={{ width: `${Math.min(100, (menit / 30) * 100)}%` }}
          />
        </span>
        <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
          Counted from the button, not from a sensor — a web app cannot see whether you are sitting or standing.
        </p>
      </div>
    </section>
  )
}
