import { Link } from 'react-router-dom'
import { useTujuan, modeAwam } from '../lib/tujuan'

/**
 * Panduan pemakaian: peta, bukan buku manual.
 *
 * Ditulis dengan bentuk yang sama dengan catatan penyakit — simpul, panah,
 * kotak — karena itu bentuk yang sudah dipakai di seluruh aplikasi ini, dan
 * panduan yang berbentuk lain justru menambah satu hal baru untuk dipelajari.
 *
 * Isinya dibatasi pada apa yang benar-benar perlu diketahui untuk mulai: ke
 * mana pergi, apa yang didapat, dan berapa lama. Sisanya sudah dijelaskan di
 * halamannya masing-masing.
 */

type Langkah = { ke?: string; ikon: string; judul: string; isi: string; lama: string }

const MULAI: Langkah[] = [
  { ke: '/profile', ikon: '👤', judul: 'Isi profil singkat', isi: 'Umur, tinggi, berat. Tanpa ini kalkulator dan target gizi tidak bisa dihitung.', lama: '1 menit' },
  { ke: '/tubuh', ikon: '❤️', judul: 'Catat satu angka', isi: 'Tekanan darah, berat, atau nadi. Satu angka sudah cukup untuk memulai grafik.', lama: '30 detik' },
  { ke: '/latihan', ikon: '🏃', judul: 'Catat satu latihan', isi: 'Aplikasi memakainya untuk menghitung kelelahan dan menyarankan sesi berikutnya.', lama: '1 menit' },
]

const BELAJAR: Langkah[] = [
  { ke: '/med-study', ikon: '🧠', judul: 'Buka satu penyakit', isi: 'Muncul peta: Sebab → Tampak → Pastikan → Periksa → Obat → Bahaya. Ketuk cabang untuk isi penuh.', lama: '2 menit' },
  { ke: '/med-study', ikon: '🩺', judul: 'Buka satu tindakan', isi: 'Tiap fase jadi satu cabang. Urutan fase itulah yang dihafal, langkahnya dipanggil saat dibutuhkan.', lama: '2 menit' },
  { ke: '/clinical-calculators', ikon: '🧮', judul: 'Hitung satu skor', isi: 'SOFA, Wells, Child-Pugh. Isi kolomnya, hasil dan artinya keluar bersamaan.', lama: '1 menit' },
]

/** Langkah yang sama tanpa istilah ujian. Halaman tujuannya persis sama. */
const BELAJAR_AWAM: Langkah[] = [
  { ke: '/med-study', ikon: '🧠', judul: 'Cari satu penyakit', isi: 'Muncul peta: Sebab → Tampak → Pastikan → Periksa → Obat → Bahaya. Ketuk cabang untuk isi penuh.', lama: '2 menit' },
  { ke: '/med-study', ikon: '🩺', judul: 'Lihat cara pertolongan', isi: 'Bantuan napas, henti jantung, membidai patah tulang — tiap tahap satu cabang.', lama: '2 menit' },
  { ke: '/clinical-calculators', ikon: '🧮', judul: 'Hitung satu risiko', isi: 'Risiko jantung, fungsi ginjal. Isi kolomnya, hasil dan artinya keluar bersamaan.', lama: '1 menit' },
]

/** Arti warna cabang di peta penyakit — sama di seluruh 623 catatan. */
const WARNA: [string, string, string][] = [
  ['bg-neutral-700', 'APA', 'definisi singkat'],
  ['bg-rose-500', 'SEBAB', 'etiologi, faktor risiko'],
  ['bg-sky-500', 'TAMPAK', 'keluhan dan tanda'],
  ['bg-violet-500', 'PASTIKAN', 'cara menegakkan diagnosis'],
  ['bg-amber-500', 'PERIKSA', 'pemeriksaan penunjang'],
  ['bg-emerald-500', 'OBAT', 'tatalaksana'],
  ['bg-neutral-400', 'BEDA DGN', 'diagnosis banding'],
  ['bg-red-600', 'BAHAYA', 'komplikasi'],
]

function Baris({ l, no }: { l: Langkah; no: number }) {
  const isi = (
    <>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-black text-white">{no}</span>
      <span className="text-xl leading-none">{l.ikon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-ink dark:text-white">{l.judul}</span>
        <span className="block text-[12px] leading-snug text-neutral-500">{l.isi}</span>
      </span>
      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-white/10">{l.lama}</span>
    </>
  )
  const kelas = 'flex items-center gap-2.5 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/5'
  return l.ke ? <Link to={l.ke} className={`${kelas} active:scale-[0.99]`}>{isi}</Link> : <div className={kelas}>{isi}</div>
}

function Bagian({ judul, langkah, dari }: { judul: string; langkah: Langkah[]; dari: number }) {
  return (
    <section>
      <h2 className="mb-2 text-[11px] font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      <div className="space-y-2">
        {langkah.map((l, i) => <Baris key={l.judul} l={l} no={dari + i} />)}
      </div>
    </section>
  )
}

export default function Tutorial() {
  // Panduan memakai bahasa pembacanya sendiri; kalau tidak, langkah pertama
  // pemakai awam justru menjadi menebak arti singkatan di dalam panduannya.
  const awam = modeAwam(useTujuan())
  return (
    <div className="space-y-5 pb-4">
      <header>
        <h1 className="text-[20px] font-black text-ink dark:text-white">Panduan Pemakaian</h1>
        <p className="text-[13px] text-neutral-500">Enam langkah, kurang dari 10 menit. Ketuk untuk langsung ke sana.</p>
      </header>

      <Bagian judul="① Siapkan dulu" langkah={MULAI} dari={1} />
      <Bagian judul={awam ? '② Mulai cari tahu' : '② Mulai belajar'} langkah={awam ? BELAJAR_AWAM : BELAJAR} dari={4} />

      <section>
        <h2 className="mb-2 text-[11px] font-black uppercase tracking-wide text-neutral-500">Arti warna di peta penyakit</h2>
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
          <p className="mb-2 text-[12px] leading-snug text-neutral-500">
            {awam
              ? 'Warna dan urutannya sama di seluruh 623 penyakit. Kenali sekali, berlaku untuk semuanya.'
              : 'Warna dan urutannya sama di seluruh 623 penyakit. Hafalkan sekali, berlaku untuk semuanya.'}
          </p>
          <ul className="space-y-1">
            {WARNA.map(([w, label, arti]) => (
              <li key={label} className="flex items-center gap-2">
                <span className={`w-[68px] shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-black uppercase tracking-wide text-white ${w}`}>{label}</span>
                <span className="text-neutral-400">▶</span>
                <span className="text-[12px] text-neutral-600 dark:text-neutral-300">{arti}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[11px] font-black uppercase tracking-wide text-neutral-500">Kalau tersesat</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/semua-fitur" className="rounded-full bg-brand px-3.5 py-2 text-[12px] font-bold text-white">🧭 Semua Fitur</Link>
          <Link to="/search" className="rounded-full bg-neutral-100 px-3.5 py-2 text-[12px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">🔍 Cari</Link>
          <Link to="/atur-fitur" className="rounded-full bg-neutral-100 px-3.5 py-2 text-[12px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">⚙️ Sembunyikan fitur</Link>
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-neutral-400">
        {awam
          ? 'Isi kesehatan di aplikasi ini bahan bacaan, bukan diagnosis dan bukan resep. Kalau ada keluhan, periksakan ke dokter.'
          : 'Isi klinis di aplikasi ini bahan belajar, bukan pengganti pemeriksaan dokter. Selalu periksa ulang pedoman terkini sebelum dipakai pada pasien.'}
      </p>
    </div>
  )
}
