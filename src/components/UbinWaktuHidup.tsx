import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────────────────
// Tiga pewaktu untuk hari kerja: istirahat mata 20-20-20, sesi fokus, dan kopi.
//
// SEMUANYA DIHITUNG DARI JAM DINDING. Sama seperti pewaktu nap: setInterval
// berhenti dihitung ketika tab dilatarbelakangkan atau layar dimatikan, dan
// ketiga pewaktu ini justru dipakai saat orang sedang mengerjakan hal lain.
// Yang disimpan selalu WAKTU BERAKHIR (atau waktu mulai), tidak pernah sisa
// detik yang dikurangi sendiri.
//
// ANGKA-ANGKANYA MEMBAWA ASALNYA:
//   · 20-20-20 (tiap 20 menit, lihat sejauh ±6 m selama 20 detik) adalah
//     anjuran yang dipakai luas oleh optometri untuk keluhan mata akibat layar
//     — bukti terbaiknya sedang, dan yang diperbaikinya adalah GEJALA (mata
//     kering, pegal), bukan rabun jauh. Ditulis begitu, tidak dilebihkan.
//   · Paruh waktu kafein pada orang dewasa kira-kira 5 jam (rentang lazim
//     3-7 jam, dipengaruhi CYP1A2, kehamilan, dan rokok). Karena itu sisa
//     kafein dihitung sebagai PERKIRAAN dan rentangnya disebut.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI_MATA = 'pmd_mata_v1'
const KUNCI_FOKUS = 'pmd_fokus_v1'
const KUNCI_KOPI = 'pmd_kopi_v1'

function bacaAngka(kunci: string): number | null {
  try {
    const v = Number(JSON.parse(localStorage.getItem(kunci) || 'null'))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch { return null }
}
function simpanAngka(kunci: string, v: number | null) {
  try {
    if (v == null) localStorage.removeItem(kunci)
    else localStorage.setItem(kunci, JSON.stringify(v))
  } catch { /* kuota */ }
}

function getar(pola: number[]) {
  try { navigator.vibrate?.(pola) } catch { /* tidak didukung */ }
}

function bunyi(nada = 880, kali = 2) {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const t0 = ctx.currentTime
    for (let i = 0; i < kali; i++) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = nada
      g.gain.setValueAtTime(0.0001, t0 + i * 0.4)
      g.gain.exponentialRampToValueAtTime(0.22, t0 + i * 0.4 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.4 + 0.3)
      osc.connect(g).connect(ctx.destination)
      osc.start(t0 + i * 0.4)
      osc.stop(t0 + i * 0.4 + 0.32)
    }
    setTimeout(() => void ctx.close().catch(() => {}), 1800)
  } catch { /* peramban menolak audio tanpa gerakan pengguna */ }
}

function mmss(detik: number): string {
  const d = Math.max(0, Math.round(detik))
  return `${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')}`
}

/** Detak penggambar — hanya memicu render, tidak menyimpan waktu. */
function useDetak(hidup: boolean, ms = 500) {
  const [, paksa] = useState(0)
  useEffect(() => {
    if (!hidup) return
    const id = window.setInterval(() => paksa((n) => n + 1), ms)
    return () => window.clearInterval(id)
  }, [hidup, ms])
}

function Kepala({ judul, kanan }: { judul: string; kanan?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      {kanan}
    </div>
  )
}

// ── 20-20-20 ───────────────────────────────────────────────────────────────
const SIKLUS_MS = 20 * 60_000
const JEDA_DETIK = 20

export function UbinMata() {
  const [mulai, setMulai] = useState<number | null>(() => bacaAngka(KUNCI_MATA))
  const [jeda, setJeda] = useState<number | null>(null)
  const [putaran, setPutaran] = useState(0)
  const ditandai = useRef(0)
  useDetak(mulai !== null)

  const sisaSiklus = mulai ? (SIKLUS_MS - ((Date.now() - mulai) % SIKLUS_MS)) / 1000 : 0
  const lewat = mulai ? Math.floor((Date.now() - mulai) / SIKLUS_MS) : 0

  // Setiap kali batas 20 menit terlewati, satu jeda dibuka — dihitung dari
  // selisih waktu, bukan dari berapa kali komponen ini sempat digambar.
  useEffect(() => {
    if (mulai === null || lewat <= ditandai.current) return
    ditandai.current = lewat
    setPutaran(lewat)
    setJeda(Date.now() + JEDA_DETIK * 1000)
    getar([250, 120, 250])
    bunyi(660, 2)
  }, [lewat, mulai])

  const sisaJeda = jeda ? (jeda - Date.now()) / 1000 : 0
  useEffect(() => {
    if (jeda && sisaJeda <= 0) { setJeda(null); getar([120]); }
  }, [jeda, sisaJeda])

  return (
    <section>
      <Kepala
        judul="Mata 20-20-20"
        kanan={mulai !== null ? (
          <button
            onClick={() => { simpanAngka(KUNCI_MATA, null); setMulai(null); setJeda(null); ditandai.current = 0; setPutaran(0) }}
            className="t-kecil flex min-h-[40px] items-center font-bold text-neutral-500"
          >
            Berhenti
          </button>
        ) : null}
      />
      <div className="kaca rounded-3xl p-3">
        {mulai === null ? (
          <>
            <p className="t-kecil leading-snug text-neutral-600 dark:text-neutral-300">
              Tiap 20 menit, lihat sesuatu sejauh ±6 meter selama 20 detik.
            </p>
            <button
              onClick={() => { const t = Date.now(); simpanAngka(KUNCI_MATA, t); setMulai(t); ditandai.current = 0; bunyi(880, 1) }}
              className="t-kecil mt-2 min-h-[44px] w-full rounded-2xl bg-brand font-bold text-white transition active:scale-[0.98]"
            >
              Mulai menemani layar
            </button>
            <p className="t-mikro mt-2 leading-snug text-neutral-400">
              Anjuran optometri untuk keluhan mata akibat layar. Yang diringankan gejalanya — mata kering dan pegal — bukan rabun jauhnya.
            </p>
          </>
        ) : jeda ? (
          <div className="flex items-center gap-3">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand text-[20px] font-black tabular-nums text-white cahaya-hijau">
              {Math.ceil(sisaJeda)}
            </span>
            <span className="min-w-0">
              <span className="t-kecil block font-black text-ink dark:text-white">Alihkan pandangan sekarang</span>
              <span className="t-mikro block text-neutral-400">±6 meter, sampai hitungan habis</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-[26px] font-black leading-none tabular-nums text-ink dark:text-white">{mmss(sisaSiklus)}</span>
            <span className="min-w-0 flex-1">
              <span className="t-mikro block text-neutral-400">menuju jeda mata berikutnya</span>
              <span className="mt-1 block h-2 w-full rounded-full bg-neutral-200 dark:bg-white/10">
                <span className="block h-full rounded-full bg-brand" style={{ width: `${100 - (sisaSiklus / (SIKLUS_MS / 1000)) * 100}%` }} />
              </span>
            </span>
            <span className="t-mikro shrink-0 tabular-nums text-neutral-400">{putaran}× hari ini</span>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Sesi fokus / lama menatap layar ────────────────────────────────────────
const PILIHAN_FOKUS = [25, 50, 90]

export function UbinFokus() {
  const [akhir, setAkhir] = useState<number | null>(() => bacaAngka(KUNCI_FOKUS))
  const berbunyi = useRef(false)
  useDetak(akhir !== null)

  const sisa = akhir ? (akhir - Date.now()) / 1000 : 0
  const habis = akhir !== null && sisa <= 0

  useEffect(() => {
    if (!habis || berbunyi.current) return
    berbunyi.current = true
    getar([400, 200, 400])
    bunyi(760, 3)
  }, [habis])

  const mulai = useCallback((menit: number) => {
    const t = Date.now() + menit * 60_000
    berbunyi.current = false
    simpanAngka(KUNCI_FOKUS, t)
    setAkhir(t)
    bunyi(880, 1)
  }, [])

  return (
    <section>
      <Kepala
        judul="Sesi fokus"
        kanan={akhir !== null ? (
          <button
            onClick={() => { simpanAngka(KUNCI_FOKUS, null); setAkhir(null); berbunyi.current = false }}
            className="t-kecil flex min-h-[40px] items-center font-bold text-neutral-500"
          >
            Berhenti
          </button>
        ) : null}
      />
      <div className="kaca rounded-3xl p-3">
        {akhir === null ? (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              {PILIHAN_FOKUS.map((m) => (
                <button
                  key={m}
                  onClick={() => mulai(m)}
                  className="flex min-h-[54px] flex-col items-center justify-center rounded-2xl border border-neutral-200 transition active:scale-95 dark:border-white/12"
                >
                  <span className="text-[19px] font-black leading-none tabular-nums text-ink dark:text-white">{m}</span>
                  <span className="t-mikro text-neutral-400">menit</span>
                </button>
              ))}
            </div>
            <p className="t-mikro mt-2 leading-snug text-neutral-400">
              Lama sesi dipilih sendiri; tidak ada lama yang terbukti benar untuk semua orang.
            </p>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className={`text-[30px] font-black leading-none tabular-nums ${habis ? 'text-rose-500' : 'text-ink dark:text-white'}`}>
              {habis ? '00:00' : mmss(sisa)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="t-kecil block font-black text-ink dark:text-white">
                {habis ? 'Waktunya berdiri dan menjauh dari layar' : 'Sedang fokus'}
              </span>
              <span className="t-mikro block truncate text-neutral-400">
                {habis ? 'Getar dan bunyi sudah dibunyikan' : `Selesai pukul ${new Date(akhir).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Kopi ───────────────────────────────────────────────────────────────────
//
// Dua hal sekaligus: jeda kopi (hitungan mundur pendek) dan KAPAN KOPI
// TERAKHIR — dengan perkiraan sisa kafein memakai paruh waktu 5 jam. Yang
// dijawabnya adalah pertanyaan yang benar-benar ditanyakan orang menjelang
// malam: "kalau saya minum sekarang, masih tersisa berapa saat saya tidur?"
const PARUH_JAM = 5

export function UbinKopi() {
  const [terakhir, setTerakhir] = useState<number | null>(() => bacaAngka(KUNCI_KOPI))
  useDetak(terakhir !== null, 30_000)

  const jamLalu = terakhir ? (Date.now() - terakhir) / 3_600_000 : 0
  const sisaPersen = terakhir ? Math.pow(0.5, jamLalu / PARUH_JAM) * 100 : 0

  return (
    <section>
      <Kepala
        judul="Kopi"
        kanan={
          <button
            onClick={() => { const t = Date.now(); simpanAngka(KUNCI_KOPI, t); setTerakhir(t) }}
            className="t-kecil flex min-h-[40px] items-center font-bold text-brand"
          >
            Baru minum ☕
          </button>
        }
      />
      <div className="kaca rounded-3xl p-3">
        {terakhir === null ? (
          <p className="t-kecil text-neutral-500">Belum ada catatan. Tekan “Baru minum” saat menyeruput yang pertama.</p>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">
                {jamLalu < 1 ? `${Math.round(jamLalu * 60)} mnt` : `${jamLalu.toFixed(1)} jam`}
              </span>
              <span className="t-mikro font-bold text-neutral-400">sejak kopi terakhir</span>
            </div>

            {/* Peluruhan kafein sebagai satu bilah — dasar nol, seratus persen
                adalah takaran saat diminum, bukan takaran mutlak dalam mg:
                kadar mg menuntut tahu isi cangkirnya, dan menebak isinya
                berarti mengarang angka. */}
            <span className="mt-2 block h-2.5 w-full rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
              <span className="block h-full rounded-full bg-amber-500" style={{ width: `${Math.max(2, sisaPersen)}%` }} />
            </span>
            <p className="t-mikro mt-1.5 leading-snug text-neutral-500 dark:text-neutral-400">
              Perkiraan sisa {Math.round(sisaPersen)}% · paruh waktu 5 jam (lazimnya 3–7 jam; berbeda tiap orang)
            </p>
            <p className="t-mikro mt-1 text-neutral-400">
              Diminum pukul {new Date(terakhir).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ·{' '}
              <Link to="/pola-tidur" className="font-bold text-brand">pola tidur →</Link>
            </p>
          </>
        )}
      </div>
    </section>
  )
}
