// Kelenjar endokrin dan saluran kemih sebagai benda yang bisa DITUNJUK.
//
// Selama ini kedua sistem ini hanya hidup sebagai paragraf. Atlasnya sudah
// mengirim keduanya sebagai mesh tersendiri, jadi "hipofisis" bisa ditunjukkan
// pada tubuh alih-alih dibayangkan dari gambar buku.
//
// EMPAT JEBAKAN berkas ini, masing-masing sudah pernah menghasilkan gambar yang
// meyakinkan tetapi salah, TANPA satu pun galat dilempar:
//
//   1. Hipofisis TIDAK pernah disebut "pituitary" di atlas ini. Namanya
//      "Adenohypophysis" dan "Neurohypophysis". Mengikat "Pituitary gland"
//      akan cocok dengan nol mesh dan diam saja.
//
//   2. Hipotalamus TIDAK ada di visceral.glb. Ia hanya dikirim oleh
//      nervous.glb. Panel ini karena itu harus memuat DUA berkas.
//
//   3. Sebagian simpul bernama TIDAK membawa mesh sendiri: geometrinya
//      digantung pada satu anak TANPA NAMA. "Kidney.l" membawa meshnya
//      langsung, tetapi "Kidney.r", "Thyroid gland", "Urinary bladder",
//      "Pancreas", "Adenohypophysis", "Neurohypophysis" dan
//      "Suprarenal gland.r" tidak. Uji keberadaan nama saja akan lulus
//      sementara layarnya kosong. Sisa anak lain (".j"/".t") adalah simpul
//      penanda tanpa geometri sama sekali.
//
//   4. GLTFLoader MEMBERSIHKAN nama simpul: titik dibuang, sehingga
//      "Kidney.l" dan "Kidney.r" tiba di scene dengan nama yang sama dan
//      dibedakan hanya oleh akhiran angka yang urutannya tidak dijamin.
//      Sisi karena itu TIDAK BOLEH dibaca dari nama scene; nama asli
//      dipulihkan lewat gltf.parser.associations.
//
// BATAS KLINIS: sekresi dan peran di bawah adalah fisiologi baku, dan tidak
// lebih dari itu. Tidak ada dosis, tidak ada rentang rujukan, tidak ada
// diagnosis, dan tidak ada yang disimpulkan tentang tubuh siapa pun. Atlas ini
// adalah satu tubuh rujukan dewasa; letak dan ukuran organ berbeda antar orang.

export const BERKAS_VISCERAL = 'anatomy/visceral.glb'
export const BERKAS_NERVOUS = 'anatomy/nervous.glb'

export type BerkasSumber = typeof BERKAS_VISCERAL | typeof BERKAS_NERVOUS

export type SistemKelenjar = 'endocrine' | 'urinary'

export interface StrukturKelenjar {
  id: string
  /** Nama dalam bahasa Inggris, seperti yang dibaca pengguna. */
  label: string
  sistem: SistemKelenjar
  /** Berkas atlas yang benar-benar mengirim geometri ini. */
  berkas: BerkasSumber
  /** Nama simpul PERSIS seperti di berkasnya, sebelum dibersihkan loader. */
  mesh: readonly string[]
  /** Di mana ia berada pada tubuh. */
  letak: string
  /**
   * Endokrin: sekresi utamanya. Urinari: perannya pada jalur kemih.
   * Fisiologi baku saja — tanpa angka, ambang, atau saran tindakan.
   */
  peran: readonly string[]
  /** Urutan pada jalur kemih, dari pembentukan urin ke luar tubuh. */
  urutanKemih?: number
}

export const STRUKTUR_KELENJAR: readonly StrukturKelenjar[] = [
  {
    id: 'hypothalamus',
    label: 'Hypothalamus',
    sistem: 'endocrine',
    // Satu-satunya struktur panel ini yang TIDAK dikirim visceral.glb.
    berkas: BERKAS_NERVOUS,
    mesh: ['Hypothalamus'],
    letak: 'In the floor and lower walls of the third ventricle, above the pituitary and behind the optic chiasm.',
    peran: [
      'Releasing and inhibiting hormones that travel to the anterior pituitary in the portal vessels — GnRH, TRH, CRH, GHRH',
      'Somatostatin and dopamine, which restrain growth hormone and prolactin release',
      'Oxytocin and vasopressin (antidiuretic hormone), made here and carried down the stalk for release from the posterior pituitary',
    ],
  },
  {
    id: 'adenohypophysis',
    label: 'Anterior pituitary (adenohypophysis)',
    sistem: 'endocrine',
    berkas: BERKAS_VISCERAL,
    // Bukan "Pituitary gland" — nama itu tidak ada di atlas ini.
    mesh: ['Adenohypophysis'],
    letak: 'In the hypophysial fossa of the sella turcica, at the base of the skull, joined to the hypothalamus by the stalk.',
    peran: [
      'Growth hormone',
      'Thyroid-stimulating hormone',
      'Adrenocorticotropic hormone',
      'Follicle-stimulating hormone and luteinising hormone',
      'Prolactin',
    ],
  },
  {
    id: 'neurohypophysis',
    label: 'Posterior pituitary (neurohypophysis)',
    sistem: 'endocrine',
    berkas: BERKAS_VISCERAL,
    mesh: ['Neurohypophysis'],
    letak: 'Behind the anterior lobe in the same fossa; it is nervous tissue continuous with the hypothalamus through the infundibular stalk.',
    peran: [
      'Vasopressin (antidiuretic hormone) — released here, made in the hypothalamus',
      'Oxytocin — released here, made in the hypothalamus',
      'It synthesises no hormone of its own: it stores and releases what the hypothalamus sends down',
    ],
  },
  {
    id: 'pineal',
    label: 'Pineal gland',
    sistem: 'endocrine',
    berkas: BERKAS_VISCERAL,
    mesh: ['Pineal gland'],
    letak: 'On the roof of the third ventricle, behind and above the thalamus, in the midline.',
    peran: ['Melatonin, released on a day–night rhythm'],
  },
  {
    id: 'thyroid',
    label: 'Thyroid gland',
    sistem: 'endocrine',
    berkas: BERKAS_VISCERAL,
    mesh: ['Thyroid gland'],
    letak: 'In front of the trachea just below the larynx; two lobes joined across the midline by the isthmus.',
    peran: [
      'Thyroxine (T4) and triiodothyronine (T3) from the follicular cells',
      'Calcitonin from the parafollicular (C) cells',
    ],
  },
  {
    id: 'parathyroid',
    label: 'Parathyroid glands',
    sistem: 'endocrine',
    berkas: BERKAS_VISCERAL,
    // Empat kelenjar, empat mesh: superior dan inferior pada kedua sisi.
    mesh: [
      'Superior parathyroid gland.l', 'Superior parathyroid gland.r',
      'Inferior parathyroid gland.l', 'Inferior parathyroid gland.r',
    ],
    letak: 'Usually four small glands on the back of the thyroid lobes, a superior and an inferior pair. Their number and position vary between people.',
    peran: ['Parathyroid hormone, the principal regulator of calcium handling'],
  },
  {
    id: 'suprarenal',
    label: 'Adrenal (suprarenal) glands',
    sistem: 'endocrine',
    berkas: BERKAS_VISCERAL,
    mesh: ['Suprarenal gland.l', 'Suprarenal gland.r'],
    letak: 'One capping the upper pole of each kidney, behind the peritoneum.',
    peran: [
      'Cortex: cortisol, aldosterone and adrenal androgens',
      'Medulla: adrenaline and noradrenaline',
    ],
  },
  {
    id: 'pancreas',
    label: 'Pancreas (endocrine part)',
    sistem: 'endocrine',
    berkas: BERKAS_VISCERAL,
    mesh: ['Pancreas'],
    letak: 'Behind the stomach, its head in the curve of the duodenum and its tail reaching the spleen.',
    peran: [
      'Insulin from the beta cells of the islets',
      'Glucagon from the alpha cells',
      'Somatostatin from the delta cells',
      'Pancreatic polypeptide',
      'The bulk of the organ is exocrine and drains digestive enzymes into the duodenum',
    ],
  },
  {
    id: 'kidney',
    label: 'Kidneys',
    sistem: 'urinary',
    berkas: BERKAS_VISCERAL,
    mesh: ['Kidney.l', 'Kidney.r'],
    letak: 'Behind the peritoneum on either side of the vertebral column, the right sitting a little lower than the left.',
    peran: [
      'Filters plasma at the glomeruli and reshapes the filtrate along the tubules to form urine',
      'Sets water, electrolyte and acid–base balance',
      'Also endocrine: erythropoietin, renin, and the final activation of vitamin D',
    ],
    urutanKemih: 1,
  },
  {
    id: 'renal-pelvis',
    label: 'Renal pelvis',
    sistem: 'urinary',
    berkas: BERKAS_VISCERAL,
    mesh: ['Renal pelvis.l', 'Renal pelvis.r'],
    letak: 'In the renal sinus at the hilum of each kidney, funnelling into the ureter.',
    peran: ['Gathers urine from the calyces and hands it to the ureter'],
    urutanKemih: 2,
  },
  {
    id: 'ureter',
    label: 'Ureters',
    sistem: 'urinary',
    berkas: BERKAS_VISCERAL,
    mesh: ['Ureter.l', 'Ureter.r'],
    letak: 'A muscular tube on each side running down behind the peritoneum from the renal pelvis to the base of the bladder.',
    peran: ['Carries urine downwards by peristalsis; it is not a passive pipe'],
    urutanKemih: 3,
  },
  {
    id: 'bladder',
    label: 'Urinary bladder',
    sistem: 'urinary',
    berkas: BERKAS_VISCERAL,
    mesh: ['Urinary bladder'],
    letak: 'In the pelvis behind the pubic bones; it rises above them as it fills.',
    peran: [
      'Stores urine at low pressure while it fills',
      'Empties by contraction of its detrusor muscle as the sphincters relax',
    ],
    urutanKemih: 4,
  },
  {
    id: 'urethra',
    label: 'Urethra',
    sistem: 'urinary',
    berkas: BERKAS_VISCERAL,
    mesh: ['Urethra'],
    letak: 'Runs from the neck of the bladder to the outside; its length differs between male and female anatomy.',
    peran: ['Conducts urine out of the body — the last step of the urinary path'],
    urutanKemih: 5,
  },
]

/**
 * Struktur yang SENGAJA tidak diklaim, dibuktikan tidak ada oleh gerbang.
 *
 * Menyatakan ketiadaan lebih murah daripada mencerminkan geometri atau
 * menyorot tetangga untuk menutupi lubang, dan itu satu-satunya cara jujur.
 */
export const TIDAK_DIKIRIM_ATLAS: readonly { label: string; pola: string }[] = [
  { label: 'Pancreatic islets (islets of Langerhans)', pola: 'islet|langerhans' },
  { label: 'Adrenal cortex and medulla as separate layers', pola: 'adrenal' },
  { label: 'A mesh literally named "pituitary"', pola: 'pituitary' },
]

export const BERKAS_KELENJAR: readonly BerkasSumber[] = [BERKAS_VISCERAL, BERKAS_NERVOUS]

/** Semua nama mesh yang diikat oleh satu berkas sumber. */
export function meshBerkas(berkas: BerkasSumber): string[] {
  return STRUKTUR_KELENJAR.filter((s) => s.berkas === berkas).flatMap((s) => [...s.mesh])
}

export function strukturUntuk(id: string): StrukturKelenjar | undefined {
  return STRUKTUR_KELENJAR.find((s) => s.id === id)
}

/**
 * Peta nama-asli -> id struktur.
 *
 * Kuncinya adalah nama PERSIS dari berkas ("Kidney.r"), bukan nama yang tiba di
 * scene. Runtime memulihkan nama asli lewat parser.associations sebelum menoleh
 * ke sini; mencocokkan nama scene akan menukar kiri dan kanan tanpa galat.
 */
export function petaMeshKeStruktur(): Map<string, string> {
  const peta = new Map<string, string>()
  for (const s of STRUKTUR_KELENJAR) for (const m of s.mesh) peta.set(m, s.id)
  return peta
}

/** Jalur kemih berurutan, dari pembentukan urin sampai keluar tubuh. */
export function jalurKemih(): StrukturKelenjar[] {
  return STRUKTUR_KELENJAR
    .filter((s) => s.sistem === 'urinary')
    .sort((a, b) => (a.urutanKemih ?? 0) - (b.urutanKemih ?? 0))
}
