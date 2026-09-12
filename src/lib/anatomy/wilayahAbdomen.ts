// Sembilan wilayah abdomen sebagai objek yang bisa DITUNJUK, bukan istilah.
//
// "Nyeri di hipokondrium kanan" adalah bahasa kerja klinis sehari-hari, dan
// selama ini aplikasi ini hanya memakai istilahnya sebagai teks. surface.glb
// ternyata mengirim wilayah-wilayah itu sebagai mesh tersendiri, jadi istilah
// itu bisa ditunjukkan pada tubuh alih-alih dihafal dari gambar buku.
//
// DUA JEBAKAN yang ditangani di sini secara eksplisit:
//
//   1. Wilayah garis tengah dikirim TERBELAH kiri dan kanan. Epigastrium adalah
//      satu wilayah klinis, tetapi dua mesh. Memakai satu sisi saja akan
//      menyalakan separuh perut dan terlihat seperti sudah benar.
//
//   2. Berkas ini juga mengirim "Lumbar region", dan itu wilayah PUNGGUNG,
//      bukan pinggang depan. Wilayah lateral abdomen -- yang dalam skema
//      sembilan-wilayah sering disebut regio lumbalis -- dikirim dengan nama
//      "Lateral region of abdomen". Menukar keduanya akan menyalakan punggung
//      ketika yang dimaksud perut, dan tidak ada yang akan melihatnya sebagai
//      galat.
//
// BATAS: proyeksi di bawah adalah anatomi permukaan, yaitu struktur apa yang
// TERLETAK di belakang dinding perut pada wilayah itu pada orang dewasa
// bertubuh rata-rata. Ia bukan daftar penyebab nyeri, bukan diagnosis banding,
// dan tidak menyimpulkan apa pun tentang siapa pun. Nyeri tidak tunduk pada
// peta ini: nyeri viseral dirujuk jauh dari organnya, dan organ bergerak
// dengan napas, postur dan habitus.

export interface WilayahAbdomen {
  id: string
  /** Nama klinis dalam bahasa Inggris. */
  label: string
  /** Baris dalam kisi tiga-kali-tiga, dari atas. */
  baris: 'atas' | 'tengah' | 'bawah'
  /** Kolom dilihat dari DEPAN pasien: kanan pasien di kiri gambar. */
  kolom: 'kanan' | 'tengah' | 'kiri'
  /** Nama node persis seperti di surface.glb. */
  mesh: readonly string[]
  /** Struktur yang terletak di belakang dinding perut di wilayah ini. */
  proyeksi: readonly string[]
}

export const BERKAS_PERMUKAAN = 'anatomy/surface.glb'

/**
 * Skema sembilan wilayah.
 *
 * Wilayah garis tengah (epigastrium, umbilikal, hipogastrium) menggabungkan
 * mesh kiri dan kanan karena secara klinis ia SATU wilayah.
 */
export const WILAYAH_ABDOMEN: readonly WilayahAbdomen[] = [
  {
    id: 'hypochondriac-right', label: 'Right hypochondriac', baris: 'atas', kolom: 'kanan',
    mesh: ['Hypochondriac region.r'],
    proyeksi: ['Right lobe of liver', 'Gallbladder', 'Right colic flexure', 'Upper pole of right kidney'],
  },
  {
    id: 'epigastric', label: 'Epigastric', baris: 'atas', kolom: 'tengah',
    mesh: ['Epigastric region.l', 'Epigastric region.r'],
    proyeksi: ['Stomach', 'Left lobe of liver', 'Pancreas', 'Duodenum', 'Abdominal aorta', 'Coeliac trunk'],
  },
  {
    id: 'hypochondriac-left', label: 'Left hypochondriac', baris: 'atas', kolom: 'kiri',
    mesh: ['Hypochondriac region.l'],
    proyeksi: ['Spleen', 'Fundus of stomach', 'Tail of pancreas', 'Left colic flexure', 'Upper pole of left kidney'],
  },
  {
    // "Lateral region of abdomen", BUKAN "Lumbar region" -- yang terakhir itu punggung.
    id: 'lateral-right', label: 'Right lateral (lumbar)', baris: 'tengah', kolom: 'kanan',
    mesh: ['Lateral region of abdomen.r'],
    proyeksi: ['Ascending colon', 'Right kidney', 'Right ureter', 'Coils of small intestine'],
  },
  {
    id: 'umbilical', label: 'Umbilical', baris: 'tengah', kolom: 'tengah',
    mesh: ['Umbilicus.l', 'Umbilicus.r'],
    proyeksi: ['Transverse colon', 'Coils of jejunum and ileum', 'Abdominal aorta', 'Inferior vena cava', 'Root of mesentery'],
  },
  {
    id: 'lateral-left', label: 'Left lateral (lumbar)', baris: 'tengah', kolom: 'kiri',
    mesh: ['Lateral region of abdomen.l'],
    proyeksi: ['Descending colon', 'Left kidney', 'Left ureter', 'Coils of small intestine'],
  },
  {
    id: 'inguinal-right', label: 'Right inguinal (iliac)', baris: 'bawah', kolom: 'kanan',
    mesh: ['Inguinal region.r'],
    proyeksi: ['Caecum', 'Vermiform appendix', 'Terminal ileum', 'Right ovary or spermatic cord'],
  },
  {
    id: 'hypogastric', label: 'Hypogastric (suprapubic)', baris: 'bawah', kolom: 'tengah',
    mesh: ['Hypogastric region.l', 'Hypogastric region.r'],
    proyeksi: ['Urinary bladder when distended', 'Sigmoid colon', 'Uterus when enlarged', 'Loops of ileum'],
  },
  {
    id: 'inguinal-left', label: 'Left inguinal (iliac)', baris: 'bawah', kolom: 'kiri',
    mesh: ['Inguinal region.l'],
    proyeksi: ['Sigmoid colon', 'Descending colon junction', 'Left ovary or spermatic cord', 'Loops of ileum'],
  },
] as const

/**
 * Wilayah PUNGGUNG yang namanya mudah tertukar dengan wilayah abdomen.
 *
 * Disebut di sini bukan untuk digambar, melainkan supaya ujinya bisa
 * membuktikan tidak satu pun dari nama ini dipakai sebagai wilayah perut.
 */
export const MESH_PUNGGUNG_MIRIP: readonly string[] = [
  'Lumbar region.l', 'Lumbar region.r', 'Sacral region.l', 'Sacral region.r',
] as const

/** Lihat `bronkusSegmental.ts`: aturan sanitasi nama GLTFLoader berbeda antar versi. */
export function kunciNama(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Kunci DASAR sebuah mesh: tanpa sisi, tanpa nomor pecahan.
 *
 * Ini bukan kenyamanan, melainkan keharusan. GLTFLoader menyanitasi nama dan
 * membuang tanda titik, sehingga "Hypochondriac region.l" dan "Hypochondriac
 * region.r" TIBA DI SCENE DENGAN NAMA YANG SAMA, "Hypochondriac_region", lalu
 * dibedakan hanya oleh akhiran angka yang urutannya tidak dijamin apa pun.
 *
 * Artinya sisi TIDAK BISA dipulihkan dari nama. Menebaknya dari akhiran angka
 * akan menyalakan hipokondrium kiri ketika yang dimaksud kanan -- limpa di
 * tempat hati -- dan gambarnya akan tetap terlihat benar.
 */
export function kunciDasar(nama: string): string {
  return kunciNama(nama.replace(/_\d+$/, '').replace(/\.[lr]$/, ''))
}

/**
 * Tanda koordinat X untuk sisi KANAN pasien.
 *
 * Diturunkan dari berkasnya sendiri, bukan diandaikan: setiap simpul ".r" di
 * surface.glb duduk pada X negatif dan pasangan ".l"-nya pada X positif.
 * `wilayah-abdomen.mts` memeriksa itu untuk SEMUA pasangan, jadi kalau atlas
 * suatu hari dicerminkan, gerbangnya gagal alih-alih diam-diam menukar sisi.
 */
export const TANDA_X_KANAN = -1

export function sisiDariX(x: number): 'kanan' | 'kiri' {
  return Math.sign(x) === TANDA_X_KANAN ? 'kanan' : 'kiri'
}

export function wilayahUntuk(id: string): WilayahAbdomen | undefined {
  return WILAYAH_ABDOMEN.find((w) => w.id === id)
}

/**
 * Cari wilayah dari nama mesh scene DAN posisi X dunianya.
 *
 * Wilayah garis tengah ditentukan oleh namanya saja; wilayah berpasangan
 * menuntut posisi, karena namanya sudah kehilangan sisinya.
 */
export function wilayahDariMesh(nama: string, x: number): string | undefined {
  const dasar = kunciDasar(nama)
  const sesuai = WILAYAH_ABDOMEN.filter((w) => w.mesh.some((n) => kunciDasar(n) === dasar))
  if (sesuai.length === 0) return undefined
  if (sesuai.length === 1) return sesuai[0].id
  const sisi = sisiDariX(x)
  return sesuai.find((w) => w.kolom === sisi)?.id
}

/** Peta kunci dasar -> wilayah yang memakainya, untuk uji dan penelusuran. */
export function petaDasarKeWilayah(): Map<string, string[]> {
  const peta = new Map<string, string[]>()
  for (const w of WILAYAH_ABDOMEN) {
    for (const nama of w.mesh) {
      const k = kunciDasar(nama)
      const ada = peta.get(k) ?? []
      // Wilayah garis tengah menyumbang dua mesh yang berbagi satu nama dasar;
      // yang menarik adalah berapa WILAYAH yang memakainya, bukan berapa mesh.
      if (!ada.includes(w.id)) peta.set(k, [...ada, w.id])
      else peta.set(k, ada)
    }
  }
  return peta
}
