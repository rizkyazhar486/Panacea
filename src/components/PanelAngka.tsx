/**
 * Panel angka: baris kartu KPI dengan grafik arah.
 *
 * Bentuk yang sama dipakai di dasbor, Tanda Tubuh, dan Latihan. Satu bentuk
 * untuk ketiganya bukan sekadar hemat kode: angka yang selalu muncul di tempat,
 * ukuran, dan warna yang sama akan dibaca dalam sekali lihat, sedangkan tiga
 * gaya berbeda memaksa mata mengurai ulang tata letaknya di setiap halaman.
 *
 * Jarak 6 px di dalam kartu, sesuai ketentuan; pemisah antar-kelompok diatur
 * oleh halaman pemanggilnya.
 */

export type Angka = {
  label: string
  nilai: string
  satuan?: string
  /** Kelas warna Tailwind. Merah untuk yang perlu perhatian, netral untuk sisanya. */
  nada: string
  /** Deret untuk grafik arah. Nilai persisnya tidak dibaca dari grafik. */
  deret?: number[]
}

/**
 * Grafik garis kecil, digambar sendiri sebagai SVG.
 *
 * Tanpa sumbu, kisi, atau label: pada lebar 70 px semua itu tidak terbaca dan
 * hanya menambah coretan. Yang perlu terbaca cuma ARAHNYA; angka persisnya
 * sudah tercetak tepat di sebelahnya.
 */
export function Garis({ deret, kelas }: { deret: number[]; kelas: string }) {
  if (deret.length < 2) return null
  const min = Math.min(...deret)
  const max = Math.max(...deret)
  const rentang = max - min || 1
  const titik = deret
    .map((v, i) => `${(i / (deret.length - 1)) * 68 + 1},${19 - ((v - min) / rentang) * 17}`)
    .join(' ')
  return (
    <svg width="70" height="20" viewBox="0 0 70 20" fill="none" className={kelas} aria-hidden="true">
      <polyline points={titik} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Latar kartu, diturunkan dari NADA angkanya.
 *
 * Kartu angka dipakai di banyak halaman, jadi satu perubahan di sini mewarnai
 * seluruhnya sekaligus. Latarnya SANGAT tipis dan sewarna angkanya — cukup
 * untuk membuat baris angka terbaca sebagai empat benda, bukan sebagai satu
 * bidang putih panjang, tanpa mengubah rasio kontras tulisannya.
 */
const LATAR: Record<string, string> = {
  'text-ink dark:text-white': 'bg-neutral-400/12',
  'text-emerald-600 dark:text-emerald-400': 'bg-emerald-400/18',
  'text-amber-600 dark:text-amber-400': 'bg-amber-400/20',
  'text-rose-600 dark:text-rose-400': 'bg-rose-400/18',
  'text-sky-600 dark:text-sky-400': 'bg-sky-400/18',
}

export function KartuAngka({ a }: { a: Angka }) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col gap-[6px] rounded-2xl p-3 ${LATAR[a.nada] ?? 'bg-white/70 dark:bg-white/5'}`}>
      {/* Label dipangkas, bukan dibiarkan membungkus: empat kartu pada layar
          390 px menyisakan ±78 px per kartu, dan label sembilan huruf pecah di
          tengah kata. Yang dipendekkan labelnya, bukan angkanya. */}
      <span className="truncate text-[10px] font-bold uppercase tracking-wide text-neutral-500">{a.label}</span>
      <span className="flex items-baseline gap-1">
        <span className={`text-[22px] font-black leading-none tabular-nums ${a.nada}`}>{a.nilai}</span>
        {a.satuan && <span className="text-[10px] font-bold text-neutral-400">{a.satuan}</span>}
      </span>
      {a.deret && <Garis deret={a.deret} kelas={a.nada} />}
    </div>
  )
}

/**
 * Baris angka. Mengembalikan `null` bila tidak ada satu pun angka.
 *
 * Panel kosong berisi "—" di setiap kolom mengajarkan pemakainya bahwa bagian
 * itu boleh diabaikan, dan sesudah itu ia tidak akan dilihat lagi walaupun
 * kemudian terisi. Karena itu ketiadaan data ditangani dengan tidak
 * menggambar apa pun, bukan dengan menggambar tempat kosong.
 */
export function PanelAngka({ angka, maks = 4 }: { angka: Angka[]; maks?: number }) {
  if (!angka.length) return null
  return (
    <div className="flex gap-[6px]">
      {angka.slice(0, maks).map((a) => <KartuAngka key={a.label} a={a} />)}
    </div>
  )
}

/** Warna baku, supaya arti warna tetap sama di seluruh halaman. */
export const NADA = {
  netral: 'text-ink dark:text-white',
  baik: 'text-emerald-600 dark:text-emerald-400',
  perhatian: 'text-amber-600 dark:text-amber-400',
  jantung: 'text-rose-600 dark:text-rose-400',
  biru: 'text-sky-600 dark:text-sky-400',
} as const
