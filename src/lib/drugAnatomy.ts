import type { AnatomyLayer } from '../components/Body3D'
import { ORGAN_FOCUS } from './organFocus'

// ─────────────────────────────────────────────────────────────────────────────
// "Obat ini bekerja di mana" — dijawab dari data, bukan dari ingatan.
//
// Masukannya adalah profil farmakologi nyata yang ditarik server dari RxClass
// (NLM): MEKANISME KERJA dan EFEK FISIOLOGIS menurut MED-RT, kelas farmakologi
// menurut FDA, dan kelompok ATC menurut WHO. Keluarannya adalah kumpulan
// struktur pada model 3D — dipakai untuk MENYOROT tempat kerjanya di tubuh.
//
// DUA LAPIS PENCOCOKAN, dan urutannya penting.
//
//   1. ATURAN KELAS (di bawah). Paling tepat: "penghambat pompa proton"
//      bekerja di sel parietal LAMBUNG, "diuretik loop" di ANSA HENLE GINJAL.
//      Aturan ini dicocokkan ke gabungan teks nama kelas dari RxClass.
//
//   2. HURUF ATC. Jaring pengaman, dan kebetulan memang tepat secara
//      rancangan: karakter PERTAMA kode ATC menurut definisi WHO adalah
//      KELOMPOK ANATOMI — A alimentary, C cardiovascular, R respiratory, dan
//      seterusnya. Jadi kalaupun tak satu pun aturan kelas cocok, sistem
//      organnya masih bisa ditunjukkan dengan benar, sekadar lebih kasar.
//
// APA YANG SENGAJA TIDAK DILAKUKAN. Tidak ada dosis di berkas ini, dan tidak
// ada tebakan. Kalau tidak ada aturan maupun huruf ATC yang cocok, hasilnya
// KOSONG dan layar berkata tidak tahu. Menyorot organ yang salah pada aplikasi
// obat lebih buruk daripada tidak menyorot apa pun.
// ─────────────────────────────────────────────────────────────────────────────

export interface DrugSite {
  key: string
  label: string
  layer: AnatomyLayer['key']
  /** Kata kunci substring terhadap nama struktur nyata di berkas .glb. */
  keywords: string[]
  /** Kenapa di sini — kalimat yang ikut tampil, supaya sorotannya bisa dinilai. */
  why: string
}

/** Mengambil kata kunci 3D dari katalog organ supaya tidak ditulis dua kali. */
function organ(key: string, why: string): DrugSite | null {
  const o = ORGAN_FOCUS.find((x) => x.key === key)
  if (!o) return null
  return { key: o.key, label: o.label, layer: o.layer, keywords: o.keywords, why }
}

/** Struktur yang tidak ada di katalog organ (mis. otot rangka, pembuluh). */
function struktur(key: string, label: string, layer: AnatomyLayer['key'], keywords: string[], why: string): DrugSite {
  return { key, label, layer, keywords, why }
}

interface Aturan {
  /** Diuji terhadap gabungan nama kelas dari RxClass, huruf kecil semua. */
  cocok: RegExp
  aksi: () => Array<DrugSite | null>
  /** Organ tempat efek SAMPING-nya lazim muncul, bukan tempat kerjanya. */
  efekSamping?: () => Array<DrugSite | null>
}

const ATURAN: Aturan[] = [
  // ── Kardiovaskular ────────────────────────────────────────────────────────
  {
    cocok: /beta[- ]?adrenergic block|beta blocker/,
    aksi: () => [organ('heart', 'Blocks β1 receptors on cardiac muscle, slowing rate and force of contraction')],
    efekSamping: () => [organ('lungs', 'β2 blockade can constrict the bronchi — the reason non-selective agents are avoided in asthma')],
  },
  {
    cocok: /angiotensin[- ]converting enzyme|ace inhibitor/,
    aksi: () => [
      organ('kidneys', 'Acts on the renin–angiotensin system, which the kidney initiates'),
      struktur('arteries', 'Arteries', 'cardiovascular', ['artery', 'aorta'], 'Less angiotensin II means less arterial vasoconstriction'),
    ],
    efekSamping: () => [organ('lungs', 'Bradykinin accumulation causes the characteristic dry cough')],
  },
  {
    cocok: /angiotensin 2 receptor block|angiotensin ii receptor/,
    aksi: () => [
      organ('kidneys', 'Blocks angiotensin II receptors in the renal and systemic vasculature'),
      struktur('arteries', 'Arteries', 'cardiovascular', ['artery', 'aorta'], 'Arterial smooth muscle relaxes without angiotensin II signalling'),
    ],
  },
  {
    cocok: /calcium channel block/,
    aksi: () => [
      struktur('arteries', 'Arteries', 'cardiovascular', ['artery', 'aorta'], 'Blocks L-type calcium entry into vascular smooth muscle, widening arteries'),
      organ('heart', 'Non-dihydropyridine agents also slow AV conduction and contractility'),
    ],
  },
  {
    cocok: /hmg[- ]?coa reductase|statin/,
    aksi: () => [organ('liver', 'Inhibits HMG-CoA reductase in hepatocytes, the rate-limiting step of cholesterol synthesis')],
    efekSamping: () => [struktur('skeletal-muscle', 'Skeletal muscle', 'muscular', ['muscle'], 'Myalgia and, rarely, rhabdomyolysis — the classic statin adverse effect')],
  },
  {
    cocok: /cardiac glycoside|digitalis/,
    aksi: () => [organ('heart', 'Inhibits the cardiac Na⁺/K⁺-ATPase, raising intracellular calcium and contractile force')],
  },
  {
    cocok: /anticoagulant|thrombin inhibitor|factor xa|vitamin k antagonis|antiplatelet|platelet aggregation inhibitor/,
    aksi: () => [
      struktur('blood-vessels', 'Blood vessels', 'cardiovascular', ['artery', 'vein', 'aorta'], 'Acts on clotting within the circulation itself'),
      organ('liver', 'Most clotting factors are synthesised in the liver — the target of vitamin K antagonists'),
    ],
    efekSamping: () => [organ('stomach', 'Gastrointestinal bleeding is the principal hazard')],
  },

  // ── Ginjal & saluran kemih ────────────────────────────────────────────────
  {
    cocok: /loop diuretic|sodium potassium chloride symport/,
    aksi: () => [organ('kidneys', 'Blocks the Na⁺/K⁺/2Cl⁻ transporter in the thick ascending limb of the loop of Henle')],
  },
  {
    cocok: /thiazide|sodium chloride symport/,
    aksi: () => [organ('kidneys', 'Blocks the Na⁺/Cl⁻ cotransporter in the distal convoluted tubule')],
  },
  {
    cocok: /aldosterone antagonist|mineralocorticoid receptor antagon|potassium sparing/,
    aksi: () => [
      organ('kidneys', 'Blocks aldosterone at the collecting duct, keeping potassium and losing sodium'),
      organ('adrenal', 'Aldosterone itself originates in the adrenal cortex'),
    ],
  },
  {
    cocok: /sodium[- ]glucose|sglt2/,
    aksi: () => [organ('kidneys', 'Blocks glucose reabsorption in the proximal tubule, so glucose leaves in the urine')],
  },
  {
    cocok: /alpha[- ]?1 adrenergic block|5[- ]?alpha reductase/,
    aksi: () => [organ('prostate', 'Relaxes prostatic smooth muscle or shrinks the gland in benign prostatic hyperplasia'), organ('bladder', 'Eases bladder outlet obstruction')],
  },

  // ── Saluran cerna ─────────────────────────────────────────────────────────
  {
    cocok: /proton pump inhibitor|h\+\/k\+[- ]?atpase/,
    aksi: () => [organ('stomach', 'Irreversibly blocks the H⁺/K⁺-ATPase proton pump on gastric parietal cells')],
  },
  {
    cocok: /histamine h2 receptor antagon/,
    aksi: () => [organ('stomach', 'Blocks histamine H2 receptors on parietal cells, reducing acid secretion')],
  },
  {
    cocok: /laxative|antidiarrheal|antipropulsive/,
    aksi: () => [organ('large-intestine', 'Acts on colonic motility and water handling'), organ('small-intestine', 'Alters transit through the small bowel')],
  },

  // ── Pernapasan ────────────────────────────────────────────────────────────
  {
    cocok: /beta2[- ]?adrenergic agonis|adrenergic beta2 agonis|bronchodilator|muscarinic antagonis.*inhal|leukotriene/,
    aksi: () => [organ('lungs', 'Relaxes bronchial smooth muscle, widening the airways')],
  },
  {
    cocok: /antihistamine|histamine h1 receptor antagon/,
    aksi: () => [
      struktur('nasal-airway', 'Nose & upper airway', 'surface', ['nose', 'nasal region', 'nostril'], 'Blocks H1 receptors in the nasal mucosa, reducing rhinorrhoea and sneezing'),
    ],
    efekSamping: () => [organ('brain', 'First-generation agents cross into the brain and cause sedation')],
  },

  // ── Endokrin & metabolik ──────────────────────────────────────────────────
  {
    cocok: /insulin|glucagon[- ]?like peptide|dipeptidyl peptidase|sulfonylurea|biguanide|metformin/,
    aksi: () => [
      organ('pancreas', 'The pancreatic islets are the source and target of glucose-regulating hormones'),
      organ('liver', 'Hepatic glucose output is a principal target — metformin acts here'),
      struktur('skeletal-muscle', 'Skeletal muscle', 'muscular', ['muscle'], 'Muscle is the largest site of insulin-driven glucose uptake'),
    ],
  },
  {
    cocok: /thyroid hormone|antithyroid|thyroid peroxidase/,
    aksi: () => [organ('thyroid', 'Acts directly on thyroid hormone synthesis or replaces the hormone itself')],
  },
  {
    cocok: /corticosteroid|glucocorticoid/,
    aksi: () => [organ('adrenal', 'Mimics or suppresses the cortisol axis run by the adrenal cortex')],
    efekSamping: () => [
      struktur('bone', 'Bone', 'skeletal', ['bone', 'vertebra', 'femur'], 'Long-term use causes osteoporosis'),
      organ('stomach', 'Increases the risk of peptic ulceration'),
    ],
  },
  {
    cocok: /bisphosphonate|calcitonin|parathyroid hormone/,
    aksi: () => [struktur('bone', 'Bone', 'skeletal', ['bone', 'vertebra', 'femur', 'humerus'], 'Acts directly on bone turnover by osteoclasts and osteoblasts')],
  },

  // ── Saraf & jiwa ──────────────────────────────────────────────────────────
  {
    cocok: /serotonin reuptake|norepinephrine reuptake|monoamine oxidase|antidepress|tricyclic/,
    aksi: () => [organ('brain', 'Raises monoamine levels at synapses in the central nervous system')],
  },
  {
    cocok: /dopamine|antipsychotic|neuroleptic/,
    aksi: () => [organ('brain', 'Acts on dopaminergic pathways in the brain')],
  },
  {
    cocok: /benzodiazepine|gaba|anticonvuls|antiepileptic|barbiturate/,
    aksi: () => [organ('brain', 'Modulates GABAergic inhibition or neuronal ion channels in the brain')],
  },
  {
    cocok: /opioid|mu[- ]?receptor agonis/,
    aksi: () => [
      organ('brain', 'Acts on µ-opioid receptors in the brain and brainstem'),
      organ('spinal-cord', 'Also acts on the dorsal horn of the spinal cord, blocking pain transmission'),
    ],
    efekSamping: () => [
      organ('lungs', 'Respiratory depression — the mechanism of opioid death'),
      organ('large-intestine', 'Constipation from reduced gut motility'),
    ],
  },
  {
    cocok: /local anesthetic|sodium channel block/,
    aksi: () => [struktur('peripheral-nerves', 'Peripheral nerves', 'nervous', ['nerve'], 'Blocks voltage-gated sodium channels in peripheral nerve axons')],
  },
  {
    cocok: /cyclooxygenase|nonsteroidal anti[- ]?inflammatory|nsaid|salicylate/,
    aksi: () => [struktur('inflamed-tissue', 'Skeletal muscle & joints', 'muscular', ['muscle'], 'Inhibits COX, cutting prostaglandin production at inflamed tissue')],
    efekSamping: () => [
      organ('stomach', 'Loss of protective prostaglandins causes gastric ulceration'),
      organ('kidneys', 'Reduced renal prostaglandins can precipitate acute kidney injury'),
    ],
  },

  // ── Infeksi & imunologi ───────────────────────────────────────────────────
  {
    cocok: /antibacterial|antibiotic|cell wall synthesis inhibitor|protein synthesis inhibitor|beta lactam|quinolone|macrolide|aminoglycoside/,
    aksi: () => [struktur('bloodstream', 'Bloodstream (systemic)', 'cardiovascular', ['artery', 'vein'], 'Distributes through the circulation to wherever the infection sits — the target is the bacterium, not a human organ')],
    efekSamping: () => [
      organ('large-intestine', 'Disrupts gut flora — the route to antibiotic-associated colitis'),
      organ('liver', 'Hepatic metabolism and, for some agents, hepatotoxicity'),
      organ('kidneys', 'Aminoglycosides and vancomycin are nephrotoxic'),
    ],
  },
  {
    cocok: /vaccine|immunization|toxoid|antiserum|immune globulin|antivenin|antitoxin/,
    aksi: () => [
      struktur('deltoid', 'Deltoid muscle (injection site)', 'muscular', ['deltoid'], 'The usual intramuscular site — where antigen or antibody is delivered'),
      organ('lymph-nodes', 'Antigen drains to the regional lymph nodes, where B and T cells are primed'),
      organ('spleen', 'The spleen is a major site of the antibody response'),
    ],
  },
  {
    cocok: /antineoplastic|antimitotic|kinase inhibitor|topoisomerase|alkylating/,
    aksi: () => [struktur('bloodstream', 'Bloodstream (systemic)', 'cardiovascular', ['artery', 'vein'], 'Distributes systemically to reach dividing tumour cells')],
    efekSamping: () => [
      struktur('bone-marrow', 'Bone marrow', 'skeletal', ['bone', 'vertebra', 'sternum', 'ilium'], 'Marrow suppression — the dose-limiting toxicity of most cytotoxics'),
      organ('small-intestine', 'Rapidly dividing gut epithelium is damaged, causing mucositis'),
    ],
  },
]

// Huruf pertama kode ATC = kelompok anatomi menurut definisi WHO.
const ATC_ANATOMI: Record<string, { organKeys: string[]; why: string }> = {
  A: { organKeys: ['stomach', 'small-intestine', 'large-intestine', 'liver'], why: 'ATC group A — alimentary tract and metabolism' },
  B: { organKeys: ['spleen'], why: 'ATC group B — blood and blood-forming organs' },
  C: { organKeys: ['heart'], why: 'ATC group C — cardiovascular system' },
  D: { organKeys: [], why: 'ATC group D — dermatologicals, acting on the skin' },
  G: { organKeys: ['bladder', 'prostate'], why: 'ATC group G — genito-urinary system and sex hormones' },
  H: { organKeys: ['thyroid', 'adrenal', 'pituitary'], why: 'ATC group H — systemic hormonal preparations' },
  J: { organKeys: [], why: 'ATC group J — anti-infectives for systemic use' },
  L: { organKeys: ['lymph-nodes'], why: 'ATC group L — antineoplastic and immunomodulating agents' },
  M: { organKeys: [], why: 'ATC group M — musculo-skeletal system' },
  N: { organKeys: ['brain', 'spinal-cord'], why: 'ATC group N — nervous system' },
  P: { organKeys: ['liver', 'small-intestine'], why: 'ATC group P — antiparasitic products' },
  R: { organKeys: ['lungs', 'larynx'], why: 'ATC group R — respiratory system' },
  S: { organKeys: ['eye', 'ear'], why: 'ATC group S — sensory organs' },
  V: { organKeys: [], why: 'ATC group V — various' },
}

export interface KelasRingkas { nama: string; jenis?: string }

export interface DrugSiteResult {
  action: DrugSite[]
  adverse: DrugSite[]
  /** true kalau semuanya berasal dari huruf ATC saja — pencocokannya kasar. */
  coarse: boolean
}

function bersihkan(daftar: Array<DrugSite | null>): DrugSite[] {
  const out: DrugSite[] = []
  for (const s of daftar) {
    if (!s) continue
    if (out.some((x) => x.key === s.key)) continue
    out.push(s)
  }
  return out
}

/**
 * Menentukan struktur 3D mana yang disorot untuk satu obat.
 *
 * `kelas` adalah seluruh nama kelas dari RxClass digabung (mekanisme, efek
 * fisiologis, kelas farmakologi); `atcCodes` adalah kode ATC-nya.
 */
export function sitesForDrug(kelas: KelasRingkas[], atcCodes: string[]): DrugSiteResult {
  const teks = kelas.map((k) => k.nama.toLowerCase()).join(' | ')

  const aksi: Array<DrugSite | null> = []
  const samping: Array<DrugSite | null> = []
  for (const aturan of ATURAN) {
    if (!aturan.cocok.test(teks)) continue
    aksi.push(...aturan.aksi())
    if (aturan.efekSamping) samping.push(...aturan.efekSamping())
  }

  const action = bersihkan(aksi)
  const adverse = bersihkan(samping)
  if (action.length) return { action, adverse, coarse: false }

  // Tidak ada aturan kelas yang cocok — pakai huruf ATC sebagai jaring
  // pengaman, dan tandai hasilnya sebagai kasar supaya layar bisa berkata
  // bahwa ini tingkat sistem organ, bukan tempat kerja yang persis.
  const kasar: Array<DrugSite | null> = []
  for (const code of atcCodes) {
    const huruf = code.trim().charAt(0).toUpperCase()
    const grup = ATC_ANATOMI[huruf]
    if (!grup) continue
    for (const key of grup.organKeys) kasar.push(organ(key, grup.why))
  }
  const coarseAction = bersihkan(kasar)
  // Kalau tetap kosong, biarkan kosong. Layar akan mengatakan tempat kerjanya
  // tidak bisa dipetakan — itu jawaban yang jujur, bukan kegagalan.
  return { action: coarseAction, adverse, coarse: coarseAction.length > 0 }
}

/** Semua kata kunci 3D dari sekumpulan situs — untuk diberikan ke Body3D. */
export function keywordsOf(sites: DrugSite[]): string[] {
  return [...new Set(sites.flatMap((s) => s.keywords))]
}

/** Lapisan 3D yang perlu dinyalakan supaya situsnya benar-benar terlihat. */
export function layersOf(sites: DrugSite[]): Array<AnatomyLayer['key']> {
  return [...new Set(sites.map((s) => s.layer))]
}
