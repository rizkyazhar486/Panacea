import { Link } from 'react-router-dom'
import type { BilahRujukan } from '../lib/bilahRujukan'

// ─────────────────────────────────────────────────────────────────────────────
// Bilah rentang rujukan sebagai gambar.
//
// Bentuknya diambil dari alat komposisi tubuh: satu garis mendatar, zona-zona
// yang dipisahkan, dan penanda pada posisi nilai Anda. Yang disampaikannya —
// "di sebelah mana angka ini berada" — tidak dapat ditandingi kalimat sepanjang
// apa pun.
//
// YANG BERBEDA DARI ALATNYA:
//
//   Zona tidak diwarnai hijau dan merah. Warna itu menyatakan penilaian moral
//   atas angka yang sebagian besarnya tidak dapat diubah dalam sehari, dan pada
//   orang yang sedang berjuang dengan berat badannya, bilah merah setiap pagi
//   bekerja persis seperti hukuman. Zona dibedakan lewat KEPEKATAN dan garis
//   pemisah — terbaca oleh siapa pun, termasuk yang sulit membedakan warna,
//   dan tidak menempelkan penilaian.
//
//   Nama zonanya berupa ANGKA BATASNYA, bukan "Under/Normal/Over" yang terbaca
//   seperti nilai rapor. Orang yang melihat "cukup (18,5-22,9)" tahu apa yang
//   dimaksud dan dapat memeriksanya; yang melihat "Normal" hanya tahu ia sedang
//   dinilai.
//
//   Populasi pembanding dan sumber batasnya selalu tertulis. Batas IMT
//   Asia-Pasifik menggeser seseorang lintas kategori dibanding batas WHO umum
//   tanpa satu gram pun berubah pada tubuhnya, dan pembaca berhak tahu batas
//   mana yang sedang dipakai atas dirinya.
// ─────────────────────────────────────────────────────────────────────────────

function Bilah({ b }: { b: BilahRujukan }) {
  const rentang = b.maksGambar - b.minGambar
  const persen = (n: number) => Math.max(0, Math.min(100, ((n - b.minGambar) / rentang) * 100))
  const posisi = persen(b.nilai)

  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="t-kecil font-semibold text-neutral-600 dark:text-neutral-300">{b.label}</span>
        <span className="flex shrink-0 items-baseline gap-1">
          <span className="t-sedang font-black tabular-nums text-ink dark:text-white">
            {/* Ditampilkan dengan jumlah desimal yang SAMA dengan yang dipakai
                menggolongkan zonanya — lihat zonaDari di bilahRujukan.ts. */}
            {b.nilai.toFixed(b.desimal).replace('.', ',')}
          </span>
          {b.satuan && <span className="t-mikro font-bold text-neutral-400">{b.satuan}</span>}
        </span>
      </div>

      {/* Bilah zona. Lebar tiap zona sebanding dengan lebar angkanya, bukan
          dibagi rata — zona yang dilebarkan agar terlihat rapi akan membuat
          jarak menuju batas berikutnya tampak lebih jauh daripada sebenarnya. */}
      <div className="relative mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
        {b.zona.map((z, i) => {
          const kiri = persen(z.dari)
          const kanan = i + 1 < b.zona.length ? persen(b.zona[i + 1].dari) : 100
          const aktif = z.label === b.zonaKini
          return (
            <span
              key={z.label}
              className={`absolute inset-y-0 ${aktif ? 'bg-neutral-500 dark:bg-neutral-300' : 'bg-neutral-300 dark:bg-white/20'}`}
              style={{ left: `${kiri}%`, width: `${Math.max(0, kanan - kiri)}%` }}
            />
          )
        })}
        {/* Garis pemisah antar-zona: pembeda kedua yang tidak bersandar warna. */}
        {b.zona.slice(1).map((z) => (
          <span
            key={`p-${z.dari}`}
            className="absolute inset-y-0 w-px bg-white dark:bg-neutral-900"
            style={{ left: `${persen(z.dari)}%` }}
          />
        ))}
        {/* Penanda nilai Anda. */}
        <span
          className="absolute -top-0.5 h-3.5 w-1 -translate-x-1/2 rounded-full bg-ink dark:bg-white"
          style={{ left: `${posisi}%` }}
          aria-hidden
        />
      </div>

      {/* SATU BARIS, DIPOTONG — bukan tiga baris penuh.
          Keterangan populasi dan sumber batas sepanjang dua sampai tiga baris
          untuk SETIAP bilah mengubah bagian ini menjadi paragraf, dan bilahnya
          sendiri — satu-satunya bagian yang menjawab pertanyaan sekali lihat —
          tenggelam di antaranya. Keduanya TIDAK dihapus: teks lengkapnya ikut
          sebagai title (muncul saat ditahan/ditunjuk) dan tertulis utuh di
          halaman Tubuh, satu ketukan dari sini. Sumber yang dihapus akan
          membuat angka ini tidak dapat diperiksa lagi, dan itu tidak boleh. */}
      <p className="t-mikro mt-1 truncate text-neutral-500 dark:text-neutral-400" title={`${b.populasi} · Batas: ${b.sumber}`}>
        <span className="font-bold">{b.zonaKini}</span>
        {' · '}
        {b.populasi}
      </p>
    </div>
  )
}

/**
 * Bagian bilah tubuh di beranda.
 *
 * Tidak dirender sama sekali bila tidak ada satu pun bilah yang dapat
 * digambar — judul bagian di atas ruang kosong memberi kesan ada yang gagal
 * dimuat, dan itu lebih buruk daripada tidak ada bagiannya.
 */
export function BilahTubuh({ daftar }: { daftar: BilahRujukan[] }) {
  if (!daftar.length) return null
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Terhadap rentang rujukan</h2>
        <Link to="/tubuh" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          Selengkapnya →
        </Link>
      </div>
      <div className="kaca rounded-3xl px-3 py-1">
        {daftar.map((b, i) => (
          <div key={b.kunci} className={i > 0 ? 'border-t border-neutral-100 dark:border-white/10' : ''}>
            <Bilah b={b} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default BilahTubuh
