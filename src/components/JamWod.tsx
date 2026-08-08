import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SetelanJam } from '../lib/crossfit'
import { hariIni } from '../lib/tanggal'

// ─────────────────────────────────────────────────────────────────────────────
// Jam WOD — mulai, jeda, lanjut, dan ketuk untuk mencatat ronde.
//
// Dua hal yang membedakan jam yang benar dari jam yang kelihatan benar:
//
//   1. WAKTU DIHITUNG DARI JAM DINDING, BUKAN DARI JUMLAH TIK. Menambah 100 ms
//      tiap setInterval terdengar masuk akal, tetapi setInterval tidak pernah
//      tepat dan browser memperlambat timer pada tab yang tidak aktif. Setelah
//      20 menit AMRAP, jam seperti itu bisa meleset lebih dari satu menit —
//      pada sesi yang skornya justru waktu. Di sini setiap render menghitung
//      selisih terhadap `Date.now()`, jadi tik yang terlewat tidak menghilangkan
//      waktu.
//   2. JEDA MENYIMPAN AKUMULASI, BUKAN MEMBEKUKAN TITIK MULAI. Saat dilanjutkan,
//      titik mulai digeser sebesar durasi jeda.
//
// Ketuk mencatat waktu ronde beserta split-nya. Split itulah yang sebenarnya
// berguna: ronde pertama yang jauh lebih cepat dari sisanya adalah bukti
// pacing yang terlalu berani, dan itu tidak terlihat dari skor akhir saja.
// ─────────────────────────────────────────────────────────────────────────────

type Fase = 'siap' | 'jalan' | 'jeda' | 'done'

interface Catatan { detik: number; split: number }
interface History { tanggal: string; wod: string; skor: string; ronde: number; detik: number }

const KEY_RIWAYAT = 'pmd_wod_riwayat_v1'

function muatHistory(): History[] {
  try { return JSON.parse(localStorage.getItem(KEY_RIWAYAT) || '[]') as History[] } catch { return [] }
}

export function jam(detik: number): string {
  const d = Math.max(0, Math.floor(detik))
  const m = Math.floor(d / 60)
  const s = d % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function JamWod({ nama, setelan, ronde }: {
  nama: string
  setelan: SetelanJam
  /** Gerakan satu ronde, untuk ditampilkan sebagai pengingat saat berjalan. */
  ronde?: string[]
}) {
  const [fase, setFase] = useState<Fase>('siap')
  const [sekarang, setSekarang] = useState(0)      // detik berjalan
  const [catatan, setCatatan] = useState<Catatan[]>([])
  const [riwayat, setHistory] = useState<History[]>(muatHistory)
  const mulaiRef = useRef(0)                        // Date.now() saat mulai/lanjut
  const akumulasiRef = useRef(0)                    // detik sebelum jeda terakhir

  const total = setelan.jenis === 'tabata' ? 240
    : setelan.jenis === 'amrap' || setelan.jenis === 'emom' ? (setelan.menit ?? 20) * 60
    : (setelan.batas ?? 0) * 60

  // Satu sumber waktu: selisih terhadap jam dinding, dibaca ulang tiap 100 ms.
  useEffect(() => {
    if (fase !== 'jalan') return
    const id = setInterval(() => {
      const d = akumulasiRef.current + (Date.now() - mulaiRef.current) / 1000
      setSekarang(d)
      if (total > 0 && d >= total) {
        akumulasiRef.current = total
        setSekarang(total)
        setFase('done')
      }
    }, 100)
    return () => clearInterval(id)
  }, [fase, total])

  const mulai = () => {
    mulaiRef.current = Date.now()
    setFase('jalan')
  }
  const jeda = () => {
    akumulasiRef.current += (Date.now() - mulaiRef.current) / 1000
    setSekarang(akumulasiRef.current)
    setFase('jeda')
  }
  const lanjut = () => {
    mulaiRef.current = Date.now()
    setFase('jalan')
  }
  const ulang = () => {
    akumulasiRef.current = 0
    mulaiRef.current = 0
    setSekarang(0)
    setCatatan([])
    setFase('siap')
  }

  const ketuk = useCallback(() => {
    if (fase !== 'jalan') return
    const d = akumulasiRef.current + (Date.now() - mulaiRef.current) / 1000
    setCatatan((c) => [...c, { detik: d, split: d - (c[c.length - 1]?.detik ?? 0) }])
  }, [fase])

  const batalKetuk = () => setCatatan((c) => c.slice(0, -1))

  // Spasi sebagai pintasan ketuk — tangan sedang sibuk, layar sering tidak.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || fase !== 'jalan') return
      const t = e.target as HTMLElement | null
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      e.preventDefault()
      ketuk()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [fase, ketuk])

  const donekan = () => {
    akumulasiRef.current += fase === 'jalan' ? (Date.now() - mulaiRef.current) / 1000 : 0
    setSekarang(akumulasiRef.current)
    setFase('done')
  }

  const skor = useMemo(() => {
    if (setelan.jenis === 'amrap') return `${catatan.length} ronde`
    if (setelan.jenis === 'emom') return `${catatan.length} menit done`
    return jam(sekarang)
  }, [setelan.jenis, catatan.length, sekarang])

  function simpan() {
    const baris: History = {
      tanggal: hariIni(), wod: nama, skor,
      ronde: catatan.length, detik: Math.round(sekarang),
    }
    const next = [baris, ...riwayat].slice(0, 100)
    setHistory(next)
    try { localStorage.setItem(KEY_RIWAYAT, JSON.stringify(next)) } catch { /* kuota */ }
    ulang()
  }

  // Tampilan waktu: AMRAP/EMOM/Tabata menghitung mundur (yang penting sisa
  // waktu), For Time menghitung maju (yang penting waktu tempuh).
  const mundur = setelan.jenis !== 'fortime'
  const tampil = mundur && total > 0 ? total - sekarang : sekarang
  const hampirHabis = mundur && total > 0 && total - sekarang <= 30 && fase === 'jalan'

  // Penanda interval untuk EMOM dan Tabata.
  const interval = setelan.jenis === 'emom' ? (setelan.interval ?? 60)
    : setelan.jenis === 'tabata' ? 30 : 0
  const dalamInterval = interval > 0 ? sekarang % interval : 0
  const tabataKerja = setelan.jenis === 'tabata' ? dalamInterval < 20 : false

  const rekorSebelumnya = riwayat.filter((r) => r.wod === nama)

  return (
    <div className="rounded-xl bg-ink/5 p-3 dark:bg-white/5">
      {/* Jam */}
      <div className="text-center">
        <div className={`tabular-nums text-5xl font-black leading-none transition-colors ${
          hampirHabis ? 'text-rose-500' : fase === 'jalan' ? 'text-brand' : 'text-white'
        }`} role="timer" aria-label="Waktu">
          {jam(tampil)}
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {setelan.jenis === 'amrap' && `AMRAP ${setelan.menit} menit · sisa waktu`}
          {setelan.jenis === 'fortime' && (setelan.batas ? `For Time · batas ${setelan.batas} mnt` : 'For Time')}
          {setelan.jenis === 'emom' && `EMOM ${setelan.menit} menit`}
          {setelan.jenis === 'tabata' && 'Tabata 20/10 × 8'}
        </div>
      </div>

      {/* Penanda interval EMOM / Tabata */}
      {interval > 0 && fase === 'jalan' && (
        <div className="mt-2 text-center">
          <span className={`rounded-lg px-2 py-1 text-[12px] font-black ${
            setelan.jenis === 'tabata'
              ? (tabataKerja ? 'bg-brand text-white' : 'bg-white/10 text-slate-300')
              : 'bg-white/10 text-slate-300'
          }`}>
            {setelan.jenis === 'tabata'
              ? (tabataKerja ? `KERJA ${Math.ceil(20 - dalamInterval)}s` : `ISTIRAHAT ${Math.ceil(30 - dalamInterval)}s`)
              : `Menit ke-${Math.floor(sekarang / interval) + 1} · ${Math.ceil(interval - dalamInterval)}s lagi`}
          </span>
        </div>
      )}

      {/* Ronde berjalan */}
      {ronde && ronde.length > 0 && fase !== 'siap' && (
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {ronde.map((x) => (
            <span key={x} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">{x}</span>
          ))}
        </div>
      )}

      {/* Tombol utama */}
      <div className="mt-3 flex gap-2">
        {fase === 'siap' && (
          <button onClick={mulai} aria-label="Mulai"
            className="flex-1 rounded-xl bg-brand py-3 text-[14px] font-black text-white">
            ▶ Mulai
          </button>
        )}
        {fase === 'jalan' && (
          <>
            <button onClick={jeda} aria-label="Jeda"
              className="rounded-xl bg-white/10 px-4 py-3 text-[14px] font-black text-white">
              ⏸ Jeda
            </button>
            <button onClick={ketuk} aria-label="Tap round"
              className="flex-1 rounded-xl bg-emerald-500 py-3 text-[14px] font-black text-white active:scale-[0.98]">
              ⊕ Ketuk — ronde {catatan.length + 1}
            </button>
          </>
        )}
        {fase === 'jeda' && (
          <>
            <button onClick={lanjut} aria-label="Resume"
              className="flex-1 rounded-xl bg-brand py-3 text-[14px] font-black text-white">
              ▶ Resume
            </button>
            <button onClick={donekan} aria-label="Finish"
              className="rounded-xl bg-white/10 px-4 py-3 text-[14px] font-black text-white">
              Finish
            </button>
          </>
        )}
        {fase === 'done' && (
          <>
            <button onClick={simpan} aria-label="Save result"
              className="flex-1 rounded-xl bg-brand py-3 text-[14px] font-black text-white">
              Simpan · {skor}
            </button>
            <button onClick={ulang} aria-label="Ulang"
              className="rounded-xl bg-white/10 px-4 py-3 text-[14px] font-black text-white">
              Ulang
            </button>
          </>
        )}
      </div>

      {fase === 'jalan' && setelan.jenis === 'fortime' && (
        <button onClick={donekan}
          className="mt-2 w-full rounded-xl bg-white/5 py-2 text-[12px] font-bold text-slate-300">
          Berhenti — sesi done
        </button>
      )}
      {fase === 'jalan' && (
        <p className="mt-2 text-center text-[10px] text-slate-500">
          Tekan spasi juga mencatat ronde.
        </p>
      )}

      {/* Catatan ronde + split */}
      {catatan.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              {catatan.length} tercatat
            </div>
            {fase !== 'done' && (
              <button onClick={batalKetuk} aria-label="Batalkan ketukan terakhir"
                className="rounded-lg bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                batalkan terakhir
              </button>
            )}
          </div>
          <div className="mt-1 max-h-40 space-y-0.5 overflow-y-auto">
            {catatan.map((c, i) => {
              const rerata = catatan.reduce((s, x) => s + x.split, 0) / catatan.length
              const lambat = c.split > rerata * 1.15
              const cepat = c.split < rerata * 0.85
              return (
                <div key={i} className="flex items-baseline justify-between rounded-lg bg-white/5 px-2 py-1">
                  <span className="text-[11px] font-bold text-slate-300">#{i + 1}</span>
                  <span className="tabular-nums text-[11px] text-slate-400">{jam(c.detik)}</span>
                  <span className={`tabular-nums text-[11px] font-bold ${
                    lambat ? 'text-amber-400' : cepat ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    +{jam(c.split)}
                  </span>
                </div>
              )
            })}
          </div>
          {catatan.length >= 3 && (
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              Kolom kanan adalah split tiap ronde. Ronde awal yang jauh lebih cepat dari rata-rata
              (hijau) biasanya berarti Anda memulai terlalu berani — total akhirnya hampir selalu
              lebih rendah, bukan lebih tinggi.
            </p>
          )}
        </div>
      )}

      {/* History WOD ini */}
      {rekorSebelumnya.length > 0 && fase === 'siap' && (
        <div className="mt-3">
          <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Previous records</div>
          <div className="mt-1 space-y-0.5">
            {rekorSebelumnya.slice(0, 4).map((r, i) => (
              <div key={i} className="flex items-baseline justify-between rounded-lg bg-white/5 px-2 py-1">
                <span className="text-[11px] text-slate-400">{r.tanggal}</span>
                <span className="text-[11px] font-bold text-white">{r.skor}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default JamWod
