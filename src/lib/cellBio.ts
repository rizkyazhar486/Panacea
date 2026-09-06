// ─────────────────────────────────────────────────────────────────────────────
// SEL DAN METABOLISMENYA — organel, dan tahap biokimia yang berjalan di dalam
// masing-masing.
//
// Diagram metabolisme sangat mudah dibuat salah tanpa ketahuan, karena tidak
// ada yang menghitung ulang. Panah boleh saja berjalan ke arah yang keliru,
// jumlah karbon boleh tidak seimbang, dan hasil ATP boleh dikarang — gambarnya
// tetap terlihat seperti biokimia. Karena itu isi berkas ini disusun sebagai
// DATA yang bisa dihitung ulang: tiap tahap membawa jumlah karbon substrat dan
// produknya, kofaktornya, ΔG°', dan pembawa elektron yang dihasilkannya,
// sehingga ujinya bisa memeriksa keseimbangan karbon dan menjumlahkan ATP
// sendiri alih-alih memercayai angka yang saya tulis.
//
// Nilai ΔG°' dalam kJ/mol pada pH 7, dari Lehninger Principles of Biochemistry
// edisi ke-8 dan Berg Stryer Biochemistry edisi ke-9.
//
// Hasil ATP memakai rasio P/O modern — 2,5 ATP per NADH dan 1,5 per FADH2 —
// bukan angka bulat 3 dan 2 dari buku lama. Angka lama berasal dari zaman
// sebelum stoikiometri proton ATP sintase diketahui; memakainya sekarang
// membuat seluruh neraca meleset sekitar 20%.
// ─────────────────────────────────────────────────────────────────────────────

export type Kompartemen =
  | 'sitosol' | 'mitokondria-matriks' | 'mitokondria-membran-dalam'
  | 'retikulum-endoplasma' | 'peroksisom' | 'lisosom' | 'nukleus' | 'golgi' | 'sitoskeleton' | 'membran-plasma'

export interface Organel {
  kunci: string
  nama: string
  kompartemen: Kompartemen
  /** Perkiraan diameter atau panjang, µm. */
  ukuranUm: number
  /** Jumlah per sel tipikal; -1 bila tunggal atau jaringan menyatu. */
  jumlah: number
  membran: 0 | 1 | 2
  fungsi: string
  /** Kenapa organel ini penting secara klinis — penyakit yang muncul saat ia gagal. */
  klinis: string
  /** Jalur metabolik yang berlangsung di sini. */
  jalur: string[]
}

export const ORGANEL: Organel[] = [
  {
    kunci: 'nukleus', nama: 'Nucleus', kompartemen: 'nukleus', ukuranUm: 6, jumlah: 1, membran: 2,
    fungsi: 'Holds the genome; transcription and pre-mRNA processing happen here, translation does not',
    klinis: 'Lamin A/C mutations in the nuclear lamina cause Emery-Dreifuss muscular dystrophy and progeria — the envelope is structural, not just a wrapper',
    jalur: [],
  },
  {
    kunci: 'nukleolus', nama: 'Nucleolus', kompartemen: 'nukleus', ukuranUm: 1.5, jumlah: 2, membran: 0,
    fungsi: 'Ribosome assembly: rRNA transcription by RNA polymerase I and subunit packaging',
    klinis: 'Ribosomopathies — Diamond-Blackfan anaemia arises from ribosomal protein genes, and shows how a "housekeeping" defect can hit one lineage hardest',
    jalur: [],
  },
  {
    kunci: 'mitokondria', nama: 'Mitochondrion', kompartemen: 'mitokondria-matriks', ukuranUm: 1, jumlah: 1500, membran: 2,
    fungsi: 'Oxidative phosphorylation, TCA cycle, beta-oxidation, part of the urea cycle, and the intrinsic apoptosis switch',
    klinis: 'Maternally inherited and heteroplasmic: MELAS, LHON, MERRF. Tissues with the highest ATP demand — brain, muscle, cochlea — fail first',
    jalur: ['tca', 'etc', 'beta-oksidasi'],
  },
  {
    kunci: 'ribosom', nama: 'Ribosome', kompartemen: 'sitosol', ukuranUm: 0.025, jumlah: 10000000, membran: 0,
    fungsi: 'Translation. 80S in cytosol, 70S inside mitochondria — the reason some antibiotics reach human mitochondria at all',
    klinis: 'Aminoglycosides bind the mitochondrial 12S rRNA; the m.1555A>G variant turns a normal dose into permanent deafness',
    jalur: [],
  },
  {
    kunci: 'rer', nama: 'Rough endoplasmic reticulum', kompartemen: 'retikulum-endoplasma', ukuranUm: 10, jumlah: -1, membran: 1,
    fungsi: 'Co-translational insertion and folding of secreted and membrane proteins; N-linked glycosylation begins here',
    klinis: 'CFTR F508del folds incorrectly and is destroyed here rather than reaching the membrane — the protein is made, then thrown away',
    jalur: [],
  },
  {
    kunci: 'ser', nama: 'Smooth endoplasmic reticulum', kompartemen: 'retikulum-endoplasma', ukuranUm: 10, jumlah: -1, membran: 1,
    fungsi: 'Steroid and phospholipid synthesis, calcium storage, and cytochrome P450 drug metabolism',
    klinis: 'Ryanodine receptor mutations release stored calcium uncontrollably — malignant hyperthermia under volatile anaesthetics',
    jalur: ['ppp'],
  },
  {
    kunci: 'golgi', nama: 'Golgi apparatus', kompartemen: 'golgi', ukuranUm: 5, jumlah: -1, membran: 1,
    fungsi: 'Sorting and terminal glycosylation; adds the mannose-6-phosphate tag that routes enzymes to lysosomes',
    klinis: 'I-cell disease: without that tag, lysosomal enzymes are secreted instead of delivered, and the lysosomes fill with undigested substrate',
    jalur: [],
  },
  {
    kunci: 'lisosom', nama: 'Lysosome', kompartemen: 'lisosom', ukuranUm: 0.5, jumlah: 300, membran: 1,
    fungsi: 'Acid hydrolysis at pH 4.5–5.0, maintained by a V-type proton pump; autophagy terminates here',
    klinis: 'Storage diseases named by the missing enzyme: Tay-Sachs (hexosaminidase A), Gaucher (glucocerebrosidase), Pompe (acid maltase)',
    jalur: [],
  },
  {
    kunci: 'peroksisom', nama: 'Peroxisome', kompartemen: 'peroksisom', ukuranUm: 0.5, jumlah: 500, membran: 1,
    fungsi: 'Beta-oxidation of very-long-chain fatty acids, plasmalogen synthesis, and hydrogen peroxide disposal by catalase',
    klinis: 'Zellweger spectrum from PEX gene defects; X-linked adrenoleukodystrophy from ABCD1, where VLCFA accumulate in brain and adrenal',
    jalur: ['beta-oksidasi'],
  },
  {
    kunci: 'sitoskeleton', nama: 'Cytoskeleton', kompartemen: 'sitoskeleton', ukuranUm: 0.025, jumlah: -1, membran: 0,
    fungsi: 'Microtubules, actin and intermediate filaments — shape, transport, mitotic spindle and cell motility',
    klinis: 'Vinca alkaloids block polymerisation and taxanes block depolymerisation; both stop mitosis, and both give peripheral neuropathy because axons run on the same tracks',
    jalur: [],
  },
  {
    kunci: 'membran', nama: 'Plasma membrane', kompartemen: 'membran-plasma', ukuranUm: 0.008, jumlah: 1, membran: 1,
    fungsi: 'Selective barrier; the Na+/K+ ATPase alone consumes roughly a quarter of resting cellular ATP',
    klinis: 'Digoxin inhibits that pump; spectrin and ankyrin defects give hereditary spherocytosis, where the membrane cannot hold its shape',
    jalur: [],
  },
]

// ── Tahap biokimia ──────────────────────────────────────────────────────────

export interface Tahap {
  nomor: number
  enzim: string
  substrat: string
  produk: string
  /** Jumlah atom karbon substrat dan produk utama, untuk memeriksa keseimbangan. */
  karbonMasuk: number
  karbonKeluar: number
  /** ΔG°' kJ/mol pada pH 7. */
  deltaG: number
  /** Tahap yang secara fisiologis tak terbalikkan — inilah titik pengaturan. */
  takTerbalikkan: boolean
  kofaktor: string[]
  /** ATP yang dipakai (negatif) atau dihasilkan langsung (positif) di tahap ini. */
  atp: number
  nadh: number
  fadh2: number
  gtp?: number
  co2?: number
  pengaturan?: string
  klinis?: string
}

export interface Jalur {
  kunci: string
  nama: string
  kompartemen: Kompartemen
  masukan: string
  keluaran: string
  tahap: Tahap[]
  ringkas: string
}

const GLIKOLISIS: Tahap[] = [
  { nomor: 1, enzim: 'Hexokinase / glucokinase', substrat: 'Glucose', produk: 'Glucose-6-phosphate', karbonMasuk: 6, karbonKeluar: 6, deltaG: -16.7, takTerbalikkan: true, kofaktor: ['ATP', 'Mg²⁺'], atp: -1, nadh: 0, fadh2: 0, pengaturan: 'Hexokinase is inhibited by its own product; glucokinase in liver and beta cells is not, so it keeps working when glucose is high', klinis: 'Glucokinase loss-of-function causes MODY2 — mild, stable fasting hyperglycaemia that usually needs no treatment' },
  { nomor: 2, enzim: 'Phosphoglucose isomerase', substrat: 'Glucose-6-phosphate', produk: 'Fructose-6-phosphate', karbonMasuk: 6, karbonKeluar: 6, deltaG: 1.7, takTerbalikkan: false, kofaktor: [], atp: 0, nadh: 0, fadh2: 0 },
  { nomor: 3, enzim: 'Phosphofructokinase-1', substrat: 'Fructose-6-phosphate', produk: 'Fructose-1,6-bisphosphate', karbonMasuk: 6, karbonKeluar: 6, deltaG: -14.2, takTerbalikkan: true, kofaktor: ['ATP', 'Mg²⁺'], atp: -1, nadh: 0, fadh2: 0, pengaturan: 'The rate-limiting step: activated by AMP and fructose-2,6-bisphosphate, inhibited by ATP and citrate — the cell stops making ATP when it already has it', klinis: 'PFK-M deficiency is Tarui disease (glycogen storage disease VII): exercise intolerance with no rise in lactate' },
  { nomor: 4, enzim: 'Aldolase A', substrat: 'Fructose-1,6-bisphosphate', produk: 'DHAP + glyceraldehyde-3-phosphate', karbonMasuk: 6, karbonKeluar: 6, deltaG: 23.8, takTerbalikkan: false, kofaktor: [], atp: 0, nadh: 0, fadh2: 0, klinis: 'Aldolase B deficiency (a different isoform, in liver) is hereditary fructose intolerance' },
  { nomor: 5, enzim: 'Triose phosphate isomerase', substrat: 'DHAP', produk: 'Glyceraldehyde-3-phosphate', karbonMasuk: 3, karbonKeluar: 3, deltaG: 7.5, takTerbalikkan: false, kofaktor: [], atp: 0, nadh: 0, fadh2: 0, klinis: 'TPI deficiency is the most severe glycolytic enzymopathy: haemolysis plus progressive neurological disease' },
  { nomor: 6, enzim: 'Glyceraldehyde-3-phosphate dehydrogenase', substrat: 'Glyceraldehyde-3-phosphate', produk: '1,3-bisphosphoglycerate', karbonMasuk: 3, karbonKeluar: 3, deltaG: 6.3, takTerbalikkan: false, kofaktor: ['NAD⁺', 'Pi'], atp: 0, nadh: 1, fadh2: 0, pengaturan: 'Arsenate uncouples this step — the arsenate ester hydrolyses spontaneously, so the ATP of step 7 is never made' },
  { nomor: 7, enzim: 'Phosphoglycerate kinase', substrat: '1,3-bisphosphoglycerate', produk: '3-phosphoglycerate', karbonMasuk: 3, karbonKeluar: 3, deltaG: -18.8, takTerbalikkan: false, kofaktor: ['ADP', 'Mg²⁺'], atp: 1, nadh: 0, fadh2: 0, pengaturan: 'Substrate-level phosphorylation — ATP made without any oxygen at all, which is why red cells survive on glycolysis alone' },
  { nomor: 8, enzim: 'Phosphoglycerate mutase', substrat: '3-phosphoglycerate', produk: '2-phosphoglycerate', karbonMasuk: 3, karbonKeluar: 3, deltaG: 4.4, takTerbalikkan: false, kofaktor: [], atp: 0, nadh: 0, fadh2: 0 },
  { nomor: 9, enzim: 'Enolase', substrat: '2-phosphoglycerate', produk: 'Phosphoenolpyruvate', karbonMasuk: 3, karbonKeluar: 3, deltaG: 1.8, takTerbalikkan: false, kofaktor: ['Mg²⁺'], atp: 0, nadh: 0, fadh2: 0, pengaturan: 'Inhibited by fluoride — the reason fluoride-oxalate tubes preserve a glucose sample' },
  { nomor: 10, enzim: 'Pyruvate kinase', substrat: 'Phosphoenolpyruvate', produk: 'Pyruvate', karbonMasuk: 3, karbonKeluar: 3, deltaG: -31.4, takTerbalikkan: true, kofaktor: ['ADP', 'Mg²⁺', 'K⁺'], atp: 1, nadh: 0, fadh2: 0, pengaturan: 'Activated by fructose-1,6-bisphosphate (feed-forward), inhibited by ATP and alanine', klinis: 'Pyruvate kinase deficiency is the commonest glycolytic cause of hereditary non-spherocytic haemolytic anaemia, second overall only to G6PD deficiency' },
]

const TCA: Tahap[] = [
  { nomor: 1, enzim: 'Citrate synthase', substrat: 'Acetyl-CoA + oxaloacetate', produk: 'Citrate', karbonMasuk: 6, karbonKeluar: 6, deltaG: -32.2, takTerbalikkan: true, kofaktor: ['H₂O'], atp: 0, nadh: 0, fadh2: 0, pengaturan: 'Inhibited by citrate, ATP and NADH — product and energy charge both slow the entry step' },
  { nomor: 2, enzim: 'Aconitase', substrat: 'Citrate', produk: 'Isocitrate', karbonMasuk: 6, karbonKeluar: 6, deltaG: 13.3, takTerbalikkan: false, kofaktor: ['Fe-S cluster'], atp: 0, nadh: 0, fadh2: 0, klinis: 'Fluoroacetate — in rodenticide and in some plants — is converted to fluorocitrate, which blocks this enzyme and stops the cycle dead' },
  { nomor: 3, enzim: 'Isocitrate dehydrogenase', substrat: 'Isocitrate', produk: 'α-ketoglutarate', karbonMasuk: 6, karbonKeluar: 5, deltaG: -8.4, takTerbalikkan: true, kofaktor: ['NAD⁺'], atp: 0, nadh: 1, fadh2: 0, co2: 1, pengaturan: 'Rate-limiting: activated by ADP and Ca²⁺, inhibited by ATP and NADH', klinis: 'IDH1/IDH2 mutations produce the oncometabolite 2-hydroxyglutarate in glioma and AML — a normal enzyme given a new, harmful reaction' },
  { nomor: 4, enzim: 'α-ketoglutarate dehydrogenase complex', substrat: 'α-ketoglutarate', produk: 'Succinyl-CoA', karbonMasuk: 5, karbonKeluar: 4, deltaG: -30.1, takTerbalikkan: true, kofaktor: ['Thiamine pyrophosphate', 'Lipoate', 'FAD', 'NAD⁺', 'CoA'], atp: 0, nadh: 1, fadh2: 0, co2: 1, pengaturan: 'Inhibited by its products succinyl-CoA and NADH', klinis: 'Needs the same five cofactors as pyruvate dehydrogenase — which is why thiamine deficiency strikes two steps at once, and why Wernicke encephalopathy answers to thiamine and to nothing else' },
  { nomor: 5, enzim: 'Succinyl-CoA synthetase', substrat: 'Succinyl-CoA', produk: 'Succinate', karbonMasuk: 4, karbonKeluar: 4, deltaG: -3.3, takTerbalikkan: false, kofaktor: ['GDP', 'Pi'], atp: 0, nadh: 0, fadh2: 0, gtp: 1, pengaturan: 'The only substrate-level phosphorylation in the cycle' },
  { nomor: 6, enzim: 'Succinate dehydrogenase (Complex II)', substrat: 'Succinate', produk: 'Fumarate', karbonMasuk: 4, karbonKeluar: 4, deltaG: 0, takTerbalikkan: false, kofaktor: ['FAD'], atp: 0, nadh: 0, fadh2: 1, pengaturan: 'The only enzyme belonging to both the TCA cycle and the respiratory chain — it sits in the inner membrane, not the matrix', klinis: 'SDHB/SDHD germline mutations cause hereditary paraganglioma and phaeochromocytoma' },
  { nomor: 7, enzim: 'Fumarase', substrat: 'Fumarate', produk: 'Malate', karbonMasuk: 4, karbonKeluar: 4, deltaG: -3.8, takTerbalikkan: false, kofaktor: ['H₂O'], atp: 0, nadh: 0, fadh2: 0, klinis: 'FH mutations cause hereditary leiomyomatosis and renal cell carcinoma' },
  { nomor: 8, enzim: 'Malate dehydrogenase', substrat: 'Malate', produk: 'Oxaloacetate', karbonMasuk: 4, karbonKeluar: 4, deltaG: 29.7, takTerbalikkan: false, kofaktor: ['NAD⁺'], atp: 0, nadh: 1, fadh2: 0, pengaturan: 'Strongly endergonic on its own; it runs only because citrate synthase immediately consumes the oxaloacetate' },
]

export const JALUR_METABOLIK: Jalur[] = [
  {
    kunci: 'glikolisis', nama: 'Glycolysis', kompartemen: 'sitosol',
    masukan: 'Glucose (C6)', keluaran: '2 pyruvate (C3)', tahap: GLIKOLISIS,
    ringkas: 'Two ATP are spent before any are made. The investment is what allows a red cell — which has no mitochondria at all — to stay alive on this pathway alone.',
  },
  {
    kunci: 'tca', nama: 'TCA (Krebs) cycle', kompartemen: 'mitokondria-matriks',
    masukan: 'Acetyl-CoA (C2) + oxaloacetate (C4)', keluaran: '2 CO₂, 3 NADH, 1 FADH₂, 1 GTP', tahap: TCA,
    ringkas: 'The cycle regenerates its own starting material, so oxaloacetate is a catalyst, not a fuel. Deplete it — as starvation does — and acetyl-CoA has nowhere to go but ketone bodies.',
  },
]

// ── Rantai transpor elektron ────────────────────────────────────────────────

export interface Kompleks {
  nomor: string
  nama: string
  /** Proton yang dipompa ke ruang antarmembran per pasang elektron. */
  protonDipompa: number
  penghambat: string[]
  catatan: string
}

export const RANTAI: Kompleks[] = [
  { nomor: 'I', nama: 'NADH:ubiquinone oxidoreductase', protonDipompa: 4, penghambat: ['Rotenone', 'Metformin (partial)'], catatan: 'Where NADH enters. Seven of its subunits are encoded by mitochondrial DNA, which is why so many mitochondrial diseases land here' },
  { nomor: 'II', nama: 'Succinate dehydrogenase', protonDipompa: 0, penghambat: ['Malonate'], catatan: 'Pumps no protons at all — the entire reason FADH₂ yields less ATP than NADH' },
  { nomor: 'III', nama: 'Cytochrome bc₁ complex', protonDipompa: 4, penghambat: ['Antimycin A'], catatan: 'The Q cycle; also the main site of superoxide leak' },
  { nomor: 'IV', nama: 'Cytochrome c oxidase', protonDipompa: 2, penghambat: ['Cyanide', 'Carbon monoxide', 'Azide', 'Hydrogen sulfide'], catatan: 'Reduces O₂ to water. Cyanide poisoning kills here: oxygen is present and unusable, so the blood stays bright red' },
  { nomor: 'V', nama: 'ATP synthase', protonDipompa: 0, penghambat: ['Oligomycin'], catatan: 'Consumes rather than pumps: about 4 protons per ATP, three for the rotor and one for exchanging ATP out and ADP plus phosphate in' },
]

/** Proton per ATP di kompleks V, termasuk ongkos pengangkutan ADP/Pi/ATP. */
export const PROTON_PER_ATP = 4
/** Rasio P/O modern. */
export const ATP_PER_NADH = 2.5
export const ATP_PER_FADH2 = 1.5

export interface Ulang { nadh: number; fadh2: number; atpLangsung: number; gtp: number }

/** Menjumlahkan pembawa elektron satu jalur — dipakai supaya neraca tidak perlu dipercaya. */
export function ringkasJalur(j: Jalur): Ulang {
  return j.tahap.reduce<Ulang>((a, t) => ({
    nadh: a.nadh + t.nadh,
    fadh2: a.fadh2 + t.fadh2,
    atpLangsung: a.atpLangsung + t.atp,
    gtp: a.gtp + (t.gtp ?? 0),
  }), { nadh: 0, fadh2: 0, atpLangsung: 0, gtp: 0 })
}

export type Antarjemput = 'malat-aspartat' | 'gliserol-fosfat'

export interface NeracaGlukosa {
  total: number
  rincian: Array<{ sumber: string; atp: number }>
  catatan: string
}

/**
 * Neraca ATP satu molekul glukosa yang dioksidasi sempurna.
 *
 * Angkanya bergantung pada ANTARJEMPUT yang dipakai untuk memindahkan NADH
 * sitosolik ke dalam mitokondria, dan itu bukan detail sepele: otot rangka dan
 * otak memakai gliserol-fosfat sehingga memperoleh 30, sedangkan hati dan
 * jantung memakai malat-aspartat sehingga memperoleh 32. Buku yang menyebut
 * satu angka tunggal menyembunyikan perbedaan jaringan yang nyata.
 */
export function neracaGlukosa(antarjemput: Antarjemput = 'malat-aspartat'): NeracaGlukosa {
  const jalurGlikolisis = JALUR_METABOLIK.find((j) => j.kunci === 'glikolisis')!
  const gl = ringkasJalur(jalurGlikolisis)
  const tca = ringkasJalur(JALUR_METABOLIK.find((j) => j.kunci === 'tca')!)
  const perNadhSitosol = antarjemput === 'malat-aspartat' ? ATP_PER_NADH : ATP_PER_FADH2

  // Tahap 5 sampai 10 glikolisis berjalan DUA KALI per glukosa, satu untuk
  // tiap triosa, sedangkan tahap investasinya hanya sekali. Data hanya
  // mencatat satu lintasan triosa, jadi penggandaannya dilakukan di sini —
  // melupakannya adalah kesalahan yang membuat neraca meleset 4,5 ATP dan
  // tetap terlihat masuk akal.
  const investasi = jalurGlikolisis.tahap.filter((t) => t.atp < 0).reduce((a, t) => a + t.atp, 0)
  const panen = jalurGlikolisis.tahap.filter((t) => t.atp > 0).reduce((a, t) => a + t.atp, 0) * 2
  const nadhSitosol = gl.nadh * 2

  const rincian = [
    { sumber: 'Glycolysis, substrate-level', atp: investasi + panen },
    { sumber: `Glycolysis NADH ×${nadhSitosol} via ${antarjemput === 'malat-aspartat' ? 'malate-aspartate' : 'glycerol-3-phosphate'} shuttle`, atp: nadhSitosol * perNadhSitosol },
    // Piruvat dehidrogenase berjalan dua kali, satu per piruvat.
    { sumber: 'Pyruvate dehydrogenase NADH ×2', atp: 2 * ATP_PER_NADH },
    { sumber: 'TCA NADH ×6', atp: tca.nadh * 2 * ATP_PER_NADH },
    { sumber: 'TCA FADH₂ ×2', atp: tca.fadh2 * 2 * ATP_PER_FADH2 },
    { sumber: 'TCA GTP ×2', atp: tca.gtp * 2 },
  ]
  const total = rincian.reduce((a, b) => a + b.atp, 0)
  return {
    total,
    rincian,
    catatan: antarjemput === 'malat-aspartat'
      ? 'Liver, heart and kidney use the malate-aspartate shuttle, which preserves the NADH — 32 ATP'
      : 'Skeletal muscle and brain use the glycerol-3-phosphate shuttle, which hands electrons to FAD instead and loses one ATP per NADH — 30 ATP',
  }
}

/**
 * Neraca ATP beta-oksidasi satu asam lemak jenuh berkarbon genap.
 *
 * Pengaktifan menjadi asil-KoA memakai satu ATP tetapi memutus DUA ikatan
 * berenergi tinggi (ATP menjadi AMP, bukan ADP), sehingga ongkosnya dua
 * setara-ATP. Melupakan hal itu adalah kesalahan tersering pada perhitungan
 * ini, dan hasilnya selalu meleset tepat satu.
 */
export function neracaAsamLemak(karbon: number): { ok: boolean; alasan?: string; siklus?: number; asetilKoA?: number; total?: number } {
  if (!Number.isInteger(karbon) || karbon < 4 || karbon % 2 !== 0) {
    return { ok: false, alasan: 'Only even-numbered saturated fatty acids of 4 carbons or more are computed here' }
  }
  const asetilKoA = karbon / 2
  const siklus = asetilKoA - 1
  const dariAsetil = asetilKoA * (3 * ATP_PER_NADH + ATP_PER_FADH2 + 1)
  const dariSiklus = siklus * (ATP_PER_NADH + ATP_PER_FADH2)
  const total = dariAsetil + dariSiklus - 2
  return { ok: true, siklus, asetilKoA, total }
}
