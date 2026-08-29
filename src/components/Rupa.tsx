import type { ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Perkakas rupa — bentuk, bukan angka.
//
// SEMUANYA SVG YANG DIGAMBAR DI SINI, tidak satu pun gambar yang diambil dari
// mana pun. Aturan itu sudah berlaku di aplikasi ini sejak diagram gerakan
// dasar dibuat, dan alasannya dua: hak cipta, dan berat halaman. Sebuah SVG
// enam baris memuat lebih cepat daripada gambar apa pun, ikut warna temanya
// sendiri, dan tetap tajam di layar mana pun.
//
// KENAPA BENTUK, BUKAN ANGKA. Angka menuntut dibandingkan — dengan target,
// dengan kemarin, dengan orang lain. Bentuk cukup dilihat. Untuk layar yang
// dibuka setiap pagi, bentuk yang membesar pelan-pelan lebih baik daripada
// angka yang naik-turun, sebab bentuk tidak bisa "buruk".
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cincin kemajuan tanpa angka di tengahnya.
 *
 * Tidak ada persen dan tidak ada "3/5". Yang terlihat hanya seberapa penuh
 * lingkarannya, dan itu sudah cukup untuk pertanyaan yang sebenarnya diajukan
 * orang: apakah aku sudah melakukan sesuatu hari ini.
 */
export function Cincin({
  isi, warna = 'var(--color-brand, #00BF63)', ukuran = 44, tebal = 5, anak,
}: { isi: number; warna?: string; ukuran?: number; tebal?: number; anak?: ReactNode }) {
  const r = (ukuran - tebal) / 2
  const keliling = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, isi))
  return (
    <span className="relative inline-grid place-items-center" style={{ width: ukuran, height: ukuran }}>
      <svg width={ukuran} height={ukuran} viewBox={`0 0 ${ukuran} ${ukuran}`} aria-hidden className="-rotate-90">
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" strokeWidth={tebal}
          className="stroke-neutral-200 dark:stroke-white/15" />
        {/* Busur tidak digambar sama sekali saat isinya nol — busur sepanjang
            satu titik terbaca sebagai cacat rendering, bukan sebagai nol. */}
        {p > 0.01 && (
          <circle
            cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke={warna} strokeWidth={tebal}
            strokeLinecap="round" strokeDasharray={`${keliling * p} ${keliling}`}
            style={{ transition: 'stroke-dasharray 0.5s cubic-bezier(0.32,0.72,0,1)' }}
          />
        )}
      </svg>
      {anak && <span className="absolute grid place-items-center">{anak}</span>}
    </span>
  )
}

/**
 * Deret batang kecil — sepekan, sebulan, apa pun.
 *
 * Tanpa sumbu dan tanpa angka. Yang ingin diketahui dari bentuk ini bukan
 * "berapa" melainkan "apakah ada polanya", dan pola terlihat justru ketika
 * angkanya disingkirkan.
 */
export function Deret({
  nilai, warna = 'bg-brand', tinggi = 28,
}: { nilai: number[]; warna?: string; tinggi?: number }) {
  const maks = Math.max(1, ...nilai)
  return (
    <span className="flex items-end gap-[3px]" style={{ height: tinggi }} aria-hidden>
      {nilai.map((v, i) => (
        <span
          key={i}
          className={`flex-1 rounded-full ${v > 0 ? warna : 'bg-neutral-200 dark:bg-white/15'}`}
          style={{ height: `${Math.max(v > 0 ? 14 : 8, (v / maks) * 100)}%` }}
        />
      ))}
    </span>
  )
}

/**
 * Latar bergradien lembut untuk kartu.
 *
 * Dipakai sebagai LAPISAN DI BELAKANG, bukan sebagai latar elemennya sendiri,
 * supaya tulisan di atasnya tetap memakai warna tinta biasa dan rasio
 * kontrasnya tidak berubah-ubah mengikuti gradien.
 */
export function Kilau({ dari, ke, kelas = '' }: { dari: string; ke: string; kelas?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-gradient-to-br ${dari} ${ke} ${kelas}`}
    />
  )
}

/**
 * Gelembung dekoratif di pojok kartu. Murni rupa; tidak membawa keterangan
 * apa pun, jadi ia aria-hidden dan tidak pernah menjadi satu-satunya penanda.
 */
export function Gelembung({ warna, kelas = '' }: { warna: string; kelas?: string }) {
  return <span aria-hidden className={`pointer-events-none absolute rounded-full blur-2xl ${warna} ${kelas}`} />
}

/**
 * Lencana bulat berisi lambang, dengan cincin tipis sewarna.
 * Dipakai sebagai kepala kartu supaya tiap bagian punya wajahnya sendiri.
 */
export function Kepala({
  emoji, judul, ringkas, warna,
}: { emoji: string; judul: string; ringkas?: string; warna: { bg: string; teks: string } }) {
  return (
    <div className="flex items-start gap-2.5">
      <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-[19px] ${warna.bg}`}>
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[14px] font-black leading-tight ${warna.teks}`}>{judul}</span>
        {ringkas && (
          <span className="mt-0.5 block text-[11.5px] leading-snug text-neutral-600 dark:text-neutral-300">
            {ringkas}
          </span>
        )}
      </span>
    </div>
  )
}
