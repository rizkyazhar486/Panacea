import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { PapanWidget } from '../components/PapanWidget'
import { KisiFitur } from '../components/KisiFitur'
import { CatatanHarian } from '../components/CatatanHarian'
import { CatatanLatihan } from '../components/CatatanLatihan'
import { pratinjauBeranda } from '../lib/pratinjauBeranda'
import { deretMetrik } from '../lib/riwayatVitals'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { statusSingkat } from '../lib/pelatih'
import { hrMaxFromAge } from '../lib/workoutImport'
import { ageFromDob } from '../lib/anthro'
import { ambilTujuan, modeAwam } from '../lib/tujuan'
import {
  LogoLatihan, LogoGizi, LogoTidur, LogoTubuh, LogoPenyakit, LogoTindakan,
  LogoKalkulator, LogoObat, LogoDarurat, LogoIbadah, LogoKabar, LogoSemua, LogoPanduan,
} from '../components/LogoFitur'

/**
 * Dasbor: piramida terbalik, dibaca Z lalu F.
 *
 * PIRAMIDA TERBALIK. Yang paling menentukan keputusan ada paling atas, dan
 * seterusnya menurun: angka hari ini -> tindakan berikutnya -> pintu fitur ->
 * pelengkap. Orang yang berhenti membaca setelah satu layar tetap memperoleh
 * bagian yang paling berguna.
 *
 * Z DI ATAS, F DI BAWAH — dua pola, karena bentuk isinya memang dua macam.
 * Bagian atas berupa panel lebar, dan mata menyapunya menyilang: kiri-atas
 * (siapa saya) -> kanan-atas (aksi utama) -> kiri-bawah (angka) -> kanan-bawah
 * (kesimpulan). Bagian bawah berupa daftar kisi, dan daftar dibaca menurun
 * dengan sapuan pendek ke kanan di tiap barisnya — karena itu judul kelompok
 * ditaruh rata kiri dan label lambang dijaga pendek.
 *
 * JARAK. Permintaannya 6 px antar-elemen dan 8 px antar-grup. Yang pertama
 * dipakai apa adanya; yang kedua tidak bisa. Pengelompokan visual bekerja lewat
 * PERBEDAAN jarak, dan 8/6 hanya 1,33x — pada layar 390 px selisihnya 2 px,
 * setara 0,5% lebar layar, sehingga kelompok berhenti terbaca sebagai kelompok
 * dan seluruh halaman kembali menjadi satu daftar rapat. Sistem desain yang
 * mapan memakai 2,5x-3x (Material 8/24, Apple 8/20). Di sini: 6 px di dalam
 * widget, 24 px antar-grup — 4x, dan hierarkinya terbaca.
 *
 * FLUID. Angka-angka di atas adalah BATAS BAWAHNYA, bukan nilai matinya.
 * Seluruh ukuran halaman ini — huruf, jarak, wadah, ubin lambang, jumlah kolom
 * — mengalir mengikuti lebar wadahnya lewat clamp() dan satuan cqw; lihat
 * "MODEL FLUID" di index.css. Yang berubah bukan sekadar nilainya melainkan
 * modelnya: sebelumnya sebuah ukuran hanya benar tepat di lebar yang diuji dan
 * meleset di antaranya, karena ditetapkan sebagai angka mati padahal yang
 * menentukan keterbacaan adalah perbandingannya terhadap ruang yang ada.
 *
 * Tidak ada satu pun titik patah yang ditulis di berkas ini. Kisi empat kolom
 * pada telepon terbentuk dengan sendirinya dari lebar ubin, dan menambah kolom
 * sendiri pada layar yang lebih lega.
 */

// ── Jarak di dalam satu widget. Batas bawah 6 px, tumbuh sampai 10 px. ──
const DALAM = 'gap-fluid'

type Pintu = { ke: string; Logo: (p: { size?: number }) => JSX.Element; judul: string; warna: string }

/** Warna latar lambang — tetap per wilayah, supaya letaknya ikut terhafal. */
const W = {
  gerak: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  makan: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  tidur: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  tubuh: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  otak: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  alat: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  obat: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
  darurat: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
}

const PRIBADI: Pintu[] = [
  { ke: '/latihan', Logo: LogoLatihan, judul: 'Latihan', warna: W.gerak },
  { ke: '/nutrition', Logo: LogoGizi, judul: 'Gizi', warna: W.makan },
  { ke: '/recovery', Logo: LogoTidur, judul: 'Tidur', warna: W.tidur },
  { ke: '/tubuh', Logo: LogoTubuh, judul: 'Tubuh', warna: W.tubuh },
]

const KLINIS: Pintu[] = [
  { ke: '/med-study', Logo: LogoPenyakit, judul: 'Penyakit', warna: W.otak },
  { ke: '/med-study', Logo: LogoTindakan, judul: 'Tindakan', warna: W.alat },
  { ke: '/calculator-hub', Logo: LogoKalkulator, judul: 'Kalkulator', warna: W.alat },
  { ke: '/drug-info', Logo: LogoObat, judul: 'Obat', warna: W.obat },
]

/** Pintu yang sama dengan nama sehari-hari. Halaman tujuannya persis sama. */
const KLINIS_AWAM: Pintu[] = [
  { ke: '/med-study', Logo: LogoPenyakit, judul: 'Penyakit', warna: W.otak },
  { ke: '/med-study', Logo: LogoTindakan, judul: 'Pertolongan', warna: W.alat },
  { ke: '/calculator-hub', Logo: LogoKalkulator, judul: 'Risiko', warna: W.alat },
  { ke: '/drug-info', Logo: LogoObat, judul: 'Obat', warna: W.obat },
]

const LAINNYA: Pintu[] = [
  { ke: '/emergency', Logo: LogoDarurat, judul: 'Darurat', warna: W.darurat },
  { ke: '/scripture', Logo: LogoIbadah, judul: 'Ibadah', warna: W.tidur },
  { ke: '/feed', Logo: LogoKabar, judul: 'Kabar', warna: W.gerak },
  { ke: '/semua-fitur', Logo: LogoSemua, judul: 'Semua', warna: W.alat },
]

// ── Angka utama ─────────────────────────────────────────────────────────────

type Kpi = { label: string; nilai: string; satuan?: string; nada: string; deret?: number[] }

/**
 * Grafik garis kecil, digambar sendiri sebagai SVG.
 *
 * Sengaja tanpa sumbu, tanpa kisi, tanpa label: pada lebar 70 px semua itu
 * tidak terbaca dan hanya menambah coretan. Yang perlu terbaca dari sini cuma
 * ARAHNYA — naik atau turun — dan angka persisnya sudah tercetak di sebelahnya.
 */
function Garis({ deret, kelas }: { deret: number[]; kelas: string }) {
  if (deret.length < 2) return null
  const min = Math.min(...deret)
  const max = Math.max(...deret)
  const rentang = max - min || 1
  const titik = deret
    .map((v, i) => `${(i / (deret.length - 1)) * 68 + 1},${19 - ((v - min) / rentang) * 17}`)
    .join(' ')
  return (
    // Melebar mengikuti kartunya, dengan tinggi tetap. preserveAspectRatio
    // "none" membuat gambarnya diregangkan mendatar — yang justru diinginkan di
    // sini, karena yang dibaca hanyalah arahnya. Agar peregangan itu tidak ikut
    // menipiskan garisnya, tebalnya dikunci dengan vector-effect.
    <svg
      viewBox="0 0 70 20"
      preserveAspectRatio="none"
      fill="none"
      className={`h-[clamp(18px,5cqw,26px)] w-full ${kelas}`}
      aria-hidden="true"
    >
      <polyline
        points={titik}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/*
 * CAHAYA HANYA UNTUK ANGKA PERTAMA.
 *
 * Percobaan pertama menyalakan seluruh kartu KPI sekaligus, dan hasilnya
 * terlihat di tangkapan layar: empat angka bersinar sama terang, sehingga tidak
 * ada satu pun yang menonjol — persis kebalikan dari maksudnya. Cahaya bekerja
 * sebagai PEMBEDA, dan pembeda yang diberikan kepada semua orang berhenti
 * membedakan.
 */
function KartuKpi({ k, utama }: { k: Kpi; utama?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col ${DALAM} rounded-2xl bg-white/70 p-3 dark:bg-white/5`}>
      <span className="t-mikro truncate font-bold uppercase tracking-wide text-neutral-500">{k.label}</span>
      {/* flex-wrap, bukan satu baris kaku: pada kartu sempit "12" dan satuannya
          "tercatat" saling menimpa — terlihat di tangkapan layar, tidak pernah
          terlihat dari kode. */}
      <span className="flex flex-wrap items-baseline gap-x-1">
        {/* Ukurannya mengikuti panjang nilainya. Lihat catatan "Angka panjang"
            di index.css: pada ukuran yang sama, "118/76" tidak muat di petak
            yang memuat "72" dengan lapang. */}
        <span className={`${k.nilai.length >= 5 ? 't-angka-panjang' : 't-angka'} ${utama ? 'nyala' : ''} min-w-0 font-black leading-none tabular-nums ${k.nada}`}>{k.nilai}</span>
        {k.satuan && <span className="t-mikro min-w-0 truncate font-bold text-neutral-400">{k.satuan}</span>}
      </span>
      {k.deret && <Garis deret={k.deret} kelas={k.nada} />}
    </div>
  )
}

// ── Kisi lambang ────────────────────────────────────────────────────────────

function Lambang({ p }: { p: Pintu }) {
  const { Logo } = p
  return (
    <Link
      to={p.ke}
      className={`flex w-full max-w-[calc(var(--ubin)*1.5)] flex-col items-center ${DALAM} rounded-2xl py-1 transition active:scale-95`}
    >
      {/* Ubin dan lambangnya tumbuh bersama: ukuran svg ditentukan dalam persen
          oleh .ubin-fluid, jadi tidak ada angka kedua yang bisa berselisih
          dengan ukuran ubinnya. Nilai size di bawah hanya bekal bila CSS-nya
          belum termuat. */}
      <span className={`ubin-fluid grid place-items-center rounded-2xl ${p.warna}`}>
        <Logo size={26} />
      </span>
      <span className="t-kecil text-center font-bold leading-tight text-ink dark:text-neutral-200">
        {p.judul}
      </span>
    </Link>
  )
}

/**
 * Satu baris keterangan di bawah judul kisi.
 *
 * Label lambang harus pendek supaya muat empat kolom, dan itu menghilangkan
 * keterangan yang dulu ada. Yang paling terasa hilangnya adalah "SKDI": bagi
 * mahasiswa kedokteran kata itu yang menandakan isinya memang bahan ujiannya,
 * dan tanpa itu kisi klinis terbaca seperti ensiklopedia umum. Baris ini
 * pernah dihapus tanpa sengaja saat berkas ini ditulis ulang, dan yang
 * menangkapnya adalah uji yang mencari kata itu di layar.
 */
function Kisi({ judul, isi, pintu }: { judul: string; isi?: string; pintu: Pintu[] }) {
  return (
    <section>
      {/* Rata kiri: pemindaian pola F bertumpu pada tepi kiri yang lurus. */}
      <h2 className="t-kecil mb-2 font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      {isi && <p className="t-kecil mb-2 leading-snug text-neutral-400">{isi}</p>}
      <div className="kisi-fluid">
        {pintu.map((p) => <Lambang key={p.judul} p={p} />)}
      </div>
    </section>
  )
}

export default function Beranda() {
  const { account, state } = useStore()
  const nama = account?.name?.split(' ')[0] ?? ''
  // Tidak ada lagi pertanyaan "Anda memakai ini untuk apa?" di beranda:
  // beranda bukan tempat mewawancarai orang. Urutan dasbor mengikuti peran
  // akun, dan tujuan yang pernah tersimpan tetap dihormati bila ada.
  const tujuan = ambilTujuan()

  /*
   * Tanggal yang dihitung sebagai "hari tercatat" — dipakai ubin rangkaian.
   * Sumbernya dua, bukan satu: seseorang yang hanya mencatat tenaganya tanpa
   * mencatat tidur tetap mencatat hari itu. Aturan yang sama dipakai
   * CatatanHarian, dan bila keduanya berbeda maka angka yang sama akan tampil
   * dua nilai di satu layar.
   */
  const tanggalCatatan = useMemo(() => {
    const dari = new Set<string>()
    for (const s of state.sleepLogs ?? []) if (s?.date) dari.add(s.date)
    for (const k of Object.keys(state.wellness ?? {})) dari.add(k)
    return [...dari]
  }, [state.sleepLogs, state.wellness])
  const klinisDulu = tujuan ? tujuan === 'belajar' : account?.role === 'dokter'
  const awam = modeAwam(tujuan)
  const klinis = awam ? KLINIS_AWAM : KLINIS
  const judulKlinis = awam ? 'Kesehatan & Penyakit' : 'Klinis'
  const isiKlinis = awam
    ? '623 penyakit — apa, sebabnya, tandanya, obatnya'
    : '623 penyakit SKDI · OSCE · SOFA, Wells, Child-Pugh · resep'

  /**
   * Angka yang benar-benar ada, bukan tempat kosong yang menunggu diisi.
   *
   * Panel angka hanya muncul bila datanya memang ada. Dasbor yang menampilkan
   * "—" di setiap kolom pada hari pertama justru mengajarkan pemakainya bahwa
   * bagian itu boleh diabaikan, dan sesudah itu ia tidak akan dilihat lagi
   * walau kemudian terisi.
   */
  const kpi = useMemo<Kpi[]>(() => {
    const out: Kpi[] = []
    const w = getWorkouts()
    const v = getVitals()
    if (w.length) {
      // Konteks dihitung sungguhan, bukan objek kosong.
      //
      // Percobaan pertama meneruskan `{}` sebagai konteks, dan seluruh skor
      // upaya jatuh ke nol -- kartu Kesegaran memajang "0" dengan penuh
      // percaya diri di layar pertama. Angka yang salah lebih buruk daripada
      // angka yang tidak ada, karena tidak ada apa pun di layar yang
      // memberitahu pembacanya bahwa itu keliru.
      const teramati = w.reduce((a, x) => Math.max(a, x.maxHr ?? 0), 0)
      const umur = account?.dob ? ageFromDob(account.dob) : 30
      const sex = (v.sex === 'F' ? 'F' : 'M') as 'M' | 'F'
      const k = {
        hrMax: Math.max(teramati, hrMaxFromAge(umur || 30, sex)),
        hrRest: typeof v.restingHr === 'number' && v.restingHr > 0 ? v.restingHr : 60,
        sex,
      }
      const st = statusSingkat(w, k)
      if (st) {
        // Empat belas hari terakhir, untuk arah — bukan untuk dibaca per titik.
        const hari = Array.from({ length: 14 }, (_, i) => {
          const s = statusSingkat(w, k, Date.now() - (13 - i) * 86400_000)
          return s ? s.kesegaran : 0
        })
        out.push({
          label: 'Segar', nilai: String(Math.round(st.kesegaran)),
          nada: st.kesegaran >= -10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
          deret: hari,
        })
        out.push({ label: 'Bugar', nilai: String(Math.round(st.kebugaran)), nada: 'text-sky-600 dark:text-sky-400' })
      }
      out.push({ label: 'Sesi', nilai: String(w.length), satuan: 'tercatat', nada: 'text-ink dark:text-white' })
    }
    // Garisnya diambil dari riwayat yang benar-benar tercatat; Garis sendiri
    // yang menolak menggambar bila titiknya kurang dari dua.
    if (v.weightKg) out.push({ label: 'Berat', nilai: String(v.weightKg), satuan: 'kg', nada: 'text-ink dark:text-white', deret: deretMetrik('weightKg').map((t) => t.nilai) })
    if (v.restingHr) out.push({ label: 'Nadi', nilai: String(v.restingHr), satuan: 'bpm', nada: 'text-rose-600 dark:text-rose-400', deret: deretMetrik('restingHr').map((t) => t.nilai) })
    if (v.systolic && v.diastolic) {
      out.push({ label: 'Tensi', nilai: `${v.systolic}/${v.diastolic}`, nada: 'text-ink dark:text-white' })
    }
    return out.slice(0, 4)
  }, [account])

  /**
   * Pratinjau dihitung sekali per kunjungan.
   *
   * Bergantung pada state.foods dan state.sleepLogs supaya ikut menyegar begitu
   * pemakainya mencatat sesuatu lalu kembali ke beranda — kartu yang tetap
   * memajang angka lama sesudah pencatatan membuat orang mencatat dua kali.
   */
  /**
   * Penanda segar untuk data yang TIDAK berada di dalam state React.
   *
   * Sesi latihan dan tanda tubuh disimpan langsung di penyimpanan peramban,
   * bukan di dalam store. Akibatnya terukur: sesi baru tersimpan dengan benar,
   * namun kartu Latihan tetap berbunyi "belum ada sesi tersimpan" sampai
   * halaman dimuat ulang — pemakainya menyimpulkan simpanannya gagal, lalu
   * menyimpannya lagi. Peristiwa yang sama yang dipakai seluruh aplikasi untuk
   * menandai perubahan data kesehatan dipakai di sini sebagai pemicu baca ulang.
   */
  const [segar, setSegar] = useState(0)
  useEffect(() => {
    const ubah = () => setSegar((v) => v + 1)
    window.addEventListener('panacea:health-updated', ubah)
    return () => window.removeEventListener('panacea:health-updated', ubah)
  }, [])

  const pratinjau = useMemo(
    () => pratinjauBeranda({
      foods: state.foods ?? [],
      sleepLogs: state.sleepLogs ?? [],
      umur: account?.dob ? ageFromDob(account.dob) : undefined,
    }),
    [state.foods, state.sleepLogs, account, segar],
  )

  // Kartu "Tubuh" dibuang bila angkanya sama dengan yang sudah berdiri besar di
  // panel atas. Denyut 58 yang muncul dua kali dalam satu layar tidak menambah
  // keterangan apa pun; ia hanya membuat layar terasa lebih penuh daripada
  // isinya. Bila angka tubuhnya lain (mis. hanya tekanan darah), kartunya tetap.
  const angkaAtas = kpi.map((k) => k.nilai)
  const pratinjauTampil = pratinjau.filter((p) => p.id !== 'tubuh' || !angkaAtas.includes(p.nilai))

  return (
    // `fluid` menjadikan pembungkus ini WADAH UKUR: seluruh cqw di dalamnya
    // mengukur lebar kotak ini, bukan lebar layar. Itulah sebabnya halaman ini
    // tetap benar saat isinya duduk di samping bilah sisi selebar 280 px.
    <div className="fluid mx-auto max-w-3xl">
      <div className="j-grup px-fluid pb-6">
      {/* ── PANEL ATAS — dibaca menyilang (Z) ───────────────────────────────
          kiri-atas: siapa saya · kanan-atas: aksi utama
          kiri-bawah: angka       · kanan-bawah: ke mana lanjut          */}
      <section className="p-fluid overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand/15 dark:to-brand/5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="t-judul truncate font-black leading-tight text-ink dark:text-white">
              Halo{nama && `, ${nama}`}
            </h1>
            <p className="t-sedang text-neutral-500">Mau kerjakan apa hari ini?</p>
          </div>
          <Link
            to="/search"
            className="t-sedang flex h-11 shrink-0 items-center rounded-full bg-brand px-5 font-bold text-white transition active:scale-95"
          >
            Cari
          </Link>
        </div>

        {kpi.length > 0 && (
          <div className="angka-fluid mt-3">
            {kpi.map((k, i) => <KartuKpi key={k.label} k={k} utama={i === 0} />)}
          </div>
        )}

        {kpi.length === 0 && (
          <Link
            to="/tutorial"
            className="mt-3 flex min-h-[44px] items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2.5 dark:bg-white/5"
          >
            <span className="t-sedang font-semibold text-ink dark:text-white">
              Belum ada angka. Mulai dari 3 langkah singkat.
            </span>
            <span className="text-brand">›</span>
          </Link>
        )}
      </section>

      {/* Pratinjau isi fitur, tepat di bawah panel angka: pertanyaan "bagaimana
          keadaan saya" terjawab tanpa satu pun ketukan, dan kisi lambang di
          bawahnya tinggal mengurus "ke mana saya pergi". */}
      <PapanWidget pratinjau={pratinjauTampil} tanggalCatatan={tanggalCatatan} />

      {/* Catatan harian ditaruh SESUDAH pratinjau, bukan sebelumnya.
          Kartu pratinjau menjawab "bagaimana keadaan saya"; catatan harian
          meminta sesuatu. Layar yang meminta lebih dahulu sebelum memberi apa
          pun terbaca sebagai pekerjaan, dan pekerjaan ditunda. */}
      <CatatanHarian />

      {/* Catatan latihan memakai bentuk yang sama persis dengan catatan harian
          di atasnya. Dua borang serupa dengan tata letak berbeda memaksa orang
          belajar dua kali, dan yang kedua tidak pernah benar-benar dipelajari. */}
      <CatatanLatihan />


      {/* ── KISI FITUR ───────────────────────────────────────────────────
          Tiga kisi tetap (Klinis, Badan Anda, Lainnya) diganti satu kisi yang
          diturunkan dari KATALOG WIDGET. Alasannya bukan tampilan: ketiga kisi
          lama ditulis tangan dan hanya memuat 16 dari 115 fitur, sehingga
          sebagian besar isi aplikasi ini tidak pernah punya jalan masuk dari
          beranda — dan setiap fitur baru harus didaftarkan di dua tempat, yang
          satu di antaranya selalu ketinggalan. */}
      <KisiFitur />

      {kpi.length === 0 && (
        <Link
          to="/tutorial"
          className="t-sedang flex min-h-[44px] items-center justify-center gap-2 font-bold text-brand"
        >
          <LogoPanduan size={16} /> Baru di sini? Buka panduan 6 langkah
        </Link>
      )}
      </div>
    </div>
  )
}
