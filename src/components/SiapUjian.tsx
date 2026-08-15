import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ambilTanggalUjian, simpanTanggalUjian, sisaHari, jatahHariIni } from '../lib/ujian'

/**
 * Widget beranda: hitung mundur ujian, pencarian tatalaksana, dan kasus hari ini.
 *
 * MENGAPA DI BERANDA. Sebelumnya beranda hanya berisi pintu menuju fitur —
 * membuka Med Study Hub, memilih bagian, mengetik pencarian: tiga ketukan
 * sebelum satu huruf pun berguna. Yang paling sering dikerjakan menjelang ujian
 * adalah mencari tatalaksana satu penyakit, dan itu kini selesai di layar
 * pertama.
 *
 * KASUSNYA DIAMBIL DARI FREKUENSI NYATA, BUKAN URUTAN ABJAD. Yang ditawarkan
 * hari ini adalah kasus yang paling sering benar-benar keluar di OSCE menurut
 * 1.416 stasiun yang terekam, beserta angka berapa kali ia muncul — supaya
 * pilihan itu dapat ditolak dengan alasan, bukan dituruti karena aplikasi yang
 * menyuruh.
 *
 * DATA BESARNYA DIMUAT BELAKANGAN. Rekap OSCE berukuran ratusan kilobyte dan
 * tidak boleh ikut terunduh oleh orang yang hanya membuka beranda untuk melihat
 * langkahnya hari ini; ia diambil lewat import dinamis setelah halaman tampil.
 */

interface Kasus { label: string; jumlah: number; cari: string }

export function SiapUjian() {
  const nav = useNavigate()
  const [tanggal, setTanggal] = useState<string | null>(() => ambilTanggalUjian())
  const [ubahTanggal, setUbahTanggal] = useState(false)
  const [cari, setCari] = useState('')
  const [kasus, setKasus] = useState<Kasus[] | null>(null)

  // Rekap OSCE dimuat setelah beranda tampil — lihat catatan di atas.
  useEffect(() => {
    let batal = false
    Promise.all([import('../lib/analisisOsce'), import('../lib/skdiTherapyReference')])
      .then(([m, t]) => {
        if (batal) return
        /*
         * HANYA KASUS YANG PUNYA TATALAKSANA YANG DITAWARKAN.
         *
         * Rekap OSCE menyimpan nama seperti tercatat di lapangan — "UAP",
         * "Tarsal tunnel syndrome" — sedangkan halaman tatalaksana memakai nama
         * SKDI. Menawarkan nama mentahnya membuat sebagian ketukan berakhir di
         * "Tidak ada hasil", dan saran yang kadang buntu lebih buruk daripada
         * saran yang lebih sedikit. Pemadanan memakai bakukan() dari analisis
         * OSCE, tabel singkatan yang sudah diperiksa satu per satu — di situlah
         * "UAP" menjadi "angina pektoris tidak stabil".
         */
        const entri = t.SKDI_ENTRIES.map((e) => ({ nama: e.diagnosis, kunci: m.bakukan(e.diagnosis) }))
        const cocok = (kunci: string) =>
          entri.find((e) => e.kunci === kunci)
          ?? entri.find((e) => e.kunci.includes(kunci) || kunci.includes(e.kunci))

        const teratas = m.hitungKasus()
          .filter((k) => k.jumlah >= 3)
          .map((k) => {
            const e = cocok(k.kunci)
            return e ? { label: k.label, jumlah: k.jumlah, cari: e.nama } : null
          })
          .filter((k): k is Kasus => k !== null)
        setKasus(teratas)
      })
      .catch(() => setKasus([]))
    return () => { batal = true }
  }, [])

  const hariIni = useMemo(() => (kasus ? jatahHariIni(kasus, 3) : []), [kasus])
  const sisa = tanggal ? sisaHari(tanggal) : null

  function ke(q: string) {
    nav(`/med-study?bagian=therapy&cari=${encodeURIComponent(q)}`)
  }

  return (
    <section className="j-grup rounded-2xl border border-brand/30 bg-brand-50/60 p-3 dark:border-brand/40 dark:bg-brand/10">
      {/* ── Hitung mundur ─────────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="t-sedang font-black text-ink dark:text-white">Menuju ujian</h2>
        <button
          onClick={() => setUbahTanggal((v) => !v)}
          className="t-kecil min-h-[40px] font-bold text-brand"
        >
          {tanggal ? 'Ubah tanggal' : 'Pasang tanggal'}
        </button>
      </div>

      {sisa === null ? (
        <p className="t-kecil text-neutral-500">
          Belum ada tanggal ujian. Memasangnya membuat sisa harinya terlihat setiap kali beranda dibuka.
        </p>
      ) : sisa > 0 ? (
        <p className="t-kecil text-neutral-500">
          <span className="t-angka font-black text-ink dark:text-white">{sisa}</span> hari lagi
          {' · '}{new Date(tanggal!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      ) : sisa === 0 ? (
        <p className="t-kecil font-bold text-brand">Hari ini. Semoga lancar.</p>
      ) : (
        <p className="t-kecil text-neutral-500">Tanggalnya sudah lewat {Math.abs(sisa)} hari.</p>
      )}

      {ubahTanggal && (
        <input
          type="date"
          value={tanggal ?? ''}
          onChange={(e) => {
            const v = e.target.value || null
            simpanTanggalUjian(v); setTanggal(v)
          }}
          className="t-sedang min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3 font-bold text-ink dark:border-white/15 dark:bg-white/10 dark:text-white"
        />
      )}

      {/* ── Cari tatalaksana ──────────────────────────────────────────── */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (cari.trim()) ke(cari.trim()) }}
        className="flex gap-fluid"
      >
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari tatalaksana — mis. Tinea"
          aria-label="Cari tatalaksana penyakit"
          className="t-sedang min-h-[44px] min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 text-ink placeholder:text-neutral-400 dark:border-white/15 dark:bg-white/10 dark:text-white"
        />
        <button
          type="submit"
          className="t-sedang min-h-[44px] shrink-0 rounded-xl bg-brand px-4 font-bold text-white"
        >
          Cari
        </button>
      </form>

      {/* ── Kasus hari ini ────────────────────────────────────────────── */}
      <div>
        <h3 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Kasus hari ini</h3>
        {kasus === null ? (
          <p className="t-kecil text-neutral-400">Memuat rekap OSCE…</p>
        ) : hariIni.length === 0 ? (
          <p className="t-kecil text-neutral-400">Rekap OSCE tidak dapat dimuat.</p>
        ) : (
          <ul className="j-grup mt-1">
            {hariIni.map((k) => (
              <li key={k.label}>
                <button
                  onClick={() => ke(k.cari)}
                  className="t-sedang flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl bg-white px-3 text-left font-bold text-ink dark:bg-white/10 dark:text-white"
                >
                  <span className="min-w-0 truncate">{k.label}</span>
                  <span className="t-mikro shrink-0 font-black text-neutral-400">{k.jumlah}×</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="t-mikro mt-1 text-neutral-400">
          Angkanya berapa kali kasus itu pernah keluar dari 1.416 stasiun OSCE yang terekam — bukan ramalan soal ujian Anda.
        </p>
      </div>

      {/* inline-flex, bukan min-h saja: <a> bawaannya inline, dan tinggi
          minimum tidak berlaku pada kotak inline — tautan ini terukur 13 px
          sampai tampilannya diubah. */}
      <Link to="/osce-ukmppd" className="t-kecil inline-flex min-h-[40px] items-center font-bold text-brand">
        Lihat seluruh rekap stasiun →
      </Link>
    </section>
  )
}
