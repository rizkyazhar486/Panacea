// Garis kecil di samping sebuah angka: bentuk perubahannya, bukan hiasan.
//
// Digambar HANYA dari titik yang benar-benar tercatat. Bila titiknya kurang
// dari tiga, tidak ada yang digambar — garis dua titik selalu tampak sebagai
// tren yang meyakinkan, padahal ia hanya menghubungkan dua bacaan.
//
// Tidak ada sumbu, tidak ada angka di dalamnya, tidak ada warna baik/buruk:
// naik belum tentu bagus (berat naik, VO2max naik), dan menebak arah mana yang
// "baik" untuk 113 metrik adalah cara tercepat berbohong dengan grafik.

export function GrafikMini({ deret, lebar = 52, tinggi = 20 }: { deret: number[]; lebar?: number; tinggi?: number }) {
  if (deret.length < 3) return null
  const min = Math.min(...deret)
  const maks = Math.max(...deret)
  const rentang = maks - min
  // Deret datar digambar sebagai garis tengah, bukan dibagi nol.
  const y = (v: number) => (rentang === 0 ? tinggi / 2 : tinggi - 2 - ((v - min) / rentang) * (tinggi - 4))
  const x = (i: number) => (i / (deret.length - 1)) * (lebar - 2) + 1
  const titik = deret.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const akhir = deret[deret.length - 1]

  return (
    <svg
      width={lebar}
      height={tinggi}
      viewBox={`0 0 ${lebar} ${tinggi}`}
      className="shrink-0 text-neutral-400 dark:text-neutral-500"
      role="img"
      aria-label={`${deret.length} bacaan terakhir, dari ${min} sampai ${maks}`}
    >
      <polyline points={titik} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(deret.length - 1)} cy={y(akhir)} r="2" fill="currentColor" />
    </svg>
  )
}

export default GrafikMini
