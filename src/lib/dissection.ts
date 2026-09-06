// ─────────────────────────────────────────────────────────────────────────────
// DISEKSI DAN PEMBUKAAN TUBUH — "unfolded", tetapi dengan urutan yang benar.
//
// Tampilan tubuh yang bisa dibuka lapis demi lapis mudah dibuat cantik dan
// mudah dibuat salah. Yang membuatnya bernilai bukan animasinya, melainkan
// URUTANNYA: kulit, lemak subkutan, fasia, otot, pembuluh dan saraf, baru
// organ dan tulang. Urutan itulah yang sebenarnya ditemui pisau, dan urutan
// itu pula yang harus dihafal seseorang yang belajar bedah.
//
// Karena itu berkas ini menyimpan dua hal yang berbeda:
//
//   1. MATEMATIKA PEMBUKAAN — bagaimana tiap struktur bergeser keluar
//      ("explode") dan bagaimana tiap lapisan memudar sesuai kedalaman.
//      Murni geometri; tidak ada klaim medis di dalamnya.
//
//   2. URUTAN LAPISAN NYATA per wilayah tubuh — dinding perut anterior punya
//      sembilan lapisan bernama, dan menyebutnya "kulit lalu otot" adalah
//      pengajaran yang keliru, bukan penyederhanaan.
//
// Sumber urutan lapisan: buku ajar anatomi bedah baku (Gray's Anatomy edisi
// ke-42; Skandalakis' Surgical Anatomy; Netter's Atlas). Nama Latin/eponim
// dipertahankan apa adanya karena itulah yang dipakai di kamar operasi.
// ─────────────────────────────────────────────────────────────────────────────

export type KunciLapisan =
  | 'surface' | 'muscular' | 'cardiovascular' | 'nervous' | 'lymphoid' | 'visceral' | 'skeletal'

/**
 * Kedalaman tiap lapisan, 0 = paling luar.
 *
 * Pembuluh dan saraf sengaja diletakkan SETELAH otot, bukan sebelum: keduanya
 * memang berjalan di dalam dan di antara otot, dan pembelajar yang melihat
 * pembuluh sebelum otot akan mengira keduanya terletak di permukaan.
 */
export const KEDALAMAN: Record<KunciLapisan, number> = {
  surface: 0,
  muscular: 1,
  cardiovascular: 2,
  nervous: 3,
  lymphoid: 4,
  visceral: 5,
  skeletal: 6,
}
export const LAPISAN_TERDALAM = 6

/**
 * Keburaman satu lapisan pada kedalaman diseksi tertentu.
 *
 * Lapisan di atas bidang diseksi memudar tetapi TIDAK pernah hilang sama
 * sekali (batas bawah 0,06): begitu lapisan luar lenyap total, pembelajar
 * kehilangan orientasi — struktur dalam tidak lagi punya rujukan permukaan,
 * dan gambar berhenti menjadi tubuh.
 */
export function keburaman(lapisan: KunciLapisan, kedalaman: number): number {
  const d = Math.max(0, Math.min(LAPISAN_TERDALAM, kedalaman))
  const l = KEDALAMAN[lapisan]
  if (l >= d) return 1
  const jarak = d - l
  return Math.max(0.06, 1 - jarak * 0.55)
}

/**
 * Apakah satu lapisan masih layak dirender sama sekali.
 *
 * Ambangnya harus DI BAWAH batas bawah keburaman, bukan di atasnya: kalau
 * tidak, lapisan terluar yang sengaja disisakan samar justru ikut dibuang —
 * persis kebalikan dari aturan yang ditulis di atas.
 */
export const terlihat = (lapisan: KunciLapisan, kedalaman: number) => keburaman(lapisan, kedalaman) > 0.05

// ── Pembukaan (explode) ─────────────────────────────────────────────────────

export interface Titik3 { x: number; y: number; z: number }

/**
 * Pergeseran satu struktur saat tubuh "dibuka".
 *
 * Arahnya RADIAL terhadap sumbu tubuh (sumbu Y), bukan menjauhi satu titik
 * pusat. Kalau dipakai titik pusat, kepala akan terbang ke atas dan kaki ke
 * bawah sehingga tubuhnya memanjang seperti karet — yang dibutuhkan justru
 * kebalikannya: lapisan terbuka ke samping seperti buku, ketinggian tetap,
 * sehingga hubungan atas-bawah antar struktur tidak berubah.
 *
 * Struktur yang duduk hampir tepat di sumbu (aorta, trakea, vertebra) hampir
 * tidak bergeser, dan itu benar: mereka memang tidak punya sisi.
 */
export function geserBuka(
  pusatStruktur: Titik3, pusatTubuh: Titik3, jumlah: number, kedalamanLapisan = 0,
): Titik3 {
  const j = Math.max(0, jumlah)
  const dx = pusatStruktur.x - pusatTubuh.x
  const dz = pusatStruktur.z - pusatTubuh.z
  const jarak = Math.hypot(dx, dz)
  // Lapisan luar bergeser lebih jauh daripada lapisan dalam, sehingga yang
  // terbuka adalah lapisannya — bukan seluruh tubuh yang meledak seragam.
  const bobot = 1 - (kedalamanLapisan / (LAPISAN_TERDALAM + 1)) * 0.6
  if (jarak < 1e-6) return { x: 0, y: 0, z: 0 }
  return { x: (dx / jarak) * j * bobot, y: 0, z: (dz / jarak) * j * bobot }
}

// ── Wilayah tubuh ───────────────────────────────────────────────────────────

export interface Wilayah {
  kunci: string
  label: string
  /** Rentang tinggi ternormalkan 0 (kaki) sampai 1 (puncak kepala). */
  y: [number, number]
  /** Kalau ada, wilayah ini juga dibatasi jarak dari sumbu tubuh. */
  radialMinimal?: number
}

export const WILAYAH: Wilayah[] = [
  { kunci: 'kepala', label: 'Head', y: [0.88, 1] },
  { kunci: 'leher', label: 'Neck', y: [0.82, 0.89] },
  { kunci: 'toraks', label: 'Thorax', y: [0.66, 0.83] },
  { kunci: 'abdomen', label: 'Abdomen', y: [0.55, 0.67] },
  { kunci: 'pelvis', label: 'Pelvis & perineum', y: [0.46, 0.56] },
  { kunci: 'bahu-lengan', label: 'Shoulder & arm', y: [0.6, 0.85], radialMinimal: 0.12 },
  { kunci: 'tangan', label: 'Forearm & hand', y: [0.4, 0.62], radialMinimal: 0.16 },
  { kunci: 'paha', label: 'Hip & thigh', y: [0.28, 0.5] },
  { kunci: 'tungkai', label: 'Leg & foot', y: [0, 0.3] },
]

export function wilayahDari(kunci: string): Wilayah | undefined {
  return WILAYAH.find((w) => w.kunci === kunci)
}

/** Apakah satu titik (dalam koordinat ternormalkan) masuk wilayah tersebut. */
export function didalamWilayah(w: Wilayah, yNorm: number, radialNorm = 0): boolean {
  if (yNorm < w.y[0] || yNorm > w.y[1]) return false
  if (w.radialMinimal != null && radialNorm < w.radialMinimal) return false
  return true
}

// ── Urutan lapisan nyata ────────────────────────────────────────────────────

export interface Lapis {
  nama: string
  /** Apa yang penting diketahui tentang lapisan ini saat menembusnya. */
  catatan: string
  /** Struktur yang bisa cedera tepat di lapisan ini. */
  bahaya?: string[]
}

export interface UrutanLapisan {
  kunci: string
  wilayah: string
  judul: string
  /** Di mana sayatannya, dengan patokan yang bisa diraba. */
  patokan: string
  lapis: Lapis[]
  sumber: string
}

// Urutan ini adalah inti berkas: yang dihafal seseorang sebelum masuk kamar
// operasi bukan daftar organ, melainkan apa yang ada tepat di bawah apa.
export const URUTAN: UrutanLapisan[] = [
  {
    kunci: 'dinding-perut-anterior',
    wilayah: 'abdomen',
    judul: 'Anterior abdominal wall (paramedian, below arcuate line)',
    patokan: 'Midline between xiphoid and pubic symphysis; the arcuate line lies about midway between umbilicus and pubis',
    lapis: [
      { nama: 'Skin', catatan: 'Langer lines run transversely here — a transverse incision heals with a finer scar than a vertical one' },
      { nama: 'Camper fascia (fatty layer)', catatan: 'Superficial fatty layer; thickness varies enormously between people and is the main determinant of wound depth' },
      { nama: 'Scarpa fascia (membranous layer)', catatan: 'Membranous layer; continues into the perineum as Colles fascia, which is why extravasated urine tracks into the scrotum and not down the thigh' },
      { nama: 'External oblique aponeurosis', catatan: 'Fibres run inferomedially — "hands in pockets"' },
      { nama: 'Internal oblique', catatan: 'Fibres run at right angles to external oblique', bahaya: ['Iliohypogastric nerve', 'Ilioinguinal nerve'] },
      { nama: 'Transversus abdominis', catatan: 'The neurovascular plane lies between internal oblique and transversus — this is the plane a TAP block fills', bahaya: ['Segmental nerves T7–L1'] },
      { nama: 'Transversalis fascia', catatan: 'Below the arcuate line all three aponeuroses pass in front of rectus, so only this fascia lies behind it' },
      { nama: 'Extraperitoneal fat', catatan: 'Where the inferior epigastric vessels run — the vessel injured by a careless lateral port' , bahaya: ['Inferior epigastric artery']},
      { nama: 'Parietal peritoneum', catatan: 'Somatically innervated: this is the layer whose irritation gives localised, pointing pain' },
    ],
    sumber: 'Skandalakis Surgical Anatomy; Gray’s Anatomy 42nd ed.',
  },
  {
    kunci: 'terowongan-karpal',
    wilayah: 'tangan',
    judul: 'Carpal tunnel release (open)',
    patokan: 'Incision in line with the radial border of the ring finger, ulnar to the thenar crease, staying distal to the wrist crease',
    lapis: [
      { nama: 'Skin', catatan: 'Kept ulnar to the thenar crease specifically to avoid the recurrent motor branch' },
      { nama: 'Subcutaneous fat', catatan: 'The palmar cutaneous branch of the median nerve crosses here', bahaya: ['Palmar cutaneous branch of median nerve'] },
      { nama: 'Palmar aponeurosis', catatan: 'Continuous with palmaris longus tendon when that muscle is present (absent in ~15%)' },
      { nama: 'Transverse carpal ligament (flexor retinaculum)', catatan: 'The structure actually divided; released along its ulnar edge', bahaya: ['Recurrent motor branch of median nerve', 'Superficial palmar arch'] },
      { nama: 'Carpal tunnel contents', catatan: 'Median nerve lies most superficial, immediately under the ligament, with nine flexor tendons deep to it', bahaya: ['Median nerve'] },
    ],
    sumber: 'Green’s Operative Hand Surgery',
  },
  {
    kunci: 'lutut-medial-parapatelar',
    wilayah: 'paha',
    judul: 'Knee: medial parapatellar approach',
    patokan: 'Midline longitudinal incision from 5 cm proximal to the patella to the medial side of the tibial tubercle',
    lapis: [
      { nama: 'Skin', catatan: 'The infrapatellar branch of the saphenous nerve crosses transversely — numbness lateral to the scar is expected and should be warned about', bahaya: ['Infrapatellar branch of saphenous nerve'] },
      { nama: 'Subcutaneous tissue and prepatellar bursa', catatan: 'Thin here; flap necrosis follows from raising flaps too superficially' },
      { nama: 'Quadriceps tendon and medial retinaculum', catatan: 'Arthrotomy leaves a 3–5 mm cuff of tendon medially for closure' },
      { nama: 'Synovium and joint capsule', catatan: 'Entering the joint proper' },
      { nama: 'Fat pad, menisci, cruciates', catatan: 'The infrapatellar fat pad is retracted, not excised, in most approaches', bahaya: ['Popliteal artery (posterior, at risk with over-vigorous posterior retraction)'] },
    ],
    sumber: 'Hoppenfeld, Surgical Exposures in Orthopaedics',
  },
  {
    kunci: 'kandung-empedu',
    wilayah: 'abdomen',
    judul: 'Laparoscopic cholecystectomy — the critical view of safety',
    patokan: 'Umbilical camera port; epigastric and two right subcostal working ports',
    lapis: [
      { nama: 'Skin and subcutaneous tissue at each port', catatan: 'Port placement follows the "baseball diamond" so instruments do not fight each other' },
      { nama: 'Anterior rectus sheath / linea alba', catatan: 'The umbilical port passes through the thinnest, least vascular point of the wall' },
      { nama: 'Peritoneum', catatan: 'Pneumoperitoneum lifts the wall away from bowel before the first trocar' },
      { nama: 'Peritoneum over Calot triangle', catatan: 'Bounded by the cystic duct, common hepatic duct, and inferior liver edge' },
      {
        nama: 'Critical view of safety',
        catatan: 'Two and only two structures entering the gallbladder, the lower third of the gallbladder separated from the cystic plate, and the hepatocystic triangle cleared. Nothing is clipped before this view is achieved.',
        bahaya: ['Common bile duct', 'Right hepatic artery', 'Aberrant right posterior sectoral duct'],
      },
    ],
    sumber: 'Strasberg SM. Critical view of safety; SAGES Safe Cholecystectomy Program',
  },
  {
    kunci: 'hernia-inguinal',
    wilayah: 'pelvis',
    judul: 'Open inguinal hernia repair',
    patokan: 'Oblique incision 2 cm above and parallel to the medial two-thirds of the inguinal ligament',
    lapis: [
      { nama: 'Skin', catatan: 'Incision follows the skin crease' },
      { nama: 'Camper and Scarpa fascia', catatan: 'Superficial epigastric vessels run here' },
      { nama: 'External oblique aponeurosis', catatan: 'Opened along its fibres through the superficial ring', bahaya: ['Ilioinguinal nerve — lies immediately beneath, on the cord'] },
      { nama: 'Spermatic cord / round ligament', catatan: 'Cord contents: vas, three arteries, pampiniform plexus, genital branch of genitofemoral nerve, lymphatics', bahaya: ['Vas deferens', 'Testicular artery'] },
      { nama: 'Cremasteric fascia and internal spermatic fascia', catatan: 'Where an indirect sac is found, anteromedial to the cord' },
      { nama: 'Transversalis fascia / Hesselbach triangle floor', catatan: 'Medial to the inferior epigastric vessels: a defect here is a direct hernia', bahaya: ['Inferior epigastric vessels'] },
    ],
    sumber: 'Skandalakis Surgical Anatomy; Lichtenstein tension-free repair',
  },
  {
    kunci: 'flap-kulit',
    wilayah: 'kepala',
    judul: 'Facial skin flap — subunit and plane',
    patokan: 'Incisions placed in relaxed skin tension lines and at aesthetic subunit borders',
    lapis: [
      { nama: 'Epidermis and dermis', catatan: 'Flap viability depends on the subdermal plexus, so dermis is never thinned at the base' },
      { nama: 'Subcutaneous fat', catatan: 'The plane most random-pattern flaps are raised in' },
      { nama: 'SMAS (superficial musculoaponeurotic system)', catatan: 'Continuous with platysma below and galea above; the layer that carries tension so that skin does not' },
      { nama: 'Facial nerve branches (deep to SMAS)', catatan: 'Branches run deep to SMAS until they pierce their target muscles from the undersurface — which is why dissection stays superficial to it', bahaya: ['Temporal branch of facial nerve', 'Marginal mandibular branch'] },
      { nama: 'Periosteum / deep fascia', catatan: 'The plane for a deeper composite flap' },
    ],
    sumber: 'Grabb and Smith’s Plastic Surgery',
  },
  {
    kunci: 'toraks-lateral',
    wilayah: 'toraks',
    judul: 'Chest drain — the safe triangle',
    patokan: 'Triangle bounded by the lateral border of pectoralis major, the anterior border of latissimus dorsi, and a line at the level of the nipple; 4th–5th intercostal space',
    lapis: [
      { nama: 'Skin', catatan: 'Incision over the rib below the intended space' },
      { nama: 'Subcutaneous tissue', catatan: 'Blunt dissection only, from here inward' },
      { nama: 'Serratus anterior / intercostal muscles', catatan: 'The tube passes just ABOVE the upper border of the rib', bahaya: ['Intercostal vein, artery and nerve — they run in the groove on the LOWER border of each rib'] },
      { nama: 'Parietal pleura', catatan: 'Punctured bluntly; a rush of air or fluid confirms entry' },
      { nama: 'Pleural cavity', catatan: 'Finger sweep before insertion confirms the lung is not adherent', bahaya: ['Lung', 'Diaphragm and liver if placed too low'] },
    ],
    sumber: 'BTS pleural disease guideline; Gray’s Anatomy 42nd ed.',
  },
]

export function urutanUntukWilayah(wilayah: string): UrutanLapisan[] {
  return URUTAN.filter((u) => u.wilayah === wilayah)
}
export function urutanDari(kunci: string): UrutanLapisan | undefined {
  return URUTAN.find((u) => u.kunci === kunci)
}

/** Semua struktur yang pernah disebut berisiko, tanpa pengulangan. */
export function strukturBerisiko(): string[] {
  const set = new Set<string>()
  for (const u of URUTAN) for (const l of u.lapis) for (const b of l.bahaya ?? []) set.add(b)
  return [...set].sort()
}
