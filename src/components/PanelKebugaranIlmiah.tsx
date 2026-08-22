import { useMemo, useState } from 'react'
import {
  SUMBER, ML_PER_MET, nilaiKebugaran, titikTengahVo2, vo2DariDenyut,
  denyutMaksPerkiraan, hrGenggam, bacaLangkah, bacaSebaran,
} from '../lib/bugarIlmiah'

// ─────────────────────────────────────────────────────────────────────────────
// Panel kebugaran yang setiap angkanya dapat dilacak ke sumbernya.
//
// MENGAPA PANEL INI ADA. Halaman Longevity menampilkan satu skor komposit dari
// delapan hal dengan bobot yang dikarang (0,22 untuk VO2max, 0,13 untuk grip).
// Skor seperti itu terbaca meyakinkan justru karena menyembunyikan asal-usul
// angkanya: pemakai tidak dapat membedakan bagian yang berasal dari kohort
// 122.007 orang dari bagian yang berasal dari tebakan penulis kode.
//
// Panel ini melakukan yang sebaliknya. Ia TIDAK membuat skor baru. Ia
// menampilkan sedikit besaran yang benar-benar dilaporkan penelitian, masing-
// masing dengan sumbernya, dan menolak menampilkan yang tidak ada sumbernya.
//
// TIGA ATURAN TAMPILAN YANG DIPEGANG:
//
//   1. TIDAK ADA ANGKA TANPA SUMBER. Setiap rasio bahaya membawa nama
//      penelitiannya, dan sumbernya dapat dibuka di tempat.
//
//   2. KETIDAKPASTIAN DITAMPILKAN, BUKAN DISEMBUNYIKAN. VO2max yang
//      diperkirakan dari denyut ditandai sebagai PERKIRAAN dengan besaran
//      kesalahannya, bukan disamakan dengan hasil uji.
//
//   3. TIDAK ADA RAMALAN PERORANGAN. Rasio bahaya berlaku bagi kelompok.
//      Menerjemahkannya menjadi "Anda akan hidup sekian tahun lagi" adalah
//      kekeliruan penafsiran yang paling sering pada data seperti ini, dan
//      panel ini menyebutnya secara terbuka alih-alih diam.
// ─────────────────────────────────────────────────────────────────────────────

export interface BahanPanel {
  usia: number
  jk: 'L' | 'P'
  /** VO2max terukur bila ada. Bila kosong, dicoba diperkirakan dari denyut. */
  vo2?: number
  denyutIstirahat?: number
  denyutMaksTerukur?: number
  genggamKg?: number
  langkahHarian?: number
  /** Menit per zona 1-5 dalam kurun terakhir. */
  menitZona?: number[]
}

function warnaPita(selisihMet: number): string {
  if (selisihMet <= -2) return '#dc2626'
  if (selisihMet <= -0.75) return '#f59e0b'
  if (selisihMet < 0.75) return '#64748b'
  if (selisihMet < 2) return '#16a34a'
  return '#0d9488'
}

/** Skala VO2max dengan titik tengah usia sebagai jangkar, bukan sebagai nilai baik. */
function SkalaVo2({ vo2, titik, jk, usia }: { vo2: number; titik: number; jk: 'L' | 'P'; usia: number }) {
  // Rentang skala dibuat simetris terhadap titik tengah supaya tidak memberi
  // kesan bahwa "penuh ke kanan" berarti sehat.
  const lebar = Math.max(14, titik * 0.6)
  const min = Math.max(0, titik - lebar)
  const max = titik + lebar
  const posisi = (n: number) => ((Math.min(max, Math.max(min, n)) - min) / (max - min)) * 100
  const met = vo2 / ML_PER_MET
  const metTitik = titik / ML_PER_MET
  const warna = warnaPita(met - metTitik)
  return (
    <div className="mt-2">
      <div className="relative h-9">
        {/* Batang skala */}
        <div className="absolute inset-x-0 top-3 h-2 rounded-full bg-gradient-to-r from-red-500/25 via-neutral-400/25 to-teal-500/25" />
        {/* Jangkar titik tengah */}
        <div className="absolute top-1.5 h-5 w-[2px] bg-neutral-500" style={{ left: `${posisi(titik)}%` }} />
        {/* Posisi pemakai */}
        <div
          className="absolute top-0.5 h-8 w-[3px] rounded-full"
          style={{ left: `${posisi(vo2)}%`, background: warna }}
          aria-label={`VO2max Anda ${vo2.toFixed(1)}`}
        />
      </div>
      <div className="flex justify-between text-[9.5px] text-neutral-500">
        <span>{min.toFixed(0)}</span>
        <span>titik tengah {jk === 'L' ? 'laki-laki' : 'perempuan'} {usia} th: {titik.toFixed(1)}</span>
        <span>{max.toFixed(0)}</span>
      </div>
    </div>
  )
}

function KartuSumber({ kunci }: { kunci: string }) {
  const s = SUMBER[kunci]
  const [buka, setBuka] = useState(false)
  if (!s) return null
  return (
    <div className="mt-1">
      <button
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="text-[10px] font-bold text-brand underline decoration-dotted underline-offset-2"
      >
        sumber {buka ? '▲' : '▼'}
      </button>
      {buka && (
        <div className="mt-1 rounded-lg bg-black/[0.04] p-2 text-[10.5px] leading-snug text-neutral-600 dark:bg-white/5 dark:text-neutral-300">
          <div className="font-bold">{s.kutipan}</div>
          {s.n && <div className="mt-0.5 opacity-80">{s.n}</div>}
          {s.catatan && <div className="mt-1">{s.catatan}</div>}
        </div>
      )}
    </div>
  )
}

function Baris({ judul, isi, sumber }: { judul: string; isi: React.ReactNode; sumber?: string }) {
  return (
    <div className="rounded-xl bg-black/[0.03] p-3 dark:bg-white/5">
      <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">{judul}</div>
      <div className="mt-1 text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-200">{isi}</div>
      {sumber && <KartuSumber kunci={sumber} />}
    </div>
  )
}

export function PanelKebugaranIlmiah(b: BahanPanel) {
  const hrMaks = useMemo(() => {
    if (b.denyutMaksTerukur && b.denyutMaksTerukur > 0) return { nilai: b.denyutMaksTerukur, terukur: true, ketidakpastian: '' }
    const p = denyutMaksPerkiraan(b.usia)
    return p ? { nilai: p.nilai, terukur: false, ketidakpastian: p.ketidakpastian } : null
  }, [b.denyutMaksTerukur, b.usia])

  const perkiraan = useMemo(
    () => (b.vo2 && b.vo2 > 0 ? null : hrMaks && b.denyutIstirahat ? vo2DariDenyut(hrMaks.nilai, b.denyutIstirahat) : null),
    [b.vo2, hrMaks, b.denyutIstirahat],
  )
  const vo2 = b.vo2 && b.vo2 > 0 ? b.vo2 : perkiraan?.nilai
  const hasil = useMemo(() => (vo2 ? nilaiKebugaran(vo2, b.usia, b.jk) : null), [vo2, b.usia, b.jk])

  const genggam = useMemo(
    () => (b.genggamKg ? hrGenggam(b.genggamKg, b.jk === 'L' ? 40 : 25) : null),
    [b.genggamKg, b.jk],
  )
  const langkah = useMemo(() => (b.langkahHarian != null ? bacaLangkah(b.langkahHarian, b.usia) : null), [b.langkahHarian, b.usia])
  const sebaran = useMemo(() => (b.menitZona ? bacaSebaran(b.menitZona) : null), [b.menitZona])

  const adaIsi = hasil || genggam || langkah || sebaran
  if (!adaIsi) {
    return (
      <div className="rounded-xl bg-black/[0.03] p-3 text-[11.5px] leading-snug text-neutral-600 dark:bg-white/5 dark:text-neutral-300">
        Belum ada angka yang cukup untuk ditampilkan. Yang diperlukan paling sedikit satu di antara: VO₂max terukur, atau
        denyut istirahat (untuk perkiraan), atau kekuatan genggam, atau jumlah langkah harian.
        <div className="mt-1.5 opacity-80">
          Bagian ini sengaja kosong alih-alih menampilkan angka bawaan — angka bawaan tidak dapat dibedakan dari hasil ukur.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-3">
        <div className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-400">Cara membaca bagian ini</div>
        <p className="mt-1 text-[11px] leading-snug text-neutral-700 dark:text-neutral-200">
          Angka di bawah adalah <b>rasio bahaya pada KELOMPOK</b>, bukan ramalan bagi seorang. Rasio 0,70 berarti kelompok
          dengan ciri itu mengalami kematian 30% lebih sedikit selama masa pengamatan — <b>bukan</b> berarti Anda akan hidup
          30% lebih lama. Semuanya bersifat <b>kaitan</b>, dan sebagian besar berasal dari kohort pengamatan, bukan uji acak.
        </p>
      </div>

      {hasil && (
        <div className="rounded-xl bg-black/[0.03] p-3 dark:bg-white/5">
          <div className="flex items-baseline justify-between">
            <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Kapasitas aerobik</div>
            <div className="text-[10px] font-bold text-neutral-500">{hasil.met.toFixed(1)} MET</div>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-[22px] font-black leading-none text-ink dark:text-white">{hasil.vo2.toFixed(1)}</span>
            <span className="text-[11px] text-neutral-500">mL/kg/menit</span>
            {perkiraan && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-700 dark:text-amber-400">
                perkiraan
              </span>
            )}
          </div>

          <SkalaVo2 vo2={hasil.vo2} titik={hasil.titikTengah} jk={b.jk} usia={b.usia} />

          <p className="mt-1.5 text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-200">
            Berada <b>{hasil.pita}</b> titik tengah orang seusia dan sejenis kelamin, selisih{' '}
            <b>{hasil.selisihMet >= 0 ? '+' : ''}{hasil.selisihMet.toFixed(1)} MET</b>.
          </p>
          <p className="mt-1 text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-200">
            Setiap 1 MET lebih tinggi berkaitan dengan kematian segala sebab <b>13% lebih rendah</b> (HR 0,87; IK95%
            0,84-0,90). Untuk selisih Anda, rasio bahaya terhadap titik tengah menjadi{' '}
            <b style={{ color: warnaPita(hasil.selisihMet) }}>{hasil.hrTerhadapTitikTengah.toFixed(2)}</b>.
          </p>
          <KartuSumber kunci="kodama" />

          {perkiraan && (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] p-2">
              <div className="text-[10px] font-black text-amber-700 dark:text-amber-400">Ini perkiraan, bukan pengukuran</div>
              <p className="mt-0.5 text-[11px] leading-snug text-neutral-700 dark:text-neutral-200">
                {perkiraan.cara}. {perkiraan.ketidakpastian}
                {hrMaks && !hrMaks.terukur && ` Denyut maksimalnya sendiri juga perkiraan: ${hrMaks.ketidakpastian}`}
              </p>
              <KartuSumber kunci="uth" />
            </div>
          )}

          <div className="mt-2 text-[10.5px] leading-snug text-neutral-500">
            Titik tengah rujukan berlaku untuk uji <b>treadmill</b>; uji sepeda menghasilkan nilai 10-15% lebih rendah, dan
            membandingkannya dengan tabel ini akan tampak lebih buruk daripada keadaan sebenarnya.
            <KartuSumber kunci="friend" />
          </div>
        </div>
      )}

      {genggam && b.genggamKg && (
        <Baris
          judul="Kekuatan genggam"
          sumber="leong"
          isi={
            <>
              <b>{b.genggamKg} kg</b>. Studi PURE melaporkan setiap <b>5 kg lebih rendah</b> berkaitan dengan kematian segala
              sebab <b>16% lebih tinggi</b> (HR 1,16). Terhadap acuan {b.jk === 'L' ? '40' : '25'} kg, rasio bahayanya{' '}
              <b>{genggam.toFixed(2)}</b>.
              <div className="mt-1 text-[10.5px] text-neutral-500">
                Acuan itu dipilih sebagai titik banding, <b>bukan</b> batas normal — PURE melaporkan efek per selisih 5 kg dan
                tidak menetapkan nilai normal.
              </div>
            </>
          }
        />
      )}

      {langkah && (
        <Baris
          judul="Langkah harian"
          sumber="paluch"
          isi={
            <>
              <b>{langkah.langkah.toLocaleString('id-ID')}</b> langkah. {langkah.keterangan}
              <div className="mt-1 text-[10.5px] text-neutral-500">
                Angka 10.000 yang beredar luas berasal dari nama sebuah pedometer Jepang tahun 1960-an, bukan dari penelitian.
              </div>
            </>
          }
        />
      )}

      {sebaran && (
        <Baris
          judul="Sebaran intensitas"
          sumber="seiler"
          isi={
            <>
              <b>{sebaran.persenRendah.toFixed(0)}%</b> intensitas rendah, <b>{sebaran.persenTinggi.toFixed(0)}%</b> tinggi.{' '}
              {sebaran.keterangan}
              <div className="mt-1 text-[10.5px] text-neutral-500">
                Pola 80/20 adalah gambaran yang <b>diamati</b> pada atlet ketahanan berprestasi, bukan resep yang teruji untuk
                bukan atlet.
              </div>
            </>
          }
        />
      )}

      <div className="rounded-xl bg-black/[0.03] p-3 text-[10.5px] leading-snug text-neutral-500 dark:bg-white/5">
        <b>Yang sengaja tidak ditampilkan di sini:</b> usia biologis dan ramalan sisa umur. Tidak ada persamaan yang
        disepakati untuk menghitung usia biologis dari pengukuran lapangan, dan rasio bahaya kelompok tidak dapat diubah
        menjadi ramalan bagi seorang. Menampilkannya dengan desimal akan menjadi ketepatan yang tidak dimiliki datanya.
      </div>
    </div>
  )
}

export default PanelKebugaranIlmiah
