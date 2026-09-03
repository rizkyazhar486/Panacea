import { useEffect, useState } from 'react'
import { didukung, langganan, mulai, hentikan, jeda, lanjut, ambilLaju, aturLaju, sedangJalan, pecah } from '../lib/bacaSuara'

// ─────────────────────────────────────────────────────────────────────────────
// Tombol "Dengarkan" — satu bentuk, dipakai di mana pun ada teks panjang.
//
// UNTUK SIAPA INI DIBUAT. Tiga keadaan yang nyata bagi pemakai aplikasi ini:
// membaca catatan penyakit sambil di perjalanan, mengulang materi sambil
// berlatih, dan membaca terjemahan ayat ketika mata sudah lelah setelah jaga.
// Ketiganya sama-sama menuntut telinga, bukan mata.
//
// TIDAK MENJANJIKAN SUARA MANUSIA. Yang membacakan adalah mesin suara bawaan
// perangkat, dan itu disebutkan — orang yang mengira ini suara pembaca sungguhan
// akan kecewa pada kalimat kedua. Yang ditukar dengan kedataran suaranya:
// gratis, tanpa kunci API, dan tidak ada satu huruf pun yang keluar dari
// perangkatnya.
//
// TOMBOLNYA HILANG BILA PERANGKATNYA TIDAK MENDUKUNG, bukan berubah menjadi
// tombol yang tidak melakukan apa-apa.
// ─────────────────────────────────────────────────────────────────────────────

export function PemutarBaca({ teks, label = 'Listen', kecil = false }: { teks: string; label?: string; kecil?: boolean }) {
  const [keadaan, setKeadaan] = useState({ jalan: false, bagian: 0, jumlah: 0 })
  const [laju, setLaju] = useState(ambilLaju)
  const [milikSaya, setMilikSaya] = useState(false)

  useEffect(() => langganan(setKeadaan), [])

  // Meninggalkan halaman menghentikan bacaan: suara yang terus berbunyi dari
  // halaman yang sudah ditutup adalah cacat yang paling cepat membuat orang
  // mematikan fitur ini selamanya.
  useEffect(() => () => { if (milikSaya) hentikan() }, [milikSaya])

  if (!didukung() || !teks.trim()) return null

  const jumlah = pecah(teks).length
  const sedang = milikSaya && keadaan.jumlah > 0

  const tekan = () => {
    if (sedang && keadaan.jalan) { jeda(); return }
    if (sedang && !keadaan.jalan && sedangJalan() === false && keadaan.bagian > 0) { lanjut(); return }
    setMilikSaya(true)
    mulai(teks)
  }

  return (
    <span className={`flex items-center gap-1.5 ${kecil ? '' : 'flex-wrap'}`}>
      <button
        onClick={tekan}
        aria-label={sedang && keadaan.jalan ? 'Pause reading' : label}
        className={`t-kecil flex min-h-[40px] items-center gap-1.5 rounded-xl px-2.5 font-bold transition ${
          sedang && keadaan.jalan ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-200'
        }`}
      >
        <span aria-hidden>{sedang && keadaan.jalan ? '⏸' : '▶'}</span>
        {kecil ? null : <span>{sedang && keadaan.jalan ? 'Pause' : label}</span>}
      </button>

      {sedang && (
        <>
          <button
            onClick={() => { hentikan(); setMilikSaya(false) }}
            aria-label="Stop reading"
            className="t-kecil flex min-h-[40px] items-center px-1 font-bold text-neutral-500"
          >
            ■
          </button>
          <span className="t-mikro tabular-nums text-neutral-400">
            {Math.min(keadaan.bagian + 1, jumlah)}/{jumlah}
          </span>
        </>
      )}

      <select
        value={String(laju)}
        onChange={(e) => { const v = Number(e.target.value); setLaju(v); aturLaju(v) }}
        aria-label="Reading speed"
        className="t-mikro min-h-[40px] rounded-lg border border-neutral-200 bg-transparent px-1 tabular-nums text-neutral-500 dark:border-white/12 dark:text-neutral-300"
      >
        {[0.8, 1, 1.25, 1.5, 1.75].map((v) => <option key={v} value={v}>{v}×</option>)}
      </select>
    </span>
  )
}

export default PemutarBaca
