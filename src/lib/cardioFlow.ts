import { CARDIO_BY_NAME, type CardioPart } from './cardioAtlas.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Aliran darah sebagai JALUR, bukan sebagai hiasan yang berkelip.
//
// Menyorot satu pembuluh saja tidak mengajarkan apa pun tentang sirkulasi:
// yang perlu terlihat adalah darah berangkat dari suatu ruang jantung, melewati
// pembuluh demi pembuluh dengan urutan yang benar, dan sampai di suatu tempat.
// Karena itu jalur di sini adalah DAFTAR BERURUTAN nama struktur, dan garis
// gerak partikel dirangkai dari garis tengah tiap struktur (lihat
// scripts/atlasCardio.mjs) — arahnya ditentukan dengan menyambung ujung
// terdekat, sehingga arkus aorta terbaca melengkung ke bawah, bukan meloncat.
//
// Semua rumus di berkas ini murni angka dan tidak menyentuh three.js, supaya
// bisa diuji tanpa peramban — dan memang diuji di server/uji/cardioFlow.uji.ts.
// Kesalahan pemodelan aliran tidak terlihat di tangkapan layar: gambarnya tetap
// bergerak indah sambil mengatakan hal yang keliru.
// ─────────────────────────────────────────────────────────────────────────────

export type Vec3 = [number, number, number]

export interface FlowPath {
  id: string
  label: string
  /** Penjelasan satu kalimat: apa yang sebenarnya sedang diikuti. */
  ringkas: string
  /** 'deoxygenated' = darah balik/menuju paru; 'oxygenated' = darah arteri. */
  oxygen: 'deoxygenated' | 'oxygenated' | 'portal'
  /** Berdenyut mengikuti siklus jantung (arteri) atau mengalir tetap (vena). */
  pulsatile: boolean
  /** Nama struktur BodyParts3D, BERURUTAN mengikuti arah aliran. */
  urutan: string[]
}

export const FLOW_PATHS: FlowPath[] = [
  {
    id: 'pulmonary',
    label: 'Pulmonary circuit',
    ringkas: 'Blood returning from the body is pumped to the lungs and comes back loaded with oxygen.',
    oxygen: 'deoxygenated',
    pulsatile: true,
    urutan: [
      'Superior vena cava', 'Cavity of right atrium', 'Anterior leaflet of tricuspid valve',
      'Cavity of right ventricle', 'Right anterior cusp of pulmonary valve', 'Pulmonary trunk',
      'Left pulmonary artery', 'Left superior pulmonary vein', 'Cavity of left atrium',
    ],
  },
  {
    id: 'systemic',
    label: 'Systemic circuit',
    ringkas: 'The left ventricle drives oxygenated blood down the aorta to the legs.',
    oxygen: 'oxygenated',
    pulsatile: true,
    urutan: [
      'Cavity of left atrium', 'Anterior leaflet of mitral valve', 'Cavity of left ventricle',
      'Anterior cusp of aortic valve', 'Ascending aorta', 'Arch of aorta', 'Descending thoracic aorta',
      'Abdominal aorta', 'Left common iliac artery', 'Left external iliac artery',
      'Left femoral artery', 'Left popliteal artery',
    ],
  },
  {
    id: 'coronary-left',
    label: 'Left coronary artery',
    ringkas: 'The heart feeds itself first — the left main splits into the LAD and the circumflex.',
    oxygen: 'oxygenated',
    pulsatile: true,
    urutan: [
      'Ascending aorta', 'Trunk of left coronary artery',
      'Trunk of anterior interventricular branch of left coronary artery',
      'Diagonal branch of anterior descending branch of left coronary artery',
    ],
  },
  {
    id: 'coronary-right',
    label: 'Right coronary artery',
    ringkas: 'The right coronary runs in the AV groove to the inferior wall and, in most people, the AV node.',
    oxygen: 'oxygenated',
    pulsatile: true,
    urutan: [
      'Ascending aorta', 'Trunk of right coronary artery', 'Marginal branch of right coronary artery',
      'Posterior interventricular branch of right coronary artery',
    ],
  },
  {
    id: 'cerebral-anterior',
    label: 'Carotid supply to the brain',
    ringkas: 'Arch → common carotid → internal carotid → middle cerebral artery, the vessel most often occluded in stroke.',
    oxygen: 'oxygenated',
    pulsatile: true,
    urutan: [
      'Arch of aorta', 'Left common carotid artery', 'Left internal carotid artery',
      'Sphenoid part of left middle cerebral artery',
    ],
  },
  {
    id: 'cerebral-posterior',
    label: 'Vertebrobasilar supply',
    ringkas: 'The vertebral arteries join as the basilar artery and feed the brainstem and occipital lobes.',
    oxygen: 'oxygenated',
    pulsatile: true,
    urutan: [
      'Left subclavian artery', 'Left vertebral artery', 'Basilar artery',
      'Precommunicating part of left posterior cerebral artery',
      'Postcommunicating part of left posterior cerebral artery',
    ],
  },
  {
    id: 'renal',
    label: 'Renal circulation',
    ringkas: 'A fifth of the cardiac output leaves the abdominal aorta for two organs the size of a fist.',
    oxygen: 'oxygenated',
    pulsatile: true,
    urutan: ['Abdominal aorta', 'Left renal artery', 'Left renal vein', 'Inferior vena cava'],
  },
  {
    id: 'portal',
    label: 'Portal circulation',
    ringkas: 'Gut blood does not return straight to the heart — it passes through the liver first.',
    oxygen: 'portal',
    pulsatile: false,
    urutan: [
      'Superior mesenteric artery', 'Superior mesenteric vein', 'Hepatic portal vein',
      'Right hepatic vein', 'Inferior vena cava', 'Cavity of right atrium',
    ],
  },
  {
    id: 'venous-return',
    label: 'Venous return from the leg',
    ringkas: 'Calf veins → popliteal → femoral → iliac → IVC. This is the road a DVT travels to the lung.',
    oxygen: 'deoxygenated',
    pulsatile: false,
    urutan: [
      'Left posterior tibial vein', 'Left popliteal vein', 'Left femoral vein',
      'Left external iliac vein', 'Left common iliac vein', 'Inferior vena cava',
      'Cavity of right atrium',
    ],
  },
]

/** Jarak Euklides. */
function jarak(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

/**
 * Rangkai garis tengah beberapa struktur menjadi satu lintasan.
 *
 * Garis tengah tiap pembuluh dihitung sepanjang sumbu terpanjangnya, dan arah
 * sumbu itu sembarang: setengahnya akan menunjuk berlawanan dengan arah aliran.
 * Jadi tiap ruas DIBALIK bila ujung akhirnya lebih dekat ke titik terakhir
 * lintasan daripada ujung awalnya. Tanpa ini, aliran tampak bolak-balik.
 */
export function bangunLintasan(namaUrut: string[]): Vec3[] {
  const titik: Vec3[] = []
  for (const nama of namaUrut) {
    const p = CARDIO_BY_NAME[nama.toLowerCase()]
    if (!p) continue
    const ruas: Vec3[] = p.line.length >= 2 ? (p.line as Vec3[]).slice() : [p.centroid as Vec3]
    if (titik.length && ruas.length >= 2) {
      const akhir = titik[titik.length - 1]
      if (jarak(akhir, ruas[ruas.length - 1]) < jarak(akhir, ruas[0])) ruas.reverse()
    }
    titik.push(...ruas)
  }
  return titik
}

/** Struktur yang benar-benar ada di atlas untuk jalur ini. */
export function strukturJalur(jalur: FlowPath): CardioPart[] {
  return jalur.urutan.map((n) => CARDIO_BY_NAME[n.toLowerCase()]).filter(Boolean) as CardioPart[]
}

/** Panjang kumulatif tiap titik; elemen terakhir = panjang total. */
export function panjangKumulatif(lintasan: Vec3[]): number[] {
  const out = [0]
  for (let i = 1; i < lintasan.length; i++) out.push(out[i - 1] + jarak(lintasan[i - 1], lintasan[i]))
  return out
}

/**
 * Titik pada lintasan di posisi t (0..1) diukur MENURUT PANJANG, bukan menurut
 * nomor titik. Bedanya nyata: ruas panjang seperti aorta desenden hanya punya
 * beberapa titik, dan tanpa pembobotan panjang partikel akan melesat di sana
 * lalu merayap di pembuluh pendek.
 */
export function titikPada(lintasan: Vec3[], t: number): Vec3 {
  if (lintasan.length === 0) return [0, 0, 0]
  if (lintasan.length === 1) return lintasan[0]
  const kum = panjangKumulatif(lintasan)
  const total = kum[kum.length - 1]
  if (total === 0) return lintasan[0]
  const s = Math.min(Math.max(t, 0), 1) * total
  let i = 1
  while (i < kum.length - 1 && kum[i] < s) i++
  const f = (s - kum[i - 1]) / (kum[i] - kum[i - 1] || 1)
  const a = lintasan[i - 1], b = lintasan[i]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

/**
 * Kecepatan sesaat aliran, dinormalkan terhadap rata-ratanya (1 = rata-rata).
 *
 * Arteri berdenyut: aliran melonjak saat sistol dan hampir berhenti saat
 * diastol, jadi partikel harus tersendat, bukan meluncur rata. Vena tidak —
 * aliran balik vena praktis tetap, dan menggambarkannya berdenyut adalah
 * kesalahan fisiologi yang akan tertanam di kepala orang yang menontonnya.
 * Fraksi sistol memendek saat denyut cepat (perkiraan Bazett), sehingga pada
 * takikardia yang terpotong adalah waktu pengisian diastolik — persis alasan
 * takikardia memperburuk iskemia.
 */
/**
 * Kecepatan sesaat aliran, dinormalkan terhadap rata-ratanya (1 = rata-rata).
 *
 * Arteri berdenyut: aliran melonjak saat sistol dan hampir berhenti saat
 * diastol, jadi partikel harus tersendat, bukan meluncur rata. Vena tidak —
 * aliran balik vena praktis tetap, dan menggambarkannya berdenyut adalah
 * kesalahan fisiologi yang akan tertanam di kepala orang yang menontonnya.
 * Lama sistol memendek saat denyut cepat (perkiraan Bazett), sehingga yang
 * terpotong pada takikardia adalah waktu pengisian diastolik — persis alasan
 * takikardia memperburuk iskemia miokard.
 */
export const ALIRAN_DIASTOL = 0.15

export function kecepatanAliran(waktuDetik: number, hr: number, pulsatile: boolean): number {
  if (!pulsatile) return 1
  const periode = 60 / Math.max(20, hr)
  const sistol = Math.min(0.55, 0.35 * Math.sqrt(periode))   // detik
  const fraksi = sistol / periode
  // Puncaknya dihitung, bukan dikira-kira: rata-rata satu siklus harus tetap 1,
  // sehingga mengubah denyut mengubah BENTUK aliran tanpa diam-diam mengubah
  // curah jantungnya.
  const puncak = (1 - ALIRAN_DIASTOL * (1 - fraksi)) / ((2 / Math.PI) * fraksi)
  const fase = ((waktuDetik % periode) + periode) % periode
  if (fase > sistol) return ALIRAN_DIASTOL
  return puncak * Math.sin((fase / sistol) * Math.PI)
}

/**
 * Akibat penyempitan terhadap aliran, dengan tahanan seri DAN autoregulasi.
 *
 * Ini bukan hiasan: angka inilah yang menjelaskan kenapa stenosis 50% tidak
 * menimbulkan keluhan saat istirahat tapi menimbulkan angina saat menaiki
 * tangga, dan kenapa yang jatuh lebih dulu adalah CADANGAN aliran, bukan
 * aliran istirahatnya.
 *
 * Tahanan lesi sebanding dengan 1/r⁴ (Poiseuille), tapi lesi hanya sepanjang
 * beberapa milimeter sedangkan anyaman pembuluh di hilirnya adalah satu pohon
 * utuh — jadi tahanan lesi harus diskalakan terhadap tahanan anyaman itu,
 * bukan disamakan dengannya. Skala K dipilih supaya ambang kritisnya jatuh di
 * sekitar stenosis diameter 80–85%, tempat aliran istirahat memang mulai
 * turun pada manusia.
 *
 * Autoregulasi dimodelkan apa adanya: saat istirahat anyaman MELEBAR untuk
 * menutupi tahanan lesi, sampai ia tidak bisa melebar lagi. Tanpa itu model
 * akan mengatakan stenosis 50% memangkas aliran istirahat sampai 6% — yang
 * akan mengajarkan hal yang salah kepada setiap orang yang membacanya.
 *
 * @param penyempitan fraksi PENYEMPITAN DIAMETER (0.7 = stenosis 70%)
 */
export const TAHANAN_ANYAMAN_MINIMAL = 0.25   // vasodilatasi penuh -> cadangan 4x
export const SKALA_LESI = 0.0012

export function alirStenosis(penyempitan: number): {
  istirahat: number
  maksimal: number
  cadangan: number
} {
  const d = Math.min(1, Math.max(0, penyempitan))
  const sisa = 1 - d
  const lesi = sisa <= 0 ? Infinity : SKALA_LESI * ((1 / Math.pow(sisa, 4)) - 1)
  // Melebar penuh: ini juga batas atas aliran istirahat, karena anyaman tidak
  // bisa melebar melampaui maksimalnya untuk menutupi lesi.
  const maksimal = 1 / (lesi + TAHANAN_ANYAMAN_MINIMAL)
  const istirahat = Math.min(1, maksimal)
  return {
    istirahat: Number(istirahat.toFixed(3)),
    maksimal: Number(maksimal.toFixed(3)),
    cadangan: Number((maksimal / Math.max(istirahat, 1e-9)).toFixed(2)),
  }
}
