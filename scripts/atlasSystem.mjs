// Pemotong ATLAS PER SPESIALISASI dari human-atlas (BodyParts3D 4.0).
//
// Pemotong organ (atlasOrgan.mjs) membuat satu organ per berkas, dan pemotong
// kardiovaskular (atlasCardio.mjs) membuat satu sistem penuh. Berkas ini
// menggeneralkan keduanya: tiap MODUL adalah satu bidang klinis, dengan
// struktur bernama yang cukup untuk menunjukkan letak penyakitnya — bukan
// seluruh 2.234 mesh, yang akan membuat berkasnya puluhan megabita dan tidak
// ada satu pun struktur yang bisa dibedakan.
//
// Jalankan:  node scripts/atlasSystem.mjs <folder-human-atlas>

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { bacaAtlas, ambilBagian, garisTengah, pusat, tulisGlb, HAK_CIPTA } from './atlasGlb.mjs'

const SUMBER = process.argv[2] ?? '/home/user/ashemag/human-atlas'
const KELUAR = new URL('../public/atlas/', import.meta.url).pathname

// Warna menurut JENIS JARINGAN, bukan menurut selera per modul: tulang yang
// sama harus berwarna sama entah ia muncul di modul ortopedi maupun di modul
// THT, kalau tidak orang harus belajar ulang kodenya tiap kali berpindah.
const WARNA = {
  bone: '#e8ded0',
  cartilage: '#cfd8dc',
  muscle: '#b4564f',
  viscera: '#c98a6b',
  gut: '#d19a6a',
  liver: '#9b5a4a',
  gland: '#d9a441',
  nerve: '#e6dfae',
  brain: '#cbb8b0',
  vessel: '#c0504d',
  vein: '#4f6fa8',
  airway: '#9fc0d4',
  eye: '#8aa9c8',
  skin: '#d8b49a',
  lymph: '#8fae86',
  repro: '#c58f9a',
  urine: '#b08fbf',
}

const jenisDari = (p) => {
  const n = p.name.toLowerCase()
  if (/bronch|trachea|larynx|epiglottis|conus elasticus/.test(n)) return 'airway'
  if (/cartilage|meniscus|disc|labrum/.test(n)) return 'cartilage'
  if (/artery|arteri|aorta|trunk of (left|right) coronary/.test(n)) return 'vessel'
  if (/vein|venous|sinus$/.test(n)) return 'vein'
  if (/nerve|ganglion|plexus|chiasm|tract$/.test(n)) return 'nerve'
  if (/gyrus|cerebell|thalamus|callosum|nucleus|amygdala|hippocamp|cortex of|pallidus|putamen|claustrum|insula|operculum|colliculus|pons|medulla|midbrain|fornix|commissure|ventricle$|cerebral aqueduct|septum of telencephalon|habenula|lamina terminalis|interpeduncular/.test(n)) return 'brain'
  if (/kidney|ureter|bladder|urethra|renal/.test(n)) return 'urine'
  if (/testis|epididymis|prostate|seminal|deferent|penis|glans/.test(n)) return 'repro'
  if (/liver|hepat|gallbladder|bile|biliary|cystic duct/.test(n)) return 'liver'
  if (/stomach|duoden|jejun|ileum|colon|caecum|cecum|rectum|appendix|oesoph|esophag|anal|mesent|omentum|peritone/.test(n)) return 'gut'
  if (/adrenal|pituitary|pineal|thymus|pancrea|lacrimal gland|parotid|submandibular|sublingual/.test(n)) return 'gland'
  if (/spleen|lymph|tonsil/.test(n)) return 'lymph'
  if (/cornea|sclera|iris|lens|retina|choroid|vitreous|ciliaris|eyelid|eyeball|tarsal plate/.test(n)) return 'eye'
  if (/skin|hair|eyebrow|^lip$/.test(n)) return 'skin'
  if (p.system === 'skeletal') return 'bone'
  if (p.system === 'muscular') return 'muscle'
  return 'viscera'
}

/**
 * Tiap modul menyebut pola nama yang ia butuhkan. Aturannya satu: struktur
 * yang TIDAK bisa ditunjuk saat menjelaskan penyakit tidak perlu diikutkan —
 * berkas yang besar membuat halamannya lambat, dan lambat berarti tidak dibuka.
 */
const MODUL = {
  respirasi: {
    label: 'Respiratory',
    pola: [
      /^trachea$/, /bronchus/, /bronchial tree$/, /^diaphragm$/, /^epiglottis$/,
      /cricoid cartilage|thyroid cartilage|arytenoid cartilage/, /vocal (ligament|fold)/,
      /pharyngeal constrictor/, /intercostal muscle/, /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) (left|right) rib$/,
      /^(left|right) rib$/, /rib$/, /^sternum$|^body of sternum$|^manubrium$|^xiphoid/,
    ],
  },
  gastro: {
    label: 'Gastrointestinal & hepatobiliary',
    pola: [
      /^stomach$/, /^duodenum$/, /part of (jejunum|ileum)$/, /^(ascending|transverse|descending|sigmoid) colon$/,
      /^caecum$|^cecum$/, /^appendix$/, /^rectum$/, /^esophagus$/, /^oesophagus$/,
      /lobe of liver$/, /^liver$/, /^gallbladder$/, /^cystic duct$/, /^common hepatic duct$/,
      /^bile duct$|^common bile duct$/, /^pancreas$/, /^parenchyma of pancreas$/, /^spleen$/,
      /hepatic portal vein$/, /^superior mesenteric artery$/, /^celiac trunk$/, /anal sphincter$/,
    ],
  },
  nefrologi: {
    label: 'Kidney & urinary tract',
    pola: [
      /^(left|right) kidney$/, /^(left|right) ureter$/, /^urinary bladder$/, /^urethra$/,
      /^(left|right) renal (artery|vein)$/, /^abdominal aorta$/, /^inferior vena cava$/,
      /^(left|right) adrenal gland$/,
    ],
  },
  endokrin: {
    label: 'Endocrine & metabolic',
    pola: [
      /^pituitary gland$/, /^pineal body$/, /^(left|right) adrenal gland$/, /^pancreas$/,
      /^parenchyma of pancreas$/, /lobe of thymus$/, /^(left|right) testis$/, /^hypothalamus$/,
      /^(left|right) kidney$/, /lobe of liver$/,
    ],
  },
  neurologi: {
    label: 'Brain & nerves',
    pola: [
      /gyrus$/, /^cerebellum$/, /^corpus callosum$/, /^hypothalamus$/, /^(left|right) thalamus$/,
      /^(left|right) (caudate nucleus|putamen|globus pallidus|amygdala|hippocampus|claustrum|insula)$/,
      /^(pons|midbrain|medulla oblongata)$/, /peduncle of midbrain/, /colliculus$/,
      /^(third|fourth|left lateral|right lateral) ventricle$/, /^cerebral aqueduct$/,
      /^(left|right) optic nerve$/, /^optic chiasm$/, /optic tract$/, /oculomotor nerve$/,
      /trigeminal|facial nerve$|vestibulocochlear|vagus nerve$|hypoglossal nerve$|accessory nerve$/,
      /^(left|right) internal carotid artery$/, /^basilar artery$/, /middle cerebral artery$/,
    ],
  },
  tht: {
    label: 'Ear, nose & throat',
    pola: [
      /^external ear$/, /nasal cartilage$/, /nasal concha$/, /^vomer$/, /nasal bone$/,
      /pharyng/, /^epiglottis$/, /^soft palate$/, /^uvula$/, /cricoid cartilage|thyroid cartilage|arytenoid cartilage|corniculate|cuneiform cartilage/,
      /vocal (ligament|fold|is)$/, /^tongue$/, /^(left|right) (parotid|submandibular|sublingual) gland$/,
      /^trachea$/, /^(left|right) palatine tonsil$/, /^mandible$/, /^maxilla$/,
    ],
  },
  mata: {
    label: 'Eye & orbit',
    pola: [
      /^(left|right) (cornea|iris|lens|sclera|choroid|vitreous body|corona ciliaris)$/,
      /^optic part of (left|right) retina$/, /^anterior chamber of (left|right) eyeball$/,
      /^(left|right) optic nerve$/, /^optic chiasm$/,
      // "oblique" tanpa batas ikut menarik obliquus abdominis, dan "orbital"
      // ikut menarik girus orbitalis di otak — dua struktur yang sama sekali
      // bukan bagian mata.
      /^(left|right) (superior|inferior|medial|lateral) rectus$/,
      /^(left|right) (superior|inferior) oblique$/,
      /levator palpebrae superioris$/, /lacrimal (gland|sac|canaliculus)$/, /nasolacrimal duct$/,
      /tarsal plate of (left|right) (upper|lower) eyelid$/,
    ],
  },
  ortopedi: {
    label: 'Bones, joints & muscles',
    pola: [
      /^(left|right) (femur|tibia|fibula|humerus|radius|ulna|patella|scapula|clavicle|hip bone)$/,
      /^sacrum$|^coccyx$/, /vertebra$/, /^atlas$|^axis$/, /rib$/, /sternum$/,
      /^(left|right) (deltoid|biceps brachii|triceps brachii|gluteus maximus|gluteus medius|rectus femoris|biceps femoris|gastrocnemius|soleus|tibialis anterior|supraspinatus|latissimus dorsi|rectus abdominis)$/,
      /part of (left|right) (trapezius|deltoid|pectoralis major)$/, /calcaneal tendon$/,
      /iliotibial tract$/, /interosseous membrane of (left|right) (leg|forearm)$/,
    ],
  },
  urogenital: {
    label: 'Urogenital & andrology',
    pola: [
      /^prostate$/, /^(left|right) (testis|epididymis|seminal vesicle|deferent duct)$/,
      /corpus (cavernosum|spongiosum) of penis$/, /^glans penis$/, /^urinary bladder$/,
      /^urethra$/, /^(left|right) ureter$/, /^(left|right) kidney$/,
    ],
  },
  obstetri: {
    label: 'Pelvis (obstetrics & gynaecology)',
    pola: [
      /^(left|right) hip bone$/, /^sacrum$/, /^coccyx$/, /^(fourth|fifth) lumbar vertebra$/,
      /^urinary bladder$/, /^rectum$/, /^urethra$/, /levator ani|coccygeus|obturator internus/,
      /^(left|right) (internal|external|common) iliac (artery|vein)$/,
    ],
  },
  imunologi: {
    label: 'Immune, blood & lymphoid',
    pola: [/^spleen$/, /lobe of thymus$/, /lymph/, /^(left|right) femur$/, /^sternum$/, /^(left|right) hip bone$/],
  },
  kulit: {
    label: 'Skin & integument',
    pola: [/^skin$/, /^hair of head$/, /^eyebrow$/, /^lip$/, /^pubic hair$/],
  },
}

const { atlas, potongan } = bacaAtlas(SUMBER)

mkdirSync(KELUAR, { recursive: true })
const ringkas = []
const semuaBagian = []

for (const [id, m] of Object.entries(MODUL)) {
  const sudah = new Set()
  const cocok = atlas.parts.filter((p) => {
    const n = p.name.toLowerCase()
    if (!m.pola.some((r) => r.test(n))) return false
    if (sudah.has(n)) return false     // beberapa nama muncul dua kali di sumber
    sudah.add(n)
    return true
  })
  if (!cocok.length) { console.warn(`lewat ${id}: tidak ada bagian cocok`); continue }

  const data = cocok.map((p) => ({ ...ambilBagian(potongan, p), warna: WARNA[jenisDari(p)] }))

  // Dipusatkan sebagai SATU kesatuan: letak antar struktur adalah setengah dari
  // yang sedang diajarkan, jadi tidak boleh masing-masing digeser ke tengah.
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (const d of data) for (let i = 0; i < d.pos.length; i += 3)
    for (let a = 0; a < 3; a++) { const v = d.pos[i + a]; if (v < min[a]) min[a] = v; if (v > max[a]) max[a] = v }
  const rentang = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1
  const skala = 2 / rentang
  const tengah = [0, 1, 2].map((a) => (min[a] + max[a]) / 2)
  for (const d of data) for (let i = 0; i < d.pos.length; i += 3)
    for (let a = 0; a < 3; a++) d.pos[i + a] = (d.pos[i + a] - tengah[a]) * skala

  const bytes = tulisGlb(join(KELUAR, `${id}.glb`), data, HAK_CIPTA)
  const tri = cocok.reduce((s, p) => s + p.indexCount / 3, 0)

  cocok.forEach((p, i) => {
    semuaBagian.push({
      name: p.name,
      module: id,
      kind: jenisDari(p),
      color: WARNA[jenisDari(p)],
      centroid: pusat(data[i]),
      line: garisTengah(data[i], 6),
      triangles: p.indexCount / 3,
    })
  })
  ringkas.push({ id, label: m.label, struktur: cocok.length, tri, kb: Math.round(bytes / 1024) })
}

writeFileSync(new URL('../src/lib/systemAtlas.gen.ts', import.meta.url).pathname,
`// DIBANGKITKAN oleh scripts/atlasSystem.mjs — jangan disunting tangan.
//
// Struktur bernama untuk tiap modul spesialisasi, dipotong dari BodyParts3D 4.0
// (Database Center for Life Science, CC BY 4.0). Nama di sini SAMA PERSIS
// dengan nama mesh di /atlas/<modul>.glb, sehingga menyorot satu struktur cukup
// dengan mencocokkan namanya.
export interface AtlasPart {
  name: string
  module: string
  kind: string
  color: string
  centroid: [number, number, number]
  line: [number, number, number][]
  triangles: number
}

export const ATLAS_PARTS: AtlasPart[] = ${JSON.stringify(semuaBagian)} as unknown as AtlasPart[]

export const ATLAS_MODULE_INFO: Record<string, { label: string; structures: number; kb: number }> =
  ${JSON.stringify(Object.fromEntries(ringkas.map((r) => [r.id, { label: r.label, structures: r.struktur, kb: r.kb }])), null, 2)}

export function partsForModule(module: string): AtlasPart[] {
  return ATLAS_PARTS.filter((p) => p.module === module)
}

export const ATLAS_BY_NAME: Record<string, AtlasPart> = Object.fromEntries(
  ATLAS_PARTS.map((p) => [p.module + '::' + p.name.toLowerCase(), p]),
)
`)

console.table(ringkas)
console.log('total struktur', semuaBagian.length)
