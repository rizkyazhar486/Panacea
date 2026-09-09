import type { AtlasGeometryStatus, AtlasNode, AtlasProvenance, AtlasScale, AtlasSystemId } from './atlasKernel'

const SOURCE_CANDIDATE: AtlasProvenance = {
  sourceId: 'z-anatomy-shipped-glb-index',
  sourceRevision: 'panacea-body-index-2026-09-09',
  license: 'CC BY-SA 4.0',
  sourceLocator: 'public/anatomy/visceral.glb + public/anatomy/lymphoid.glb + src/lib/bodyIndex.gen.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Engineering source-node candidate mapping only; qualified anatomy review remains required.',
}

const REFERENCE_ONLY: AtlasProvenance = {
  sourceId: 'panacea-deep-visceral-reference-scaffold',
  sourceRevision: '2026-09-09-r1',
  license: 'Internal metadata scaffold; no additional third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/deepVisceralAtlas.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Educational semantic hierarchy only; reference-only nodes must never masquerade as source-resolved gross anatomy.',
}

type VOptions = {
  system?: AtlasSystemId
  regions?: AtlasNode['regions']
  laterality?: AtlasNode['laterality']
  scale?: AtlasScale
  geometryStatus?: AtlasGeometryStatus
  hints?: readonly string[]
  files?: readonly string[]
  priority?: number
  physiologyCapable?: boolean
  surgicalLandmark?: boolean
  synonyms?: readonly string[]
}

function visceral(id: string, label: string, parentId: string, options: VOptions = {}): AtlasNode {
  const geometryStatus = options.geometryStatus ?? 'reference-only'
  const system = options.system ?? 'digestive'
  const defaultFile = system === 'lymphatic' ? 'lymphoid.glb' : 'visceral.glb'
  return {
    id,
    label,
    system,
    regions: options.regions ?? ['abdomen'],
    laterality: options.laterality ?? 'midline',
    scale: options.scale ?? 'suborgan',
    parentId,
    synonyms: options.synonyms,
    source: {
      mode: 'specific-fallback',
      files: geometryStatus === 'reference-only' ? undefined : (options.files ?? [defaultFile]),
      nodeHints: options.hints ?? [label],
    },
    provenance: geometryStatus === 'reference-only' ? REFERENCE_ONLY : SOURCE_CANDIDATE,
    geometryStatus,
    educationalPriority: options.priority ?? 0.82,
    physiologyCapable: options.physiologyCapable ?? true,
    surgicalLandmark: options.surgicalLandmark ?? false,
  }
}

const gastrointestinal: readonly AtlasNode[] = [
  visceral('gi:esophagus', 'Esophagus', 'system:digestive', { regions: ['neck', 'thorax', 'abdomen'], geometryStatus: 'partial', hints: ['esophagus'], priority: 0.95, surgicalLandmark: true }),
  visceral('gi:gastroesophageal-junction', 'Gastroesophageal junction', 'gi:esophagus', { regions: ['thorax', 'abdomen'], geometryStatus: 'reference-only', priority: 0.9, surgicalLandmark: true, synonyms: ['GE junction'] }),
  visceral('gi:gastric-cardia', 'Gastric cardia', 'gi:stomach', { geometryStatus: 'reference-only', priority: 0.78 }),
  visceral('gi:gastric-fundus', 'Gastric fundus', 'gi:stomach', { laterality: 'left', geometryStatus: 'reference-only', priority: 0.82 }),
  visceral('gi:gastric-body', 'Gastric body', 'gi:stomach', { geometryStatus: 'reference-only', priority: 0.8 }),
  visceral('gi:gastric-antrum', 'Gastric antrum', 'gi:stomach', { geometryStatus: 'reference-only', priority: 0.82 }),
  visceral('gi:pylorus', 'Pylorus', 'gi:stomach', { geometryStatus: 'reference-only', priority: 0.86, surgicalLandmark: true }),

  visceral('gi:duodenum', 'Duodenum', 'gi:small-intestine', { geometryStatus: 'partial', hints: ['duodenum'], priority: 0.95, surgicalLandmark: true }),
  visceral('gi:duodenum-d1', 'First part of duodenum', 'gi:duodenum', { geometryStatus: 'reference-only', priority: 0.8, surgicalLandmark: true }),
  visceral('gi:duodenum-d2', 'Second part of duodenum', 'gi:duodenum', { geometryStatus: 'reference-only', priority: 0.9, surgicalLandmark: true }),
  visceral('gi:major-duodenal-papilla', 'Major duodenal papilla', 'gi:duodenum-d2', { geometryStatus: 'reference-only', priority: 0.92, surgicalLandmark: true }),
  visceral('gi:duodenum-d3', 'Third part of duodenum', 'gi:duodenum', { geometryStatus: 'reference-only', priority: 0.78 }),
  visceral('gi:duodenum-d4', 'Fourth part of duodenum', 'gi:duodenum', { geometryStatus: 'reference-only', priority: 0.78 }),
  visceral('gi:jejunum', 'Jejunum', 'gi:small-intestine', { geometryStatus: 'partial', hints: ['jejunum'], priority: 0.88 }),
  visceral('gi:ileum', 'Ileum', 'gi:small-intestine', { geometryStatus: 'partial', hints: ['ileum'], priority: 0.9 }),
  visceral('gi:ileocecal-valve', 'Ileocecal valve', 'gi:ileum', { geometryStatus: 'reference-only', priority: 0.86, surgicalLandmark: true }),

  visceral('gi:cecum', 'Cecum', 'gi:large-intestine', { geometryStatus: 'partial', hints: ['cecum'], priority: 0.88 }),
  visceral('gi:appendix', 'Vermiform appendix', 'gi:cecum', { geometryStatus: 'partial', hints: ['appendix', 'vermiform appendix'], priority: 0.98, surgicalLandmark: true }),
  visceral('gi:ascending-colon', 'Ascending colon', 'gi:large-intestine', { laterality: 'right', geometryStatus: 'partial', hints: ['ascending colon'], priority: 0.86 }),
  visceral('gi:hepatic-flexure', 'Hepatic flexure', 'gi:large-intestine', { laterality: 'right', geometryStatus: 'reference-only', priority: 0.78 }),
  visceral('gi:transverse-colon', 'Transverse colon', 'gi:large-intestine', { geometryStatus: 'partial', hints: ['transverse colon'], priority: 0.86 }),
  visceral('gi:splenic-flexure', 'Splenic flexure', 'gi:large-intestine', { laterality: 'left', geometryStatus: 'reference-only', priority: 0.78 }),
  visceral('gi:descending-colon', 'Descending colon', 'gi:large-intestine', { laterality: 'left', geometryStatus: 'partial', hints: ['descending colon'], priority: 0.86 }),
  visceral('gi:sigmoid-colon', 'Sigmoid colon', 'gi:large-intestine', { regions: ['abdomen', 'pelvis'], geometryStatus: 'partial', hints: ['sigmoid colon'], priority: 0.9, surgicalLandmark: true }),
  visceral('gi:rectum', 'Rectum', 'gi:large-intestine', { regions: ['pelvis'], geometryStatus: 'partial', hints: ['rectum'], priority: 0.92, surgicalLandmark: true }),
  visceral('gi:anal-canal', 'Anal canal', 'gi:rectum', { regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.88, surgicalLandmark: true }),
]

const hepatobiliaryPancreatic: readonly AtlasNode[] = [
  visceral('gi:right-hepatic-lobe', 'Right hepatic lobe', 'gi:liver', { laterality: 'right', geometryStatus: 'partial', hints: ['right lobe of liver', 'right hepatic lobe'], priority: 0.82 }),
  visceral('gi:left-hepatic-lobe', 'Left hepatic lobe', 'gi:liver', { laterality: 'left', geometryStatus: 'partial', hints: ['left lobe of liver', 'left hepatic lobe'], priority: 0.82 }),
  visceral('gi:caudate-lobe', 'Caudate lobe', 'gi:liver', { geometryStatus: 'reference-only', priority: 0.76, surgicalLandmark: true }),
  visceral('gi:quadrate-lobe', 'Quadrate lobe', 'gi:liver', { geometryStatus: 'reference-only', priority: 0.72 }),
  visceral('gi:porta-hepatis', 'Porta hepatis', 'gi:liver', { geometryStatus: 'reference-only', priority: 0.95, surgicalLandmark: true }),
  visceral('gi:hepatic-lobule-reference', 'Hepatic lobule reference unit', 'gi:liver', { scale: 'microstructure', geometryStatus: 'reference-only', priority: 0.8 }),
  visceral('gi:portal-triad-reference', 'Portal triad reference unit', 'gi:hepatic-lobule-reference', { scale: 'microstructure', geometryStatus: 'reference-only', priority: 0.88 }),
  visceral('gi:hepatic-sinusoid-reference', 'Hepatic sinusoid reference', 'gi:hepatic-lobule-reference', { scale: 'microstructure', geometryStatus: 'reference-only', priority: 0.82 }),
  visceral('gi:central-vein-reference', 'Central vein reference', 'gi:hepatic-lobule-reference', { scale: 'microstructure', geometryStatus: 'reference-only', priority: 0.8 }),

  visceral('gi:gallbladder', 'Gallbladder', 'system:digestive', { laterality: 'right', geometryStatus: 'partial', hints: ['gallbladder', 'gall bladder'], priority: 0.92, surgicalLandmark: true }),
  visceral('gi:gallbladder-fundus', 'Gallbladder fundus', 'gi:gallbladder', { laterality: 'right', geometryStatus: 'reference-only', priority: 0.74 }),
  visceral('gi:gallbladder-body', 'Gallbladder body', 'gi:gallbladder', { laterality: 'right', geometryStatus: 'reference-only', priority: 0.72 }),
  visceral('gi:gallbladder-neck', 'Gallbladder neck', 'gi:gallbladder', { laterality: 'right', geometryStatus: 'reference-only', priority: 0.84, surgicalLandmark: true }),
  visceral('gi:cystic-duct', 'Cystic duct', 'gi:gallbladder', { laterality: 'right', geometryStatus: 'reference-only', priority: 0.94, surgicalLandmark: true }),
  visceral('gi:right-hepatic-duct', 'Right hepatic duct', 'gi:liver', { laterality: 'right', geometryStatus: 'reference-only', priority: 0.9, surgicalLandmark: true }),
  visceral('gi:left-hepatic-duct', 'Left hepatic duct', 'gi:liver', { laterality: 'left', geometryStatus: 'reference-only', priority: 0.9, surgicalLandmark: true }),
  visceral('gi:common-hepatic-duct', 'Common hepatic duct', 'system:digestive', { geometryStatus: 'reference-only', priority: 0.95, surgicalLandmark: true }),
  visceral('gi:common-bile-duct', 'Common bile duct', 'system:digestive', { geometryStatus: 'reference-only', priority: 0.98, surgicalLandmark: true, synonyms: ['CBD'] }),

  visceral('gi:pancreatic-head', 'Pancreatic head', 'gi:pancreas', { geometryStatus: 'reference-only', priority: 0.86, surgicalLandmark: true }),
  visceral('gi:pancreatic-uncinate', 'Uncinate process of pancreas', 'gi:pancreas', { geometryStatus: 'reference-only', priority: 0.82, surgicalLandmark: true }),
  visceral('gi:pancreatic-neck', 'Pancreatic neck', 'gi:pancreas', { geometryStatus: 'reference-only', priority: 0.78, surgicalLandmark: true }),
  visceral('gi:pancreatic-body', 'Pancreatic body', 'gi:pancreas', { geometryStatus: 'reference-only', priority: 0.78 }),
  visceral('gi:pancreatic-tail', 'Pancreatic tail', 'gi:pancreas', { laterality: 'left', geometryStatus: 'reference-only', priority: 0.82, surgicalLandmark: true }),
  visceral('gi:main-pancreatic-duct', 'Main pancreatic duct', 'gi:pancreas', { geometryStatus: 'reference-only', priority: 0.9, surgicalLandmark: true, synonyms: ['Duct of Wirsung'] }),
]

const urinary: readonly AtlasNode[] = [
  visceral('urinary:right-kidney', 'Right kidney', 'urinary:kidneys', { system: 'urinary', laterality: 'right', regions: ['abdomen', 'back'], geometryStatus: 'partial', hints: ['right kidney'], priority: 0.96, surgicalLandmark: true }),
  visceral('urinary:left-kidney', 'Left kidney', 'urinary:kidneys', { system: 'urinary', laterality: 'left', regions: ['abdomen', 'back'], geometryStatus: 'partial', hints: ['left kidney'], priority: 0.96, surgicalLandmark: true }),
  ...(['right', 'left'] as const).flatMap((side) => [
    visceral(`urinary:${side}-renal-cortex`, `${side === 'right' ? 'Right' : 'Left'} renal cortex`, `urinary:${side}-kidney`, { system: 'urinary', laterality: side, regions: ['abdomen', 'back'], scale: 'tissue', geometryStatus: 'reference-only', priority: 0.8 }),
    visceral(`urinary:${side}-renal-medulla`, `${side === 'right' ? 'Right' : 'Left'} renal medulla`, `urinary:${side}-kidney`, { system: 'urinary', laterality: side, regions: ['abdomen', 'back'], scale: 'tissue', geometryStatus: 'reference-only', priority: 0.8 }),
    visceral(`urinary:${side}-renal-pyramids`, `${side === 'right' ? 'Right' : 'Left'} renal pyramids`, `urinary:${side}-renal-medulla`, { system: 'urinary', laterality: side, regions: ['abdomen', 'back'], scale: 'tissue', geometryStatus: 'reference-only', priority: 0.78 }),
    visceral(`urinary:${side}-minor-calyces`, `${side === 'right' ? 'Right' : 'Left'} minor calyces`, `urinary:${side}-kidney`, { system: 'urinary', laterality: side, regions: ['abdomen', 'back'], geometryStatus: 'reference-only', priority: 0.86 }),
    visceral(`urinary:${side}-major-calyces`, `${side === 'right' ? 'Right' : 'Left'} major calyces`, `urinary:${side}-kidney`, { system: 'urinary', laterality: side, regions: ['abdomen', 'back'], geometryStatus: 'reference-only', priority: 0.86 }),
    visceral(`urinary:${side}-renal-pelvis`, `${side === 'right' ? 'Right' : 'Left'} renal pelvis`, `urinary:${side}-kidney`, { system: 'urinary', laterality: side, regions: ['abdomen', 'back'], geometryStatus: 'reference-only', priority: 0.9, surgicalLandmark: true }),
    visceral(`urinary:${side}-nephron-reference`, `${side === 'right' ? 'Right' : 'Left'} nephron reference`, `urinary:${side}-renal-cortex`, { system: 'urinary', laterality: side, regions: ['abdomen', 'back'], scale: 'microstructure', geometryStatus: 'reference-only', priority: 0.9 }),
    visceral(`urinary:${side}-glomerulus`, `${side === 'right' ? 'Right' : 'Left'} glomerulus reference`, `urinary:${side}-nephron-reference`, { system: 'urinary', laterality: side, regions: ['abdomen', 'back'], scale: 'microstructure', geometryStatus: 'reference-only', priority: 0.92 }),
    visceral(`urinary:${side}-proximal-tubule`, `${side === 'right' ? 'Right' : 'Left'} proximal tubule reference`, `urinary:${side}-nephron-reference`, { system: 'urinary', laterality: side, regions: ['abdomen', 'back'], scale: 'microstructure', geometryStatus: 'reference-only', priority: 0.86 }),
    visceral(`urinary:${side}-loop-of-henle`, `${side === 'right' ? 'Right' : 'Left'} loop of Henle reference`, `urinary:${side}-nephron-reference`, { system: 'urinary', laterality: side, regions: ['abdomen', 'back'], scale: 'microstructure', geometryStatus: 'reference-only', priority: 0.86 }),
    visceral(`urinary:${side}-distal-tubule`, `${side === 'right' ? 'Right' : 'Left'} distal tubule reference`, `urinary:${side}-nephron-reference`, { system: 'urinary', laterality: side, regions: ['abdomen', 'back'], scale: 'microstructure', geometryStatus: 'reference-only', priority: 0.86 }),
    visceral(`urinary:${side}-collecting-duct`, `${side === 'right' ? 'Right' : 'Left'} collecting duct reference`, `urinary:${side}-nephron-reference`, { system: 'urinary', laterality: side, regions: ['abdomen', 'back'], scale: 'microstructure', geometryStatus: 'reference-only', priority: 0.88 }),
  ]),
  visceral('urinary:right-ureter', 'Right ureter', 'urinary:ureters', { system: 'urinary', laterality: 'right', regions: ['abdomen', 'pelvis'], geometryStatus: 'partial', hints: ['right ureter'], priority: 0.9, surgicalLandmark: true }),
  visceral('urinary:left-ureter', 'Left ureter', 'urinary:ureters', { system: 'urinary', laterality: 'left', regions: ['abdomen', 'pelvis'], geometryStatus: 'partial', hints: ['left ureter'], priority: 0.9, surgicalLandmark: true }),
  visceral('urinary:bladder-dome', 'Bladder dome', 'urinary:bladder', { system: 'urinary', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.72 }),
  visceral('urinary:bladder-trigone', 'Bladder trigone', 'urinary:bladder', { system: 'urinary', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.88, surgicalLandmark: true }),
  visceral('urinary:bladder-neck', 'Bladder neck', 'urinary:bladder', { system: 'urinary', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.84, surgicalLandmark: true }),
  visceral('urinary:urethra-reference', 'Urethra reference', 'urinary:bladder', { system: 'urinary', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.86, surgicalLandmark: true }),
]

const lymphatic: readonly AtlasNode[] = [
  visceral('lymph:spleen', 'Spleen', 'system:lymphatic', { system: 'lymphatic', laterality: 'left', regions: ['abdomen'], geometryStatus: 'partial', hints: ['spleen'], priority: 0.92, surgicalLandmark: true }),
  visceral('lymph:thymus', 'Thymus', 'system:lymphatic', { system: 'lymphatic', regions: ['thorax'], geometryStatus: 'partial', hints: ['thymus'], priority: 0.78 }),
  visceral('lymph:thoracic-duct', 'Thoracic duct', 'system:lymphatic', { system: 'lymphatic', regions: ['abdomen', 'thorax', 'neck'], geometryStatus: 'reference-only', priority: 0.94, surgicalLandmark: true }),
  visceral('lymph:cisterna-chyli', 'Cisterna chyli', 'lymph:thoracic-duct', { system: 'lymphatic', regions: ['abdomen'], geometryStatus: 'reference-only', priority: 0.84 }),
  visceral('lymph:right-lymphatic-duct', 'Right lymphatic duct', 'system:lymphatic', { system: 'lymphatic', laterality: 'right', regions: ['neck', 'thorax'], geometryStatus: 'reference-only', priority: 0.82 }),
  visceral('lymph:cervical-nodes', 'Cervical lymph node groups', 'system:lymphatic', { system: 'lymphatic', laterality: 'bilateral', regions: ['head', 'neck'], geometryStatus: 'partial', hints: ['cervical lymph node', 'lymph node of neck'], priority: 0.88 }),
  visceral('lymph:axillary-nodes', 'Axillary lymph node groups', 'system:lymphatic', { system: 'lymphatic', laterality: 'bilateral', regions: ['thorax', 'upper-limb'], geometryStatus: 'partial', hints: ['axillary lymph node'], priority: 0.9, surgicalLandmark: true }),
  visceral('lymph:mediastinal-nodes', 'Mediastinal lymph node groups', 'system:lymphatic', { system: 'lymphatic', regions: ['thorax'], geometryStatus: 'partial', hints: ['mediastinal lymph node'], priority: 0.88 }),
  visceral('lymph:mesenteric-nodes', 'Mesenteric lymph node groups', 'system:lymphatic', { system: 'lymphatic', regions: ['abdomen'], geometryStatus: 'partial', hints: ['mesenteric lymph node'], priority: 0.86 }),
  visceral('lymph:para-aortic-nodes', 'Para-aortic lymph node groups', 'system:lymphatic', { system: 'lymphatic', regions: ['abdomen', 'pelvis'], geometryStatus: 'reference-only', priority: 0.84, surgicalLandmark: true }),
  visceral('lymph:inguinal-nodes', 'Inguinal lymph node groups', 'system:lymphatic', { system: 'lymphatic', laterality: 'bilateral', regions: ['pelvis', 'lower-limb'], geometryStatus: 'partial', hints: ['inguinal lymph node'], priority: 0.9, surgicalLandmark: true }),
]

const endocrine: readonly AtlasNode[] = [
  visceral('endo:anterior-pituitary', 'Anterior pituitary', 'endo:pituitary', { system: 'endocrine', regions: ['head'], geometryStatus: 'reference-only', priority: 0.8 }),
  visceral('endo:posterior-pituitary', 'Posterior pituitary', 'endo:pituitary', { system: 'endocrine', regions: ['head'], geometryStatus: 'reference-only', priority: 0.8 }),
  visceral('endo:right-thyroid-lobe', 'Right thyroid lobe', 'endo:thyroid', { system: 'endocrine', laterality: 'right', regions: ['neck'], geometryStatus: 'partial', hints: ['right lobe of thyroid gland'], priority: 0.84, surgicalLandmark: true }),
  visceral('endo:left-thyroid-lobe', 'Left thyroid lobe', 'endo:thyroid', { system: 'endocrine', laterality: 'left', regions: ['neck'], geometryStatus: 'partial', hints: ['left lobe of thyroid gland'], priority: 0.84, surgicalLandmark: true }),
  visceral('endo:thyroid-isthmus', 'Thyroid isthmus', 'endo:thyroid', { system: 'endocrine', regions: ['neck'], geometryStatus: 'reference-only', priority: 0.84, surgicalLandmark: true }),
  visceral('endo:parathyroids-reference', 'Parathyroid glands reference', 'system:endocrine', { system: 'endocrine', regions: ['neck'], laterality: 'paired', geometryStatus: 'reference-only', priority: 0.84, surgicalLandmark: true }),
  visceral('endo:right-adrenal', 'Right adrenal gland', 'endo:adrenals', { system: 'endocrine', laterality: 'right', geometryStatus: 'partial', hints: ['right suprarenal gland', 'right adrenal gland'], priority: 0.84 }),
  visceral('endo:left-adrenal', 'Left adrenal gland', 'endo:adrenals', { system: 'endocrine', laterality: 'left', geometryStatus: 'partial', hints: ['left suprarenal gland', 'left adrenal gland'], priority: 0.84 }),
  visceral('endo:adrenal-cortex-reference', 'Adrenal cortex reference', 'endo:adrenals', { system: 'endocrine', scale: 'tissue', geometryStatus: 'reference-only', priority: 0.78 }),
  visceral('endo:adrenal-medulla-reference', 'Adrenal medulla reference', 'endo:adrenals', { system: 'endocrine', scale: 'tissue', geometryStatus: 'reference-only', priority: 0.78 }),
  visceral('endo:pancreatic-islet-reference', 'Pancreatic islet reference', 'gi:pancreas', { system: 'endocrine', scale: 'microstructure', geometryStatus: 'reference-only', priority: 0.84 }),
]

const reproductive: readonly AtlasNode[] = [
  visceral('repro:male-reference', 'Male reproductive anatomy reference', 'system:reproductive', { system: 'reproductive', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.78 }),
  visceral('repro:testes', 'Testes reference', 'repro:male-reference', { system: 'reproductive', laterality: 'paired', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.84 }),
  visceral('repro:epididymides', 'Epididymides reference', 'repro:male-reference', { system: 'reproductive', laterality: 'paired', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.8 }),
  visceral('repro:ductus-deferens', 'Ductus deferens reference', 'repro:male-reference', { system: 'reproductive', laterality: 'paired', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.8 }),
  visceral('repro:seminal-vesicles', 'Seminal vesicles reference', 'repro:male-reference', { system: 'reproductive', laterality: 'paired', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.8 }),
  visceral('repro:prostate', 'Prostate reference', 'repro:male-reference', { system: 'reproductive', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.9, surgicalLandmark: true }),
  visceral('repro:penis-reference', 'Penis reference', 'repro:male-reference', { system: 'reproductive', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.76 }),

  visceral('repro:female-reference', 'Female reproductive anatomy reference', 'system:reproductive', { system: 'reproductive', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.78 }),
  visceral('repro:ovaries', 'Ovaries reference', 'repro:female-reference', { system: 'reproductive', laterality: 'paired', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.86 }),
  visceral('repro:uterine-tubes', 'Uterine tubes reference', 'repro:female-reference', { system: 'reproductive', laterality: 'paired', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.84 }),
  visceral('repro:uterus', 'Uterus reference', 'repro:female-reference', { system: 'reproductive', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.9, surgicalLandmark: true }),
  visceral('repro:uterine-fundus', 'Uterine fundus reference', 'repro:uterus', { system: 'reproductive', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.76 }),
  visceral('repro:uterine-body', 'Uterine body reference', 'repro:uterus', { system: 'reproductive', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.76 }),
  visceral('repro:cervix', 'Cervix reference', 'repro:uterus', { system: 'reproductive', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.88, surgicalLandmark: true }),
  visceral('repro:vagina', 'Vagina reference', 'repro:female-reference', { system: 'reproductive', regions: ['pelvis'], geometryStatus: 'reference-only', priority: 0.82 }),
]

const peritonealAndFascial: readonly AtlasNode[] = [
  visceral('fascia:peritoneum-reference', 'Peritoneum reference layer', 'system:fascial', { system: 'fascial', regions: ['abdomen', 'pelvis'], scale: 'tissue', geometryStatus: 'reference-only', priority: 0.8 }),
  visceral('fascia:greater-omentum-reference', 'Greater omentum reference', 'fascia:peritoneum-reference', { system: 'fascial', regions: ['abdomen'], scale: 'tissue', geometryStatus: 'reference-only', priority: 0.74 }),
  visceral('fascia:small-bowel-mesentery-reference', 'Small-bowel mesentery reference', 'fascia:peritoneum-reference', { system: 'fascial', regions: ['abdomen'], scale: 'tissue', geometryStatus: 'reference-only', priority: 0.82, surgicalLandmark: true }),
  visceral('fascia:mesocolon-reference', 'Mesocolon reference', 'fascia:peritoneum-reference', { system: 'fascial', regions: ['abdomen', 'pelvis'], scale: 'tissue', geometryStatus: 'reference-only', priority: 0.8, surgicalLandmark: true }),
]

export const DEEP_VISCERAL_ATLAS_NODES: readonly AtlasNode[] = [
  ...gastrointestinal,
  ...hepatobiliaryPancreatic,
  ...urinary,
  ...lymphatic,
  ...endocrine,
  ...reproductive,
  ...peritonealAndFascial,
]
