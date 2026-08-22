import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Pratinjau } from '../lib/pratinjauBeranda'
import { hitungRangkaian, PERINGATAN_RANGKAIAN } from '../lib/rangkaian'
import { widgetPapan, ambilWidget } from '../lib/homeWidgets'

const WIDGETS = widgetPapan()
import { lazy, Suspense } from 'react'
import { getWorkouts } from '../lib/workoutStore'
import { hrMaxFromAge } from '../lib/workoutImport'
import { getDemo } from '../lib/profile'

// Dimuat malas: berkas grafik beserta analisisnya tidak perlu ikut ke bundel
// awal bagi pemakai yang tidak menyalakan kartunya.
const GrafikOlahraga = lazy(() =>
  import('./GrafikOlahraga').then((m) => ({ default: m.GrafikOlahraga })),
)
import { PemilihWidget } from './PemilihWidget'
import { rincianBeranda, barisTekananDarah, type BarisRincian } from '../lib/rincianBeranda'
import { deretMetrik } from '../lib/riwayatVitals'
import { GrafikMini } from './GrafikMini'
import { UBIN_LANGSUNG } from './UbinLangsung'
import { UbinGrafik, wilayahBergrafik } from './UbinGrafik'
import { UbinPantauan } from './UbinPantauan'
import { bilahTersedia } from '../lib/bilahRujukan'
import { BilahTubuh } from './BilahTubuh'
import { getVitals } from '../lib/healthVitals'
import { UbinDompet } from './UbinDompet'
import { useStore } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Papan widget beranda — bentuk ubin seperti di layar utama telepon.
//
// MENGAPA DIGANTI DARI DERET GESER. Bentuk sebelumnya adalah satu baris kartu
// yang digeser mendatar. Pada layar 390 px hanya dua kartu yang terlihat, dan
// isi kartu ketiga dan seterusnya hanya diketahui oleh orang yang menebak bahwa
// baris itu dapat digeser. Aplikasi ini punya puluhan fitur, dan yang tampak di
// beranda hanya dua di antaranya.
//
// Papan ini menaruh widget dalam KISI DUA KOLOM yang mengalir ke bawah — semua
// terlihat dengan menggulir, arah yang sudah pasti dicoba setiap orang, tanpa
// perlu menebak adanya gerakan menyamping.
//
// DUA UKURAN, DAN ALASANNYA BUKAN VARIASI. Widget kecil memuat SATU angka;
// widget lebar memuat beberapa angka yang hanya bermakna bila dibaca
// bersama-sama — rangkaian pencatatan (berjalan, terpanjang, total) tidak dapat
// dipahami dari salah satunya saja. Ukuran mengikuti banyaknya angka yang harus
// dibaca sekaligus, bukan tingkat kepentingan.
//
// ATURAN KEJUJURAN YANG DIWARISI DARI KARTU PRATINJAU, dan tetap berlaku di
// sini: tidak ada angka yang dikarang (kosong berkata kosong, bukan 0), tiap
// angka membawa umurnya, dan tidak ada penilaian baik/buruk di ubin sekecil ini.
// ─────────────────────────────────────────────────────────────────────────────

/** Bingkai satu ubin. Lebar = dua kolom, kecil = satu kolom. */
function Ubin({
  ke, judul, lebar = false, tanda, children,
}: {
  ke: string; judul: string; lebar?: boolean; tanda?: string; children: React.ReactNode
}) {
  return (
    <Link
      to={ke}
      className={`kaca flex min-h-[112px] flex-col justify-between gap-1.5 rounded-3xl p-3 transition active:scale-[0.98] ${
        lebar ? 'col-span-2' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="t-mikro font-black uppercase tracking-wide text-neutral-500">{judul}</span>
        {tanda && (
          <span className="t-mikro shrink-0 rounded bg-neutral-200 px-1.5 py-0.5 font-bold leading-none text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
            {tanda}
          </span>
        )}
      </div>
      {children}
    </Link>
  )
}

/**
 * Ubin kosong — DIPADATKAN, bukan disamakan besarnya dengan ubin berisi.
 *
 * Bentuk sebelumnya memakai tinggi dan kalimat ajakan yang sama panjangnya
 * dengan ubin berangka. Akibatnya pemakai baru, yang semua ubinnya masih
 * kosong, membuka beranda dan menemukan lima kotak besar berisi kalimat "belum
 * ada" — hampir satu layar penuh yang tidak memberi satu pun angka. Ruang
 * terbesar di halaman justru diberikan kepada bagian yang paling sedikit
 * isinya, dan itulah yang membuat halaman ini terasa sesak.
 *
 * Sekarang ubin kosong hanya setinggi 64 px dengan satu ajakan pendek. Ia tetap
 * ADA — menghapusnya akan menyembunyikan fitur yang belum pernah dipakai, dan
 * orang tidak akan pernah tahu bahwa ia bisa mengisinya — tetapi tidak lagi
 * menuntut ruang sebesar bagian yang benar-benar berisi.
 *
 * Pembedaannya tetap lewat BENTUK (garis putus-putus dan tinggi yang berbeda),
 * bukan lewat warna saja.
 */
function UbinKosong({ ke, judul }: { ke: string; judul: string; garis?: string }) {
  return (
    <Link
      to={ke}
      className="flex min-h-[64px] flex-col justify-center gap-0.5 rounded-3xl border border-dashed border-neutral-300 p-3 transition active:scale-[0.98] dark:border-white/20"
    >
      <span className="t-mikro font-black uppercase tracking-wide text-neutral-500">{judul}</span>
      <span className="t-kecil text-neutral-400">Belum ada — catat →</span>
    </Link>
  )
}

/**
 * Grafik garis kecil di dalam ubin.
 *
 * SUMBUNYA TIDAK PERNAH DIPOTONG PADA NOL YANG PALSU. Grafik kecil memakai
 * seluruh tinggi yang ada untuk rentang datanya sendiri, dan itu memang
 * membesar-besarkan perubahan kecil — karena itu ia TIDAK BOLEH berdiri
 * sendirian sebagai bukti. Ia selalu ditemani angka sebenarnya di sebelahnya
 * dan keterangan jangkanya, sehingga yang dibaca dari garis ini hanyalah
 * BENTUK perjalanannya, bukan besarnya.
 *
 * Tanpa sumbu, tanpa kisi, tanpa label: pada lebar sekitar 70 px semuanya tidak
 * terbaca dan hanya menambah coretan.
 */
function GarisKecil({ deret, kelas }: { deret: number[]; kelas: string }) {
  if (deret.length < 2) return null
  const min = Math.min(...deret)
  const maks = Math.max(...deret)
  const rentang = maks - min || 1
  const titik = deret
    .map((v, i) => `${(i / (deret.length - 1)) * 68 + 1},${18 - ((v - min) / rentang) * 16}`)
    .join(' ')
  return (
    <svg viewBox="0 0 70 20" preserveAspectRatio="none" fill="none" className={`h-5 w-full ${kelas}`} aria-hidden="true">
      <polyline
        points={titik}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * Penanda tren.
 *
 * TANPA WARNA HIJAU-MERAH, dan ini keputusan yang disengaja. Aplikasi yang
 * menjadi rujukan bentuk ini mewarnai panah naik hijau dan panah turun merah,
 * seolah arah perubahan sudah cukup untuk menilai. Pada berat badan, turun
 * belum tentu baik; pada denyut istirahat, naik belum tentu buruk; pada jam
 * tidur, keduanya bergantung pada dari berapa. Yang ditampilkan di sini
 * hanyalah ARAH dan BESARNYA, beserta jangka waktunya — penilaiannya ada di
 * halaman yang punya ruang untuk mempertanggungjawabkannya.
 */
function Tren({ persen, jangka }: { persen: number; jangka: string }) {
  // Jangka waktunya WAJIB ikut, bukan pelengkap: "naik 5%" tanpa keterangan
  // atas berapa lama tidak berarti apa-apa, dan pembaca akan mengiranya
  // perubahan sejak kemarin.
  return (
    <span className="t-mikro whitespace-nowrap font-bold text-neutral-400" title={`Dibanding awal ${jangka} terakhir`}>
      {persen === 0 ? 'tetap' : <><span aria-hidden>{persen > 0 ? '↑' : '↓'}</span>{Math.abs(persen)}%</>}
      {' '}/{jangka.replace(' hari', 'h').replace(' malam', 'm')}
    </span>
  )
}

function UbinAngka({ p }: { p: Pratinjau }) {
  if (p.nilai === '') return <UbinKosong ke={p.ke} judul={p.wilayah} garis={p.garis} />
  return (
    <Ubin ke={p.ke} judul={p.wilayah} tanda={p.umur}>
      {/* Tren duduk SEBARIS dengan angkanya, bukan di bawah kalimat.
          Percobaan pertama menaruhnya bersebelahan dengan kalimat penjelas, dan
          pada ubin selebar 159 px keduanya tidak muat: kalimatnya terpotong di
          tengah kata dan trennya membungkus menjadi dua baris. Angka, satuan,
          dan trennya adalah satu kesatuan yang dibaca sekali sapu — merekatkan
          ketiganya juga membuat jelas bahwa persennya menerangkan angka itu,
          bukan menerangkan kalimat di bawahnya. */}
      <div className="flex flex-wrap items-baseline gap-x-1">
        <span className={`${p.nilai.length >= 5 ? 't-angka-panjang' : 't-angka'} min-w-0 font-black leading-none tabular-nums ${p.nada}`}>
          {p.nilai}
        </span>
        {p.satuan && <span className="t-mikro min-w-0 truncate font-bold text-neutral-400">{p.satuan}</span>}
        {p.tren && <Tren persen={p.tren.persen} jangka={p.tren.jangka} />}
      </div>
      {/* Garis hanya muncul bila riwayatnya cukup — lihat CUKUP_TITIK di
          pratinjauBeranda.ts. Dua pengukuran hanya dapat berbeda, tidak dapat
          menunjukkan arah. */}
      {p.deret && p.deret.length >= 2 && <GarisKecil deret={p.deret} kelas={p.nada} />}
      {/* SATU BARIS, DIPOTONG. Kalimat penjelas di dalam ubin membuat dasbor
          menjadi bacaan; yang dicari orang di sini adalah angkanya. Kalimat
          penuhnya tetap ada — pada halaman yang dituju ubin ini, dan pada
          atribut title untuk pembaca layar. */}
      <p className="t-kecil truncate text-neutral-500 dark:text-neutral-400" title={p.garis}>{p.garis}</p>
    </Ubin>
  )
}

/** Satu angka bersama labelnya, dipakai di dalam ubin lebar. */
function Angka({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="min-w-0">
      <div className="t-angka font-black leading-none tabular-nums text-ink dark:text-white">{nilai}</div>
      <div className="t-mikro truncate font-bold text-neutral-400">{label}</div>
    </div>
  )
}

/**
 * Ubin rangkaian pencatatan.
 *
 * Ketiga angkanya ditampilkan bersama dengan sengaja. Menampilkan "berjalan"
 * sendirian membuat satu hari terlewat terbaca sebagai kehilangan segalanya,
 * padahal totalnya tidak pernah berkurang — dan itulah yang menahan orang
 * berhenti mencatat sesudah jedanya yang pertama.
 */
/**
 * Ubin rangkaian — TIDAK LAGI DIPAKAI DI BERANDA.
 *
 * Dibiarkan ada karena halaman Log memakainya bila ingin, dan karena
 * menghapusnya berarti kehilangan penanganan keadaan kosong yang sudah
 * dipikirkan. Yang berubah hanyalah tempatnya: peta konsistensi
 * menggambarkan hal yang sama dengan jauh lebih banyak keterangan.
 */
export function UbinRangkaian({ tanggal }: { tanggal: string[] }) {
  const r = hitungRangkaian(tanggal)
  if (r.total === 0) {
    return <UbinKosong ke="/logs" judul="Catatan" garis="Belum ada hari tercatat. Satu catatan hari ini sudah cukup untuk memulai." />
  }
  return (
    <Ubin ke="/logs" judul="Catatan" lebar tanda={r.hariIniSudah ? 'hari ini' : undefined}>
      <div className="flex items-end gap-4">
        <Angka label="hari berturut" nilai={String(r.berjalan)} />
        <Angka label="terpanjang" nilai={String(r.terpanjang)} />
        <Angka label="seluruhnya" nilai={String(r.total)} />
      </div>
    </Ubin>
  )
}

/**
 * Ubin isi klinis: berapa banyak yang benar-benar ada di dalam aplikasi.
 *
 * Angkanya DIHITUNG dari berkas datanya, tidak ditulis tangan. Angka yang
 * ditulis tangan akan menjadi salah pada penambahan data berikutnya, dan angka
 * yang salah di beranda merusak kepercayaan pada seluruh angka lain di sini.
 *
 * Berkas datanya berukuran ratusan kilobyte dan tidak boleh ikut terunduh oleh
 * orang yang hanya membuka beranda, jadi ia diambil setelah halaman tampil.
 */
export function UbinKlinis() {
  const [n, setN] = useState<{ penyakit: number; obat: number; stasiun: number } | null>(null)
  useEffect(() => {
    let batal = false
    Promise.all([
      import('../lib/skdiDiseaseNotes'),
      import('../lib/skdiTherapyReference'),
      import('../lib/osceUkmppdRiwayat'),
    ])
      .then(([d, t, o]) => {
        if (batal) return
        setN({
          penyakit: Object.keys(d.SKDI_DISEASE_NOTES).length,
          obat: t.SKDI_ENTRIES.length,
          stasiun: o.RIWAYAT_OSCE.length,
        })
      })
      .catch(() => { /* ubin tetap menampilkan keadaan memuat, tanpa angka palsu */ })
    return () => { batal = true }
  }, [])

  return (
    <Ubin ke="/med-study" judul="Klinis" lebar>
      {n ? (
        /* Tiga angka pada satu baris. Ini isi katalog, bukan angka tubuh
           siapa pun, jadi tidak ada tren yang dapat digambar — yang jujur
           hanyalah jumlahnya. */
        <div className="flex items-end justify-between gap-2">
          <Angka label="penyakit" nilai={String(n.penyakit)} />
          <Angka label="obat" nilai={String(n.obat)} />
          <Angka label="stasiun" nilai={String(n.stasiun)} />
        </div>
      ) : (
        <p className="t-kecil text-neutral-400">Menghitung isi…</p>
      )}
    </Ubin>
  )
}

/**
 * Papan widget.
 *
 * Kisi dua kolom ditulis dengan grid-cols-2 tetap, bukan auto-fill: ubin lebar
 * memakai col-span-2, dan rentang kolom hanya bermakna bila jumlah kolomnya
 * pasti. Pada layar lebar, wadahnya sendiri yang dibatasi lebarnya.
 */
/**
 * Kartu grafik olahraga di beranda.
 *
 * Tidak dirender sama sekali bila belum ada sesi: judul di atas ruang kosong
 * memberi kesan ada yang gagal dimuat, dan itu lebih buruk daripada tidak ada.
 */
function KartuGrafikOlahraga() {
  const workouts = getWorkouts()
  if (!workouts.length) return null
  const demo = getDemo()
  const teramati = workouts.reduce((a, w) => Math.max(a, w.maxHr ?? 0), 0)
  const hrMax = Math.max(teramati, hrMaxFromAge(demo.age || 30, demo.sex))
  return (
    <section className="rounded-3xl bg-neutral-900 p-4 dark:bg-white/5">
      <Suspense fallback={<div className="h-24" />}>
        <GrafikOlahraga workouts={workouts} hrMax={hrMax} ringkas />
      </Suspense>
    </section>
  )
}

/**
 * Ubin pintasan: satu fitur yang dipilih sendiri oleh pemakainya.
 *
 * Sengaja TANPA angka. Ubin berangka di atasnya menjawab "bagaimana keadaan
 * saya"; ubin ini menjawab "ke mana saya mau pergi", dan mencampur keduanya
 * dalam satu bentuk membuat mata harus memeriksa tiap ubin untuk tahu ia jenis
 * yang mana. Bentuknya dibuat lebih rendah supaya perbedaan itu terbaca sekilas.
 */
function UbinPintasan({ w }: { w: (typeof WIDGETS)[number] }) {
  // Bila fitur ini punya ubin hidup DAN datanya sudah ada, angkanya yang
  // ditampilkan. Ubin hidup mengembalikan null ketika datanya belum ada,
  // sehingga pintu biasa di bawah ini tetap menjadi jalan keluarnya.
  const Langsung = UBIN_LANGSUNG[w.id]
  if (Langsung) {
    const isi = Langsung()
    if (isi) return isi
    // DATANYA BELUM ADA → TIDAK DIGAMBAR SAMA SEKALI.
    //
    // Sebelumnya ia jatuh kembali menjadi kartu berisi lambang dan nama fitur.
    // Itu membuat papan widget penuh oleh pintu justru pada pemakai baru —
    // keadaan yang paling tidak boleh terjadi, karena merekalah yang paling
    // mudah menyimpulkan bahwa aplikasi ini isinya menu belaka.
    return null
  }
  return (
    <Link
      to={w.ke}
      className="kaca flex min-h-[76px] flex-col justify-center gap-0.5 rounded-3xl p-3 transition active:scale-[0.98]"
    >
      <span aria-hidden className="text-[17px] leading-none">{w.emoji}</span>
      <span className="t-kecil truncate font-black text-ink dark:text-white">{w.label}</span>
      <span className="t-mikro truncate text-neutral-400">{w.ringkas}</span>
    </Link>
  )
}

/**
 * Rincian angka tubuh sebagai daftar baris.
 *
 * BENTUKNYA DIAMBIL DARI APLIKASI KEBUGARAN, ALASANNYA DARI JUMLAH DATA. Ubin
 * setengah lebar layar tepat untuk empat sampai enam angka utama; katalog
 * metrik perangkat memuat lebih dari seratus medan, dan dua puluh di antaranya
 * sebagai ubin berarti sepuluh layar yang tidak mungkin dibaca. Baris memuat
 * delapan sampai sepuluh angka dalam satu layar.
 *
 * DILIPAT SETELAH ENAM BARIS. Daftar yang seluruhnya terbuka mendorong bagian
 * di bawahnya keluar layar, dan bagian di bawahnya adalah pintasan serta kisi
 * fitur — dua hal yang justru paling sering dituju.
 */
function DaftarRincian({ baris }: { baris: BarisRincian[] }) {
  const [semua, setSemua] = useState(false)
  if (!baris.length) return null
  const tampil = semua ? baris : baris.slice(0, 6)
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Rincian tubuh</h2>
        <span className="t-mikro text-neutral-400">{baris.length} angka tercatat</span>
      </div>
      <div className="kaca overflow-hidden rounded-3xl">
        {tampil.map((b, i) => (
          <Link
            key={b.kunci}
            to={b.ke}
            className={`flex min-h-[48px] items-center justify-between gap-2 px-3 py-2 transition active:bg-neutral-100 dark:active:bg-white/10 ${
              i > 0 ? 'border-t border-neutral-100 dark:border-white/10' : ''
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="t-kecil block truncate font-semibold text-neutral-600 dark:text-neutral-300">{b.label}</span>
              {/* Rentang KEBIASAAN ANDA SENDIRI, dan angkanya selalu ikut
                  disebut. "Di luar kebiasaan" tanpa menyebut kebiasaannya
                  berapa adalah penilaian yang tidak dapat diperiksa pembacanya.
                  Ditandai dengan tebal-tipis huruf, bukan warna, karena ini
                  BUKAN penilaian sehat atau sakit — hanya pernyataan bahwa
                  angkanya berbeda dari biasanya. */}
              {b.rentang && (
                <span className={`t-mikro block truncate ${
                  b.rentang.posisi === 'dalam kebiasaan' ? 'text-neutral-400' : 'font-bold text-neutral-500 dark:text-neutral-300'
                }`}>
                  {b.rentang.baca}
                </span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {/* Bentuk perubahannya, dari bacaan yang benar-benar tercatat.
                  Tidak muncul selama titiknya belum sampai tiga. */}
              <GrafikMini deret={deretMetrik(b.kunci).map((t) => t.nilai)} />
              <span className="t-sedang font-black tabular-nums text-ink dark:text-white">{b.nilai}</span>
              <span className="t-mikro font-bold text-neutral-400">{b.satuan}</span>
              <span aria-hidden className="t-kecil text-neutral-300 dark:text-neutral-600">›</span>
            </span>
          </Link>
        ))}
      </div>
      {baris.length > 6 && (
        <button onClick={() => setSemua((v) => !v)} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          {semua ? 'Ringkas ▲' : `Lihat ${baris.length - 6} angka lainnya ▼`}
        </button>
      )}
    </section>
  )
}

/**
 * Papan widget.
 *
 * DUA LAPIS, DAN PEMISAHANNYA DISENGAJA. Lapis pertama berisi angka keadaan
 * Anda dan selalu tampil. Lapis kedua berisi pintasan yang DIPILIH SENDIRI dari
 * lebih dari seratus fitur — sebab tidak ada susunan bawaan yang benar untuk
 * semua orang, dan menebak berarti salah bagi sebagian besar.
 *
 * Bawaannya sedikit dengan sengaja: beranda yang penuh sejak hari pertama
 * membuat orang berhenti membacanya, dan sesudah itu widget yang benar-benar
 * penting pun ikut tidak terbaca.
 */
export function PapanWidget({ pratinjau, tanggalCatatan }: { pratinjau: Pratinjau[]; tanggalCatatan: string[] }) {
  const { state } = useStore()
  const [pilihan, setPilihan] = useState<string[]>(ambilWidget)
  const [aturBuka, setAturBuka] = useState(false)

  useEffect(() => {
    const on = () => setPilihan(ambilWidget())
    window.addEventListener('panacea:home-widgets', on)
    return () => window.removeEventListener('panacea:home-widgets', on)
  }, [])

  // Urutan mengikuti urutan katalog, bukan urutan penambahan — supaya letak
  // sebuah ubin tidak berpindah-pindah dan tetap dapat dihafal tangannya.
  /*
   * KARTU YANG PUNYA ISI SENDIRI DIKELUARKAN DARI DAFTAR UBIN.
   *
   * Ubin pintasan hanyalah pintu: lambang, nama, dan satu baris ringkasan.
   * Untuk sebagian besar fitur itu memang yang dibutuhkan. Tetapi grafik
   * olahraga isinya justru angka pemakainya sendiri, dan angka itu tidak ada
   * gunanya disembunyikan di balik pintu — yang membukanya sudah tahu apa yang
   * dicarinya, sedangkan yang perlu diingatkan justru yang tidak membuka.
   *
   * Tanpa pengecualian ini ia dirender DUA KALI: sekali sebagai kartu, sekali
   * sebagai ubin.
   */
  // Widget yang PUNYA TEMPATNYA SENDIRI di halaman ini tidak boleh muncul lagi
  // sebagai ubin pintasan. Tanpa daftar ini, "Grafik Tidur 7 Hari" tampil dua
  // kali: sekali sebagai grafik sungguhan, sekali sebagai kartu berisi lambang
  // dan namanya — persis bentuk yang baru saja dibuang dari aplikasi ini.
  const BERKARTU = [
    'grafikOlahraga',
    'grafikLatihan', 'grafikTidur', 'grafikLangkah', 'grafikGizi', 'grafikDenyut',
    'pantauan',
  ]
  const pintasan = WIDGETS.filter((w) => pilihan.includes(w.id) && !BERKARTU.includes(w.id))
  const adaGrafik = pilihan.includes('grafikOlahraga')

  // Tekanan darah didahulukan karena ia satu-satunya baris berisi dua angka,
  // dan menaruhnya di tengah daftar memutus keselarasan kolom angkanya.
  /*
   * BERAT, NADI DAN TENSI TIDAK DIULANG DI SINI.
   *
   * Ketiganya sudah berdiri sebagai angka besar di panel atas beranda. Sebelum
   * ini denyut 58 muncul tiga kali pada satu layar dan berat dua kali, dan
   * pengulangan itu membuat daftar rincian terbaca seperti salinan, bukan
   * seperti keterangan tambahan. Yang tersisa di sini justru yang TIDAK ada di
   * atas: VO2max, lama tidur, langkah, dan seterusnya.
   */
  // Wilayah yang sudah punya grafik tujuh hari tidak diulang sebagai ubin teks.
  const bergrafik = wilayahBergrafik(state)

  const DI_PANEL_ATAS = ['weightKg', 'restingHr', 'td']
  const td = barisTekananDarah()
  const rincian = (td ? [td, ...rincianBeranda()] : rincianBeranda()).filter(
    (b) => !DI_PANEL_ATAS.includes(b.kunci),
  )
  const bilah = bilahTersedia(getVitals() as Record<string, unknown>)

  return (
    <>
    {pilihan.includes('pantauan') && <UbinPantauan />}

    <UbinGrafik />

    {/* JUDUL "KEADAAN ANDA" DIHAPUS, BUKAN DIKOSONGKAN.
        Sesudah wilayah yang bergrafik dikeluarkan, bagian ini kerap hanya
        berisi satu ubin — dan judul bagian di atas satu ubin adalah judul yang
        tidak membagi apa pun. Ubin yang tersisa naik ke atas tanpa judul; isi
        klinis pindah ke bawah rincian tubuh, tempat angka-angka katalog memang
        lebih masuk akal dibaca. */}
    {pratinjau.some((p) => !bergrafik.includes(p.id)) && (
      <section>
        <div className="grid grid-cols-2 gap-fluid">
          {pratinjau.filter((p) => !bergrafik.includes(p.id)).map((p) => <UbinAngka key={p.id} p={p} />)}
        </div>
      </section>
    )}

    {/* Kartu dompet hanya muncul bila memang ada saldo. Bagi yang tidak
        memakai token, ia sebelumnya menempati satu kartu penuh di beranda
        untuk menyatakan angka nol setiap hari. Halaman Tagihan tetap ada. */}
    {(state.wallet?.balance ?? 0) > 0 && <UbinDompet saldoLokal={state.wallet?.balance ?? 0} />}

    <BilahTubuh daftar={bilah} />

    <DaftarRincian baris={rincian} />

    <section className="grid grid-cols-2 gap-fluid">
      <UbinKlinis />
    </section>

    {adaGrafik && <KartuGrafikOlahraga />}

    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Pintasan</h2>
        <button onClick={() => setAturBuka(true)} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          Atur widget
        </button>
      </div>
      {pintasan.length ? (
        <div className="grid grid-cols-2 gap-fluid">
          {pintasan.map((w) => <UbinPintasan key={w.id} w={w} />)}
        </div>
      ) : (
        <button
          onClick={() => setAturBuka(true)}
          className="t-kecil flex min-h-[76px] w-full items-center justify-center rounded-3xl border border-dashed border-neutral-300 px-3 text-center leading-snug text-neutral-500 dark:border-white/20"
        >
          Belum ada pintasan. Pilih dari {WIDGETS.length} fitur yang ada.
        </button>
      )}
    </section>

    {aturBuka && <PemilihWidget tutup={() => setAturBuka(false)} />}
    </>
  )
}

export default PapanWidget
