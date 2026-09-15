export type ImagingModality = 'xray' | 'ct' | 'mri' | 'ultrasound' | 'echo' | 'nuclear' | 'endoscopy' | 'pathology'
export type ImagingPlane = 'axial' | 'coronal' | 'sagittal' | 'oblique' | 'projection' | 'surface' | 'volume'

export interface ImagingPreset {
  id: string
  title: string
  modality: ImagingModality
  plane: ImagingPlane
  region: string
  emphasis: readonly string[]
  synchronized3d: readonly string[]
  interactions: readonly string[]
  educationalOnly: true
}

const i = (
  id: string,
  title: string,
  modality: ImagingModality,
  plane: ImagingPlane,
  region: string,
  emphasis: readonly string[],
  synchronized3d: readonly string[],
  interactions: readonly string[] = ['scroll', 'zoom', 'window', 'crosshair', 'compare', 'label'],
): ImagingPreset => ({ id, title, modality, plane, region, emphasis, synchronized3d, interactions, educationalOnly: true })

export const BODY_IMAGING_UNIVERSE: readonly ImagingPreset[] = [
  i('xray-chest-pa', 'Chest projection explorer', 'xray', 'projection', 'thorax', ['lungs', 'heart silhouette', 'mediastinum', 'ribs', 'diaphragm'], ['thoracic skeleton', 'lungs', 'heart']),
  i('xray-msk', 'Musculoskeletal projection explorer', 'xray', 'projection', 'limb', ['alignment', 'joint spaces', 'cortical contour', 'trabecular pattern'], ['bone model', 'joint axes']),
  i('ct-head', 'Head CT slice world', 'ct', 'axial', 'head', ['brain density', 'ventricles', 'skull', 'cisterns', 'hemorrhage teaching overlays'], ['brain', 'skull', 'ventricular system']),
  i('ct-stroke', 'Stroke CT/CTA teaching world', 'ct', 'axial', 'brain', ['early ischemic change', 'arterial anatomy', 'large-vessel territories'], ['cerebral arteries', 'cortex', 'deep nuclei']),
  i('ct-chest', 'Chest CT anatomy world', 'ct', 'axial', 'thorax', ['airways', 'parenchyma', 'pleura', 'mediastinum', 'pulmonary vessels'], ['lungs', 'airway tree', 'heart', 'vessels']),
  i('ct-cardiac', 'Cardiac CT geometry', 'ct', 'oblique', 'heart', ['coronary origins', 'cardiac chambers', 'aortic root', 'calcium-style teaching overlays'], ['heart', 'coronaries', 'aortic root']),
  i('ct-abdomen', 'Abdominal CT atlas', 'ct', 'axial', 'abdomen', ['liver', 'spleen', 'pancreas', 'kidneys', 'bowel', 'vessels'], ['viscera', 'aorta', 'portal system']),
  i('ct-trauma', 'Whole-body trauma CT explorer', 'ct', 'volume', 'whole-body', ['head', 'chest', 'abdomen', 'pelvis', 'spine'], ['whole-body skeleton', 'major organs', 'major vessels']),
  i('ct-bone', 'High-detail bone CT concept', 'ct', 'volume', 'musculoskeletal', ['cortical bone', 'fracture geometry', 'joint surfaces'], ['skeleton', 'fracture overlays']),
  i('mri-brain-t1', 'Brain T1 teaching preset', 'mri', 'axial', 'brain', ['anatomical boundaries', 'white-gray relationships', 'post-contrast concept'], ['brain regions', 'ventricles']),
  i('mri-brain-t2', 'Brain T2 teaching preset', 'mri', 'axial', 'brain', ['water-rich tissue contrast', 'edema-style teaching overlays', 'CSF spaces'], ['brain', 'CSF spaces']),
  i('mri-brain-flair', 'Brain FLAIR teaching preset', 'mri', 'axial', 'brain', ['CSF suppression concept', 'parenchymal signal emphasis'], ['brain', 'periventricular regions']),
  i('mri-dwi', 'Diffusion teaching preset', 'mri', 'axial', 'brain', ['diffusion restriction concept', 'ADC pairing', 'acute-lesion localization'], ['vascular territories', 'brain']),
  i('mri-swi', 'Susceptibility teaching preset', 'mri', 'axial', 'brain', ['blood-product susceptibility concept', 'venous structures'], ['brain', 'venous anatomy']),
  i('mri-spine', 'Spine MRI explorer', 'mri', 'sagittal', 'spine', ['vertebral bodies', 'discs', 'cord', 'roots', 'CSF'], ['spine', 'cord', 'roots']),
  i('mri-knee', 'Knee MRI explorer', 'mri', 'sagittal', 'knee', ['menisci', 'ACL', 'PCL', 'cartilage', 'bone marrow'], ['knee joint', 'ligaments', 'menisci']),
  i('mri-shoulder', 'Shoulder MRI explorer', 'mri', 'oblique', 'shoulder', ['rotator cuff', 'labrum', 'cartilage', 'biceps tendon'], ['shoulder joint', 'rotator cuff']),
  i('mri-pelvis', 'Pelvic MRI explorer', 'mri', 'axial', 'pelvis', ['pelvic organs', 'pelvic floor', 'regional compartments'], ['pelvic viscera', 'pelvic floor']),
  i('us-abdomen', 'Abdominal ultrasound beam lab', 'ultrasound', 'oblique', 'abdomen', ['liver', 'gallbladder', 'kidney', 'aorta', 'IVC'], ['probe', 'beam plane', 'target organ']),
  i('us-lung', 'Lung ultrasound teaching lab', 'ultrasound', 'surface', 'thorax', ['pleural line', 'artifact concepts', 'diaphragm', 'effusion space'], ['pleura', 'lung surface', 'diaphragm']),
  i('us-vascular', 'Vascular ultrasound lab', 'ultrasound', 'oblique', 'vessels', ['vessel lumen', 'flow direction', 'compression concept', 'Doppler-style overlays'], ['artery', 'vein', 'probe']),
  i('us-ob', 'Obstetric ultrasound concept', 'ultrasound', 'oblique', 'pelvis-uterus', ['gestational anatomy', 'placenta', 'fetal orientation'], ['uterus', 'gestational structures', 'probe']),
  i('us-renal', 'Renal ultrasound concept', 'ultrasound', 'oblique', 'flank', ['kidney', 'collecting system', 'bladder', 'post-void concept'], ['kidney', 'ureter route', 'bladder']),
  i('echo-plax', 'Echo parasternal long-axis', 'echo', 'oblique', 'heart', ['LV', 'LA', 'aortic root', 'mitral valve', 'RV'], ['heart', 'probe', 'beam plane']),
  i('echo-psax', 'Echo parasternal short-axis', 'echo', 'oblique', 'heart', ['ventricular circularity', 'valve levels', 'papillary level'], ['heart', 'probe', 'beam plane']),
  i('echo-apical4', 'Echo apical four-chamber', 'echo', 'oblique', 'heart', ['four chambers', 'AV valves', 'septum'], ['heart', 'probe', 'beam plane']),
  i('echo-subcostal', 'Echo subcostal window', 'echo', 'oblique', 'heart', ['four chambers', 'pericardium', 'IVC context'], ['heart', 'IVC', 'probe']),
  i('nuclear-bone', 'Bone scintigraphy concept', 'nuclear', 'projection', 'skeleton', ['tracer distribution concept', 'skeletal symmetry', 'focal uptake teaching overlays'], ['skeleton']),
  i('nuclear-thyroid', 'Thyroid uptake concept', 'nuclear', 'projection', 'neck', ['functional distribution', 'hot-cold pattern concept'], ['thyroid']),
  i('pet-wholebody', 'Whole-body PET concept', 'nuclear', 'volume', 'whole-body', ['metabolic activity concept', 'physiologic uptake regions', 'lesion overlay teaching'], ['whole body', 'organs']),
  i('endo-upper-gi', 'Upper GI endoscopic flight', 'endoscopy', 'surface', 'upper-GI', ['esophagus', 'stomach', 'duodenum', 'mucosal landmarks'], ['lumen path', 'organ shell']),
  i('endo-colon', 'Colonoscopy flight', 'endoscopy', 'surface', 'colon', ['rectum', 'colonic segments', 'folds', 'mucosal landmarks'], ['colon path', 'organ shell']),
  i('endo-airway', 'Bronchoscopy flight', 'endoscopy', 'surface', 'airway', ['trachea', 'carina', 'lobar bronchi', 'segmental bronchi'], ['airway tree']),
  i('endo-bladder', 'Cystoscopy flight', 'endoscopy', 'surface', 'bladder', ['urethra', 'bladder walls', 'ureteric orifices'], ['lower urinary tract']),
  i('path-skin', 'Skin histology navigator', 'pathology', 'surface', 'skin', ['epidermis', 'dermis', 'appendages', 'subcutis'], ['skin micro-world']),
  i('path-liver', 'Liver histology navigator', 'pathology', 'surface', 'liver', ['lobules', 'portal tracts', 'sinusoids', 'fibrosis-style overlays'], ['liver micro-world']),
  i('path-kidney', 'Kidney histology navigator', 'pathology', 'surface', 'kidney', ['glomeruli', 'tubules', 'interstitium', 'vessels'], ['kidney micro-world']),
  i('path-lung', 'Lung histology navigator', 'pathology', 'surface', 'lung', ['alveoli', 'interstitium', 'small airways', 'vessels'], ['lung micro-world']),
  i('path-lymphnode', 'Lymph node histology navigator', 'pathology', 'surface', 'lymph-node', ['cortex', 'follicles', 'paracortex', 'sinuses', 'medulla'], ['immune micro-world']),
] as const

export const BODY_IMAGING_MODALITIES = [...new Set(BODY_IMAGING_UNIVERSE.map((preset) => preset.modality))]
export const BODY_IMAGING_PLANES = [...new Set(BODY_IMAGING_UNIVERSE.map((preset) => preset.plane))]

export function imagingPreset(id: string) {
  return BODY_IMAGING_UNIVERSE.find((preset) => preset.id === id)
}

export function imagingPresetsForModality(modality: ImagingModality) {
  return BODY_IMAGING_UNIVERSE.filter((preset) => preset.modality === modality)
}

export function searchImagingUniverse(query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return BODY_IMAGING_UNIVERSE
  return BODY_IMAGING_UNIVERSE.filter((preset) => [preset.title, preset.modality, preset.plane, preset.region, ...preset.emphasis, ...preset.synchronized3d].join(' ').toLowerCase().includes(normalized))
}

export const BODY_IMAGING_UNIVERSE_META = {
  presetCount: BODY_IMAGING_UNIVERSE.length,
  modalityCount: BODY_IMAGING_MODALITIES.length,
  planeCount: BODY_IMAGING_PLANES.length,
  realDicomValidationRequiredBeforeClinicalUse: true,
  currentPurpose: 'educational multimodal synchronization architecture',
} as const
