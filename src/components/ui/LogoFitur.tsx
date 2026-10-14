/**
 * Lambang per fitur — SVG asli, bukan emoji.
 *
 * Emoji digambar oleh sistem operasi, jadi bentuk, berat garis, dan warnanya
 * berbeda di Android, iOS, dan Windows. Satu kisi lambang yang bercampur
 * begitu tidak pernah terbaca sebagai satu keluarga, dan itu yang paling cepat
 * merusak kesan rapi pada tatapan pertama.
 *
 * Semuanya digambar pada kotak 24 dan memakai `currentColor` dengan tebal
 * garis yang sama, sehingga warnanya diatur dari luar dan seluruh set tampak
 * satu tangan. Tidak ada gambar yang disalin dari mana pun.
 */

type Props = { size?: number; className?: string }

function S({ size = 24, className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** Latihan — sosok berlari. */
export const LogoLatihan = (p: Props) => (
  <S {...p}><circle cx="14.5" cy="4.5" r="1.8" /><path d="M13 9.5 9.5 12l2 3.5-1 5" /><path d="m13 9.5 3.5 2 1.5 3.5" /><path d="M13 9.5 8 8" /><path d="m11.5 15.5-4 2" /></S>
)

/** Gizi — daun di dalam mangkuk. */
export const LogoGizi = (p: Props) => (
  <S {...p}><path d="M3.5 11h17a8.5 8.5 0 0 1-17 0Z" /><path d="M12 8.5c0-2.5 1.8-4.5 4-4.5 0 2.5-1.8 4.5-4 4.5Z" /><path d="M12 8.5V11" /></S>
)

/** Tidur — bulan sabit dengan bintang. */
export const LogoTidur = (p: Props) => (
  <S {...p}><path d="M19 14.5A8 8 0 0 1 9.5 5a7 7 0 1 0 9.5 9.5Z" /><path d="M17 4.5v2M16 5.5h2" /></S>
)

/** Tanda tubuh — denyut jantung. */
export const LogoTubuh = (p: Props) => (
  <S {...p}><path d="M20.4 6.8a4.6 4.6 0 0 0-7.8-1.9L12 5.5l-.6-.6a4.6 4.6 0 1 0-6.5 6.5L12 19l3-3" /><path d="M14 12.5h2.5l1.5-2.5 2 5 1.5-2.5H23" /></S>
)

/** Penyakit — otak, untuk isi yang dihafal. */
export const LogoPenyakit = (p: Props) => (
  <S {...p}><path d="M12 5.5a3 3 0 0 0-5.6-1.4A2.8 2.8 0 0 0 4 9.4a3 3 0 0 0 .8 5A3 3 0 0 0 12 18.5Z" /><path d="M12 5.5a3 3 0 0 1 5.6-1.4A2.8 2.8 0 0 1 20 9.4a3 3 0 0 1-.8 5A3 3 0 0 1 12 18.5Z" /><path d="M12 5.5v13" /></S>
)

/** Tindakan — stetoskop. */
export const LogoTindakan = (p: Props) => (
  <S {...p}><path d="M6 3v5a4 4 0 0 0 8 0V3" /><path d="M4.5 3H6M12.5 3H14" /><path d="M10 12v3a4 4 0 0 0 8 0v-1" /><circle cx="18" cy="11" r="2" /></S>
)

/** Kalkulator — kotak dengan tombol. */
export const LogoKalkulator = (p: Props) => (
  <S {...p}><rect x="4.5" y="3" width="15" height="18" rx="2.5" /><path d="M8 7.5h8" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" /></S>
)

/** Obat — kapsul. */
export const LogoObat = (p: Props) => (
  <S {...p}><rect x="2.6" y="8.6" width="18.8" height="6.8" rx="3.4" transform="rotate(-45 12 12)" /><path d="M9.6 9.6 14.4 14.4" /></S>
)

/** Darurat — perisai dengan palang. */
export const LogoDarurat = (p: Props) => (
  <S {...p}><path d="M12 3l7 2.8v5.4c0 4.3-2.9 8-7 9.3-4.1-1.3-7-5-7-9.3V5.8Z" /><path d="M12 9v6M9 12h6" /></S>
)

/** Ibadah — kitab terbuka. */
export const LogoIbadah = (p: Props) => (
  <S {...p}><path d="M12 6.5C10.5 5 8 4.5 4 4.8v13c4-.3 6.5.2 8 1.7 1.5-1.5 4-2 8-1.7v-13c-4-.3-6.5.2-8 1.7Z" /><path d="M12 6.5v13" /></S>
)

/** Kabar — gelembung percakapan. */
export const LogoKabar = (p: Props) => (
  <S {...p}><path d="M20 12.5a7 7 0 0 1-7 7H8l-4 2.5.9-3.6A7 7 0 0 1 8 4.5h5a7 7 0 0 1 7 7Z" /><path d="M9 11h6M9 14.5h3.5" /></S>
)

/** Semua fitur — kompas. */
export const LogoSemua = (p: Props) => (
  <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="m15.2 8.8-1.7 4.7-4.7 1.7 1.7-4.7Z" /></S>
)

/** Panduan — tanda tanya di dalam lingkaran. */
export const LogoPanduan = (p: Props) => (
  <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M9.7 9.5a2.4 2.4 0 1 1 3.2 2.3c-.6.2-.9.8-.9 1.4v.3" /><path d="M12 16.5h.01" /></S>
)
