import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { ambilTujuan, simpanTujuan, modeAwam, PILIHAN_TUJUAN, type Tujuan } from '../lib/tujuan'

/**
 * Beranda: satu pertanyaan, "apa yang saya kerjakan sekarang?"
 *
 * Sebelumnya beranda adalah umpan sosial. Bagi pemakai baru itu berarti layar
 * pertama sebuah aplikasi kesehatan berbunyi "No posts yet" — 31 kata, tidak
 * satu pun tentang kesehatannya. Tidak ada alasan untuk kembali besok.
 *
 * Bentuknya KISI LAMBANG, bukan tumpukan kartu bertulisan. Kartu selebar layar
 * hanya memuat empat pintu per layar; kisi empat kolom memuat delapan sekaligus,
 * jadi seluruh isi aplikasi terlihat tanpa menggulir. Lambang juga dikenali
 * lebih cepat daripada dibaca, dan posisinya yang tetap membuat orang hafal
 * letaknya — itu pola yang sudah dipahami semua orang di sini dari Gojek dan
 * aplikasi sejenis.
 *
 * Susunannya mengikuti TUJUAN PAKAI yang ditanyakan sekali, bukan peran akun.
 * Peran "Doctor" mensyaratkan nomor STR, sedangkan mahasiswa kedokteran belum
 * punya STR dan karenanya mendaftar sebagai "pasien" — persis kelompok yang
 * paling membutuhkan isi klinis di atas, tetapi justru mendapat susunan orang
 * awam. Apa pun jawabannya tidak ada yang disembunyikan; yang berubah hanya
 * urutannya.
 */

type Pintu = { ke: string; ikon: string; judul: string; warna: string }

/** Warna latar lambang — tetap per wilayah, supaya letaknya ikut terhafal. */
const W = {
  gerak: 'bg-emerald-100 dark:bg-emerald-500/20',
  makan: 'bg-amber-100 dark:bg-amber-500/20',
  tidur: 'bg-indigo-100 dark:bg-indigo-500/20',
  tubuh: 'bg-rose-100 dark:bg-rose-500/20',
  otak: 'bg-violet-100 dark:bg-violet-500/20',
  alat: 'bg-sky-100 dark:bg-sky-500/20',
  obat: 'bg-teal-100 dark:bg-teal-500/20',
  darurat: 'bg-red-100 dark:bg-red-500/20',
}

const PRIBADI: Pintu[] = [
  { ke: '/latihan', ikon: '🏃', judul: 'Latihan', warna: W.gerak },
  { ke: '/nutrition', ikon: '🥗', judul: 'Gizi', warna: W.makan },
  { ke: '/recovery', ikon: '🌙', judul: 'Tidur', warna: W.tidur },
  { ke: '/tubuh', ikon: '❤️', judul: 'Tanda Tubuh', warna: W.tubuh },
]

const KLINIS: Pintu[] = [
  { ke: '/med-study', ikon: '🧠', judul: 'Penyakit', warna: W.otak },
  { ke: '/med-study', ikon: '🩺', judul: 'Tindakan', warna: W.alat },
  { ke: '/calculator-hub', ikon: '🧮', judul: 'Kalkulator', warna: W.alat },
  { ke: '/drug-info', ikon: '💊', judul: 'Obat', warna: W.obat },
]

/**
 * Pintu yang sama, disebut dengan bahasa sehari-hari.
 *
 * Halaman yang dituju persis sama dan tidak ada isi yang dikurangi. Yang
 * berbeda hanya namanya: "OSCE" dan "SOFA" adalah bahasa ujian, berarti bagi
 * yang diuji dengannya dan singkatan kosong bagi yang tidak.
 */
const KLINIS_AWAM: Pintu[] = [
  { ke: '/med-study', ikon: '🧠', judul: 'Penyakit', warna: W.otak },
  { ke: '/med-study', ikon: '🩺', judul: 'Pertolongan', warna: W.alat },
  { ke: '/calculator-hub', ikon: '🧮', judul: 'Hitung Risiko', warna: W.alat },
  { ke: '/drug-info', ikon: '💊', judul: 'Obat', warna: W.obat },
]

const LAINNYA: Pintu[] = [
  { ke: '/emergency', ikon: '🚨', judul: 'Darurat', warna: W.darurat },
  { ke: '/scripture', ikon: '📖', judul: 'Ibadah', warna: W.tidur },
  { ke: '/feed', ikon: '💬', judul: 'Kabar', warna: W.gerak },
  { ke: '/semua-fitur', ikon: '🧭', judul: 'Semua Fitur', warna: W.alat },
]

/**
 * Satu lambang.
 *
 * Label dibiarkan membungkus sampai dua baris dan tingginya dikunci, supaya
 * baris kisi tetap sejajar walau ada label sepanjang "Tanda Tubuh" berdampingan
 * dengan "Gizi" — tanpa itu, kotak-kotaknya bergeser naik-turun dan kisinya
 * berhenti terbaca sebagai kisi.
 */
function Lambang({ p }: { p: Pintu }) {
  return (
    <Link to={p.ke} className="flex flex-col items-center gap-1.5 transition active:scale-95">
      <span className={`grid h-[58px] w-[58px] place-items-center rounded-2xl text-[26px] ${p.warna}`}>
        {p.ikon}
      </span>
      <span className="flex h-[26px] items-start text-center text-[11px] font-bold leading-[1.2] text-ink dark:text-neutral-200">
        {p.judul}
      </span>
    </Link>
  )
}

/**
 * Satu baris keterangan di bawah judul kisi.
 *
 * Label lambang harus pendek supaya muat empat kolom, dan itu menghilangkan
 * keterangan yang dulu ada di kartu. Yang paling terasa hilangnya adalah
 * "SKDI": bagi mahasiswa kedokteran kata itu yang menandakan isinya memang
 * bahan ujiannya, dan tanpa itu kisi klinis terbaca seperti ensiklopedia umum.
 * Satu baris cukup untuk mengembalikannya tanpa menghidupkan lagi dinding
 * teks yang baru saja dibongkar.
 */
function Kisi({ judul, isi, pintu }: { judul: string; isi?: string; pintu: Pintu[] }) {
  return (
    <section>
      <h2 className="text-[11px] font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      {isi && <p className="mb-2 text-[11px] leading-snug text-neutral-400">{isi}</p>}
      {!isi && <div className="mb-2" />}
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {pintu.map((p) => <Lambang key={p.judul} p={p} />)}
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
  // Sebelum dijawab, peran akun dipakai sebagai perkiraan sementara — dan
  // pertanyaannya tetap tampil supaya perkiraan itu bisa dikoreksi.
  //
  // "Keduanya" menaruh badan lebih dulu, dan itu keputusan frekuensi, bukan
  // kepentingan: gizi, latihan, dan tanda tubuh dibuka setiap hari, sedangkan
  // isi klinis dibuka saat sedang belajar.
  const klinisDulu = tujuan ? tujuan === 'belajar' : account?.role === 'dokter'
  const awam = modeAwam(tujuan)
  const klinis = awam ? KLINIS_AWAM : KLINIS
  const judulKlinis = awam ? 'Kesehatan & Penyakit' : 'Klinis'
  const isiKlinis = awam
    ? '623 penyakit — apa, sebabnya, tandanya, obatnya'
    : '623 penyakit SKDI · OSCE · SOFA, Wells, Child-Pugh · resep'

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
          <Kisi judul={judulKlinis} isi={isiKlinis} pintu={klinis} />
          <Kisi judul="Badan Anda" isi="Latihan, makan, tidur, dan angka tubuh Anda" pintu={PRIBADI} />
        </>
      ) : (
        <>
          <Kisi judul="Badan Anda" isi="Latihan, makan, tidur, dan angka tubuh Anda" pintu={PRIBADI} />
          <Kisi judul={judulKlinis} isi={isiKlinis} pintu={klinis} />
        </>
      )}

      <Kisi judul="Lainnya" pintu={LAINNYA} />

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

      <Link to="/tutorial" className="block text-center text-[12px] font-bold text-brand">
        ❓ Baru di sini? Buka panduan 6 langkah
      </Link>
    </div>
  )
}
