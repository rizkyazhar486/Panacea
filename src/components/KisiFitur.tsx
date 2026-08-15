import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { WIDGETS } from '../lib/homeWidgets'

// ─────────────────────────────────────────────────────────────────────────────
// Kisi fitur bergaya super-app.
//
// BENTUK YANG DITIRU, DAN ALASAN TIAP BAGIANNYA. Aplikasi dompet dan belanja
// besar menyusun beranda dengan pola yang sama, dan pola itu bertahan bukan
// karena selera melainkan karena memecahkan satu masalah nyata: bagaimana
// menaruh seratus lebih fitur di satu layar tanpa membuat orang menyerah.
//
//   1. DIKELOMPOKKAN, BUKAN SATU DAFTAR PANJANG. Ingatan bekerja pada kelompok
//      berukuran kecil; seratus lambang berjajar tanpa sekat menjadi kabur dan
//      tidak satu pun terhafal letaknya.
//
//   2. EMPAT KOLOM, DUA BARIS PER BAGIAN. Delapan sudah cukup untuk mewakili
//      satu wilayah, dan sisanya diambil lewat "Lihat semua". Menampilkan
//      seluruh isi tiap kelompok membuat halaman kembali menjadi daftar
//      panjang yang tadi hendak dihindari.
//
//   3. KEPING PENYARING YANG DAPAT DIGESER. Ia bukan hiasan: pada sebelas
//      kelompok, keping inilah yang memungkinkan orang melompat ke wilayahnya
//      tanpa menggulir melewati wilayah yang tidak ia butuhkan.
//
//   4. LABEL DI BAWAH LAMBANG, BUKAN DI SAMPINGNYA. Susunan menurun memuat
//      empat kolom pada layar 390 px; susunan menyamping hanya memuat dua.
//
// YANG SENGAJA TIDAK DITIRU. Aplikasi yang menjadi contoh menaruh hitung mundur
// "berakhir dalam 11:10:26", lencana "baru", dan tawaran yang berkedip — semua
// itu bekerja karena menciptakan rasa takut tertinggal, dan itu tidak punya
// tempat pada aplikasi kesehatan. Yang diambil di sini adalah cara MENYUSUN
// fitur, bukan cara mendesak orang.
// ─────────────────────────────────────────────────────────────────────────────

/** Satu lambang fitur: gambar di atas, label pendek di bawahnya. */
function Lambang({ w }: { w: (typeof WIDGETS)[number] }) {
  return (
    <Link
      to={w.ke}
      className="flex min-h-[76px] flex-col items-center gap-1 rounded-2xl p-1 text-center transition active:scale-95"
    >
      <span
        aria-hidden
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-[20px] dark:bg-white/10"
      >
        {w.emoji}
      </span>
      {/* Dua baris, lalu dipotong. Label yang boleh memanjang membuat tinggi
          tiap ubin berbeda-beda dan barisnya tidak lagi sejajar. */}
      <span className="line-clamp-2 text-[10.5px] font-bold leading-tight text-ink dark:text-white">
        {w.label}
      </span>
    </Link>
  )
}

const PER_BAGIAN = 8

function Bagian({ kategori, daftar }: { kategori: string; daftar: typeof WIDGETS }) {
  const [semua, setSemua] = useState(false)
  const tampil = semua ? daftar : daftar.slice(0, PER_BAGIAN)
  const sisa = daftar.length - PER_BAGIAN

  return (
    <section id={`bagian-${kategori}`} className="rounded-3xl bg-white p-3 dark:bg-white/5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-black text-ink dark:text-white">{kategori}</h3>
        {sisa > 0 && (
          <button
            onClick={() => setSemua((v) => !v)}
            className="flex h-10 shrink-0 items-center gap-1 text-[11px] font-bold text-brand"
          >
            {semua ? 'Ringkas' : `Lihat semua (${daftar.length})`}
            <span aria-hidden>{semua ? '▲' : '›'}</span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1">
        {tampil.map((w) => <Lambang key={w.id} w={w} />)}
      </div>
    </section>
  )
}

/**
 * Kisi fitur beranda.
 *
 * Kelompoknya diturunkan DARI KATALOG, bukan ditulis ulang di sini. Dua daftar
 * yang berisi hal sama pasti berselisih setelah beberapa kali diubah, dan yang
 * ketinggalan biasanya yang ini — fitur baru akan muncul di pemilih widget
 * tetapi hilang dari kisi, tanpa ada yang menyadarinya.
 */
export function KisiFitur() {
  const kelompok = useMemo(() => {
    const peta = new Map<string, typeof WIDGETS>()
    for (const w of WIDGETS) {
      if (!peta.has(w.kategori)) peta.set(w.kategori, [])
      peta.get(w.kategori)!.push(w)
    }
    return [...peta.entries()]
  }, [])

  const [pilih, setPilih] = useState<string | null>(null)
  const wadah = useRef<HTMLDivElement>(null)

  const terlihat = pilih ? kelompok.filter(([k]) => k === pilih) : kelompok

  return (
    <section className="j-grup">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Semua fitur</h2>
        <Link to="/semua-fitur" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          Daftar lengkap →
        </Link>
      </div>

      {/* Keping penyaring. Memakai .geser-aman supaya gerakan menyamping tidak
          bertabrakan dengan gerakan kembali milik sistem di tepi layar. */}
      <div className="geser-aman" ref={wadah}>
        <button
          onClick={() => setPilih(null)}
          aria-pressed={pilih === null}
          className={`t-kecil flex min-h-[40px] items-center rounded-full px-4 font-bold transition ${
            pilih === null ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
          }`}
          style={{ width: 'auto' }}
        >
          Semua
        </button>
        {kelompok.map(([k, d]) => (
          <button
            key={k}
            onClick={() => setPilih(pilih === k ? null : k)}
            aria-pressed={pilih === k}
            className={`t-kecil flex min-h-[40px] items-center whitespace-nowrap rounded-full px-4 font-bold transition ${
              pilih === k ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
            }`}
            style={{ width: 'auto' }}
          >
            {k} <span className="ml-1 opacity-60">{d.length}</span>
          </button>
        ))}
      </div>

      <div className="j-grup">
        {terlihat.map(([k, d]) => <Bagian key={k} kategori={k} daftar={d} />)}
      </div>
    </section>
  )
}

export default KisiFitur
