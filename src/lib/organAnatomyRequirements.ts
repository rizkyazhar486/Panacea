// Auditable gross-anatomy scope for Body Exposure.
//
// This file deliberately separates *what a learner should be able to inspect*
// from *what a particular GLB happens to contain*. A coarse mesh named
// "Stomach" must never be interpreted as proof that cardia, fundus, body,
// antrum, pylorus, and the curvatures are individually represented.
//
// Terminology is English-first and aligned to standard gross anatomy / FIPAT
// Terminologia Anatomica concepts. Matching is conservative: a requirement is
// Exact 3D only when an actual named source mesh contains one of its aliases.

export type AnatomyRequirementGroup =
  | 'gross'
  | 'ducts-vessels'
  | 'internal'
  | 'neurovascular'
  | 'surface'
  | 'system'

export interface OrganAnatomyRequirement {
  id: string
  label: string
  aliases: string[]
  group: AnatomyRequirementGroup
}

export interface OrganAnatomyScope {
  organKey: string
  label: string
  requirements: OrganAnatomyRequirement[]
}

const r = (
  id: string,
  label: string,
  aliases: string[],
  group: AnatomyRequirementGroup = 'gross',
): OrganAnatomyRequirement => ({ id, label, aliases, group })

export const ORGAN_ANATOMY_SCOPES: OrganAnatomyScope[] = [
  {
    organKey: 'heart', label: 'Heart', requirements: [
      r('right-atrium', 'Right atrium', ['right atrium']),
      r('left-atrium', 'Left atrium', ['left atrium']),
      r('right-ventricle', 'Right ventricle', ['right ventricle']),
      r('left-ventricle', 'Left ventricle', ['left ventricle']),
      r('interventricular-septum', 'Interventricular septum', ['interventricular septum'], 'internal'),
      r('tricuspid-valve', 'Tricuspid valve', ['tricuspid valve', 'right atrioventricular valve'], 'internal'),
      r('pulmonary-valve', 'Pulmonary valve', ['pulmonary valve'], 'internal'),
      r('mitral-valve', 'Mitral valve', ['mitral valve', 'left atrioventricular valve'], 'internal'),
      r('aortic-valve', 'Aortic valve', ['aortic valve'], 'internal'),
      r('papillary-muscle', 'Papillary muscles', ['papillary muscle'], 'internal'),
      r('chordae', 'Chordae tendineae', ['chordae tendineae', 'chorda tendinea'], 'internal'),
      r('aorta', 'Aorta', ['aorta'], 'ducts-vessels'),
      r('pulmonary-trunk', 'Pulmonary trunk', ['pulmonary trunk'], 'ducts-vessels'),
      r('vena-cava', 'Superior / inferior vena cava', ['superior vena cava', 'inferior vena cava'], 'ducts-vessels'),
    ],
  },
  {
    organKey: 'lungs', label: 'Lungs', requirements: [
      r('right-lung', 'Right lung', ['right lung']),
      r('left-lung', 'Left lung', ['left lung']),
      r('right-upper-lobe', 'Right superior lobe', ['superior lobe of right lung', 'right superior lobe']),
      r('right-middle-lobe', 'Right middle lobe', ['middle lobe of right lung', 'right middle lobe']),
      r('right-lower-lobe', 'Right inferior lobe', ['inferior lobe of right lung', 'right inferior lobe']),
      r('left-upper-lobe', 'Left superior lobe', ['superior lobe of left lung', 'left superior lobe']),
      r('left-lower-lobe', 'Left inferior lobe', ['inferior lobe of left lung', 'left inferior lobe']),
      r('trachea', 'Trachea', ['trachea'], 'ducts-vessels'),
      r('main-bronchi', 'Main bronchi', ['main bronchus', 'principal bronchus'], 'ducts-vessels'),
      r('lobar-bronchi', 'Lobar bronchi', ['lobar bronchus', 'secondary bronchus'], 'ducts-vessels'),
    ],
  },
  {
    organKey: 'liver', label: 'Liver', requirements: [
      r('right-lobe', 'Right lobe', ['right lobe of liver', 'right hepatic lobe']),
      r('left-lobe', 'Left lobe', ['left lobe of liver', 'left hepatic lobe']),
      r('caudate-lobe', 'Caudate lobe', ['caudate lobe']),
      r('quadrate-lobe', 'Quadrate lobe', ['quadrate lobe']),
      r('portal-vein', 'Portal vein', ['portal vein'], 'ducts-vessels'),
      r('hepatic-veins', 'Hepatic veins', ['hepatic vein'], 'ducts-vessels'),
      r('hepatic-artery', 'Hepatic artery', ['hepatic artery'], 'ducts-vessels'),
      r('hepatic-duct', 'Hepatic ducts', ['hepatic duct'], 'ducts-vessels'),
    ],
  },
  {
    organKey: 'kidneys', label: 'Kidneys', requirements: [
      r('right-kidney', 'Right kidney', ['right kidney']),
      r('left-kidney', 'Left kidney', ['left kidney']),
      r('renal-cortex', 'Renal cortex', ['renal cortex', 'cortex of kidney'], 'internal'),
      r('renal-medulla', 'Renal medulla', ['renal medulla', 'medulla of kidney'], 'internal'),
      r('renal-pyramids', 'Renal pyramids', ['renal pyramid'], 'internal'),
      r('renal-papilla', 'Renal papillae', ['renal papilla'], 'internal'),
      r('minor-calyx', 'Minor calyces', ['minor calyx'], 'internal'),
      r('major-calyx', 'Major calyces', ['major calyx'], 'internal'),
      r('renal-pelvis', 'Renal pelvis', ['renal pelvis'], 'internal'),
      r('ureter', 'Ureters', ['ureter'], 'ducts-vessels'),
      r('renal-artery', 'Renal arteries', ['renal artery'], 'ducts-vessels'),
      r('renal-vein', 'Renal veins', ['renal vein'], 'ducts-vessels'),
    ],
  },
  {
    organKey: 'stomach', label: 'Stomach', requirements: [
      r('cardia', 'Cardia', ['gastric cardia', 'cardia of stomach']),
      r('fundus', 'Fundus', ['fundus of stomach', 'gastric fundus']),
      r('body', 'Body', ['body of stomach', 'gastric body']),
      r('antrum', 'Pyloric antrum', ['pyloric antrum', 'gastric antrum']),
      r('pyloric-canal', 'Pyloric canal', ['pyloric canal']),
      r('pylorus', 'Pylorus', ['pylorus']),
      r('greater-curvature', 'Greater curvature', ['greater curvature of stomach', 'greater gastric curvature']),
      r('lesser-curvature', 'Lesser curvature', ['lesser curvature of stomach', 'lesser gastric curvature']),
    ],
  },
  {
    organKey: 'small-intestine', label: 'Small intestine', requirements: [
      r('duodenum', 'Duodenum', ['duodenum']),
      r('duodenum-superior', 'Superior duodenum', ['superior part of duodenum']),
      r('duodenum-descending', 'Descending duodenum', ['descending part of duodenum']),
      r('duodenum-horizontal', 'Horizontal duodenum', ['horizontal part of duodenum', 'inferior part of duodenum']),
      r('duodenum-ascending', 'Ascending duodenum', ['ascending part of duodenum']),
      r('jejunum', 'Jejunum', ['jejunum']),
      r('ileum', 'Ileum', ['ileum']),
      r('ileocecal-junction', 'Ileocecal junction', ['ileocecal junction', 'ileocecal valve']),
    ],
  },
  {
    organKey: 'large-intestine', label: 'Large intestine', requirements: [
      r('cecum', 'Cecum', ['cecum', 'caecum']),
      r('appendix', 'Vermiform appendix', ['vermiform appendix', 'appendix']),
      r('ascending-colon', 'Ascending colon', ['ascending colon']),
      r('hepatic-flexure', 'Right colic flexure', ['right colic flexure', 'hepatic flexure']),
      r('transverse-colon', 'Transverse colon', ['transverse colon']),
      r('splenic-flexure', 'Left colic flexure', ['left colic flexure', 'splenic flexure']),
      r('descending-colon', 'Descending colon', ['descending colon']),
      r('sigmoid-colon', 'Sigmoid colon', ['sigmoid colon']),
      r('rectum', 'Rectum', ['rectum']),
      r('anal-canal', 'Anal canal', ['anal canal']),
    ],
  },
  {
    organKey: 'pancreas', label: 'Pancreas', requirements: [
      r('head', 'Head', ['head of pancreas', 'pancreatic head']),
      r('uncinate', 'Uncinate process', ['uncinate process']),
      r('neck', 'Neck', ['neck of pancreas', 'pancreatic neck']),
      r('body', 'Body', ['body of pancreas', 'pancreatic body']),
      r('tail', 'Tail', ['tail of pancreas', 'pancreatic tail']),
      r('main-duct', 'Main pancreatic duct', ['main pancreatic duct', 'pancreatic duct'], 'ducts-vessels'),
    ],
  },
  {
    organKey: 'gallbladder', label: 'Gallbladder', requirements: [
      r('fundus', 'Fundus', ['fundus of gallbladder']),
      r('body', 'Body', ['body of gallbladder']),
      r('neck', 'Neck', ['neck of gallbladder']),
      r('cystic-duct', 'Cystic duct', ['cystic duct'], 'ducts-vessels'),
      r('common-bile-duct', 'Common bile duct', ['common bile duct'], 'ducts-vessels'),
    ],
  },
  {
    organKey: 'spleen', label: 'Spleen', requirements: [
      r('spleen', 'Spleen', ['spleen']),
      r('superior-pole', 'Superior pole', ['superior pole of spleen']),
      r('inferior-pole', 'Inferior pole', ['inferior pole of spleen']),
      r('diaphragmatic-surface', 'Diaphragmatic surface', ['diaphragmatic surface of spleen']),
      r('visceral-surface', 'Visceral surface', ['visceral surface of spleen']),
      r('hilum', 'Splenic hilum', ['hilum of spleen', 'splenic hilum']),
    ],
  },
  {
    organKey: 'lymph-nodes', label: 'Lymph nodes', requirements: [
      r('cervical', 'Cervical lymph nodes', ['cervical lymph node'], 'system'),
      r('axillary', 'Axillary lymph nodes', ['axillary lymph node'], 'system'),
      r('mediastinal', 'Mediastinal lymph nodes', ['mediastinal lymph node'], 'system'),
      r('mesenteric', 'Mesenteric lymph nodes', ['mesenteric lymph node'], 'system'),
      r('para-aortic', 'Lumbar / para-aortic lymph nodes', ['lumbar lymph node', 'para aortic lymph node'], 'system'),
      r('inguinal', 'Inguinal lymph nodes', ['inguinal lymph node'], 'system'),
    ],
  },
  {
    organKey: 'thyroid', label: 'Thyroid', requirements: [
      r('right-lobe', 'Right lobe', ['right lobe of thyroid', 'right thyroid lobe']),
      r('left-lobe', 'Left lobe', ['left lobe of thyroid', 'left thyroid lobe']),
      r('isthmus', 'Isthmus', ['isthmus of thyroid', 'thyroid isthmus']),
      r('pyramidal-lobe', 'Pyramidal lobe', ['pyramidal lobe of thyroid', 'pyramidal lobe']),
    ],
  },
  {
    organKey: 'adrenal', label: 'Adrenal glands', requirements: [
      r('right-adrenal', 'Right adrenal gland', ['right adrenal gland', 'right suprarenal gland']),
      r('left-adrenal', 'Left adrenal gland', ['left adrenal gland', 'left suprarenal gland']),
      r('cortex', 'Adrenal cortex', ['adrenal cortex', 'cortex of adrenal gland'], 'internal'),
      r('medulla', 'Adrenal medulla', ['adrenal medulla', 'medulla of adrenal gland'], 'internal'),
    ],
  },
  {
    organKey: 'pituitary', label: 'Pituitary gland', requirements: [
      r('adenohypophysis', 'Anterior pituitary / adenohypophysis', ['adenohypophysis', 'anterior lobe of pituitary'], 'internal'),
      r('neurohypophysis', 'Posterior pituitary / neurohypophysis', ['neurohypophysis', 'posterior lobe of pituitary'], 'internal'),
      r('pars-intermedia', 'Pars intermedia', ['pars intermedia'], 'internal'),
      r('infundibulum', 'Infundibulum', ['pituitary stalk', 'infundibulum'], 'internal'),
    ],
  },
  {
    organKey: 'bladder', label: 'Urinary bladder', requirements: [
      r('bladder', 'Urinary bladder', ['urinary bladder']),
      r('apex', 'Apex', ['apex of urinary bladder']),
      r('body', 'Body', ['body of urinary bladder']),
      r('fundus', 'Fundus', ['fundus of urinary bladder']),
      r('neck', 'Neck', ['neck of urinary bladder']),
      r('trigone', 'Trigone', ['trigone of urinary bladder', 'vesical trigone'], 'internal'),
      r('ureters', 'Ureters', ['ureter'], 'ducts-vessels'),
      r('urethra', 'Urethra', ['urethra'], 'ducts-vessels'),
    ],
  },
  {
    organKey: 'prostate', label: 'Prostate & seminal tract', requirements: [
      r('prostate', 'Prostate', ['prostate']),
      r('seminal-vesicles', 'Seminal vesicles', ['seminal vesicle'], 'ducts-vessels'),
      r('deferent-ducts', 'Ductus deferentes', ['deferent duct', 'ductus deferens', 'vas deferens'], 'ducts-vessels'),
      r('ejaculatory-ducts', 'Ejaculatory ducts', ['ejaculatory duct'], 'ducts-vessels'),
      r('prostatic-urethra', 'Prostatic urethra', ['prostatic urethra'], 'internal'),
    ],
  },
  {
    organKey: 'testis', label: 'Testis & epididymis', requirements: [
      r('right-testis', 'Right testis', ['right testis']),
      r('left-testis', 'Left testis', ['left testis']),
      r('epididymis-head', 'Head of epididymis', ['head of epididymis']),
      r('epididymis-body', 'Body of epididymis', ['body of epididymis']),
      r('epididymis-tail', 'Tail of epididymis', ['tail of epididymis']),
      r('ductus-deferens', 'Ductus deferens', ['deferent duct', 'ductus deferens', 'vas deferens'], 'ducts-vessels'),
      r('tunica-albuginea', 'Tunica albuginea', ['tunica albuginea of testis', 'tunica albuginea'], 'surface'),
    ],
  },
  {
    organKey: 'brain', label: 'Brain', requirements: [
      r('frontal-lobe', 'Frontal lobe', ['frontal lobe']),
      r('parietal-lobe', 'Parietal lobe', ['parietal lobe']),
      r('temporal-lobe', 'Temporal lobe', ['temporal lobe']),
      r('occipital-lobe', 'Occipital lobe', ['occipital lobe']),
      r('insula', 'Insula', ['insula']),
      r('thalamus', 'Thalamus', ['thalamus'], 'internal'),
      r('hypothalamus', 'Hypothalamus', ['hypothalamus'], 'internal'),
      r('hippocampus', 'Hippocampus', ['hippocampus'], 'internal'),
      r('amygdala', 'Amygdala', ['amygdala'], 'internal'),
      r('corpus-callosum', 'Corpus callosum', ['corpus callosum'], 'internal'),
      r('midbrain', 'Midbrain', ['midbrain', 'mesencephalon'], 'internal'),
      r('pons', 'Pons', ['pons'], 'internal'),
      r('medulla', 'Medulla oblongata', ['medulla oblongata'], 'internal'),
      r('cerebellum', 'Cerebellum', ['cerebellum']),
    ],
  },
  {
    organKey: 'spinal-cord', label: 'Spinal cord', requirements: [
      r('cervical', 'Cervical spinal cord', ['cervical spinal cord'], 'system'),
      r('thoracic', 'Thoracic spinal cord', ['thoracic spinal cord'], 'system'),
      r('lumbar', 'Lumbar spinal cord', ['lumbar spinal cord'], 'system'),
      r('sacral', 'Sacral spinal cord', ['sacral spinal cord'], 'system'),
      r('conus', 'Conus medullaris', ['conus medullaris']),
      r('anterior-horn', 'Anterior horn', ['anterior horn of spinal cord', 'ventral horn'], 'internal'),
      r('posterior-horn', 'Posterior horn', ['posterior horn of spinal cord', 'dorsal horn'], 'internal'),
    ],
  },
  {
    organKey: 'eye', label: 'Eye', requirements: [
      r('cornea', 'Cornea', ['cornea']),
      r('sclera', 'Sclera', ['sclera']),
      r('choroid', 'Choroid', ['choroid']),
      r('iris', 'Iris', ['iris']),
      r('ciliary-body', 'Ciliary body', ['ciliary body', 'corona ciliaris']),
      r('lens', 'Lens', ['lens of eye', 'ocular lens']),
      r('retina', 'Retina', ['retina']),
      r('vitreous', 'Vitreous body', ['vitreous body', 'vitreous humor'], 'internal'),
      r('optic-disc', 'Optic disc', ['optic disc'], 'internal'),
      r('optic-nerve', 'Optic nerve', ['optic nerve'], 'neurovascular'),
    ],
  },
  {
    organKey: 'ear', label: 'Ear', requirements: [
      r('auricle', 'Auricle', ['auricle', 'pinna']),
      r('external-meatus', 'External acoustic meatus', ['external acoustic meatus', 'external auditory canal']),
      r('tympanic-membrane', 'Tympanic membrane', ['tympanic membrane']),
      r('malleus', 'Malleus', ['malleus']),
      r('incus', 'Incus', ['incus']),
      r('stapes', 'Stapes', ['stapes']),
      r('cochlea', 'Cochlea', ['cochlea']),
      r('vestibule', 'Vestibule', ['vestibule of inner ear', 'vestibule']),
      r('semicircular-ducts', 'Semicircular ducts', ['semicircular duct', 'semicircular canal']),
      r('auditory-tube', 'Auditory tube', ['auditory tube', 'pharyngotympanic tube', 'eustachian tube']),
    ],
  },
  {
    organKey: 'external-nose', label: 'External nose', requirements: [
      r('dorsum', 'Dorsum', ['dorsum of nose', 'nasal dorsum'], 'surface'),
      r('apex', 'Apex / tip', ['apex of nose', 'tip of nose'], 'surface'),
      r('ala', 'Alae', ['ala of nose', 'nasal ala'], 'surface'),
      r('nostril', 'Nostrils', ['nostril', 'naris'], 'surface'),
    ],
  },
  {
    organKey: 'external-ear', label: 'External ear', requirements: [
      r('helix', 'Helix', ['helix of auricle', 'helix']),
      r('antihelix', 'Antihelix', ['antihelix']),
      r('tragus', 'Tragus', ['tragus']),
      r('antitragus', 'Antitragus', ['antitragus']),
      r('concha', 'Concha', ['concha of auricle', 'auricular concha']),
      r('lobule', 'Lobule', ['lobule of auricle', 'earlobe']),
    ],
  },
  {
    organKey: 'larynx', label: 'Larynx', requirements: [
      r('epiglottis', 'Epiglottis', ['epiglottis']),
      r('thyroid-cartilage', 'Thyroid cartilage', ['thyroid cartilage']),
      r('cricoid-cartilage', 'Cricoid cartilage', ['cricoid cartilage']),
      r('arytenoid', 'Arytenoid cartilages', ['arytenoid cartilage']),
      r('vocal-fold', 'Vocal folds', ['vocal fold', 'vocal cord'], 'internal'),
      r('vestibular-fold', 'Vestibular folds', ['vestibular fold', 'false vocal cord'], 'internal'),
      r('glottis', 'Glottis', ['glottis'], 'internal'),
    ],
  },
  {
    organKey: 'ossicles', label: 'Ear ossicles', requirements: [
      r('malleus', 'Malleus', ['malleus']),
      r('incus', 'Incus', ['incus']),
      r('stapes', 'Stapes', ['stapes']),
    ],
  },
  {
    organKey: 'eardrum', label: 'Eardrum & middle ear', requirements: [
      r('tympanic-membrane', 'Tympanic membrane', ['tympanic membrane']),
      r('pars-tensa', 'Pars tensa', ['pars tensa']),
      r('pars-flaccida', 'Pars flaccida', ['pars flaccida']),
      r('malleus-handle', 'Manubrium of malleus', ['manubrium of malleus', 'handle of malleus']),
      r('chorda-tympani', 'Chorda tympani', ['chorda tympani'], 'neurovascular'),
    ],
  },
  {
    organKey: 'inner-ear-nerve', label: 'Hearing & balance nerves', requirements: [
      r('cochlear-nerve', 'Cochlear nerve', ['cochlear nerve'], 'neurovascular'),
      r('vestibular-nerve', 'Vestibular nerve', ['vestibular nerve'], 'neurovascular'),
      r('vestibulocochlear', 'Vestibulocochlear nerve', ['vestibulocochlear nerve'], 'neurovascular'),
      r('cochlear-nuclei', 'Cochlear nuclei', ['cochlear nucleus'], 'internal'),
      r('vestibular-nuclei', 'Vestibular nuclei', ['vestibular nucleus', 'vestibular nuclei'], 'internal'),
    ],
  },
  {
    organKey: 'nasal-septum', label: 'Nasal septum & conchae', requirements: [
      r('septal-cartilage', 'Septal cartilage', ['nasal septal cartilage', 'septal cartilage']),
      r('perpendicular-plate', 'Perpendicular plate of ethmoid', ['perpendicular plate of ethmoid']),
      r('vomer', 'Vomer', ['vomer']),
      r('superior-concha', 'Superior nasal concha', ['superior nasal concha']),
      r('middle-concha', 'Middle nasal concha', ['middle nasal concha']),
      r('inferior-concha', 'Inferior nasal concha', ['inferior nasal concha']),
    ],
  },
  {
    organKey: 'pharynx', label: 'Pharynx', requirements: [
      r('nasopharynx', 'Nasopharynx', ['nasopharynx']),
      r('oropharynx', 'Oropharynx', ['oropharynx']),
      r('laryngopharynx', 'Laryngopharynx', ['laryngopharynx', 'hypopharynx']),
      r('pharyngeal-tonsil', 'Pharyngeal tonsil', ['pharyngeal tonsil', 'adenoid']),
      r('palatine-tonsil', 'Palatine tonsils', ['palatine tonsil']),
    ],
  },
  {
    organKey: 'optic-pathway', label: 'Optic pathway', requirements: [
      r('retina', 'Retina', ['retina']),
      r('optic-nerve', 'Optic nerves', ['optic nerve'], 'neurovascular'),
      r('optic-chiasm', 'Optic chiasm', ['optic chiasm'], 'neurovascular'),
      r('optic-tract', 'Optic tracts', ['optic tract'], 'neurovascular'),
      r('lateral-geniculate', 'Lateral geniculate body', ['lateral geniculate body', 'lateral geniculate nucleus'], 'internal'),
      r('optic-radiation', 'Optic radiations', ['optic radiation'], 'neurovascular'),
      r('visual-cortex', 'Primary visual cortex', ['primary visual cortex', 'calcarine cortex'], 'internal'),
    ],
  },
  {
    organKey: 'skeleton', label: 'Skeleton', requirements: [
      r('skull', 'Skull', ['skull', 'cranium'], 'system'),
      r('vertebral-column', 'Vertebral column', ['vertebra'], 'system'),
      r('thoracic-cage', 'Thoracic cage', ['rib', 'sternum'], 'system'),
      r('shoulder-girdle', 'Shoulder girdle', ['clavicle', 'scapula'], 'system'),
      r('upper-limb', 'Upper-limb long bones', ['humerus', 'radius', 'ulna'], 'system'),
      r('pelvis', 'Pelvis', ['pelvis', 'ilium', 'ischium', 'pubis'], 'system'),
      r('lower-limb', 'Lower-limb long bones', ['femur', 'tibia', 'fibula'], 'system'),
    ],
  },
  {
    organKey: 'skin', label: 'Skin', requirements: [
      r('epidermis', 'Epidermis', ['epidermis'], 'surface'),
      r('dermis', 'Dermis', ['dermis'], 'surface'),
      r('hypodermis', 'Subcutaneous tissue / hypodermis', ['hypodermis', 'subcutaneous tissue', 'tela subcutanea'], 'surface'),
      r('hair-follicle', 'Hair follicle', ['hair follicle', 'folliculus pili'], 'internal'),
      r('sebaceous-gland', 'Sebaceous gland', ['sebaceous gland'], 'internal'),
      r('sweat-gland', 'Sweat gland', ['sweat gland', 'sudoriferous gland'], 'internal'),
    ],
  },
  {
    organKey: 'breast', label: 'Breast', requirements: [
      r('nipple', 'Nipple', ['nipple'], 'surface'),
      r('areola', 'Areola', ['areola'], 'surface'),
      r('lobes', 'Mammary gland lobes / lobules', ['mammary lobe', 'mammary lobule', 'lobule of mammary gland'], 'internal'),
      r('lactiferous-ducts', 'Lactiferous ducts', ['lactiferous duct'], 'ducts-vessels'),
      r('retromammary-space', 'Retromammary space', ['retromammary space'], 'internal'),
    ],
  },
  {
    organKey: 'peripheral-nerves', label: 'Peripheral nerves', requirements: [
      r('cervical-plexus', 'Cervical plexus', ['cervical plexus'], 'system'),
      r('brachial-plexus', 'Brachial plexus', ['brachial plexus'], 'system'),
      r('lumbar-plexus', 'Lumbar plexus', ['lumbar plexus'], 'system'),
      r('sacral-plexus', 'Sacral plexus', ['sacral plexus'], 'system'),
      r('median', 'Median nerve', ['median nerve'], 'neurovascular'),
      r('ulnar', 'Ulnar nerve', ['ulnar nerve'], 'neurovascular'),
      r('radial', 'Radial nerve', ['radial nerve'], 'neurovascular'),
      r('femoral', 'Femoral nerve', ['femoral nerve'], 'neurovascular'),
      r('sciatic', 'Sciatic nerve', ['sciatic nerve'], 'neurovascular'),
      r('tibial', 'Tibial nerve', ['tibial nerve'], 'neurovascular'),
      r('fibular', 'Common fibular nerve', ['common fibular nerve', 'common peroneal nerve'], 'neurovascular'),
    ],
  },
]

export function normalizeAnatomyName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[._/()[\]-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function requirementMatchesSource(
  requirement: OrganAnatomyRequirement,
  sourcePartNames: string[],
): boolean {
  const aliases = requirement.aliases.map(normalizeAnatomyName).filter(Boolean)
  return sourcePartNames.some((sourceName) => {
    const source = normalizeAnatomyName(sourceName)
    return aliases.some((alias) => source === alias || source.includes(alias))
  })
}

export function anatomyScopeForOrgan(organKey: string): OrganAnatomyScope | undefined {
  return ORGAN_ANATOMY_SCOPES.find((scope) => scope.organKey === organKey)
}

export interface OrganAnatomyCoverage {
  matched: OrganAnatomyRequirement[]
  missing: OrganAnatomyRequirement[]
  total: number
}

export function anatomyCoverageForOrgan(organKey: string, sourcePartNames: string[]): OrganAnatomyCoverage {
  const scope = anatomyScopeForOrgan(organKey)
  if (!scope) return { matched: [], missing: [], total: 0 }
  const matched: OrganAnatomyRequirement[] = []
  const missing: OrganAnatomyRequirement[] = []
  for (const requirement of scope.requirements) {
    if (requirementMatchesSource(requirement, sourcePartNames)) matched.push(requirement)
    else missing.push(requirement)
  }
  return { matched, missing, total: scope.requirements.length }
}
