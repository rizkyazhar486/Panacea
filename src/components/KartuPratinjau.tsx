import { Link } from 'react-router-dom'
import type { Pratinjau } from '../lib/pratinjauBeranda'

// ─────────────────────────────────────────────────────────────────────────────
// Kartu pratinjau fitur.
//
// DUA BENTUK, DAN PERBEDAANNYA HARUS TERLIHAT SEKILAS:
//
//   BERISI    — ada angkanya. Latar padat, angka besar.
//   KOSONG    — datanya memang belum ada. Bergaris putus-putus, tanpa angka,
//               dan kalimatnya berupa ajakan mengisi.
//
// Keduanya sengaja dibedakan lewat BENTUK, bukan lewat warna saja. Sekitar satu
// dari dua belas laki-laki mengalami kesulitan membedakan warna tertentu, dan
// pembedaan yang hanya bersandar pada warna tidak sampai kepada mereka. Garis
// putus-putus terbaca oleh semua orang.
// ─────────────────────────────────────────────────────────────────────────────

export function KartuPratinjau({ p }: { p: Pratinjau }) {
  const kosong = p.nilai === ''
  return (
    <Link
      to={p.ke}
      // Kartu berisi merenggangkan isinya supaya angkanya duduk di tengah dan
      // kalimatnya menempel di dasar; kartu kosong tidak, karena merenggangkan
      // dua baris pada kartu yang tidak punya angka hanya menghasilkan lubang
      // di tengahnya, dan lubang itu terbaca sebagai ada yang gagal dimuat.
      className={`flex min-h-[112px] flex-col gap-1.5 rounded-3xl p-3 transition active:scale-[0.98] ${
        kosong ? '' : 'justify-between'
      } ${
        kosong
          ? 'border border-dashed border-neutral-300 dark:border-white/20'
          : 'kaca'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="t-mikro font-black uppercase tracking-wide text-neutral-500">{p.wilayah}</span>
        {/* Umur data ditempel pada angkanya, bukan disembunyikan di halaman
            lain: angka lama yang tampak seperti angka sekarang adalah cara
            paling mudah membuat orang menyimpulkan hal yang keliru. */}
        {p.umur && (
          <span className="t-mikro shrink-0 rounded bg-neutral-200 px-1.5 py-0.5 font-bold leading-none text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
            {p.umur}
          </span>
        )}
      </div>

      {!kosong && (
        <div className="flex items-baseline gap-1">
          <span className={`${p.nilai.length >= 5 ? 't-angka-panjang' : 't-angka'} min-w-0 font-black leading-none tabular-nums ${p.nada}`}>{p.nilai}</span>
          {p.satuan && <span className="t-mikro min-w-0 truncate font-bold text-neutral-400">{p.satuan}</span>}
        </div>
      )}

      <p className={`t-kecil leading-snug ${kosong ? 'text-neutral-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
        {p.garis}
      </p>
    </Link>
  )
}

export function DeretPratinjau({ daftar }: { daftar: Pratinjau[] }) {
  if (!daftar.length) return null
  return (
    <section>
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Keadaan Anda</h2>
      <p className="t-kecil mb-2 leading-snug text-neutral-400">
        Isi tiap fitur, bukan hanya pintunya. Geser untuk melihat sisanya.
      </p>
      {/* Deret dijauhkan dari tepi layar supaya tidak menelan sapuan kembali —
          alasannya ditulis lengkap di .geser-aman pada index.css. */}
      {/* Tanpa role="list": membungkus tiap kartu demi peran daftar akan
          menyisipkan satu lapisan di antara .geser-aman dan kartunya, dan
          lebar kartu ditetapkan lewat pemilih anak langsung. Deret tautan
          sudah dapat ditelusuri pembaca layar tanpa peran tambahan. */}
      <div className="geser-aman">
        {daftar.map((p) => (
          <KartuPratinjau key={p.id} p={p} />
        ))}
      </div>
    </section>
  )
}

export default DeretPratinjau
