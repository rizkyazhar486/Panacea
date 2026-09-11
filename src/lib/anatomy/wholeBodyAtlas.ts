import type { AtlasManifest, AtlasNode, AtlasProvenance, AtlasSystemId } from './atlasKernel'

const Z_ANATOMY: AtlasProvenance = {
  sourceId: 'z-anatomy-shipped-glb-index',
  sourceRevision: 'panacea-body-index-2026-09-09',
  license: 'CC BY-SA 4.0',
  sourceLocator: 'public/anatomy/*.glb + src/lib/bodyIndex.gen.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Engineering source-node mapping only; anatomical content requires qualified human review.',
}

const REFERENCE_ONLY: AtlasProvenance = {
  sourceId: 'panacea-atlas-reference-scaffold',
  sourceRevision: '2026-09-09-r1',
  license: 'Internal metadata scaffold; no third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/wholeBodyAtlas.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Structural graph scaffold only.',
}

function node(input: Omit<AtlasNode, 'provenance' | 'educationalPriority'> & { provenance?: AtlasProvenance; educationalPriority?: number }): AtlasNode {
  return {
    educationalPriority: input.educationalPriority ?? 0.7,
    provenance: input.provenance ?? Z_ANATOMY,
    ...input,
  }
}

const systemRoots: readonly AtlasNode[] = [
  ['surface', 'Integumentary surface', ['surface'], ['whole-body'], ['skin', 'surface']],
  ['skeletal', 'Skeletal system', ['skeletal'], ['whole-body'], ['bone', 'skeleton']],
  ['articular', 'Articular system', ['skeletal'], ['whole-body'], ['joint', 'cartilage', 'ligament']],
  ['muscular', 'Muscular system', ['muscular'], ['whole-body'], ['muscle']],
  ['cardiovascular', 'Cardiovascular system', ['cardiovascular'], ['whole-body'], ['heart', 'artery', 'vein']],
  ['lymphatic', 'Lymphatic system', ['lymphoid'], ['whole-body'], ['nodes', 'Spleen', 'thymus']],
  ['nervous', 'Nervous system', ['nervous'], ['whole-body'], ['brain', 'spinal cord', 'nerve']],
  ['respiratory', 'Respiratory system', ['visceral'], ['head', 'neck', 'thorax'], ['trachea', 'bronch', 'lung']],
  ['digestive', 'Digestive system', ['visceral'], ['head', 'neck', 'thorax', 'abdomen', 'pelvis'], ['esophagus', 'stomach', 'intestine', 'liver']],
  ['urinary', 'Urinary system', ['visceral'], ['abdomen', 'pelvis'], ['kidney', 'ureter', 'urinary bladder']],
  ['endocrine', 'Endocrine system', ['visceral'], ['head', 'neck', 'thorax', 'abdomen', 'pelvis'], ['hypophysis', 'thyroid', 'suprarenal', 'pancreas']],
  ['reproductive', 'Reproductive system', ['visceral'], ['pelvis'], ['prostate', 'testis', 'uterus', 'ovary']],
  ['sensory', 'Special sensory organs', ['nervous', 'visceral'], ['head'], ['eye', 'cochlea', 'vestibular']],
  ['fascial', 'Fascial and connective planes', ['surface', 'muscular'], ['whole-body'], ['fascia', 'aponeurosis']],
].map(([id, label, files, regions, hints]) => node({
  id: `system:${id}`,
  label: label as string,
  system: id as AtlasSystemId,
  regions: regions as AtlasNode['regions'],
  laterality: 'not-applicable',
  scale: 'organism',
  children: [],
  source: { mode: 'composite', files: (files as string[]).map((file) => `${file}.glb`), nodeHints: hints as string[] },
  geometryStatus: id === 'articular' || id === 'fascial' ? 'partial' : 'shipped',
  educationalPriority: 0.9,
}))

const regionNodes: readonly AtlasNode[] = [
  node({ id: 'region:head', label: 'Head', system: 'surface', regions: ['head'], laterality: 'midline', scale: 'region', source: { mode: 'specific-fallback', nodeHints: ['head', 'skull'] }, geometryStatus: 'shipped', educationalPriority: 0.85 }),
  node({ id: 'region:neck', label: 'Neck', system: 'surface', regions: ['neck'], laterality: 'midline', scale: 'region', source: { mode: 'specific-fallback', nodeHints: ['neck', 'cervical'] }, geometryStatus: 'shipped', educationalPriority: 0.8 }),
  node({ id: 'region:thorax', label: 'Thorax', system: 'surface', regions: ['thorax'], laterality: 'midline', scale: 'region', source: { mode: 'specific-fallback', nodeHints: ['thorax', 'rib'] }, geometryStatus: 'shipped', educationalPriority: 0.9 }),
  node({ id: 'region:abdomen', label: 'Abdomen', system: 'surface', regions: ['abdomen'], laterality: 'midline', scale: 'region', source: { mode: 'specific-fallback', nodeHints: ['abdominal', 'abdomen'] }, geometryStatus: 'shipped', educationalPriority: 0.9 }),
  node({ id: 'region:pelvis', label: 'Pelvis', system: 'surface', regions: ['pelvis'], laterality: 'midline', scale: 'region', source: { mode: 'specific-fallback', nodeHints: ['pelvis', 'pelvic'] }, geometryStatus: 'shipped', educationalPriority: 0.85 }),
  node({ id: 'region:back', label: 'Back', system: 'surface', regions: ['back'], laterality: 'midline', scale: 'region', source: { mode: 'specific-fallback', nodeHints: ['vertebra', 'back'] }, geometryStatus: 'shipped', educationalPriority: 0.8 }),
  node({ id: 'region:upper-limb', label: 'Upper limb', system: 'surface', regions: ['upper-limb', 'hand'], laterality: 'bilateral', scale: 'region', source: { mode: 'composite', nodeHints: ['humerus', 'radius', 'ulna', 'hand'] }, geometryStatus: 'shipped', educationalPriority: 0.85 }),
  node({ id: 'region:lower-limb', label: 'Lower limb', system: 'surface', regions: ['lower-limb', 'foot'], laterality: 'bilateral', scale: 'region', source: { mode: 'composite', nodeHints: ['femur', 'tibia', 'fibula', 'foot'] }, geometryStatus: 'shipped', educationalPriority: 0.85 }),
]

const majorNodes: readonly AtlasNode[] = [
  node({ id: 'cv:heart', label: 'Heart', system: 'cardiovascular', regions: ['thorax'], laterality: 'midline', scale: 'organ', parentId: 'system:cardiovascular', children: ['cv:aorta', 'cv:pulmonary-trunk', 'cv:coronary'], source: { mode: 'specific-fallback', files: ['cardiovascular.glb'], nodeHints: ['heart'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true, relations: [{ kind: 'continuous-with', targetId: 'cv:aorta' }, { kind: 'continuous-with', targetId: 'cv:pulmonary-trunk' }] }),
  node({ id: 'cv:aorta', label: 'Aorta', system: 'cardiovascular', regions: ['thorax', 'abdomen', 'pelvis'], laterality: 'midline', scale: 'organ', parentId: 'cv:heart', source: { mode: 'composite', files: ['cardiovascular.glb'], nodeHints: ['ascending aorta', 'aortic arch', 'thoracic aorta', 'abdominal aorta'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true }),
  node({ id: 'cv:pulmonary-trunk', label: 'Pulmonary trunk and arteries', system: 'cardiovascular', regions: ['thorax'], laterality: 'paired', scale: 'suborgan', parentId: 'cv:heart', source: { mode: 'composite', files: ['cardiovascular.glb'], nodeHints: ['pulmonary trunk', 'pulmonary artery'] }, geometryStatus: 'shipped', educationalPriority: 0.95, physiologyCapable: true }),
  node({ id: 'cv:coronary', label: 'Coronary arterial tree', system: 'cardiovascular', regions: ['thorax'], laterality: 'paired', scale: 'suborgan', parentId: 'cv:heart', source: { mode: 'composite', files: ['cardiovascular.glb'], nodeHints: ['right coronary artery', 'left coronary artery', 'anterior interventricular'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true }),

  node({ id: 'neuro:brain', label: 'Brain', system: 'nervous', regions: ['head'], laterality: 'bilateral', scale: 'organ', parentId: 'system:nervous', children: ['neuro:brainstem', 'neuro:cerebellum', 'neuro:spinal-cord'], source: { mode: 'composite', files: ['nervous.glb'], nodeHints: ['cerebrum', 'brain'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true }),
  node({ id: 'neuro:brainstem', label: 'Brainstem', system: 'nervous', regions: ['head'], laterality: 'midline', scale: 'suborgan', parentId: 'neuro:brain', source: { mode: 'composite', files: ['nervous.glb'], nodeHints: ['midbrain', 'pons', 'medulla oblongata'] }, geometryStatus: 'shipped', educationalPriority: 0.95, physiologyCapable: true }),
  node({ id: 'neuro:cerebellum', label: 'Cerebellum', system: 'nervous', regions: ['head'], laterality: 'bilateral', scale: 'suborgan', parentId: 'neuro:brain', source: { mode: 'specific-fallback', files: ['nervous.glb'], nodeHints: ['cerebellum'] }, geometryStatus: 'shipped', educationalPriority: 0.9, physiologyCapable: true }),
  node({ id: 'neuro:spinal-cord', label: 'Spinal cord', system: 'nervous', regions: ['neck', 'thorax', 'abdomen', 'back'], laterality: 'midline', scale: 'organ', parentId: 'neuro:brain', source: { mode: 'specific-fallback', files: ['nervous.glb'], nodeHints: ['spinal cord'] }, geometryStatus: 'shipped', educationalPriority: 1, physiologyCapable: true, surgicalLandmark: true }),

  node({ id: 'gi:liver', label: 'Liver', system: 'digestive', regions: ['abdomen'], laterality: 'right', scale: 'organ', parentId: 'system:digestive', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['liver'] }, geometryStatus: 'shipped', educationalPriority: 0.95, physiologyCapable: true, surgicalLandmark: true }),
  node({ id: 'gi:stomach', label: 'Stomach', system: 'digestive', regions: ['abdomen'], laterality: 'left', scale: 'organ', parentId: 'system:digestive', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['stomach'] }, geometryStatus: 'shipped', educationalPriority: 0.9, physiologyCapable: true, surgicalLandmark: true }),
  node({ id: 'gi:small-intestine', label: 'Small intestine', system: 'digestive', regions: ['abdomen', 'pelvis'], laterality: 'midline', scale: 'organ', parentId: 'system:digestive', source: { mode: 'composite', files: ['visceral.glb'], nodeHints: ['duodenum', 'jejunum', 'ileum'] }, geometryStatus: 'shipped', educationalPriority: 0.9, physiologyCapable: true }),
  node({ id: 'gi:large-intestine', label: 'Large intestine', system: 'digestive', regions: ['abdomen', 'pelvis'], laterality: 'midline', scale: 'organ', parentId: 'system:digestive', source: { mode: 'composite', files: ['visceral.glb'], nodeHints: ['cecum', 'ascending colon', 'transverse colon', 'descending colon', 'sigmoid colon', 'rectum'] }, geometryStatus: 'shipped', educationalPriority: 0.9, physiologyCapable: true }),
  node({ id: 'gi:pancreas', label: 'Pancreas', system: 'digestive', regions: ['abdomen'], laterality: 'midline', scale: 'organ', parentId: 'system:digestive', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['pancreas'] }, geometryStatus: 'shipped', educationalPriority: 0.9, physiologyCapable: true, surgicalLandmark: true }),

  node({ id: 'urinary:kidneys', label: 'Kidneys', system: 'urinary', regions: ['abdomen', 'back'], laterality: 'paired', scale: 'organ', parentId: 'system:urinary', children: ['urinary:ureters'], source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['kidney'] }, geometryStatus: 'shipped', educationalPriority: 0.95, physiologyCapable: true, surgicalLandmark: true }),
  node({ id: 'urinary:ureters', label: 'Ureters', system: 'urinary', regions: ['abdomen', 'pelvis'], laterality: 'paired', scale: 'organ', parentId: 'urinary:kidneys', children: ['urinary:bladder'], source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['ureter'] }, geometryStatus: 'shipped', educationalPriority: 0.8, physiologyCapable: true }),
  node({ id: 'urinary:bladder', label: 'Urinary bladder', system: 'urinary', regions: ['pelvis'], laterality: 'midline', scale: 'organ', parentId: 'urinary:ureters', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['urinary bladder', 'bladder'] }, geometryStatus: 'shipped', educationalPriority: 0.85, physiologyCapable: true, surgicalLandmark: true }),

  node({ id: 'endo:pituitary', label: 'Pituitary gland', system: 'endocrine', regions: ['head'], laterality: 'midline', scale: 'organ', parentId: 'system:endocrine', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Adenohypophysis', 'Neurohypophysis', 'hypophysis'] }, synonyms: ['Hypophysis'], geometryStatus: 'shipped', educationalPriority: 0.85, physiologyCapable: true }),
  node({ id: 'endo:thyroid', label: 'Thyroid gland', system: 'endocrine', regions: ['neck'], laterality: 'bilateral', scale: 'organ', parentId: 'system:endocrine', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['thyroid gland', 'thyroid'] }, geometryStatus: 'shipped', educationalPriority: 0.9, physiologyCapable: true, surgicalLandmark: true }),
  node({ id: 'endo:adrenals', label: 'Adrenal glands', system: 'endocrine', regions: ['abdomen'], laterality: 'paired', scale: 'organ', parentId: 'system:endocrine', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['suprarenal gland', 'adrenal gland'] }, geometryStatus: 'shipped', educationalPriority: 0.85, physiologyCapable: true }),

  // ── Organ yang geometrinya SUDAH dikirim tetapi belum pernah dideklarasikan ──
  //
  // Gerbang cakupan melaporkan 24 dari 44 organ makro sebagai "missing". Sebagian
  // besar ternyata bukan tidak ada: bundel GLB-nya sudah ikut dikirim, hanya
  // simpul atlasnya yang tidak pernah ditulis. Jadi yang hilang adalah
  // deklarasinya, bukan meshnya.
  //
  // Setiap nodeHints di bawah dibaca LANGSUNG dari chunk JSON berkas GLB-nya,
  // bukan ditebak dari nama Latin yang sepertinya benar. Ejaannya mengikuti
  // berkasnya apa adanya -- "Oesophagus", bukan "Esophagus" -- karena pencarian
  // simpul mencocokkan teks, dan ejaan yang salah menghasilkan organ yang
  // dideklarasikan tetapi tidak pernah tampil.
  //
  // Yang TIDAK ditambahkan di sini, karena tidak ditemukan di berkas mana pun:
  // kulit, pembuluh limfa (duktus torasikus), sendi sinovial utama, bidang
  // fasia, dan organ reproduksi perempuan. Itu tetap kekurangan yang nyata dan
  // dibiarkan merah, bukan diisi supaya angkanya bagus.

  node({ id: 'lymph:spleen', label: 'Spleen', system: 'lymphatic', regions: ['abdomen'], laterality: 'left', scale: 'organ', parentId: 'system:lymphatic', source: { mode: 'specific-fallback', files: ['lymphoid.glb'], nodeHints: ['Spleen'] }, geometryStatus: 'shipped', educationalPriority: 0.9, physiologyCapable: true, surgicalLandmark: true }),
  node({ id: 'lymph:thymus', label: 'Thymus', system: 'lymphatic', regions: ['thorax'], laterality: 'bilateral', scale: 'organ', parentId: 'system:lymphatic', source: { mode: 'composite', files: ['lymphoid.glb'], nodeHints: ['Left lobe of thymus', 'Right lobe of thymus'] }, geometryStatus: 'shipped', educationalPriority: 0.75, physiologyCapable: true }),
  // Jaringan kelenjar getah bening: bundelnya memuat sekitar 150 kelompok
  // bernama. Yang didaftarkan di sini adalah kelompok regional utama, cukup
  // untuk membuat simpulnya nyata tanpa menyalin seluruh daftar.
  node({ id: 'lymph:nodes', label: 'Lymph node network', system: 'lymphatic', regions: ['whole-body'], laterality: 'bilateral', scale: 'organ', parentId: 'system:lymphatic', source: { mode: 'composite', files: ['lymphoid.glb'], nodeHints: ['Central axillary nodes', 'Apical axillary nodes', 'Superficial lateral cervical nodes', 'Submandibular nodes', 'Coeliac nodes', 'Lateral aortic nodes', 'Superomedial superficial inguinal nodes', 'Deep popliteal nodes', 'Superior tracheobronchial nodes', 'Parasternal nodes'] }, geometryStatus: 'shipped', educationalPriority: 0.8, physiologyCapable: true }),

  node({ id: 'gi:oesophagus', label: 'Esophagus', system: 'digestive', regions: ['neck', 'thorax'], laterality: 'midline', scale: 'organ', parentId: 'system:digestive', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Oesophagus'] }, synonyms: ['Oesophagus'], geometryStatus: 'shipped', educationalPriority: 0.85, physiologyCapable: true, surgicalLandmark: true }),
  node({ id: 'gi:gallbladder', label: 'Gallbladder', system: 'digestive', regions: ['abdomen'], laterality: 'right', scale: 'organ', parentId: 'gi:liver', source: { mode: 'composite', files: ['visceral.glb'], nodeHints: ['Gallbladder', 'Body of gallbladder', 'Fundus of gallbladder', 'Neck of gallbladder', 'Bile duct'] }, geometryStatus: 'shipped', educationalPriority: 0.85, physiologyCapable: true, surgicalLandmark: true }),
  node({ id: 'gi:salivary-glands', label: 'Major salivary glands', system: 'digestive', regions: ['head', 'neck'], laterality: 'paired', scale: 'organ', parentId: 'system:digestive', source: { mode: 'composite', files: ['visceral.glb'], nodeHints: ['Parotid gland', 'Submandibular gland', 'Sublingual gland'] }, geometryStatus: 'shipped', educationalPriority: 0.75, physiologyCapable: true, surgicalLandmark: true }),
  // Sengaja 'partial': berkasnya memuat lidah, palatum molle, dan uvula, tetapi
  // rongga mulut yang utuh juga menuntut gigi dan palatum durum, yang tidak ada
  // di sini. Menyebutnya 'shipped' akan menjanjikan lebih daripada yang tampil.
  node({ id: 'gi:oral-cavity', label: 'Oral cavity', system: 'digestive', regions: ['head'], laterality: 'midline', scale: 'organ', parentId: 'system:digestive', source: { mode: 'composite', files: ['visceral.glb'], nodeHints: ['Tongue', 'Soft palate', 'Uvula of palate'] }, geometryStatus: 'partial', educationalPriority: 0.8, physiologyCapable: true }),

  node({ id: 'urinary:urethra', label: 'Urethra', system: 'urinary', regions: ['pelvis'], laterality: 'midline', scale: 'organ', parentId: 'urinary:bladder', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Urethra'] }, geometryStatus: 'shipped', educationalPriority: 0.7, physiologyCapable: true }),

  node({ id: 'endo:pineal', label: 'Pineal gland', system: 'endocrine', regions: ['head'], laterality: 'midline', scale: 'organ', parentId: 'system:endocrine', source: { mode: 'specific-fallback', files: ['visceral.glb'], nodeHints: ['Pineal gland'] }, geometryStatus: 'shipped', educationalPriority: 0.7, physiologyCapable: true }),
  node({ id: 'endo:parathyroids', label: 'Parathyroid glands', system: 'endocrine', regions: ['neck'], laterality: 'paired', scale: 'organ', parentId: 'endo:thyroid', source: { mode: 'composite', files: ['visceral.glb'], nodeHints: ['Superior parathyroid gland', 'Inferior parathyroid gland'] }, geometryStatus: 'shipped', educationalPriority: 0.75, physiologyCapable: true, surgicalLandmark: true }),
  // Hipotalamus ada di bundel SARAF, bukan viseral. Mengikat berkas yang keliru
  // memberi simpul yang dideklarasikan tetapi tidak pernah tampil.
  node({ id: 'endo:hypothalamus', label: 'Hypothalamus', system: 'endocrine', regions: ['head'], laterality: 'midline', scale: 'organ', parentId: 'system:endocrine', source: { mode: 'specific-fallback', files: ['nervous.glb'], nodeHints: ['Hypothalamus'] }, geometryStatus: 'shipped', educationalPriority: 0.85, physiologyCapable: true }),

  node({ id: 'msk:spine', label: 'Vertebral column', system: 'skeletal', regions: ['neck', 'thorax', 'abdomen', 'back', 'pelvis'], laterality: 'midline', scale: 'organ', parentId: 'system:skeletal', source: { mode: 'composite', files: ['skeletal.glb'], nodeHints: ['cervical vertebra', 'thoracic vertebra', 'lumbar vertebra', 'sacrum'] }, geometryStatus: 'shipped', educationalPriority: 0.95, surgicalLandmark: true }),
  node({ id: 'msk:shoulder-complex', label: 'Shoulder complex', system: 'articular', regions: ['upper-limb'], laterality: 'paired', scale: 'organ', parentId: 'system:articular', source: { mode: 'composite', files: ['skeletal.glb', 'muscular.glb'], nodeHints: ['scapula', 'clavicle', 'humerus', 'deltoid', 'supraspinatus', 'infraspinatus'] }, geometryStatus: 'partial', educationalPriority: 0.9, physiologyCapable: true, surgicalLandmark: true }),
  node({ id: 'msk:knee-complex', label: 'Knee complex', system: 'articular', regions: ['lower-limb'], laterality: 'paired', scale: 'organ', parentId: 'system:articular', source: { mode: 'composite', files: ['skeletal.glb', 'muscular.glb'], nodeHints: ['femur', 'tibia', 'patella', 'quadriceps', 'popliteus'] }, geometryStatus: 'partial', educationalPriority: 0.95, physiologyCapable: true, surgicalLandmark: true }),
]

const referenceOnlyNodes: readonly AtlasNode[] = [
  node({ id: 'micro:alveolus', label: 'Alveolar-capillary unit', system: 'respiratory', regions: ['thorax'], laterality: 'bilateral', scale: 'microstructure', parentId: 'resp:lungs', source: { mode: 'specific-fallback', nodeHints: ['alveolus'] }, provenance: REFERENCE_ONLY, geometryStatus: 'reference-only', educationalPriority: 0.95, physiologyCapable: true }),
  node({ id: 'micro:nephron', label: 'Nephron', system: 'urinary', regions: ['abdomen'], laterality: 'paired', scale: 'microstructure', parentId: 'urinary:kidneys', source: { mode: 'specific-fallback', nodeHints: ['nephron'] }, provenance: REFERENCE_ONLY, geometryStatus: 'reference-only', educationalPriority: 0.9, physiologyCapable: true }),
  node({ id: 'micro:hepatic-lobule', label: 'Hepatic lobule', system: 'digestive', regions: ['abdomen'], laterality: 'right', scale: 'microstructure', parentId: 'gi:liver', source: { mode: 'specific-fallback', nodeHints: ['hepatic lobule'] }, provenance: REFERENCE_ONLY, geometryStatus: 'reference-only', educationalPriority: 0.85, physiologyCapable: true }),
  node({ id: 'micro:sarcomere', label: 'Sarcomere', system: 'muscular', regions: ['whole-body'], laterality: 'not-applicable', scale: 'microstructure', parentId: 'system:muscular', source: { mode: 'specific-fallback', nodeHints: ['sarcomere'] }, provenance: REFERENCE_ONLY, geometryStatus: 'reference-only', educationalPriority: 0.85, physiologyCapable: true }),
  node({ id: 'micro:synapse', label: 'Chemical synapse', system: 'nervous', regions: ['whole-body'], laterality: 'not-applicable', scale: 'microstructure', parentId: 'system:nervous', source: { mode: 'specific-fallback', nodeHints: ['synapse'] }, provenance: REFERENCE_ONLY, geometryStatus: 'reference-only', educationalPriority: 0.85, physiologyCapable: true }),
]

export const WHOLE_BODY_ATLAS_BASE_NODES: readonly AtlasNode[] = [
  ...systemRoots,
  ...regionNodes,
  ...majorNodes,
  ...referenceOnlyNodes,
]

export function withChildrenDerived(nodes: readonly AtlasNode[]): readonly AtlasNode[] {
  const childMap = new Map<string, string[]>()
  for (const entry of nodes) {
    if (!entry.parentId) continue
    const children = childMap.get(entry.parentId) ?? []
    children.push(entry.id)
    childMap.set(entry.parentId, children)
  }
  return nodes.map((entry) => ({
    ...entry,
    children: [...new Set([...(entry.children ?? []), ...(childMap.get(entry.id) ?? [])])],
  }))
}

export const WHOLE_BODY_ATLAS: AtlasManifest = {
  id: 'panacea-whole-body-atlas',
  revision: '2026-09-09-r1',
  nodes: withChildrenDerived(WHOLE_BODY_ATLAS_BASE_NODES),
}
