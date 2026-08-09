import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { ambilTujuan, simpanTujuan, PILIHAN_TUJUAN, type Tujuan } from '../lib/tujuan'

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
 * Susunannya mengikuti TUJUAN PAKAI yang ditanyakan sekali, bukan peran akun.
 * Percobaan sebelumnya memakai peran, dan itu salah untuk separuh pemakai yang
 * dituju: peran "Doctor" mensyaratkan nomor STR, sedangkan mahasiswa kedokteran
 * belum punya STR dan karenanya mendaftar sebagai "pasien" — persis kelompok
 * yang paling membutuhkan isi klinis di atas, tetapi justru mendapat susunan
 * orang awam.
 *
 * Apa pun jawabannya, tidak ada bagian yang disembunyikan. Yang berubah hanya
 * urutan, karena aplikasi ini memang melayani keduanya dan seorang mahasiswa
 * kedokteran juga punya badan yang perlu dijaga.
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

/** Pertanyaan sekali pakai. Tidak menghalangi: beranda tetap terbaca di bawahnya. */
function Tanya({ pilih }: { pilih: (t: Tujuan) => void }) {
  return (
    <section className="rounded-2xl border border-brand/30 bg-brand-50/60 p-3 dark:border-brand/40 dark:bg-brand/10">
      <h2 className="text-[13px] font-black text-ink dark:text-white">Anda memakai ini untuk apa?</h2>
      <p className="mb-2 text-[11px] text-neutral-500">Menentukan urutan beranda saja — tidak ada yang disembunyikan.</p>
      <div className="space-y-1.5">
        {PILIHAN_TUJUAN.map((o) => (
          <button
            key={o.id}
            onClick={() => pilih(o.id)}
            className="flex w-full items-center gap-2.5 rounded-xl bg-white p-2.5 text-left dark:bg-white/10"
          >
            <span className="text-xl leading-none">{o.ikon}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-ink dark:text-white">{o.judul}</span>
              <span className="block text-[11px] text-neutral-500">{o.isi}</span>
            </span>
            <span className="text-neutral-300">›</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default function Beranda() {
  const { account } = useStore()
  const nama = account?.name?.split(' ')[0] ?? ''
  const [tujuan, setTujuan] = useState<Tujuan | null>(() => ambilTujuan())
  const pilih = (t: Tujuan) => { simpanTujuan(t); setTujuan(t) }
  // Sebelum dijawab, urutannya mengikuti peran akun sebagai perkiraan sementara
  // — dan pertanyaannya tetap ditampilkan supaya perkiraan itu bisa dikoreksi.
  //
  // "Keduanya" menaruh badan lebih dulu, dan itu keputusan frekuensi, bukan
  // kepentingan: gizi, latihan, dan tanda tubuh dibuka setiap hari, sedangkan
  // isi klinis dibuka saat sedang belajar. Yang lebih sering dituju diletakkan
  // lebih dekat. Kelompok klinis tetap ada tepat di bawahnya.
  const klinisDulu = tujuan ? tujuan === 'belajar' : account?.role === 'dokter'

  return (
    <div className="space-y-5 pb-4">
      <header>
        <h1 className="text-[20px] font-black text-ink dark:text-white">
          Halo{nama && `, ${nama}`}
        </h1>
        <p className="text-[13px] text-neutral-500">Mau kerjakan apa hari ini?</p>
      </header>

      {!tujuan && <Tanya pilih={pilih} />}

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

      {tujuan && (
        <section>
          <h2 className="mb-2 text-[11px] font-black uppercase tracking-wide text-neutral-500">Urutan beranda</h2>
          <div className="flex flex-wrap gap-1.5">
            {PILIHAN_TUJUAN.map((o) => (
              <button
                key={o.id}
                onClick={() => pilih(o.id)}
                aria-pressed={tujuan === o.id}
                className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${
                  tujuan === o.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}
              >
                {o.ikon} {o.judul}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-[11px] font-black uppercase tracking-wide text-neutral-500">Lainnya</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { ke: '/feed', label: '💬 Kabar Teman' },
            { ke: '/community', label: '👥 Komunitas' },
            { ke: '/scripture', label: '📖 Ibadah' },
            { ke: '/emergency', label: '🚨 Darurat' },
            { ke: '/semua-fitur', label: '🧭 Semua Fitur' },
            { ke: '/tutorial', label: '❓ Panduan' },
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
