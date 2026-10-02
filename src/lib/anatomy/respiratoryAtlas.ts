import type { AtlasNode, AtlasProvenance } from './atlasKernel'

const SHIPPED: AtlasProvenance = {
  sourceId: 'z-anatomy-shipped-glb-index',
  sourceRevision: 'panacea-body-index-2026-09-09',
  license: 'CC BY-SA 4.0',
  sourceLocator: 'public/anatomy/*.glb + src/lib/bodyIndex.gen.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Engineering graph/source-node mapping only; final anatomy review remains human.',
}

const REFERENCE: AtlasProvenance = {
  sourceId: 'panacea-respiratory-reference-scaffold',
  sourceRevision: '2026-09-09-r1',
  license: 'Internal educational metadata scaffold; no unverified third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/respiratoryAtlas.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Educational topology and physiology bridge require qualified anatomy/respiratory review.',
}

function resp(input: Omit<AtlasNode, 'system' | 'provenance' | 'educationalPriority'> & { provenance?: AtlasProvenance; educationalPriority?: number }): AtlasNode {
  return {
    system: 'respiratory',
    provenance: input.provenance ?? SHIPPED,
    educationalPriority: input.educationalPriority ?? 0.9,
    ...input,
  }
}

interface SegmentDefinition {
  id: string
  label: string
  side: 'left' | 'right'
  lobeId: string
  bronchusHints: readonly string[]
}

const SEGMENTS: readonly SegmentDefinition[] = [
  { id: 'r-s1', label: 'Right S1 apical segment', side: 'right', lobeId: 'resp:right-upper-lobe', bronchusHints: ['Apical segmental bronchus of right lung', 'apical segmental bronchus'] },
  { id: 'r-s2', label: 'Right S2 posterior segment', side: 'right', lobeId: 'resp:right-upper-lobe', bronchusHints: ['Posterior segmental bronchus of right lung'] },
  { id: 'r-s3', label: 'Right S3 anterior segment', side: 'right', lobeId: 'resp:right-upper-lobe', bronchusHints: ['Anterior segmental bronchus of right lung'] },
  { id: 'r-s4', label: 'Right S4 lateral segment', side: 'right', lobeId: 'resp:right-middle-lobe', bronchusHints: ['Lateral segmental bronchus of right lung'] },
  { id: 'r-s5', label: 'Right S5 medial segment', side: 'right', lobeId: 'resp:right-middle-lobe', bronchusHints: ['Medial segmental bronchus of right lung'] },
  { id: 'r-s6', label: 'Right S6 superior segment', side: 'right', lobeId: 'resp:right-lower-lobe', bronchusHints: ['Superior segmental bronchus of right lung'] },
  { id: 'r-s7', label: 'Right S7 medial basal segment', side: 'right', lobeId: 'resp:right-lower-lobe', bronchusHints: ['medial basal segmental bronchus of right lung', 'medial basal segmental bronchus'] },
  { id: 'r-s8', label: 'Right S8 anterior basal segment', side: 'right', lobeId: 'resp:right-lower-lobe', bronchusHints: ['anterior basal segmental bronchus of right lung'] },
  { id: 'r-s9', label: 'Right S9 lateral basal segment', side: 'right', lobeId: 'resp:right-lower-lobe', bronchusHints: ['lateral basal segmental bronchus of right lung'] },
  { id: 'r-s10', label: 'Right S10 posterior basal segment', side: 'right', lobeId: 'resp:right-lower-lobe', bronchusHints: ['posterior basal segmental bronchus of right lung'] },
  { id: 'l-s1-2', label: 'Left S1+2 apicoposterior segment', side: 'left', lobeId: 'resp:left-upper-lobe', bronchusHints: ['Apicoposterior segmental bronchus of left lung', 'Apicoposterior segmental bronchus of left lung', 'Apicoposterior segmental bronchus of left lung'] },
  { id: 'l-s3', label: 'Left S3 anterior segment', side: 'left', lobeId: 'resp:left-upper-lobe', bronchusHints: ['Anterior segmental bronchus of left lung'] },
  { id: 'l-s4', label: 'Left S4 superior lingular segment', side: 'left', lobeId: 'resp:left-upper-lobe', bronchusHints: ['superior lingular segmental bronchus'] },
  { id: 'l-s5', label: 'Left S5 inferior lingular segment', side: 'left', lobeId: 'resp:left-upper-lobe', bronchusHints: ['inferior lingular segmental bronchus'] },
  { id: 'l-s6', label: 'Left S6 superior segment', side: 'left', lobeId: 'resp:left-lower-lobe', bronchusHints: ['Superior segmental bronchus of left lung'] },
  { id: 'l-s7-8', label: 'Left S7+8 anteromedial basal segment', side: 'left', lobeId: 'resp:left-lower-lobe', bronchusHints: ['anteromedial basal segmental bronchus of left lung', 'anterior basal segmental bronchus of left lung', 'medial basal segmental bronchus of left lung'] },
  { id: 'l-s9', label: 'Left S9 lateral basal segment', side: 'left', lobeId: 'resp:left-lower-lobe', bronchusHints: ['lateral basal segmental bronchus of left lung'] },
  { id: 'l-s10', label: 'Left S10 posterior basal segment', side: 'left', lobeId: 'resp:left-lower-lobe', bronchusHints: ['posterior basal segmental bronchus of left lung'] },
]

const lobeSegmentIds = (lobeId: string) => SEGMENTS.filter((segment) => segment.lobeId === lobeId).map((segment) => `resp:segment:${segment.id}`)

const LOBAR_BRONCHUS_BY_LOBE = {
  'resp:right-upper-lobe': 'resp:right-upper-lobar-bronchus',
  'resp:right-middle-lobe': 'resp:right-middle-lobar-bronchus',
  'resp:right-lower-lobe': 'resp:right-lower-lobar-bronchus',
  'resp:left-upper-lobe': 'resp:left-upper-lobar-bronchus',
  'resp:left-lower-lobe': 'resp:left-lower-lobar-bronchus',
} as const

const segmentNodes: readonly AtlasNode[] = SEGMENTS.map((segment) => resp({
  id: `resp:segment:${segment.id}`,
  label: segment.label,
  regions: ['thorax'],
  laterality: segment.side,
  scale: 'suborgan',
  parentId: segment.lobeId,
  source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: segment.bronchusHints },
  geometryStatus: 'partial',
  educationalPriority: 0.92,
  physiologyCapable: true,
  surgicalLandmark: true,
  relations: [
    {
      kind: 'continuous-with',
      targetId: LOBAR_BRONCHUS_BY_LOBE[segment.lobeId as keyof typeof LOBAR_BRONCHUS_BY_LOBE],
      note: 'Airway continuity follows the lobar bronchus; parenchymal lobe containment remains represented by parentId.',
    },
    { kind: 'supplies', targetId: segment.lobeId, note: 'Segmental airway topology for educational bronchoscopy/segment localization.' },
  ],
}))

export const RESPIRATORY_ATLAS_NODES: readonly AtlasNode[] = [
  // Upper-airway rendering is a source-backed composition, not a single mesh.
  // Every hint below is an exact shipped source identity. Child organ nodes keep
  // their own completeness state, so this aggregate does not promote an
  // incomplete nasal cavity, pharynx or larynx to anatomically complete.
  resp({ id: 'resp:upper-airway', label: 'Upper airway', regions: ['head', 'neck'], laterality: 'midline', scale: 'organ', parentId: 'system:respiratory', children: ['resp:nasal-cavity', 'resp:pharynx', 'resp:larynx'], source: { mode: 'composite', files: ['visceral.glb', 'skeletal.glb'], nodeHints: ['Mucosa of nasal cavity', 'Laryngopharynx', 'Epiglottis', 'Thyroid cartilage', 'Cricoid cartilage', 'Arytenoid cartilage'] }, geometryStatus: 'shipped', physiologyCapable: true }),
  // The shipped atlas contains more nasal-cavity geometry than the former
  // mucosa-only binding exposed: septal cartilage, inferior conchae and nasal
  // bones are present in the same indexed whole-body frame. This remains
  // partial because the current source does not separately establish every
  // gross nasal-cavity component required for a completeness claim.
  resp({ id: 'resp:nasal-cavity', label: 'Nasal cavity', regions: ['head'], laterality: 'bilateral', scale: 'organ', parentId: 'resp:upper-airway', source: { mode: 'composite', files: ['visceral.glb', 'skeletal.glb'], nodeHints: ['Mucosa of nasal cavity', 'Nasal septal cartilage', 'Inferior nasal concha bone', 'Nasal bone'] }, geometryStatus: 'partial', physiologyCapable: true }),
  // Only the laryngopharynx has a direct cavity mesh in the shipped index.
  // Keeping the whole pharynx partial prevents a broad label from silently
  // claiming nasopharyngeal/oropharyngeal geometry that is not independently
  // represented by the current source assets.
  resp({ id: 'resp:pharynx', label: 'Pharynx', regions: ['head', 'neck'], laterality: 'midline', scale: 'organ', parentId: 'resp:upper-airway', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Laryngopharynx'] }, geometryStatus: 'partial', physiologyCapable: true }),
  // Laryngeal source coverage spans epiglottis plus major cartilages in the
  // shipped visceral/skeletal bundles. It remains partial because a dedicated
  // complete larynx/vocal-fold mesh is not present in the indexed assets.
  resp({ id: 'resp:larynx', label: 'Larynx', regions: ['neck'], laterality: 'midline', scale: 'organ', parentId: 'resp:upper-airway', children: ['resp:trachea'], source: { mode: 'composite', files: ['visceral.glb', 'skeletal.glb'], nodeHints: ['Epiglottis', 'Thyroid cartilage', 'Cricoid cartilage', 'Arytenoid cartilage', 'Corniculate cartilage'] }, geometryStatus: 'partial', educationalPriority: 0.95, physiologyCapable: true, surgicalLandmark: true }),
  resp({ id: 'resp:trachea', label: 'Trachea', regions: ['neck', 'thorax'], laterality: 'midline', scale: 'organ', parentId: 'resp:larynx', children: ['resp:carina'], source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['trachea'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true }),
  // Karina adalah rigi di dalam percabangan trakea, dan bundel ini tidak
  // memuatnya sebagai objek tersendiri -- yang ada hanya 'Trachea'. Petunjuk
  // sumbernya dikosongkan supaya tidak mengaku punya geometri yang tidak
  // pernah ditemukan, dan statusnya menjadi 'reference-only': simpul ini
  // membawa topologi (trakea bercabang menjadi dua bronkus utama), bukan mesh.
  //
  // surgicalLandmark TETAP true. Sempat dicabut dengan alasan "patokan yang
  // tidak bisa dilihat menyesatkan", dan itu keliru: karina memang patokan
  // bronkoskopi yang nyata, dan itu fakta klinis yang tidak bergantung pada
  // ada-tidaknya mesh. Model ini sudah punya medan terpisah untuk geometri.
  // Mencabut penandanya menggabungkan dua hal yang berbeda dan memerahkan uji
  // pencarian patokan bedah yang memang benar.
  resp({ id: 'resp:carina', label: 'Carina', regions: ['thorax'], laterality: 'midline', scale: 'suborgan', parentId: 'resp:trachea', children: ['resp:right-main-bronchus', 'resp:left-main-bronchus'], source: { mode: 'specific-fallback', files: [], nodeHints: [] }, geometryStatus: 'reference-only', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true }),
  resp({ id: 'resp:right-main-bronchus', label: 'Right main bronchus', regions: ['thorax'], laterality: 'right', scale: 'suborgan', parentId: 'resp:carina', children: ['resp:right-upper-lobar-bronchus', 'resp:bronchus-intermedius'], source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['right main bronchus', 'Right main bronchus'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true }),
  resp({ id: 'resp:left-main-bronchus', label: 'Left main bronchus', regions: ['thorax'], laterality: 'left', scale: 'suborgan', parentId: 'resp:carina', children: ['resp:left-upper-lobar-bronchus', 'resp:left-lower-lobar-bronchus'], source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['left main bronchus', 'Left main bronchus'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true }),

  // Airway hierarchy is distinct from lung-parenchyma containment. Five lobar
  // bronchi are exact shipped source meshes. Bronchus intermedius is retained
  // as reference topology only because the current source bundle has no exact
  // independently named mesh for it.
  resp({ id: 'resp:right-upper-lobar-bronchus', label: 'Right upper lobar bronchus', regions: ['thorax'], laterality: 'right', scale: 'suborgan', parentId: 'resp:right-main-bronchus', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Right superior lobar bronchus'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true, relations: [{ kind: 'supplies', targetId: 'resp:right-upper-lobe' }] }),
  resp({ id: 'resp:bronchus-intermedius', label: 'Bronchus intermedius', regions: ['thorax'], laterality: 'right', scale: 'suborgan', parentId: 'resp:right-main-bronchus', children: ['resp:right-middle-lobar-bronchus', 'resp:right-lower-lobar-bronchus'], source: { mode: 'specific-fallback', files: [], nodeHints: [] }, provenance: REFERENCE, geometryStatus: 'reference-only', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true }),
  resp({ id: 'resp:right-middle-lobar-bronchus', label: 'Right middle lobar bronchus', regions: ['thorax'], laterality: 'right', scale: 'suborgan', parentId: 'resp:bronchus-intermedius', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Middle lobar bronchus.r'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true, relations: [{ kind: 'supplies', targetId: 'resp:right-middle-lobe' }] }),
  resp({ id: 'resp:right-lower-lobar-bronchus', label: 'Right lower lobar bronchus', regions: ['thorax'], laterality: 'right', scale: 'suborgan', parentId: 'resp:bronchus-intermedius', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Right inferior lobar bronchus'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true, relations: [{ kind: 'supplies', targetId: 'resp:right-lower-lobe' }] }),
  resp({ id: 'resp:left-upper-lobar-bronchus', label: 'Left upper lobar bronchus', regions: ['thorax'], laterality: 'left', scale: 'suborgan', parentId: 'resp:left-main-bronchus', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Left superior lobar bronchus'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true, relations: [{ kind: 'supplies', targetId: 'resp:left-upper-lobe' }] }),
  resp({ id: 'resp:left-lower-lobar-bronchus', label: 'Left lower lobar bronchus', regions: ['thorax'], laterality: 'left', scale: 'suborgan', parentId: 'resp:left-main-bronchus', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Left inferior lobar bronchus'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true, relations: [{ kind: 'supplies', targetId: 'resp:left-lower-lobe' }] }),

  resp({ id: 'resp:lungs', label: 'Lungs', regions: ['thorax'], laterality: 'paired', scale: 'organ', parentId: 'system:respiratory', children: ['resp:right-lung', 'resp:left-lung', 'resp:pleura', 'resp:alveolar-capillary-unit'], source: { mode: 'composite', files: ['visceral.glb'], nodeHints: ['right lung', 'left lung'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true, relations: [{ kind: 'adjacent-to', targetId: 'resp:diaphragm' }, { kind: 'adjacent-to', targetId: 'cv:heart' }] }),
  resp({ id: 'resp:right-lung', label: 'Right lung', regions: ['thorax'], laterality: 'right', scale: 'organ', parentId: 'resp:lungs', children: ['resp:right-upper-lobe', 'resp:right-middle-lobe', 'resp:right-lower-lobe'], source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['right lung'] }, geometryStatus: 'shipped', physiologyCapable: true, surgicalLandmark: true }),
  resp({ id: 'resp:left-lung', label: 'Left lung', regions: ['thorax'], laterality: 'left', scale: 'organ', parentId: 'resp:lungs', children: ['resp:left-upper-lobe', 'resp:left-lower-lobe'], source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['left lung'] }, geometryStatus: 'shipped', physiologyCapable: true, surgicalLandmark: true }),
  resp({ id: 'resp:right-upper-lobe', label: 'Right upper lobe', regions: ['thorax'], laterality: 'right', scale: 'suborgan', parentId: 'resp:right-lung', children: lobeSegmentIds('resp:right-upper-lobe'), source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Superior lobe of right lung'] }, geometryStatus: 'partial', physiologyCapable: true, surgicalLandmark: true }),
  resp({ id: 'resp:right-middle-lobe', label: 'Right middle lobe', regions: ['thorax'], laterality: 'right', scale: 'suborgan', parentId: 'resp:right-lung', children: lobeSegmentIds('resp:right-middle-lobe'), source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['middle lobe of right lung', 'right middle lobe'] }, geometryStatus: 'partial', physiologyCapable: true, surgicalLandmark: true }),
  resp({ id: 'resp:right-lower-lobe', label: 'Right lower lobe', regions: ['thorax'], laterality: 'right', scale: 'suborgan', parentId: 'resp:right-lung', children: lobeSegmentIds('resp:right-lower-lobe'), source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Inferior lobe of right lung'] }, geometryStatus: 'partial', physiologyCapable: true, surgicalLandmark: true }),
  resp({ id: 'resp:left-upper-lobe', label: 'Left upper lobe', regions: ['thorax'], laterality: 'left', scale: 'suborgan', parentId: 'resp:left-lung', children: lobeSegmentIds('resp:left-upper-lobe'), source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Superior lobe of left lung'] }, geometryStatus: 'partial', physiologyCapable: true, surgicalLandmark: true }),
  resp({ id: 'resp:left-lower-lobe', label: 'Left lower lobe', regions: ['thorax'], laterality: 'left', scale: 'suborgan', parentId: 'resp:left-lung', children: lobeSegmentIds('resp:left-lower-lobe'), source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Inferior lobe of left lung'] }, geometryStatus: 'partial', physiologyCapable: true, surgicalLandmark: true }),

  resp({ id: 'resp:pleura', label: 'Pleural envelope', regions: ['thorax'], laterality: 'bilateral', scale: 'tissue', parentId: 'resp:lungs', children: ['resp:visceral-pleura', 'resp:parietal-pleura'], source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['pleura'] }, geometryStatus: 'partial', educationalPriority: 0.95, physiologyCapable: true, surgicalLandmark: true }),
  resp({ id: 'resp:visceral-pleura', label: 'Visceral pleura', regions: ['thorax'], laterality: 'bilateral', scale: 'tissue', parentId: 'resp:pleura', source: { mode: 'specific-fallback', nodeHints: ['visceral pleura'] }, provenance: REFERENCE, geometryStatus: 'reference-only', educationalPriority: 0.85, surgicalLandmark: true }),
  resp({ id: 'resp:parietal-pleura', label: 'Parietal pleura', regions: ['thorax'], laterality: 'bilateral', scale: 'tissue', parentId: 'resp:pleura', source: { mode: 'specific-fallback', nodeHints: ['parietal pleura'] }, provenance: REFERENCE, geometryStatus: 'reference-only', educationalPriority: 0.85, surgicalLandmark: true }),
  resp({ id: 'resp:diaphragm', label: 'Diaphragm', regions: ['thorax', 'abdomen'], laterality: 'bilateral', scale: 'organ', parentId: 'system:respiratory', source: { mode: 'specific-fallback', files: ['muscular.glb'], nodeHints: ['diaphragm'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true, relations: [{ kind: 'moves-with', targetId: 'resp:lungs' }] }),

  ...segmentNodes,

  resp({ id: 'resp:alveolar-capillary-unit', label: 'Alveolar-capillary gas-exchange unit', regions: ['thorax'], laterality: 'bilateral', scale: 'microstructure', parentId: 'resp:lungs', children: ['resp:alveolar-airspace', 'resp:alveolar-epithelium', 'resp:interstitium', 'resp:capillary'], source: { mode: 'specific-fallback', nodeHints: ['alveolus'] }, provenance: REFERENCE, geometryStatus: 'reference-only', educationalPriority: 1, physiologyCapable: true, relations: [{ kind: 'continuous-with', targetId: 'cv:pulmonary-trunk' }] }),
  resp({ id: 'resp:alveolar-airspace', label: 'Alveolar airspace', regions: ['thorax'], laterality: 'not-applicable', scale: 'microstructure', parentId: 'resp:alveolar-capillary-unit', source: { mode: 'specific-fallback', nodeHints: ['alveolar airspace'] }, provenance: REFERENCE, geometryStatus: 'reference-only', educationalPriority: 0.95, physiologyCapable: true }),
  resp({ id: 'resp:alveolar-epithelium', label: 'Alveolar epithelium', regions: ['thorax'], laterality: 'not-applicable', scale: 'microstructure', parentId: 'resp:alveolar-capillary-unit', source: { mode: 'specific-fallback', nodeHints: ['alveolar epithelium'] }, provenance: REFERENCE, geometryStatus: 'reference-only', educationalPriority: 0.95, physiologyCapable: true }),
  resp({ id: 'resp:interstitium', label: 'Alveolar interstitium', regions: ['thorax'], laterality: 'not-applicable', scale: 'microstructure', parentId: 'resp:alveolar-capillary-unit', source: { mode: 'specific-fallback', nodeHints: ['alveolar interstitium'] }, provenance: REFERENCE, geometryStatus: 'reference-only', educationalPriority: 0.9, physiologyCapable: true }),
  resp({ id: 'resp:capillary', label: 'Pulmonary capillary', regions: ['thorax'], laterality: 'not-applicable', scale: 'microstructure', parentId: 'resp:alveolar-capillary-unit', source: { mode: 'specific-fallback', nodeHints: ['pulmonary capillary'] }, provenance: REFERENCE, geometryStatus: 'reference-only', educationalPriority: 0.95, physiologyCapable: true }),
]

export const RESPIRATORY_SEGMENT_IDS = SEGMENTS.map((segment) => `resp:segment:${segment.id}`)
