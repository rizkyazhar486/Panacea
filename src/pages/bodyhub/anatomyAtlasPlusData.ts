import type { AnatomyLayer } from '../../components/Body3D'

export type AtlasScale = 'organ' | 'structure' | 'micro'

export interface AtlasPlusEntry {
  /** Stable Panacea-owned identity. Never silently replaced with an unverified TA2/FMA code. */
  id: string
  label: string
  aliases: string[]
  system: string
  region: string
  scale: AtlasScale
  layer: AnatomyLayer['key']
  /** Exact/sub-string terms used by the existing Body3D focus contract. */
  keywords: string[]
  functionSummary: string
  microSummary: string
  relationships: string[]
  sourceIds: string[]
  /** TA2 remains null until a qualified mapping is explicitly verified. */
  ta2: string | null
}

export const ATLAS_PLUS_SOURCE_IDS = [
  'z_anatomy',
  'hubmap_hra',
  'nih_3d',
  'wikimedia_commons',
] as const

export const ATLAS_PLUS_REVIEW = {
  status: 'source-checked-reference' as const,
  humanReview: 'pending' as const,
  clinicalDecisionUse: false,
  patientSpecific: false,
}

export const ATLAS_PLUS_ENTRIES: AtlasPlusEntry[] = [
  {
    id: 'pan-anat-brain', label: 'Brain', aliases: ['cerebrum', 'encephalon'], system: 'Nervous', region: 'Head', scale: 'organ', layer: 'nervous',
    keywords: ['brain', 'cerebr'], functionSummary: 'Central organ for sensation, movement, cognition, autonomic integration and higher-order processing.',
    microSummary: 'Neural tissue is organized into neurons, glia, gray matter and white-matter pathways.', relationships: ['Spinal cord', 'Cranial nerves', 'Cerebral vessels'], sourceIds: ['z_anatomy', 'nih_3d'], ta2: null,
  },
  {
    id: 'pan-anat-eye', label: 'Eye', aliases: ['globe', 'ocular globe'], system: 'Sensory', region: 'Head', scale: 'organ', layer: 'nervous',
    keywords: ['eye', 'ocular', 'optic'], functionSummary: 'Optical and neural organ that focuses light and converts it into signals carried through the visual pathway.',
    microSummary: 'The retina contains layered neural circuitry including photoreceptors, bipolar cells and ganglion cells.', relationships: ['Optic nerve', 'Orbit', 'Retina'], sourceIds: ['z_anatomy', 'wikimedia_commons'], ta2: null,
  },
  {
    id: 'pan-anat-thyroid', label: 'Thyroid gland', aliases: ['thyroid'], system: 'Endocrine', region: 'Neck', scale: 'organ', layer: 'visceral',
    keywords: ['thyroid'], functionSummary: 'Endocrine gland whose follicles synthesize and store thyroid hormone precursors.',
    microSummary: 'Follicles are lined by epithelial cells around colloid; parafollicular cells form a separate endocrine population.', relationships: ['Larynx', 'Trachea', 'Parathyroid glands'], sourceIds: ['z_anatomy', 'hubmap_hra'], ta2: null,
  },
  {
    id: 'pan-anat-trachea', label: 'Trachea', aliases: ['windpipe'], system: 'Respiratory', region: 'Neck / thorax', scale: 'structure', layer: 'visceral',
    keywords: ['trachea'], functionSummary: 'Conducting airway linking the larynx to the main bronchi.',
    microSummary: 'Its wall includes respiratory epithelium, connective tissue, smooth muscle and cartilaginous support.', relationships: ['Larynx', 'Main bronchi', 'Esophagus'], sourceIds: ['z_anatomy', 'hubmap_hra'], ta2: null,
  },
  {
    id: 'pan-anat-lungs', label: 'Lungs', aliases: ['lung', 'pulmonary organs'], system: 'Respiratory', region: 'Thorax', scale: 'organ', layer: 'visceral',
    keywords: ['lung', 'pulmon'], functionSummary: 'Paired respiratory organs containing the branching airways and gas-exchange surface.',
    microSummary: 'Distal lung contains respiratory bronchioles, alveolar ducts, alveoli, capillary networks and supporting interstitium.', relationships: ['Main bronchi', 'Pleura', 'Diaphragm', 'Pulmonary vessels'], sourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], ta2: null,
  },
  {
    id: 'pan-anat-bronchi', label: 'Main bronchi', aliases: ['bronchus', 'primary bronchi'], system: 'Respiratory', region: 'Thorax', scale: 'structure', layer: 'visceral',
    keywords: ['bronch'], functionSummary: 'First major airway branches carrying airflow from the trachea toward each lung.',
    microSummary: 'As airways branch distally, cartilage support decreases and smooth-muscle influence becomes proportionally more important.', relationships: ['Trachea', 'Bronchioles', 'Lungs'], sourceIds: ['z_anatomy', 'wikimedia_commons'], ta2: null,
  },
  {
    id: 'pan-anat-alveoli', label: 'Alveoli', aliases: ['alveolus', 'pulmonary alveoli'], system: 'Respiratory', region: 'Lung microanatomy', scale: 'micro', layer: 'visceral',
    keywords: ['alveol', 'lung'], functionSummary: 'Terminal gas-exchange units where air is brought into close proximity with pulmonary capillary blood.',
    microSummary: 'Thin epithelial and endothelial layers, surfactant-producing type II cells and surrounding capillaries create the exchange interface.', relationships: ['Respiratory bronchioles', 'Pulmonary capillaries', 'Lungs'], sourceIds: ['hubmap_hra', 'wikimedia_commons'], ta2: null,
  },
  {
    id: 'pan-anat-diaphragm', label: 'Diaphragm', aliases: ['thoracic diaphragm'], system: 'Respiratory / musculoskeletal', region: 'Thoracoabdominal boundary', scale: 'structure', layer: 'muscular',
    keywords: ['diaphragm'], functionSummary: 'Primary muscle of quiet inspiration and an anatomical partition between thorax and abdomen.',
    microSummary: 'Skeletal-muscle fibers converge toward a central tendon and are controlled by the phrenic nerves.', relationships: ['Lungs', 'Pleura', 'Lower ribs', 'Phrenic nerves'], sourceIds: ['z_anatomy', 'nih_3d'], ta2: null,
  },
  {
    id: 'pan-anat-heart', label: 'Heart', aliases: ['cardiac organ'], system: 'Cardiovascular', region: 'Thorax / mediastinum', scale: 'organ', layer: 'cardiovascular',
    keywords: ['heart', 'cardiac'], functionSummary: 'Muscular pump that drives pulmonary and systemic circulation.',
    microSummary: 'Cardiomyocytes are electrically coupled; specialized conducting tissue coordinates activation across chambers.', relationships: ['Aorta', 'Pulmonary vessels', 'Coronary vessels', 'Pericardium'], sourceIds: ['z_anatomy', 'nih_3d'], ta2: null,
  },
  {
    id: 'pan-anat-aorta', label: 'Aorta', aliases: ['aortic artery'], system: 'Cardiovascular', region: 'Thorax / abdomen', scale: 'structure', layer: 'cardiovascular',
    keywords: ['aorta', 'aortic'], functionSummary: 'Largest systemic artery, receiving blood from the left ventricle and distributing it through major branches.',
    microSummary: 'Its wall has intimal, medial and adventitial layers adapted to pulsatile arterial pressure.', relationships: ['Left ventricle', 'Aortic arch branches', 'Abdominal arteries'], sourceIds: ['z_anatomy', 'nih_3d'], ta2: null,
  },
  {
    id: 'pan-anat-esophagus', label: 'Esophagus', aliases: ['oesophagus'], system: 'Digestive', region: 'Neck / thorax / upper abdomen', scale: 'organ', layer: 'visceral',
    keywords: ['esophagus', 'oesophagus'], functionSummary: 'Muscular conduit transporting swallowed material from pharynx to stomach.',
    microSummary: 'Its mucosa is adapted to mechanical transit and the muscular wall coordinates peristaltic propulsion.', relationships: ['Pharynx', 'Trachea', 'Stomach'], sourceIds: ['z_anatomy', 'wikimedia_commons'], ta2: null,
  },
  {
    id: 'pan-anat-liver', label: 'Liver', aliases: ['hepatic organ'], system: 'Digestive / metabolic', region: 'Right upper abdomen', scale: 'organ', layer: 'visceral',
    keywords: ['liver', 'hepatic'], functionSummary: 'Large metabolic organ integrating nutrient processing, bile production, synthesis and detoxification pathways.',
    microSummary: 'Hepatocytes are arranged around sinusoidal blood flow with portal tracts and bile drainage pathways.', relationships: ['Portal vein', 'Hepatic veins', 'Gallbladder', 'Biliary tree'], sourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], ta2: null,
  },
  {
    id: 'pan-anat-gallbladder', label: 'Gallbladder', aliases: ['biliary gallbladder'], system: 'Digestive', region: 'Right upper abdomen', scale: 'organ', layer: 'visceral',
    keywords: ['gallbladder', 'gall bladder'], functionSummary: 'Reservoir that stores and concentrates bile between meals.',
    microSummary: 'A folded mucosa and smooth-muscle wall support concentration and emptying of bile.', relationships: ['Liver', 'Cystic duct', 'Common bile duct'], sourceIds: ['z_anatomy', 'wikimedia_commons'], ta2: null,
  },
  {
    id: 'pan-anat-stomach', label: 'Stomach', aliases: ['gastric organ'], system: 'Digestive', region: 'Upper abdomen', scale: 'organ', layer: 'visceral',
    keywords: ['stomach', 'gastric'], functionSummary: 'Expandable muscular organ that mixes ingested material and begins acid- and enzyme-mediated digestion.',
    microSummary: 'Gastric glands contain specialized epithelial populations for acid, enzyme, mucus and hormone secretion.', relationships: ['Esophagus', 'Duodenum', 'Omenta'], sourceIds: ['z_anatomy', 'hubmap_hra'], ta2: null,
  },
  {
    id: 'pan-anat-pancreas', label: 'Pancreas', aliases: ['pancreatic gland'], system: 'Digestive / endocrine', region: 'Upper abdomen / retroperitoneum', scale: 'organ', layer: 'visceral',
    keywords: ['pancreas', 'pancreatic'], functionSummary: 'Gland combining digestive enzyme secretion with endocrine control of glucose metabolism.',
    microSummary: 'Exocrine acini and ducts surround endocrine islets containing multiple hormone-producing cell populations.', relationships: ['Duodenum', 'Pancreatic duct', 'Splenic vessels'], sourceIds: ['z_anatomy', 'hubmap_hra'], ta2: null,
  },
  {
    id: 'pan-anat-spleen', label: 'Spleen', aliases: ['splenic organ'], system: 'Lymphatic / immune', region: 'Left upper abdomen', scale: 'organ', layer: 'lymphoid',
    keywords: ['spleen', 'splenic'], functionSummary: 'Lymphoid organ that filters circulating blood and participates in immune surveillance and blood-cell turnover.',
    microSummary: 'White-pulp immune tissue and red-pulp vascular compartments perform distinct functions.', relationships: ['Splenic vessels', 'Stomach', 'Pancreas'], sourceIds: ['z_anatomy', 'hubmap_hra'], ta2: null,
  },
  {
    id: 'pan-anat-small-intestine', label: 'Small intestine', aliases: ['small bowel'], system: 'Digestive', region: 'Abdomen', scale: 'organ', layer: 'visceral',
    keywords: ['duodenum', 'jejunum', 'ileum', 'small intestine'], functionSummary: 'Principal site for enzymatic digestion and nutrient absorption.',
    microSummary: 'Circular folds, villi and microvilli expand absorptive surface while crypts contain renewing epithelial populations.', relationships: ['Stomach', 'Pancreas', 'Large intestine', 'Mesentery'], sourceIds: ['z_anatomy', 'hubmap_hra'], ta2: null,
  },
  {
    id: 'pan-anat-large-intestine', label: 'Large intestine', aliases: ['colon', 'large bowel'], system: 'Digestive', region: 'Abdomen / pelvis', scale: 'organ', layer: 'visceral',
    keywords: ['colon', 'large intestine', 'rectum'], functionSummary: 'Distal gut segment involved in water and electrolyte handling, microbial fermentation and fecal storage/transport.',
    microSummary: 'Its mucosa contains deep crypts and abundant mucus-producing goblet cells without small-intestinal villi.', relationships: ['Ileum', 'Appendix', 'Rectum'], sourceIds: ['z_anatomy', 'hubmap_hra'], ta2: null,
  },
  {
    id: 'pan-anat-kidneys', label: 'Kidneys', aliases: ['kidney', 'renal organs'], system: 'Urinary', region: 'Retroperitoneum', scale: 'organ', layer: 'visceral',
    keywords: ['kidney', 'renal'], functionSummary: 'Paired organs that filter plasma and regulate water, electrolytes, acid-base balance and endocrine signals.',
    microSummary: 'Nephrons combine glomerular filtration with tubular reabsorption and secretion along specialized segments.', relationships: ['Renal arteries', 'Renal veins', 'Ureters', 'Adrenal glands'], sourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], ta2: null,
  },
  {
    id: 'pan-anat-bladder', label: 'Urinary bladder', aliases: ['bladder', 'vesical organ'], system: 'Urinary', region: 'Pelvis', scale: 'organ', layer: 'visceral',
    keywords: ['urinary bladder', 'bladder'], functionSummary: 'Distensible muscular reservoir for urine before voiding.',
    microSummary: 'Urothelium lines a compliant wall backed by connective tissue and detrusor smooth muscle.', relationships: ['Ureters', 'Urethra', 'Pelvic floor'], sourceIds: ['z_anatomy', 'wikimedia_commons'], ta2: null,
  },
  {
    id: 'pan-anat-femur', label: 'Femur', aliases: ['thigh bone'], system: 'Skeletal', region: 'Lower limb', scale: 'structure', layer: 'skeletal',
    keywords: ['femur'], functionSummary: 'Major long bone transmitting load between hip and knee.',
    microSummary: 'Cortical bone surrounds trabecular regions and marrow; remodeling continually adapts the tissue to load.', relationships: ['Hip joint', 'Patella', 'Tibia'], sourceIds: ['z_anatomy', 'nih_3d'], ta2: null,
  },
  {
    id: 'pan-anat-tibia', label: 'Tibia', aliases: ['shin bone'], system: 'Skeletal', region: 'Lower limb', scale: 'structure', layer: 'skeletal',
    keywords: ['tibia'], functionSummary: 'Primary weight-bearing long bone of the leg between knee and ankle.',
    microSummary: 'Its cortex and trabecular architecture distribute bending, torsional and compressive loads.', relationships: ['Femur', 'Fibula', 'Talus'], sourceIds: ['z_anatomy', 'nih_3d'], ta2: null,
  },
  {
    id: 'pan-anat-humerus', label: 'Humerus', aliases: ['upper arm bone'], system: 'Skeletal', region: 'Upper limb', scale: 'structure', layer: 'skeletal',
    keywords: ['humerus'], functionSummary: 'Long bone connecting the shoulder girdle to the elbow.',
    microSummary: 'Cortical and trabecular bone form a load-bearing framework with marrow-containing medullary space.', relationships: ['Scapula', 'Radius', 'Ulna'], sourceIds: ['z_anatomy', 'nih_3d'], ta2: null,
  },
  {
    id: 'pan-anat-median-nerve', label: 'Median nerve', aliases: ['nervus medianus'], system: 'Peripheral nervous', region: 'Upper limb', scale: 'structure', layer: 'nervous',
    keywords: ['median nerve', 'median'], functionSummary: 'Major peripheral nerve carrying motor and sensory fibers through the arm, forearm and hand.',
    microSummary: 'Axons travel in fascicles supported by endoneurial, perineurial and epineurial connective tissues.', relationships: ['Brachial plexus', 'Carpal tunnel', 'Forearm flexors'], sourceIds: ['z_anatomy', 'nih_3d'], ta2: null,
  },
]

export function atlasPlusSearch(query: string): AtlasPlusEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return ATLAS_PLUS_ENTRIES
  return ATLAS_PLUS_ENTRIES.filter((entry) => {
    const haystack = [entry.id, entry.label, entry.system, entry.region, ...entry.aliases, ...entry.keywords]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

export function atlasPlusById(id: string | null | undefined): AtlasPlusEntry | null {
  if (!id) return null
  return ATLAS_PLUS_ENTRIES.find((entry) => entry.id === id) ?? null
}
