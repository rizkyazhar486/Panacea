import { useEffect, useRef, useState } from 'react'
import { inputClass } from './ui'

// ─────────────────────────────────────────────────────────────────────────────
// Kolom angka yang benar-benar bisa diketik.
//
// Pola lama yang dipakai di enam halaman:
//
//     <input type="number" value={angka || ''} onChange={e => set(+e.target.value)} />
//
// terlihat wajar, tetapi rusak dalam tiga cara sekaligus, dan ketiganya baru
// terasa saat seseorang benar-benar mengetik dengan jarinya:
//
//   1. NOL TIDAK BISA DIMASUKKAN. `0 || ''` menghasilkan string kosong, jadi
//      kolomnya melompat balik ke kosong tepat saat Anda mengetik "0" — padahal
//      "tidur 0 jam" dan "belum diisi" adalah dua hal yang berbeda.
//   2. KOLOM TIDAK BISA DIKOSONGKAN. Menghapus "7.5" melewati keadaan "7."
//      yang oleh <input type=number> dilaporkan sebagai string kosong, lalu
//      `+''` menjadi 0, lalu 0 dirender kembali sebagai... "7". Terukur:
//      delapan kali Backspace menyisakan "7", dan ketikan berikutnya menyambung
//      menjadi "78" alih-alih mengganti.
//   3. DESIMAL PUTUS DI TENGAH JALAN. Mengetik "7.5" melewati "7." yang
//      langsung dibulatkan menjadi 7, sehingga titiknya hilang sebelum angka
//      di belakang koma sempat diketik.
//
// Perbaikannya: selama kolom sedang disunting, yang ditampilkan adalah TEKS
// yang diketik pengguna, bukan hasil pembulatan angkanya. Angka diteruskan ke
// atas hanya bila teksnya memang sudah berupa angka yang sah. Begitu fokus
// lepas, tampilan kembali mengikuti nilai dari atas — sehingga sinkronisasi
// perangkat tetap bisa memperbarui kolom yang tidak sedang disentuh.
// ─────────────────────────────────────────────────────────────────────────────

export function KolomAngka({
  nilai, onNilai, step = 1, placeholder, ariaLabel, kelas, disabled,
}: {
  /** Nilai dari atas. `undefined` berarti belum diisi. */
  nilai: number | undefined
  /** Dipanggil dengan angka baru, atau `undefined` bila kolom dikosongkan. */
  onNilai: (n: number | undefined) => void
  step?: number
  placeholder?: string
  ariaLabel?: string
  kelas?: string
  disabled?: boolean
}) {
  const [draf, setDraf] = useState<string | null>(null)
  const fokus = useRef(false)

  // Nilai dari atas hanya boleh menimpa tampilan saat kolom TIDAK disentuh.
  useEffect(() => {
    if (!fokus.current) setDraf(null)
  }, [nilai])

  const tampil = draf !== null
    ? draf
    : nilai === undefined || nilai === null || Number.isNaN(nilai) ? '' : String(nilai)

  return (
    <input
      className={`${inputClass} ${kelas ?? ''}`}
      // `inputMode="decimal"` memunculkan papan angka bertitik di ponsel;
      // type="number" saja memberi papan tanpa titik pada sebagian perangkat.
      type="text"
      inputMode="decimal"
      step={step}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={tampil}
      onFocus={() => { fokus.current = true }}
      onBlur={() => {
        fokus.current = false
        // Rapikan "7." menjadi "7" setelah selesai; selama mengetik dibiarkan.
        setDraf(null)
      }}
      onChange={(e) => {
        const t = e.target.value
        // Hanya angka, satu titik/koma, dan tanda minus di depan.
        if (!/^-?\d*[.,]?\d*$/.test(t)) return
        setDraf(t)
        if (t === '' || t === '-' || t === '.' || t === ',') { onNilai(undefined); return }
        const n = Number(t.replace(',', '.'))
        if (Number.isFinite(n)) onNilai(n)
      }}
    />
  )
}

export default KolomAngka
