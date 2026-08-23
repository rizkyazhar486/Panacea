import { useMemo, useState } from 'react'
import { KARYA, TEMA, type Karya } from '../lib/ringkasanKarya'
import { PemutarBaca } from '../components/PemutarBaca'

// ─────────────────────────────────────────────────────────────────────────────
// Ringkasan buku dan film pengembangan diri — satu paragraf per karya.
//
// UNTUK APA HALAMAN INI. Bukan pengganti bacaan, melainkan alat MEMILIH:
// membaca satu paragraf jauh lebih murah daripada memulai buku tiga ratus
// halaman yang ternyata bukan yang dibutuhkan bulan ini. Karena itu tiap
// ringkasan menjawab satu pertanyaan: apa gagasan intinya, dan untuk siapa.
//
// KEJUJURAN YANG DIPEGANG DI SINI, sama dengan seluruh aplikasi:
//   · Tidak ada angka penilaian yang dikarang. Nilai Goodreads dan IMDb
//     berubah tiap hari dan tidak dapat diperiksa dari dalam aplikasi ini
//     tanpa layanan berbayar; menuliskan "4,37" yang tidak pernah diambil dari
//     mana pun sama saja mengarang.
//   · Buku yang gagasannya dibantah bukti disebutkan bantahannya di
//     ringkasannya sendiri, bukan disembunyikan supaya daftarnya terlihat
//     mulus. Beberapa judul paling terkenal di sini justru yang paling banyak
//     catatannya.
//   · Tidak ada urutan "terbaik nomor satu". Urutannya menurut tema.
//
// Setiap ringkasan dapat DIDENGARKAN, memakai mesin suara bawaan perangkat —
// berguna justru pada saat orang paling mungkin memilih bacaan berikutnya:
// dalam perjalanan, bukan di depan meja.
// ─────────────────────────────────────────────────────────────────────────────

type Saring = 'semua' | 'buku' | 'film'

function Kartu({ k }: { k: Karya }) {
  return (
    <article className="kaca rounded-3xl p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="t-sedang min-w-0 font-black leading-snug text-ink dark:text-white">{k.judul}</h3>
        <span className="t-mikro shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 font-black uppercase text-neutral-500 dark:bg-white/10 dark:text-neutral-300">
          {k.jenis}
        </span>
      </div>
      <p className="t-mikro mt-0.5 truncate text-neutral-400">
        {k.oleh}{k.tahun ? ` · ${k.tahun}` : ''}
      </p>
      <p className="t-kecil mt-2 leading-relaxed text-neutral-600 dark:text-neutral-300">{k.ringkas}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PemutarBaca teks={`${k.judul}, oleh ${k.oleh}. ${k.ringkas}`} label="Dengarkan" />
        {k.tema.map((t) => (
          <span key={t} className="t-mikro rounded-full bg-brand/10 px-2 py-0.5 font-bold text-brand-dark dark:text-brand">{t}</span>
        ))}
      </div>
    </article>
  )
}

export function RingkasanKarya() {
  const [q, setQ] = useState('')
  const [jenis, setJenis] = useState<Saring>('semua')
  const [tema, setTema] = useState<string | null>(null)
  const [batas, setBatas] = useState(20)

  const hasil = useMemo(() => {
    const kata = q.trim().toLowerCase()
    return KARYA.filter((k) => {
      if (jenis !== 'semua' && k.jenis !== jenis) return false
      if (tema && !k.tema.includes(tema)) return false
      if (!kata) return true
      return (
        k.judul.toLowerCase().includes(kata) ||
        k.oleh.toLowerCase().includes(kata) ||
        k.ringkas.toLowerCase().includes(kata)
      )
    })
  }, [q, jenis, tema])

  const jumlahBuku = KARYA.filter((k) => k.jenis === 'buku').length
  const jumlahFilm = KARYA.length - jumlahBuku

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <section className="p-fluid rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand/15 dark:to-brand/5">
        <h1 className="t-judul font-black leading-tight text-ink dark:text-white">Ringkasan karya</h1>
        <p className="t-kecil mt-1 leading-relaxed text-neutral-600 dark:text-neutral-300">
          {KARYA.length} buku dan film pengembangan diri, masing-masing satu paragraf: apa gagasan intinya, dan untuk
          siapa. Cukup untuk memutuskan apakah akan dibaca atau ditonton — bukan untuk menggantikannya.
        </p>
        <p className="t-mikro mt-2 leading-relaxed text-neutral-500 dark:text-neutral-400">
          Tidak ada angka penilaian di halaman ini. Nilai di Goodreads dan IMDb berubah tiap hari dan tidak dapat
          diperiksa dari dalam aplikasi ini, jadi menuliskannya berarti mengarang. Yang dipilih: judul yang konsisten
          bernilai tinggi dan bertahan dibicarakan bertahun-tahun. Buku yang gagasannya dibantah bukti tetap masuk —
          dengan bantahannya ikut tertulis.
        </p>
      </section>

      <section className="kaca sticky top-2 z-10 rounded-3xl p-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setBatas(20) }}
          placeholder="Cari judul, penulis, atau kata dalam ringkasan"
          aria-label="Cari karya"
          className="t-kecil w-full rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-ink outline-none placeholder:text-neutral-400 focus:border-brand dark:border-white/12 dark:text-white"
        />
        <div className="geser-aman -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {([['semua', `Semua ${KARYA.length}`], ['buku', `Buku ${jumlahBuku}`], ['film', `Film ${jumlahFilm}`]] as [Saring, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setJenis(id); setBatas(20) }}
              className={`t-mikro shrink-0 rounded-full px-3 py-1.5 font-black transition ${
                jenis === id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/8 dark:text-neutral-300'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="w-px shrink-0 bg-neutral-200 dark:bg-white/10" />
          {TEMA.map((t) => (
            <button
              key={t}
              onClick={() => { setTema(tema === t ? null : t); setBatas(20) }}
              className={`t-mikro shrink-0 rounded-full px-3 py-1.5 font-black transition ${
                tema === t ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/8 dark:text-neutral-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <p className="t-mikro px-1 text-neutral-400">{hasil.length} karya</p>

      <div className="space-y-2">
        {hasil.slice(0, batas).map((k) => <Kartu key={k.id} k={k} />)}
      </div>

      {/* DIMUAT BERTAHAP. Seratus tiga puluh paragraf sekaligus membuat halaman
          ini setinggi tiga puluh layar dan berat digulir pada telepon lama;
          yang dicari orang biasanya ada di dua puluh pertama sesudah menyaring. */}
      {hasil.length > batas && (
        <button
          onClick={() => setBatas((b) => b + 20)}
          className="t-kecil min-h-[44px] w-full rounded-2xl border border-neutral-200 font-bold text-brand dark:border-white/12"
        >
          Tampilkan {Math.min(20, hasil.length - batas)} lagi
        </button>
      )}

      {hasil.length === 0 && (
        <p className="t-kecil px-1 text-center text-neutral-500">
          Tidak ada yang cocok. Coba kata lain, atau hapus saringan tema.
        </p>
      )}

      <p className="t-mikro px-1 leading-relaxed text-neutral-400">
        Ringkasan ditulis ulang, bukan disalin dari bukunya, sampul belakangnya, atau ulasan orang lain. Yang membuat
        sebuah buku bekerja — contoh, bantahan, dan pengulangannya — justru bagian yang hilang saat diringkas, jadi
        anggaplah halaman ini daftar pilihan, bukan sarinya.
      </p>
    </div>
  )
}

export default RingkasanKarya
