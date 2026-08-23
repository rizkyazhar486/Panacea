import { useCallback, useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Pewaktu tidur singkat (nap) dan AMRAP — dua hitungan mundur yang dipakai
// justru saat telepon TIDAK sedang dipegang.
//
// KARENA ITU WAKTUNYA DIHITUNG DARI JAM DINDING, BUKAN DARI DETAK.
// setInterval berhenti dihitung ketika tab dilatarbelakangkan atau layar
// dimatikan — dan itu persis keadaan sebuah pewaktu nap: layar mati, telepon
// di samping bantal. Pewaktu yang memakai hitungan detak akan bangun
// terlambat sebanyak lama layar mati, tanpa pernah memberi tahu. Di sini yang
// disimpan adalah WAKTU BERAKHIR, dan sisanya dihitung ulang dari Date.now()
// setiap kali digambar; detak hanya memicu penggambaran.
//
// SELESAINYA DITANDAI GETARAN DAN BUNYI, keduanya dicoba. Getaran tidak ada di
// iOS Safari; bunyi tidak keluar bila telepon disenyapkan. Memakai salah satu
// saja berarti sebagian orang tidak pernah terbangun.
//
// LAMA NAP YANG DITAWARKAN BUKAN ANGKA ACAK: 10-20 menit adalah rentang yang
// berulang kali diteliti tidak menimbulkan rasa berat bangun tidur (sleep
// inertia) karena tidak masuk tidur dalam, sedangkan 90 menit kira-kira satu
// putaran tidur penuh. Keduanya perkiraan populasi, bukan janji bagi tiap
// orang — karena itu ditulis apa adanya sebagai pilihan, bukan sebagai saran.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd_pewaktu_v1'

type Mode = 'nap' | 'amrap'
interface Keadaan {
  mode: Mode
  /** Waktu berakhir dalam milidetik epoch. */
  akhir: number
  /** Lama seluruhnya dalam detik — untuk menggambar cincin. */
  lama: number
}

const NAP = [10, 20, 90]
const AMRAP = [7, 12, 20]

function baca(): Keadaan | null {
  try {
    const k = JSON.parse(localStorage.getItem(KUNCI) || 'null')
    if (!k || typeof k.akhir !== 'number' || typeof k.lama !== 'number') return null
    // Pewaktu yang sudah lewat lebih dari lima menit dibuang: membuka aplikasi
    // esok hari tidak boleh disambut alarm dari kemarin.
    if (Date.now() - k.akhir > 5 * 60_000) return null
    return k as Keadaan
  } catch { return null }
}

function simpan(k: Keadaan | null) {
  try {
    if (k) localStorage.setItem(KUNCI, JSON.stringify(k))
    else localStorage.removeItem(KUNCI)
  } catch { /* kuota */ }
}

/** Bunyi pendek dari WebAudio — tanpa berkas suara, tanpa unduhan. */
function bunyikan() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const kini = ctx.currentTime
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, kini + i * 0.45)
      gain.gain.exponentialRampToValueAtTime(0.25, kini + i * 0.45 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, kini + i * 0.45 + 0.32)
      osc.connect(gain).connect(ctx.destination)
      osc.start(kini + i * 0.45)
      osc.stop(kini + i * 0.45 + 0.35)
    }
    setTimeout(() => void ctx.close().catch(() => {}), 2000)
  } catch { /* peramban menolak audio tanpa gerakan pengguna */ }
}

function getarkan() {
  try { navigator.vibrate?.([400, 200, 400, 200, 600]) } catch { /* tidak didukung */ }
}

function jamMundur(detik: number): string {
  const m = Math.floor(Math.max(0, detik) / 60)
  const d = Math.max(0, Math.floor(detik)) % 60
  return `${m}:${String(d).padStart(2, '0')}`
}

export function UbinPewaktu() {
  const [keadaan, setKeadaan] = useState<Keadaan | null>(baca)
  const [mode, setMode] = useState<Mode>(() => baca()?.mode ?? 'nap')
  const [, paksa] = useState(0)
  const sudahBunyi = useRef(false)

  // Detak hanya memicu penggambaran ulang; sisanya selalu dihitung dari jam.
  useEffect(() => {
    if (!keadaan) return
    const id = window.setInterval(() => paksa((n) => n + 1), 250)
    return () => window.clearInterval(id)
  }, [keadaan])

  const sisa = keadaan ? (keadaan.akhir - Date.now()) / 1000 : 0
  const selesai = !!keadaan && sisa <= 0

  useEffect(() => {
    if (!selesai || sudahBunyi.current) return
    sudahBunyi.current = true
    getarkan()
    bunyikan()
  }, [selesai])

  const mulai = useCallback((menit: number, m: Mode) => {
    const k: Keadaan = { mode: m, akhir: Date.now() + menit * 60_000, lama: menit * 60 }
    sudahBunyi.current = false
    simpan(k)
    setKeadaan(k)
    // Menyalakan audio di dalam ketukan pengguna: peramban seluler menolak
    // memutar bunyi yang tidak berawal dari gerakan tangan, jadi konteks
    // audionya "dibuka" sekarang dengan bunyi yang tak terdengar.
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AC) { const c = new AC(); void c.resume().catch(() => {}); setTimeout(() => void c.close().catch(() => {}), 500) }
    } catch { /* abaikan */ }
  }, [])

  const berhenti = useCallback(() => {
    sudahBunyi.current = false
    simpan(null)
    setKeadaan(null)
  }, [])

  const pilihan = mode === 'nap' ? NAP : AMRAP
  const r = 34
  const keliling = 2 * Math.PI * r
  const bagian = keadaan ? Math.max(0, Math.min(1, sisa / keadaan.lama)) : 0

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Pewaktu</h2>
        {keadaan && (
          <button onClick={berhenti} className="t-kecil flex min-h-[40px] items-center font-bold text-neutral-500">
            Berhenti
          </button>
        )}
      </div>

      <div className="kaca rounded-3xl p-3">
        {!keadaan ? (
          <>
            <div className="flex gap-1.5">
              {(['nap', 'amrap'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`t-mikro rounded-full px-3 py-1.5 font-black transition ${
                    m === mode ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/8 dark:text-neutral-300'
                  }`}
                >
                  {m === 'nap' ? 'Tidur singkat' : 'AMRAP'}
                </button>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {pilihan.map((menit) => (
                <button
                  key={menit}
                  onClick={() => mulai(menit, mode)}
                  className="flex min-h-[54px] flex-col items-center justify-center rounded-2xl border border-neutral-200 transition active:scale-95 dark:border-white/12"
                >
                  <span className="text-[19px] font-black leading-none tabular-nums text-ink dark:text-white">{menit}</span>
                  <span className="t-mikro text-neutral-400">menit</span>
                </button>
              ))}
            </div>

            <p className="t-mikro mt-2 leading-snug text-neutral-400">
              {mode === 'nap'
                ? '10–20 menit umumnya tidak menimbulkan rasa berat bangun tidur; 90 menit kira-kira satu putaran tidur.'
                : 'As Many Rounds As Possible — kerjakan putaran sebanyak mungkin sampai waktunya habis.'}
            </p>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="relative grid h-[84px] w-[84px] shrink-0 place-items-center">
              <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
                <circle cx="42" cy="42" r={r} fill="none" strokeWidth="6" stroke="currentColor" className="text-neutral-200 dark:text-white/10" />
                <circle
                  cx="42" cy="42" r={r} fill="none" strokeWidth="6" strokeLinecap="round" stroke="currentColor"
                  className={selesai ? 'text-rose-500' : 'text-brand cahaya-hijau'}
                  strokeDasharray={`${(bagian * keliling).toFixed(1)} ${keliling}`}
                  transform="rotate(-90 42 42)"
                />
              </svg>
              <span className="absolute text-[18px] font-black tabular-nums text-ink dark:text-white">
                {selesai ? '00:00' : jamMundur(sisa)}
              </span>
            </span>

            <div className="min-w-0 flex-1">
              <span className="t-kecil block font-black text-ink dark:text-white">
                {selesai ? 'Waktu habis' : keadaan.mode === 'nap' ? 'Tidur singkat' : 'AMRAP berjalan'}
              </span>
              <span className="t-mikro block text-neutral-400">
                {selesai
                  ? 'Getar dan bunyi sudah dibunyikan.'
                  : `Selesai pukul ${new Date(keadaan.akhir).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
              </span>
              {selesai && (
                <button
                  onClick={berhenti}
                  className="t-kecil mt-2 min-h-[40px] rounded-xl bg-brand px-3 font-bold text-white"
                >
                  Selesai
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default UbinPewaktu
