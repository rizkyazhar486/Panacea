import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Pratinjau } from '../lib/pratinjauBeranda'
import { hitungRangkaian, PERINGATAN_RANGKAIAN } from '../lib/rangkaian'

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

/** Ubin kosong: dibedakan lewat BENTUK (garis putus-putus), bukan warna saja. */
function UbinKosong({ ke, judul, garis }: { ke: string; judul: string; garis: string }) {
  return (
    <Link
      to={ke}
      className="flex min-h-[112px] flex-col gap-1.5 rounded-3xl border border-dashed border-neutral-300 p-3 transition active:scale-[0.98] dark:border-white/20"
    >
      <span className="t-mikro font-black uppercase tracking-wide text-neutral-500">{judul}</span>
      <p className="t-kecil leading-snug text-neutral-500">{garis}</p>
    </Link>
  )
}

function UbinAngka({ p }: { p: Pratinjau }) {
  if (p.nilai === '') return <UbinKosong ke={p.ke} judul={p.wilayah} garis={p.garis} />
  return (
    <Ubin ke={p.ke} judul={p.wilayah} tanda={p.umur}>
      <div className="flex items-baseline gap-1">
        <span className={`${p.nilai.length >= 5 ? 't-angka-panjang' : 't-angka'} min-w-0 font-black leading-none tabular-nums ${p.nada}`}>
          {p.nilai}
        </span>
        {p.satuan && <span className="t-mikro min-w-0 truncate font-bold text-neutral-400">{p.satuan}</span>}
      </div>
      <p className="t-kecil leading-snug text-neutral-500 dark:text-neutral-400">{p.garis}</p>
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
      <p className="t-mikro leading-snug text-neutral-400">{PERINGATAN_RANGKAIAN}</p>
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
        <div className="flex items-end gap-4">
          <Angka label="penyakit" nilai={String(n.penyakit)} />
          <Angka label="tatalaksana" nilai={String(n.obat)} />
          <Angka label="stasiun OSCE" nilai={String(n.stasiun)} />
        </div>
      ) : (
        <p className="t-kecil text-neutral-400">Menghitung isi…</p>
      )}
      <p className="t-mikro leading-snug text-neutral-400">Catatan penyakit, tatalaksana berdosis, dan rekap stasiun.</p>
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
export function PapanWidget({ pratinjau, tanggalCatatan }: { pratinjau: Pratinjau[]; tanggalCatatan: string[] }) {
  return (
    <section>
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Keadaan Anda</h2>
      <p className="t-kecil mb-2 leading-snug text-neutral-400">Isi tiap fitur, bukan hanya pintunya.</p>
      <div className="grid grid-cols-2 gap-fluid">
        {pratinjau.map((p) => <UbinAngka key={p.id} p={p} />)}
        <UbinRangkaian tanggal={tanggalCatatan} />
        <UbinKlinis />
      </div>
    </section>
  )
}

export default PapanWidget
