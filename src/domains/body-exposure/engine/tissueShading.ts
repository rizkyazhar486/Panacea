// Parameter shading per jenis jaringan untuk aset Z-Anatomy/BodyParts3D.
//
// Kenapa ada: material GLB sumber hanya menyimpan baseColorFactor. Spesifikasi
// glTF 2.0 menetapkan metallicFactor dan roughnessFactor default = 1 bila tidak
// ditulis, sehingga setiap jaringan dirender sebagai LOGAM kasar — penyebab
// tampilan kusam/datar. Jaringan biologis bersifat dielektrik (metalness 0).
//
// Batas: modul ini hanya mengubah cara cahaya dipantulkan (kilap basah, sheen
// serat). Warna dasar dari sumber TIDAK diubah, dan tidak ada geometri, tekstur,
// atau detail anatomi yang ditambahkan. Nilai di bawah adalah pilihan rendering
// (estetika), bukan pengukuran optik jaringan.

export type TissueClass =
  | 'muscle'
  | 'tendon'
  | 'bone'
  | 'cartilage'
  | 'vessel'
  | 'nerve'
  | 'brain'
  | 'viscera'
  | 'mucosa'
  | 'skin'
  | 'gland'
  | 'fluid'
  | 'unknown'

export interface TissueShading {
  tissue: TissueClass
  metalness: 0
  roughness: number
  clearcoat: number
  clearcoatRoughness: number
  sheen: number
  sheenRoughness: number
}

// Urutan penting: pola lebih spesifik lebih dulu (mis. "tendon" sebelum otot,
// "pulmonary artery" adalah pembuluh, "white matter" adalah otak).
const RULES: readonly (readonly [TissueClass, RegExp])[] = [
  ['tendon', /\b(tendon|ligament|aponeuros|fascia|suture)/i],
  ['cartilage', /\b(cartilage|meniscus|disc)/i],
  ['bone', /\b(bone|vertebra|skull|teeth|tooth)/i],
  ['vessel', /\b(arter|vein|vessel|aorta|capillar)/i],
  ['nerve', /\b(nerve|plexus|ganglion)/i],
  ['brain', /\b(brain|lobe|cerebell|matter|nucleus|cortex|thalam|medulla|spinal)/i],
  ['fluid', /\b(lcr|csf|fluid)/i],
  ['mucosa', /\b(mucosa|intestine|stomach|esophag|colon)/i],
  ['gland', /\b(gland|lymph|thyroid|adrenal|spleen)/i],
  ['skin', /\b(skin|nail|hair)/i],
  ['viscera', /\b(organ|peritoneum|liver|kidney|lung|heart|gallbladder|bladder|pancrea)/i],
  [
    'muscle',
    /\b(muscle|rotat|flexion|extension|levator|depressor|orbicularis|constrictor|phonation|trapezius|abduct|adduct|sphincter)/i,
  ],
]

type Params = Omit<TissueShading, 'tissue' | 'metalness'>

// Kilap basah (clearcoat) untuk permukaan berlendir/serosa; sheen untuk
// jaringan berserat yang menghamburkan cahaya di sudut tajam.
const PARAMS: Record<TissueClass, Params> = {
  muscle: { roughness: 0.52, clearcoat: 0.25, clearcoatRoughness: 0.35, sheen: 0.6, sheenRoughness: 0.45 },
  tendon: { roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.3, sheen: 0.35, sheenRoughness: 0.4 },
  bone: { roughness: 0.68, clearcoat: 0.05, clearcoatRoughness: 0.6, sheen: 0, sheenRoughness: 1 },
  cartilage: { roughness: 0.3, clearcoat: 0.55, clearcoatRoughness: 0.2, sheen: 0, sheenRoughness: 1 },
  vessel: { roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.2, sheen: 0, sheenRoughness: 1 },
  nerve: { roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.3, sheen: 0.4, sheenRoughness: 0.5 },
  brain: { roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.3, sheen: 0, sheenRoughness: 1 },
  viscera: { roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.18, sheen: 0, sheenRoughness: 1 },
  mucosa: { roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.15, sheen: 0, sheenRoughness: 1 },
  skin: { roughness: 0.6, clearcoat: 0.1, clearcoatRoughness: 0.5, sheen: 0.3, sheenRoughness: 0.7 },
  gland: { roughness: 0.45, clearcoat: 0.45, clearcoatRoughness: 0.25, sheen: 0, sheenRoughness: 1 },
  fluid: { roughness: 0.15, clearcoat: 0.8, clearcoatRoughness: 0.1, sheen: 0, sheenRoughness: 1 },
  // Fail closed: jenis tak dikenal tetap dielektrik netral, tanpa efek tambahan.
  unknown: { roughness: 0.6, clearcoat: 0, clearcoatRoughness: 1, sheen: 0, sheenRoughness: 1 },
}

export function classifyTissue(materialName: unknown): TissueClass {
  if (typeof materialName !== 'string') return 'unknown'
  const name = materialName.replace(/^Flat_/, '').trim()
  if (!name) return 'unknown'
  for (const [tissue, pattern] of RULES) if (pattern.test(name)) return tissue
  return 'unknown'
}

export function tissueShading(materialName: unknown): TissueShading {
  const tissue = classifyTissue(materialName)
  return { tissue, metalness: 0, ...PARAMS[tissue] }
}
