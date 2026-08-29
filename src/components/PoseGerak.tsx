// ─────────────────────────────────────────────────────────────────────────────
// Sosok gerakan kecil untuk kartu daftar latihan.
//
// SATU POSE, BUKAN DUA. GerakDasar menggambar dua pose berdampingan karena di
// sana yang diajarkan adalah GERAKANNYA — dari mana ke mana. Di kartu daftar,
// yang dibutuhkan berbeda: satu siluet berukuran 40 px yang cukup dikenali
// sekilas. Dua pose pada ukuran itu menjadi dua kepingan kecil yang keduanya
// tidak terbaca.
//
// SEMUANYA DIGAMBAR DI SINI, tidak satu pun gambar diambil dari mana pun.
// Aturan itu berlaku sejak diagram gerakan pertama dibuat, dan alasannya dua:
// hak cipta, dan berat halaman.
//
// YANG TIDAK PUNYA SOSOK TIDAK DIBERI SOSOK PALSU. Beberapa gerakan — tali
// gelombang, latihan napas diafragma — tidak punya siluet yang dapat dikenali
// pada 40 px. Untuk itu dikembalikan null, dan kartunya memakai lambang
// kelompok ototnya seperti sebelumnya. Sosok yang salah lebih membingungkan
// daripada tidak ada sosok.
// ─────────────────────────────────────────────────────────────────────────────

type Titik = [number, number]

interface Pose {
  kepala: Titik
  bahu: Titik
  siku: Titik
  tangan: Titik
  pinggul: Titik
  lutut: Titik
  kaki: Titik
  sikuJauh?: Titik
  tanganJauh?: Titik
  lututJauh?: Titik
  kakiJauh?: Titik
  /** Benda yang dipegang: palang, barbel, atau lantai. Digambar tipis. */
  alat?: { a: Titik; b: Titik }
}

// Kanvas 140x120, lantai pada y = 112. Koordinat ditulis apa adanya supaya
// tiap posisi dapat diperiksa dengan mata dan diperbaiki satu titik.
const POSE: Record<string, Pose> = {
  pushup: {
    kepala: [112, 62], bahu: [98, 70], siku: [96, 90], tangan: [94, 110],
    pinggul: [56, 84], lutut: [34, 96], kaki: [12, 110],
    sikuJauh: [104, 90], tanganJauh: [102, 110], lututJauh: [36, 100], kakiJauh: [14, 112],
  },
  bench: {
    kepala: [30, 74], bahu: [48, 78], siku: [54, 58], tangan: [60, 38],
    pinggul: [92, 82], lutut: [110, 96], kaki: [126, 110],
    sikuJauh: [46, 58], tanganJauh: [52, 38],
    alat: { a: [34, 38], b: [86, 38] },
  },
  pullup: {
    kepala: [70, 46], bahu: [70, 58], siku: [88, 40], tangan: [100, 22],
    pinggul: [70, 84], lutut: [72, 100], kaki: [76, 110],
    sikuJauh: [52, 40], tanganJauh: [40, 22], lututJauh: [64, 100], kakiJauh: [60, 110],
    alat: { a: [26, 22], b: [114, 22] },
  },
  row: {
    kepala: [110, 50], bahu: [94, 58], siku: [90, 78], tangan: [88, 96],
    pinggul: [50, 66], lutut: [46, 90], kaki: [42, 110],
    sikuJauh: [98, 78], tanganJauh: [96, 96], lututJauh: [52, 90], kakiJauh: [48, 110],
    alat: { a: [76, 96], b: [108, 96] },
  },
  press: {
    kepala: [70, 40], bahu: [70, 54], siku: [88, 44], tangan: [94, 24],
    pinggul: [70, 84], lutut: [70, 98], kaki: [70, 112],
    sikuJauh: [52, 44], tanganJauh: [46, 24], lututJauh: [64, 98], kakiJauh: [62, 112],
    alat: { a: [36, 24], b: [104, 24] },
  },
  raise: {
    kepala: [70, 38], bahu: [70, 52], siku: [96, 54], tangan: [116, 54],
    pinggul: [70, 84], lutut: [70, 98], kaki: [70, 112],
    sikuJauh: [44, 54], tanganJauh: [24, 54], lututJauh: [64, 98], kakiJauh: [62, 112],
  },
  dip: {
    kepala: [70, 40], bahu: [70, 54], siku: [92, 62], tangan: [96, 42],
    pinggul: [70, 82], lutut: [86, 96], kaki: [82, 110],
    sikuJauh: [48, 62], tanganJauh: [44, 42], lututJauh: [56, 96], kakiJauh: [58, 110],
    alat: { a: [88, 42], b: [116, 42] },
  },
  curl: {
    kepala: [70, 38], bahu: [70, 52], siku: [80, 74], tangan: [86, 54],
    pinggul: [70, 84], lutut: [70, 98], kaki: [70, 112],
    sikuJauh: [60, 74], tanganJauh: [54, 54], lututJauh: [64, 98], kakiJauh: [62, 112],
  },
  squat: {
    kepala: [66, 44], bahu: [68, 58], siku: [88, 60], tangan: [104, 58],
    pinggul: [76, 84], lutut: [54, 92], kaki: [58, 112],
    sikuJauh: [48, 60], tanganJauh: [32, 58], lututJauh: [60, 94], kakiJauh: [66, 112],
  },
  lunge: {
    kepala: [64, 38], bahu: [66, 52], siku: [70, 70], tangan: [72, 86],
    pinggul: [68, 80], lutut: [98, 92], kaki: [100, 112],
    lututJauh: [42, 104], kakiJauh: [26, 112],
  },
  deadlift: {
    kepala: [98, 50], bahu: [84, 58], siku: [82, 78], tangan: [80, 96],
    pinggul: [50, 70], lutut: [48, 92], kaki: [46, 112],
    sikuJauh: [90, 78], tanganJauh: [88, 96], lututJauh: [54, 92], kakiJauh: [52, 112],
    alat: { a: [60, 100], b: [104, 100] },
  },
  hipthrust: {
    kepala: [26, 62], bahu: [42, 68], siku: [40, 86], tangan: [34, 100],
    pinggul: [86, 70], lutut: [110, 84], kaki: [116, 112],
    lututJauh: [112, 90], kakiJauh: [120, 112],
    alat: { a: [70, 62], b: [102, 62] },
  },
  plank: {
    kepala: [112, 68], bahu: [98, 76], siku: [96, 96], tangan: [78, 106],
    pinggul: [56, 88], lutut: [34, 98], kaki: [12, 110],
    lututJauh: [36, 102], kakiJauh: [14, 112],
  },
  hollow: {
    kepala: [34, 78], bahu: [48, 82], siku: [40, 66], tangan: [28, 54],
    pinggul: [86, 92], lutut: [108, 78], kaki: [126, 64],
    lututJauh: [110, 84], kakiJauh: [128, 70],
  },
  burpee: {
    kepala: [56, 62], bahu: [64, 74], siku: [72, 90], tangan: [78, 108],
    pinggul: [84, 90], lutut: [70, 100], kaki: [58, 110],
    lututJauh: [74, 96], kakiJauh: [62, 108],
  },
  swing: {
    kepala: [66, 44], bahu: [68, 58], siku: [86, 68], tangan: [104, 72],
    pinggul: [72, 84], lutut: [62, 98], kaki: [64, 112],
    sikuJauh: [78, 70], tanganJauh: [96, 74], lututJauh: [70, 98], kakiJauh: [72, 112],
  },
  kick: {
    kepala: [50, 36], bahu: [54, 50], siku: [44, 64], tangan: [38, 52],
    pinggul: [58, 80], lutut: [92, 74], kaki: [122, 62],
    lututJauh: [52, 98], kakiJauh: [48, 112],
  },
  box: {
    kepala: [62, 40], bahu: [66, 54], siku: [90, 54], tangan: [112, 50],
    pinggul: [66, 82], lutut: [80, 96], kaki: [86, 112],
    sikuJauh: [56, 66], tanganJauh: [48, 52], lututJauh: [54, 98], kakiJauh: [46, 112],
  },
  rope: {
    kepala: [70, 34], bahu: [70, 48], siku: [92, 54], tangan: [102, 44],
    pinggul: [70, 78], lutut: [76, 92], kaki: [74, 104],
    sikuJauh: [48, 54], tanganJauh: [38, 44], lututJauh: [64, 92], kakiJauh: [66, 104],
  },
  mobility: {
    kepala: [40, 52], bahu: [54, 60], siku: [46, 78], tangan: [36, 94],
    pinggul: [92, 74], lutut: [110, 94], kaki: [96, 110],
    lututJauh: [104, 98], kakiJauh: [88, 112],
  },
}

/**
 * Nama gerakan menuju sosoknya.
 *
 * DICOCOKKAN DENGAN KATA KUNCI, bukan dengan nama persis. Nama di daftar
 * membawa keterangan dalam kurung ("Squat (Bodyweight/Barbell)"), dan
 * pencocokan persis akan gagal pada setiap gerakan yang namanya nanti
 * disunting sedikit — kegagalan yang tidak menimbulkan galat apa pun, hanya
 * kartu yang diam-diam kehilangan gambarnya.
 */
const KUNCI: [RegExp, string][] = [
  [/push-?up/i, 'pushup'],
  [/bench/i, 'bench'],
  [/pull-?up/i, 'pullup'],
  [/row/i, 'row'],
  [/overhead press|shoulder press/i, 'press'],
  [/lateral raise/i, 'raise'],
  [/dip/i, 'dip'],
  [/curl/i, 'curl'],
  [/goblet squat|squat/i, 'squat'],
  [/lunge/i, 'lunge'],
  [/deadlift/i, 'deadlift'],
  [/hip thrust|glute bridge/i, 'hipthrust'],
  [/plank/i, 'plank'],
  [/hollow/i, 'hollow'],
  [/burpee/i, 'burpee'],
  [/swing/i, 'swing'],
  [/kick/i, 'kick'],
  [/boxing|pad work/i, 'box'],
  [/jump rope|skipping/i, 'rope'],
  [/mobility|flow/i, 'mobility'],
]

export function poseUntuk(nama: string): string | null {
  for (const [pola, id] of KUNCI) if (pola.test(nama)) return id
  return null
}

/** Sosok satu gerakan. Mengembalikan null bila tidak ada yang cocok. */
export function PoseGerak({ nama, kelas = '' }: { nama: string; kelas?: string }) {
  const id = poseUntuk(nama)
  if (!id) return null
  const p = POSE[id]
  if (!p) return null
  /*
   * VIEWBOX DIPOTONG KE SOSOKNYA, TIDAK DIBIARKAN 140x120.
   *
   * Pada kotak 40 px, kanvas penuh membuat sosoknya menyusut menjadi beberapa
   * goresan tipis di satu sudut — terlihat langsung saat diperiksa: push-up
   * terbaca sebagai satu garis miring, bukan sebagai orang. Kotak pembatas
   * dihitung dari titik yang benar-benar dipakai, lalu diberi bantalan.
   * Hasilnya tiap pose mengisi kotaknya sendiri, sebesar mungkin, berapa pun
   * bentuk aslinya.
   */
  const titik: Titik[] = [p.kepala, p.bahu, p.siku, p.tangan, p.pinggul, p.lutut, p.kaki]
  for (const t of [p.sikuJauh, p.tanganJauh, p.lututJauh, p.kakiJauh]) if (t) titik.push(t)
  if (p.alat) titik.push(p.alat.a, p.alat.b)
  const bantalan = 7
  const x0 = Math.min(...titik.map((t) => t[0])) - bantalan
  const y0 = Math.min(...titik.map((t) => t[1])) - bantalan
  const x1 = Math.max(...titik.map((t) => t[0])) + bantalan
  const y1 = Math.max(...titik.map((t) => t[1])) + bantalan
  // Kotaknya dibuat persegi supaya sosok yang lebar (push-up, plank) tidak
  // digepengkan ketika dimasukkan ke kotak persegi.
  /* Sosok TELUNGKUP DIMIRINGKAN sedikit. Push-up, plank dan bench press
     hampir mendatar: dimasukkan ke kotak persegi, keduanya menyisakan
     sepertiga tinggi kotak kosong di atas dan di bawah, dan yang tersisa di
     tengah terbaca sebagai satu garis dengan titik — bukan sebagai orang.
     Diperiksa di layar sebelum dan sesudah; kemiringan kecil membuat sosoknya
     mengisi kotak dan langsung terbaca. */
  const lebar = x1 - x0
  const tinggi = y1 - y0
  const miring = lebar > tinggi * 1.6 ? -18 : 0
  const sisi = Math.max(lebar, tinggi)
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  // Goresan ditebalkan seiring kotaknya mengecil, supaya sosok yang lebar
  // tidak berubah menjadi rambut tipis.
  const tebal = Math.max(4, sisi / 16)

  const garis = (a: Titik, b: Titik, k: string, pudar = false) => (
    <line
      key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
      stroke="currentColor" strokeWidth={pudar ? tebal * 0.8 : tebal} strokeLinecap="round"
      opacity={pudar ? 0.3 : 1}
    />
  )
  return (
    <svg viewBox={`${cx - sisi / 2} ${cy - sisi / 2} ${sisi} ${sisi}`} className={kelas} aria-hidden>
      <g transform={miring ? `rotate(${miring} ${cx} ${cy})` : undefined}>
      {p.alat && (
        <line x1={p.alat.a[0]} y1={p.alat.a[1]} x2={p.alat.b[0]} y2={p.alat.b[1]}
          stroke="currentColor" strokeWidth={tebal * 0.8} opacity="0.45" strokeLinecap="round" />
      )}
      {p.sikuJauh && garis(p.bahu, p.sikuJauh, 'lau', true)}
      {p.sikuJauh && p.tanganJauh && garis(p.sikuJauh, p.tanganJauh, 'lbu', true)}
      {p.lututJauh && garis(p.pinggul, p.lututJauh, 'phu', true)}
      {p.lututJauh && p.kakiJauh && garis(p.lututJauh, p.kakiJauh, 'btu', true)}
      {garis(p.bahu, p.pinggul, 'badan')}
      {garis(p.pinggul, p.lutut, 'paha')}
      {garis(p.lutut, p.kaki, 'betis')}
      {garis(p.bahu, p.siku, 'la')}
      {garis(p.siku, p.tangan, 'lb')}
      {/* Leher: tanpa garis pendek ini kepala tampak lepas dari badan pada
          posisi telungkup, dan sosoknya berhenti terbaca sebagai orang. */}
      {garis(p.bahu, p.kepala, 'leher')}
      <circle cx={p.kepala[0]} cy={p.kepala[1]} r={tebal * 1.6} fill="currentColor" />
      </g>
    </svg>
  )
}

export default PoseGerak
