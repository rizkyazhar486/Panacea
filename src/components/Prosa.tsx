import { useState, type ReactNode } from 'react'

/**
 * Lapisan kerapian teks dan gerak, dipakai bersama seluruh halaman.
 *
 * Keluhannya: "terlalu banyak tulisan". Terukur — 123 halaman memuat total
 * 25.719 kata prosa yang tercetak langsung ke layar. Menulis ulang semuanya
 * satu per satu tidak realistis dan berisiko: banyak di antaranya peringatan
 * klinis yang memang harus ada.
 *
 * Karena itu yang diubah PRIMITIF-nya, bukan 123 halaman. Semua halaman
 * memakai SectionTitle dan Card yang sama, jadi memendekkan di sini
 * memendekkan di mana-mana — dan tidak ada satu kata pun yang dibuang: yang
 * panjang hanya dilipat, satu ketukan untuk membukanya.
 */

/** Ambang lipat. Di bawah ini teks dibiarkan utuh — melipatnya malah menambah kerja. */
const BATAS_KATA = 16

/**
 * Paragraf yang melipat dirinya sendiri bila panjang.
 *
 * Pemotongan dilakukan CSS (line-clamp), bukan dengan memotong teksnya. Teks
 * di DOM selalu utuh, jadi pembaca layar dan pencarian halaman tidak kehilangan
 * apa pun, dan tidak ada risiko kalimat klinis terpangkas di tengah lalu tetap
 * terbaca wajar — kesalahan yang tidak akan terlihat siapa pun.
 */
export function Prosa({ children, kelas, baris = 2 }: {
  children?: ReactNode
  kelas?: string
  baris?: number
}) {
  const [buka, setBuka] = useState(false)
  const teks = typeof children === 'string' ? children : ''
  const panjang = teks ? teks.trim().split(/\s+/).length > BATAS_KATA : false
  if (!panjang) return <p className={kelas}>{children}</p>
  return (
    <p className={kelas}>
      <span
        style={buka ? undefined : {
          display: '-webkit-box', WebkitLineClamp: baris, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}
      >
        {children}
      </span>
      <button
        onClick={() => setBuka((x) => !x)}
        /* h-10: sasaran sentuh terkecil yang masih bisa dikenai jempol. Sebagai
           teks telanjang tingginya cuma 18 px. */
        className="flex h-10 items-center text-[11px] font-bold text-brand underline underline-offset-2"
      >
        {buka ? 'ringkas' : 'selengkapnya'}
      </button>
    </p>
  )
}
