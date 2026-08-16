// ─────────────────────────────────────────────────────────────────────────────
// Kata yang DIKETIK ORANG berbanding nama resmi pada daftar SKDI.
//
// CACAT YANG MELAHIRKAN BERKAS INI. Pemakai mengetik "Gout" pada Daftar
// Penyakit dan memperoleh "Tidak ada hasil". Dua sebab yang berbeda:
//
//   1. GOUT MEMANG TIDAK ADA di daftar — itu kekurangan data, dan sudah
//      ditambahkan ke skdiDiseaseList.ts.
//
//   2. Sebagian besar sisanya ADA tetapi dengan ejaan atau istilah lain.
//      Daftar SKDI memakai 'Migren', 'Pterigium', 'Lepra', 'Apendisitis',
//      'Infark serebral', 'Fibrilasi atrial'; yang diketik orang — dan yang
//      dipakai di rekap ujian serta di catatan stasiun — adalah 'Migrain',
//      'Pterygium', 'Kusta', 'Appendisitis', 'Stroke', 'Atrial fibrilasi'.
//      Pencariannya hanya mencocokkan huruf, sehingga tidak satu pun ketemu.
//
// Bagi yang mencari, keduanya terasa sama: penyakitnya seolah tidak ada di
// aplikasi ini. Dan justru pada penyakit yang PALING SERING dicari — stroke,
// appendisitis, gout — kegagalan itu paling merusak kepercayaan.
//
// MENGAPA TABEL, BUKAN PENCOCOKAN LONGGAR. Pencocokan longgar pernah
// menautkan 'Transient Ischemic Attack' ke 'Transient tics disorder'. Pada
// halaman pencarian, kekeliruan semacam itu berarti seseorang membuka penyakit
// yang salah tanpa menyadarinya. Tabel ini kecil dan tiap barisnya dapat
// diperiksa dengan mata.
//
// ARAHNYA: kata yang diketik  ->  kata yang harus ikut dicocokkan.
// ─────────────────────────────────────────────────────────────────────────────

export const SINONIM_PENYAKIT: Record<string, string[]> = {
  // Ejaan Indonesia berbanding ejaan Inggris
  migrain: ['migren'],
  migraine: ['migren'],
  pterygium: ['pterigium'],
  appendisitis: ['apendisitis'],
  apendisitis: ['apendisitis'],
  'usus buntu': ['apendisitis'],
  kolesistitis: ['kolesistitis'],
  hemoroid: ['hemoroid', 'wasir'],
  wasir: ['hemoroid'],

  // Nama umum berbanding nama resmi
  kusta: ['lepra'],
  'morbus hansen': ['lepra'],
  lepra: ['lepra'],
  stroke: ['infark serebral', 'hematom intraserebral', 'perdarahan subarakhnoid'],
  'stroke iskemik': ['infark serebral'],
  'stroke hemoragik': ['hematom intraserebral', 'perdarahan subarakhnoid'],
  'atrial fibrilasi': ['fibrilasi atrial'],
  'fibrilasi atrium': ['fibrilasi atrial'],
  af: ['fibrilasi atrial'],
  'fibrilasi ventrikel': ['fibrilasi ventrikular'],
  vf: ['fibrilasi ventrikular'],
  ves: ['ekstrasistol', 'ventrikular'],
  ppok: ['emfisema paru', 'bronkitis'],
  copd: ['emfisema paru'],
  hnp: ['hernia nukleus pulposus'],
  'low back pain': ['hernia nukleus pulposus', 'nyeri punggung'],
  lbp: ['hernia nukleus pulposus'],
  tbc: ['tuberkulosis'],
  tb: ['tuberkulosis'],
  'kencing manis': ['diabetes'],
  'darah tinggi': ['hipertensi'],
  'sakit kuning': ['hepatitis'],
  cacar: ['varisela'],
  campak: ['morbili', 'campak'],
  gondongan: ['parotitis'],
  'demam berdarah': ['dengue'],
  dbd: ['dengue'],
  tipes: ['tifoid'],
  tifus: ['tifoid'],
  ispa: ['infeksi saluran napas'],
  isk: ['infeksi saluran kemih'],

  // Yang dipakai rekap ujian
  gout: ['gout', 'pirai'],
  pirai: ['gout'],
  'asam urat': ['gout'],
  kandidiasis: ['kandidiasis', 'kandidosis'],
  kandidosis: ['kandidiasis'],
  candidiasis: ['kandidiasis'],
  scabies: ['skabies'],
  skabies: ['skabies'],
  'creeping eruption': ['larva migrans'],
  clm: ['larva migrans'],
}

/**
 * Kata tambahan yang harus ikut dicocokkan untuk sebuah ketikan.
 *
 * Mengembalikan larik KOSONG bila tidak ada padanan — dan itu benar; pencarian
 * lalu berjalan seperti biasa, bukan melebar ke penyakit lain.
 */
export function sinonimUntuk(ketikan: string): string[] {
  const q = ketikan.toLowerCase().trim()
  if (!q) return []
  const keluar = new Set<string>()
  for (const [kata, padanan] of Object.entries(SINONIM_PENYAKIT)) {
    if (q === kata || q.includes(kata)) padanan.forEach((p) => keluar.add(p))
  }
  return [...keluar]
}

export default SINONIM_PENYAKIT
