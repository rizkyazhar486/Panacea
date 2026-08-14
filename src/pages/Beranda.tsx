import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { DeretPratinjau } from '../components/KartuPratinjau'
import { pratinjauBeranda } from '../lib/pratinjauBeranda'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { statusSingkat } from '../lib/pelatih'
import { hrMaxFromAge } from '../lib/workoutImport'
import { ageFromDob } from '../lib/anthro'
import { ambilTujuan, simpanTujuan, modeAwam, PILIHAN_TUJUAN, type Tujuan } from '../lib/tujuan'
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

function KartuKpi({ k }: { k: Kpi }) {
  return (
    <div className={`flex min-w-0 flex-col ${DALAM} rounded-2xl bg-white/70 p-3 dark:bg-white/5`}>
      <span className="t-mikro truncate font-bold uppercase tracking-wide text-neutral-500">{k.label}</span>
      <span className="flex items-baseline gap-1">
        {/* Ukurannya mengikuti panjang nilainya. Lihat catatan "Angka panjang"
            di index.css: pada ukuran yang sama, "118/76" tidak muat di petak
            yang memuat "72" dengan lapang. */}
        <span className={`${k.nilai.length >= 5 ? 't-angka-panjang' : 't-angka'} min-w-0 font-black leading-none tabular-nums ${k.nada}`}>{k.nilai}</span>
        {k.satuan && <span className="t-mikro font-bold text-neutral-400">{k.satuan}</span>}
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
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      <p className="t-kecil mb-2 leading-snug text-neutral-400">{isi ?? '\u00A0'}</p>
      <div className="kisi-fluid">
        {pintu.map((p) => <Lambang key={p.judul} p={p} />)}
      </div>
    </section>
  )
}

/** Pertanyaan sekali pakai. Tidak menghalangi: dasbor tetap terbaca di bawahnya. */
function Tanya({ pilih }: { pilih: (t: Tujuan) => void }) {
  return (
    <section className="rounded-2xl border border-brand/30 bg-brand-50/60 p-3 dark:border-brand/40 dark:bg-brand/10">
      <h2 className="t-sedang font-black text-ink dark:text-white">Anda memakai ini untuk apa?</h2>
      <p className="t-kecil mb-2 text-neutral-500">Menentukan urutan dasbor saja — tidak ada yang disembunyikan.</p>
      <div className="flex flex-wrap gap-fluid">
        {PILIHAN_TUJUAN.map((o) => (
          <button
            key={o.id}
            onClick={() => pilih(o.id)}
            className="t-sedang flex min-h-[44px] items-center rounded-full bg-white px-4 font-bold text-ink dark:bg-white/10 dark:text-white"
          >
            {o.ikon} {o.judul}
          </button>
        ))}
      </div>
    </section>
  )
}

export default function Beranda() {
  const { account, state } = useStore()
  const nama = account?.name?.split(' ')[0] ?? ''
  const [tujuan, setTujuan] = useState<Tujuan | null>(() => ambilTujuan())
  const pilih = (t: Tujuan) => { simpanTujuan(t); setTujuan(t) }
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
    if (v.weightKg) out.push({ label: 'Berat', nilai: String(v.weightKg), satuan: 'kg', nada: 'text-ink dark:text-white' })
    if (v.restingHr) out.push({ label: 'Nadi', nilai: String(v.restingHr), satuan: 'bpm', nada: 'text-rose-600 dark:text-rose-400' })
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
  const pratinjau = useMemo(
    () => pratinjauBeranda({
      foods: state.foods ?? [],
      sleepLogs: state.sleepLogs ?? [],
      umur: account?.dob ? ageFromDob(account.dob) : undefined,
    }),
    [state.foods, state.sleepLogs, account],
  )

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
            {kpi.map((k) => <KartuKpi key={k.label} k={k} />)}
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
      <DeretPratinjau daftar={pratinjau} />

      {!tujuan && <Tanya pilih={pilih} />}

      {/* ── KISI FITUR — dibaca menurun (F) ─────────────────────────────── */}
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

      <Kisi judul="Lainnya" isi="Darurat, ibadah, kabar teman, dan seluruh fitur" pintu={LAINNYA} />

      {tujuan && (
        <section>
          <h2 className="t-kecil mb-2 font-black uppercase tracking-wide text-neutral-500">Urutan dasbor</h2>
          <div className="flex flex-wrap gap-fluid">
            {PILIHAN_TUJUAN.map((o) => (
              <button
                key={o.id}
                onClick={() => pilih(o.id)}
                aria-pressed={tujuan === o.id}
                className={`t-sedang flex min-h-[44px] items-center rounded-full px-4 font-bold transition ${
                  tujuan === o.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}
              >
                {o.ikon} {o.judul}
              </button>
            ))}
          </div>
        </section>
      )}

      <Link
        to="/tutorial"
        className="t-sedang flex min-h-[44px] items-center justify-center gap-2 font-bold text-brand"
      >
        <LogoPanduan size={16} /> Baru di sini? Buka panduan 6 langkah
      </Link>
      </div>
    </div>
  )
}
