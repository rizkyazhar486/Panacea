export type SimulationFamily =
  | 'cardio'
  | 'neuro'
  | 'respiratory'
  | 'renal'
  | 'GI'
  | 'endocrine'
  | 'reproductive'
  | 'immune'
  | 'MSK'
  | 'ENT-eye'
  | 'surgery'
  | 'emergency'
  | 'imaging'
  | 'biomechanics'

export interface SimulationControl {
  id: string
  label: string
  min: number
  max: number
  step: number
  value: number
  unit?: string
}

export interface SimulationScenario {
  id: string
  title: string
  family: SimulationFamily
  description: string
  controls: readonly SimulationControl[]
  outputs: readonly string[]
  visualLayers: readonly string[]
  flags?: readonly string[]
}

const c = (id: string, label: string, min: number, max: number, step: number, value: number, unit?: string): SimulationControl => ({ id, label, min, max, step, value, unit })
const s = (
  id: string,
  title: string,
  family: SimulationFamily,
  description: string,
  controls: readonly SimulationControl[],
  outputs: readonly string[],
  visualLayers: readonly string[],
  flags: readonly string[] = ['synthetic', 'educational'],
): SimulationScenario => ({ id, title, family, description, controls, outputs, visualLayers, flags })

export const BODY_SIMULATION_SCENARIOS: readonly SimulationScenario[] = [
  s('cardiac-cycle', 'Cardiac Cycle Engine', 'cardio', 'Synthetic pressure-volume animation with chamber timing and valve-state overlays.', [c('hr', 'Heart rate', 40, 180, 1, 72, 'bpm'), c('preload', 'Preload', 0, 100, 1, 58, '%'), c('afterload', 'Afterload', 0, 100, 1, 48, '%'), c('contractility', 'Contractility', 0, 100, 1, 62, '%')], ['stroke volume', 'cycle duration', 'relative pressure', 'valve state'], ['chambers', 'valves', 'great vessels', 'ECG timing']),
  s('shock-sandbox', 'Shock Hemodynamics Sandbox', 'emergency', 'Explore synthetic interactions between pump function, circulating volume, vascular tone, and obstruction.', [c('pump', 'Pump function', 0, 100, 1, 62, '%'), c('volume', 'Effective volume', 0, 100, 1, 65, '%'), c('tone', 'Vascular tone', 0, 100, 1, 55, '%'), c('obstruction', 'Flow obstruction', 0, 100, 1, 0, '%')], ['MAP proxy', 'perfusion proxy', 'venous pressure proxy', 'shock phenotype hint'], ['heart', 'arterial tree', 'venous tree', 'microcirculation']),
  s('arrhythmia-clock', 'Arrhythmia Clock', 'cardio', 'Animate synthetic atrial and ventricular activation timing with rhythm irregularity controls.', [c('atrialRate', 'Atrial rate', 40, 300, 1, 80, 'bpm'), c('avConduction', 'AV conduction', 0, 100, 1, 95, '%'), c('irregularity', 'Irregularity', 0, 100, 1, 5, '%')], ['RR sequence', 'atrial-ventricular relationship', 'rate estimate'], ['SA node', 'atria', 'AV node', 'His-Purkinje']),
  s('stroke-territory', 'Stroke Territory Sandbox', 'neuro', 'Toggle synthetic lesion position and size against a vascular-territory teaching map.', [c('x', 'Left-right', -100, 100, 1, 25), c('y', 'Anterior-posterior', -100, 100, 1, -15), c('size', 'Lesion radius', 1, 100, 1, 22, '%')], ['territory overlap', 'tract proximity', 'cortical region proximity'], ['cortex', 'deep nuclei', 'arterial territories', 'long tracts']),
  s('icp-box', 'Intracranial Volume Box', 'neuro', 'Synthetic Monro-Kellie style visual teaching model linking brain, blood, and CSF volume compartments.', [c('brain', 'Brain volume', 80, 120, 1, 100, '%'), c('blood', 'Blood volume', 50, 150, 1, 100, '%'), c('csf', 'CSF volume', 20, 180, 1, 100, '%')], ['reserve indicator', 'pressure proxy', 'perfusion warning'], ['brain', 'blood compartment', 'CSF space', 'skull']),
  s('tract-localizer', 'Motor-Sensory Tract Localizer', 'neuro', 'Move a lesion marker through a stylized neuraxis and compare predicted pathway intersections.', [c('level', 'Neuraxis level', 0, 100, 1, 55, '%'), c('lateral', 'Lateral position', -100, 100, 1, 20), c('radius', 'Lesion size', 1, 100, 1, 18, '%')], ['tract hits', 'crossing status', 'side relationship'], ['corticospinal', 'spinothalamic', 'dorsal columns', 'cranial pathways']),
  s('ventilator-lab', 'Ventilator Mechanics Lab', 'respiratory', 'A synthetic respiratory mechanics sandbox for visualizing pressure, volume, resistance, and compliance relationships.', [c('rate', 'Respiratory rate', 5, 40, 1, 16, '/min'), c('vt', 'Relative tidal volume', 20, 100, 1, 55, '%'), c('compliance', 'Compliance', 10, 100, 1, 65, '%'), c('resistance', 'Airway resistance', 0, 100, 1, 25, '%')], ['airway pressure proxy', 'minute ventilation proxy', 'flow waveform', 'volume waveform'], ['airway tree', 'lungs', 'diaphragm', 'waveforms']),
  s('vq-map', 'V/Q Map', 'respiratory', 'Paint regional ventilation and perfusion values onto a synthetic lung field.', [c('ventilation', 'Ventilation', 0, 100, 1, 78, '%'), c('perfusion', 'Perfusion', 0, 100, 1, 82, '%'), c('shunt', 'Shunt region', 0, 100, 1, 5, '%'), c('deadspace', 'Dead-space region', 0, 100, 1, 8, '%')], ['V/Q proxy', 'oxygenation trend', 'dead-space trend'], ['alveoli', 'capillaries', 'pulmonary arteries', 'gas particles']),
  s('airway-tree', 'Bronchial Flow Tree', 'respiratory', 'Synthetic particles demonstrate changing flow through progressively branching airways.', [c('flow', 'Inspiratory flow', 0, 100, 1, 55, '%'), c('radius', 'Airway radius', 20, 140, 1, 100, '%'), c('mucus', 'Mucus load', 0, 100, 1, 8, '%')], ['relative resistance', 'particle velocity', 'distal delivery'], ['trachea', 'bronchi', 'bronchioles', 'alveoli']),
  s('nephron-flow', 'Nephron Flow Simulator', 'renal', 'Follow synthetic solute and water handling through major nephron segments.', [c('filtration', 'Filtration', 0, 100, 1, 70, '%'), c('proximal', 'Proximal reabsorption', 0, 100, 1, 65, '%'), c('loop', 'Loop gradient', 0, 100, 1, 62, '%'), c('adh', 'ADH signal', 0, 100, 1, 45, '%')], ['urine concentration proxy', 'water excretion proxy', 'sodium handling proxy'], ['glomerulus', 'proximal tubule', 'loop', 'distal tubule', 'collecting duct']),
  s('acid-base', 'Acid-Base Mixer', 'renal', 'Manipulate synthetic ventilation and metabolic acid/base drivers with a visual compensation board.', [c('ventilation', 'Ventilation', 20, 180, 1, 100, '%'), c('metabolicAcid', 'Metabolic acid load', 0, 100, 1, 10, '%'), c('bicarbonate', 'Buffer reserve', 0, 100, 1, 72, '%'), c('renalResponse', 'Renal response', 0, 100, 1, 50, '%')], ['pH direction', 'respiratory direction', 'metabolic direction', 'compensation trend'], ['lung', 'kidney', 'blood buffer', 'timeline']),
  s('gi-transit', 'GI Transit Timeline', 'GI', 'Animate a synthetic meal through esophagus, stomach, small bowel, colon, and rectum.', [c('gastric', 'Gastric emptying', 0, 100, 1, 50, '%'), c('smallBowel', 'Small-bowel transit', 0, 100, 1, 55, '%'), c('colon', 'Colonic transit', 0, 100, 1, 45, '%')], ['transit time proxy', 'segment occupancy', 'absorption window'], ['esophagus', 'stomach', 'small bowel', 'colon']),
  s('portal-pressure', 'Portal Pressure World', 'GI', 'Synthetic portal-flow visualization with adjustable inflow, resistance, collateralization, and ascites tendency.', [c('inflow', 'Portal inflow', 0, 100, 1, 60, '%'), c('resistance', 'Hepatic resistance', 0, 100, 1, 30, '%'), c('collaterals', 'Collateral capacity', 0, 100, 1, 20, '%')], ['portal pressure proxy', 'collateral flow proxy', 'congestion trend'], ['portal vein', 'liver', 'splenic vein', 'collaterals']),
  s('glucose-control', 'Glucose-Insulin Control Loop', 'endocrine', 'Synthetic glucose dynamics respond to meal load, insulin signal, counter-regulation, and activity.', [c('meal', 'Meal glucose load', 0, 100, 1, 35, '%'), c('insulin', 'Insulin signal', 0, 100, 1, 62, '%'), c('counter', 'Counter-regulation', 0, 100, 1, 15, '%'), c('activity', 'Activity uptake', 0, 100, 1, 22, '%')], ['glucose trend', 'storage trend', 'ketone tendency proxy'], ['pancreas', 'liver', 'muscle', 'adipose']),
  s('thyroid-loop', 'Thyroid Feedback Loop', 'endocrine', 'Animate a synthetic hypothalamic-pituitary-thyroid negative feedback circuit.', [c('trh', 'TRH drive', 0, 100, 1, 50, '%'), c('tsh', 'TSH drive', 0, 100, 1, 50, '%'), c('thyroid', 'Thyroid output', 0, 100, 1, 50, '%')], ['feedback direction', 'axis state', 'target tissue effect proxy'], ['hypothalamus', 'pituitary', 'thyroid', 'target tissues']),
  s('cycle-ring', 'Ovarian-Endometrial Cycle Ring', 'reproductive', 'Synthetic circular timeline synchronizes follicle state, hormone waves, ovulation marker, and endometrial phase.', [c('day', 'Cycle day', 1, 35, 1, 14, 'day'), c('estrogen', 'Estrogen signal', 0, 100, 1, 60, '%'), c('progesterone', 'Progesterone signal', 0, 100, 1, 15, '%')], ['phase', 'ovulatory window marker', 'endometrial state'], ['ovary', 'pituitary', 'uterus', 'hormone curves']),
  s('fetal-flow', 'Fetal Circulation Flow', 'reproductive', 'A synthetic animated map demonstrates prenatal shunts and placental flow pathways.', [c('placentalFlow', 'Placental flow', 0, 100, 1, 75, '%'), c('pulmonaryResistance', 'Pulmonary resistance', 0, 100, 1, 80, '%'), c('ductalFlow', 'Ductal flow', 0, 100, 1, 72, '%')], ['right-left distribution proxy', 'placental return', 'shunt flow direction'], ['placenta', 'umbilical vein', 'ductus venosus', 'foramen ovale', 'ductus arteriosus']),
  s('immune-response', 'Immune Response Arena', 'immune', 'Synthetic pathogen signal triggers innate recruitment followed by delayed adaptive response layers.', [c('pathogen', 'Pathogen signal', 0, 100, 1, 25, '%'), c('innate', 'Innate response', 0, 100, 1, 55, '%'), c('adaptive', 'Adaptive response', 0, 100, 1, 20, '%'), c('regulation', 'Regulatory brake', 0, 100, 1, 35, '%')], ['inflammation proxy', 'clearance proxy', 'tissue stress proxy'], ['barrier', 'neutrophils', 'macrophages', 'T cells', 'B cells']),
  s('lymph-flow', 'Lymphatic Drainage Map', 'immune', 'Animated synthetic lymph flow traverses peripheral channels, nodal basins, and central return.', [c('production', 'Interstitial fluid load', 0, 100, 1, 45, '%'), c('drainage', 'Lymph drainage', 0, 100, 1, 68, '%'), c('obstruction', 'Obstruction', 0, 100, 1, 5, '%')], ['edema tendency', 'nodal throughput', 'central return'], ['lymphatics', 'nodes', 'thoracic duct', 'venous return']),
  s('gait', 'Gait Cycle Studio', 'biomechanics', 'Synthetic full-body gait timeline with center-of-mass and joint-angle traces.', [c('speed', 'Speed', 0.2, 3.0, 0.1, 1.2, 'm/s'), c('cadence', 'Cadence', 50, 220, 1, 110, 'steps/min'), c('stride', 'Stride scale', 50, 150, 1, 100, '%')], ['stance time', 'swing time', 'COM path', 'joint angle curves'], ['pelvis', 'hip', 'knee', 'ankle', 'foot']),
  s('squat', 'Squat Kinetic Chain', 'biomechanics', 'Synthetic lower-limb model visualizes depth, knee travel, trunk angle, and load distribution.', [c('depth', 'Depth', 0, 100, 1, 65, '%'), c('load', 'External load', 0, 100, 1, 35, '%'), c('trunk', 'Trunk inclination', 0, 70, 1, 25, 'deg')], ['joint moment proxies', 'COM projection', 'range-of-motion'], ['spine', 'pelvis', 'hip', 'knee', 'ankle']),
  s('throw', 'Throwing Kinetic Chain', 'biomechanics', 'Synthetic energy pulse travels from lower limb through trunk to upper limb.', [c('legDrive', 'Leg drive', 0, 100, 1, 65, '%'), c('rotation', 'Trunk rotation', 0, 100, 1, 70, '%'), c('shoulder', 'Shoulder contribution', 0, 100, 1, 75, '%')], ['energy transfer proxy', 'segment timing', 'joint velocity proxy'], ['legs', 'pelvis', 'trunk', 'shoulder', 'elbow', 'wrist']),
  s('skin-depth', 'Skin Depth Explorer', 'ENT-eye', 'A synthetic surface-to-micro view transitions through epidermis, dermis, adnexa, vessels, nerves, and fat.', [c('depth', 'Depth', 0, 100, 1, 15, '%'), c('zoom', 'Microscopic zoom', 1, 100, 1, 10, '×')], ['active layer', 'structure labels', 'relative scale'], ['epidermis', 'dermis', 'follicle', 'gland', 'vessel', 'nerve']),
  s('eye-optics', 'Eye Optics Bench', 'ENT-eye', 'Synthetic ray tracing visualizes corneal and lenticular refraction with accommodation control.', [c('focus', 'Accommodation', 0, 100, 1, 20, '%'), c('pupil', 'Pupil size', 2, 8, 0.1, 4, 'mm'), c('objectDistance', 'Object distance', 0.2, 20, 0.1, 3, 'm')], ['focus plane', 'ray convergence', 'retinal blur proxy'], ['cornea', 'anterior chamber', 'lens', 'retina', 'optic nerve']),
  s('cochlear-wave', 'Cochlear Traveling Wave', 'ENT-eye', 'Synthetic frequency slider moves the peak traveling wave along a stylized cochlear membrane.', [c('frequency', 'Frequency', 20, 16000, 20, 1000, 'Hz'), c('intensity', 'Relative intensity', 0, 100, 1, 45, '%')], ['peak location', 'wave amplitude proxy'], ['cochlea', 'basilar membrane', 'hair cells', 'auditory nerve']),
  s('ct-volume', 'CT Volume Scrubber', 'imaging', 'Synthetic volumetric body data is represented with synchronized axial, sagittal, coronal, and 3D locator planes.', [c('axial', 'Axial slice', 0, 100, 1, 50, '%'), c('window', 'Window width', 0, 100, 1, 50, '%'), c('level', 'Window level', 0, 100, 1, 50, '%')], ['slice index', 'plane intersection', 'window preset'], ['axial plane', 'sagittal plane', 'coronal plane', '3D body']),
  s('mri-morph', 'MRI Sequence Morph', 'imaging', 'Synthetic tissue contrast smoothly morphs between teaching presets inspired by common MR sequence families.', [c('t1', 'T1 weighting', 0, 100, 1, 50, '%'), c('t2', 'T2 weighting', 0, 100, 1, 50, '%'), c('diffusion', 'Diffusion emphasis', 0, 100, 1, 0, '%')], ['contrast map', 'sequence label', 'tissue emphasis'], ['brain', 'CSF', 'white matter', 'gray matter']),
  s('ultrasound-probe', 'Ultrasound Probe Trainer', 'imaging', 'Move a virtual probe over synthetic anatomy while the beam plane updates a stylized image.', [c('angle', 'Probe angle', -60, 60, 1, 0, 'deg'), c('depth', 'Imaging depth', 2, 30, 1, 12, 'cm'), c('gain', 'Gain', 0, 100, 1, 50, '%')], ['beam plane', 'depth scale', 'target alignment'], ['probe', 'beam', 'target organ', 'image plane']),
  s('laparoscopy', 'Laparoscopy Camera Gym', 'surgery', 'Synthetic enclosed-space trainer for camera centering, horizon control, depth, and target approach.', [c('yaw', 'Camera yaw', -90, 90, 1, 0, 'deg'), c('pitch', 'Camera pitch', -60, 60, 1, 0, 'deg'), c('zoom', 'Camera distance', 20, 100, 1, 60, '%')], ['target centering', 'horizon error', 'camera smoothness'], ['abdominal cavity', 'camera', 'target', 'instruments']),
  s('arthroscopy', 'Arthroscopy Portal Gym', 'surgery', 'Synthetic joint-space navigation with portal geometry, camera cone, and target acquisition.', [c('portal', 'Portal angle', -45, 45, 1, 0, 'deg'), c('camera', 'Camera rotation', -180, 180, 1, 0, 'deg'), c('distension', 'Joint distension', 0, 100, 1, 55, '%')], ['target visibility', 'camera angle', 'spatial score'], ['joint', 'cartilage', 'camera', 'portal']),
  s('fracture-fixation', 'Fracture Fixation Concept Lab', 'surgery', 'Synthetic bone fragments and fixation objects can be aligned in an educational planning sandbox.', [c('translation', 'Fragment translation', -50, 50, 1, 12, '%'), c('angulation', 'Angulation', -45, 45, 1, 8, 'deg'), c('rotation', 'Rotation', -45, 45, 1, 0, 'deg')], ['alignment score', 'axis deviation', 'construct concept'], ['bone', 'fracture', 'plate', 'screw', 'nail']),
  s('surgical-layer', 'Surgical Layer Peel', 'surgery', 'Synthetic ordered tissue planes reveal deeper anatomy without pretending to reproduce patient-specific surgery.', [c('depth', 'Dissection depth', 0, 100, 1, 10, '%'), c('traction', 'Retraction', 0, 100, 1, 15, '%'), c('transparency', 'Context transparency', 0, 100, 1, 40, '%')], ['current layer', 'protected structures', 'depth index'], ['skin', 'subcutaneous', 'fascia', 'muscle', 'vessels', 'nerves', 'organ']),
  s('bleeding-control', 'Synthetic Bleeding Control Drill', 'emergency', 'A non-patient-specific visual drill links source flow, compression effectiveness, and volume-loss trend.', [c('flow', 'Bleeding source flow', 0, 100, 1, 35, '%'), c('compression', 'Compression', 0, 100, 1, 0, '%'), c('time', 'Elapsed time', 0, 300, 1, 0, 's')], ['flow trend', 'volume-loss proxy', 'control status'], ['vessel', 'wound field', 'pressure zone', 'trend graph']),
  s('code-blue', 'Code Blue Synthetic Scenario', 'emergency', 'A scripted non-patient-specific training canvas connects rhythm state, perfusion, oxygenation, and intervention events.', [c('rhythm', 'Rhythm stability', 0, 100, 1, 70, '%'), c('perfusion', 'Perfusion', 0, 100, 1, 55, '%'), c('oxygen', 'Oxygenation', 0, 100, 1, 75, '%')], ['state timeline', 'event markers', 'perfusion proxy'], ['ECG', 'heart', 'lungs', 'brain', 'timeline']),
  s('trauma-map', 'Whole-Body Trauma Map', 'emergency', 'Synthetic regional injury markers can be placed across head, chest, abdomen, pelvis, and limbs for prioritization training.', [c('head', 'Head injury load', 0, 100, 1, 10, '%'), c('chest', 'Chest injury load', 0, 100, 1, 20, '%'), c('abdomen', 'Abdominal injury load', 0, 100, 1, 15, '%'), c('pelvis', 'Pelvic injury load', 0, 100, 1, 5, '%')], ['regional burden', 'priority ordering', 'timeline'], ['whole body', 'regions', 'vitals', 'imaging checkpoints']),
] as const

export const BODY_SIMULATION_FAMILIES = [...new Set(BODY_SIMULATION_SCENARIOS.map((scenario) => scenario.family))]

export function simulationScenarioById(id: string) {
  return BODY_SIMULATION_SCENARIOS.find((scenario) => scenario.id === id)
}

export function simulationFamilyCounts() {
  return BODY_SIMULATION_FAMILIES.map((family) => ({
    family,
    count: BODY_SIMULATION_SCENARIOS.filter((scenario) => scenario.family === family).length,
  }))
}
