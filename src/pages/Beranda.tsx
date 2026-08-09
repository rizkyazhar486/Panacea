import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'

/**
 * Beranda: satu pertanyaan, "apa yang saya kerjakan sekarang?"
 *
 * Sebelumnya beranda adalah umpan sosial. Bagi pemakai baru itu berarti layar
 * pertama sebuah aplikasi kesehatan berbunyi "No posts yet" — 31 kata, tidak
 * satu pun tentang kesehatannya. Tidak ada alasan untuk kembali besok.
 *
 * Umpan sosial tidak dihapus, hanya tidak lagi menjadi pintu masuk: ia butuh
 * massa kritis yang belum ada, sedangkan isi klinis sudah lengkap sejak hari
 * pertama dan berguna walau pemakainya sendirian.
 *
 * Susunannya mengikuti PERAN, karena dua pemakai yang dilayani aplikasi ini
 * datang untuk hal yang sama sekali berbeda: yang satu menghafal penyakit
 * untuk ujian, yang lain menjaga badannya sendiri. Satu beranda yang mencoba
 * melayani keduanya sekaligus akan gagal untuk keduanya.
 */

type Pintu = { ke: string; ikon: string; judul: string; isi: string }

/**
 * Pintu untuk yang belajar/berpraktik kedokteran, DIURUTKAN MENURUT KEDALAMAN
 * ISI YANG SUDAH ADA — bukan menurut selera. Direktori SKDI memuat 623 catatan
 * penyakit; itu yang paling matang, jadi itu yang di atas.
 */
const KLINIS: Pintu[] = [
  { ke: '/med-study', ikon: '🧠', judul: 'Belajar Penyakit', isi: '623 penyakit SKDI — peta sebab, tanda, obat, bahaya' },
  { ke: '/med-study', ikon: '🩺', judul: 'Keterampilan & OSCE', isi: 'APN, ACLS, ATLS, bidai, sirkumsisi — langkah demi langkah' },
  { ke: '/clinical-calculators', ikon: '🧮', judul: 'Skor & Kalkulator', isi: 'SOFA, Wells, GRACE, Child-Pugh, dosis anak' },
  { ke: '/drug-info', ikon: '💊', judul: 'Obat & Resep', isi: 'Dosis, interaksi, cara menulis resep' },
]

/** Pintu untuk yang menjaga badannya sendiri. */
const PRIBADI: Pintu[] = [
  { ke: '/latihan', ikon: '🏃', judul: 'Latihan', isi: 'Sesi berikutnya dari kelelahan yang masih ada' },
  { ke: '/nutrition', ikon: '🥗', judul: 'Gizi', isi: 'Makan hari ini, target kalori dan protein' },
  { ke: '/recovery', ikon: '🌙', judul: 'Tidur & Pemulihan', isi: 'Utang tidur, kesiapan besok' },
  { ke: '/tubuh', ikon: '❤️', judul: 'Tanda Tubuh', isi: 'Tekanan darah, nadi, berat, gula' },
]

function Kartu({ p }: { p: Pintu }) {
  return (
    <Link
      to={p.ke}
      className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5 transition active:scale-[0.99] dark:border-white/10 dark:bg-white/5"
    >
      <span className="text-2xl leading-none">{p.ikon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-ink dark:text-white">{p.judul}</span>
        <span className="block text-[12px] leading-snug text-neutral-500">{p.isi}</span>
      </span>
      <span className="text-neutral-300">›</span>
    </Link>
  )
}

function Bagian({ judul, pintu }: { judul: string; pintu: Pintu[] }) {
  return (
    <section>
      <h2 className="mb-2 text-[11px] font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      <div className="space-y-2">
        {pintu.map((p) => <Kartu key={p.judul} p={p} />)}
      </div>
    </section>
  )
}

export default function Beranda() {
  const { account } = useStore()
  const nama = account?.name?.split(' ')[0] ?? ''
  // Peran 'dokter' mencakup mahasiswa kedokteran dan dokter muda — merekalah
  // yang datang untuk isi klinis. Bagi mereka klinis didahulukan; bagi yang
  // lain badannya sendiri yang didahulukan. Kedua bagian tetap ada, hanya
  // urutannya yang berbeda, supaya tidak ada yang kehilangan akses.
  const klinisDulu = account?.role === 'dokter'

  return (
    <div className="space-y-5 pb-4">
      <header>
        <h1 className="text-[20px] font-black text-ink dark:text-white">
          Halo{nama && `, ${nama}`}
        </h1>
        <p className="text-[13px] text-neutral-500">Mau kerjakan apa hari ini?</p>
      </header>

      <Link
        to="/search"
        className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[13px] text-neutral-400 dark:border-white/10 dark:bg-white/5"
      >
        🔍 Cari penyakit, obat, skor, atau latihan…
      </Link>

      {klinisDulu ? (
        <>
          <Bagian judul="Klinis" pintu={KLINIS} />
          <Bagian judul="Badan Anda" pintu={PRIBADI} />
        </>
      ) : (
        <>
          <Bagian judul="Badan Anda" pintu={PRIBADI} />
          <Bagian judul="Klinis" pintu={KLINIS} />
        </>
      )}

      <section>
        <h2 className="mb-2 text-[11px] font-black uppercase tracking-wide text-neutral-500">Lainnya</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { ke: '/feed', label: '💬 Kabar Teman' },
            { ke: '/community', label: '👥 Komunitas' },
            { ke: '/scripture', label: '📖 Ibadah' },
            { ke: '/emergency', label: '🚨 Darurat' },
            { ke: '/jelajah', label: '🧭 Semua fitur' },
          ].map((x) => (
            <Link
              key={x.ke}
              to={x.ke}
              className="rounded-full bg-neutral-100 px-3.5 py-2 text-[12px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
            >
              {x.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
