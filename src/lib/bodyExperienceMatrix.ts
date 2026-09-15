export type ExperienceKind =
  | 'spatial'
  | 'motion'
  | 'simulation'
  | 'surgery'
  | 'imaging'
  | 'physiology'
  | 'micro'
  | 'education'
  | 'game'
  | 'cinematic'

export type ExperienceMaturity = 'prototype' | 'experimental' | 'candidate'

export interface BodyExperienceFeature {
  id: string
  title: string
  kind: ExperienceKind
  maturity: ExperienceMaturity
  summary: string
  tags: readonly string[]
}

const f = (
  id: string,
  title: string,
  kind: ExperienceKind,
  summary: string,
  tags: readonly string[],
  maturity: ExperienceMaturity = 'experimental',
): BodyExperienceFeature => ({ id, title, kind, summary, tags, maturity })

export const BODY_INFINITY_FEATURES: readonly BodyExperienceFeature[] = [
  f('orbital-body', 'Orbital Whole-Body Stage', 'spatial', 'Human anatomy floats inside a camera-driven spatial stage with depth-aware controls.', ['orbit', 'depth', 'whole-body'], 'candidate'),
  f('layer-explosion', 'Exploded Anatomy Layers', 'spatial', 'Skin, fascia, muscle, vessels, nerves, viscera, and skeleton separate along a controllable depth axis.', ['layers', 'exploded', 'anatomy'], 'candidate'),
  f('cinematic-entry', 'Cinematic Body Entry', 'cinematic', 'Camera dives from whole-body silhouette toward a selected region with progressive contextual reveal.', ['camera', 'transition', 'zoom']),
  f('holo-labels', 'Volumetric Floating Labels', 'spatial', 'Labels occupy depth planes and subtly reflow as the camera rotates.', ['labels', '3d', 'spatial']),
  f('light-thread-vessels', 'Luminous Vessel Threads', 'motion', 'Vascular pathways pulse as animated light threads synchronized to a simulated cardiac cycle.', ['vascular', 'pulse', 'light']),
  f('neural-fire', 'Neural Firing Trails', 'motion', 'Signals propagate along nervous pathways as temporal light trails.', ['neuro', 'axon', 'signal']),
  f('airflow-particles', 'Airflow Particle Field', 'physiology', 'Inspiratory and expiratory flow is visualized as directional particle movement through branching airways.', ['lung', 'airflow', 'particles']),
  f('alveolar-breath', 'Alveolar Expansion Field', 'physiology', 'Thousands of alveolar units expand and recoil as a grouped breathing simulation.', ['alveoli', 'compliance', 'breath']),
  f('cardiac-pressure', 'Pressure-Volume Chamber Glow', 'physiology', 'Cardiac chambers change emissive intensity and volumetric scale with phase of the cardiac cycle.', ['heart', 'pressure-volume', 'cycle']),
  f('perfusion-map', 'Perfusion Heat Geography', 'physiology', 'Regional perfusion is represented as a dynamic body heatmap linked to organ demand.', ['perfusion', 'heatmap', 'organs']),
  f('oxygen-route', 'Oxygen Journey Mode', 'education', 'Follow one oxygen molecule from inspired air to alveolus, blood, mitochondrion, and ATP production.', ['oxygen', 'journey', 'story']),
  f('glucose-route', 'Glucose Journey Mode', 'education', 'Follow dietary carbohydrate from digestion through portal flow, insulin response, uptake, and metabolism.', ['glucose', 'metabolism', 'story']),
  f('drug-route', 'Drug Journey Mode', 'education', 'Animated ADME route from administration through absorption, distribution, metabolism, and elimination.', ['pharmacology', 'ADME', 'story']),
  f('immune-chase', 'Immune Patrol Simulation', 'game', 'Immune cells patrol a tissue microenvironment and respond to scripted danger signals.', ['immune', 'cells', 'game']),
  f('thrombus-builder', 'Thrombus Formation Sandbox', 'simulation', 'Platelets, coagulation surfaces, and flow disturbance create an interactive clot-formation teaching sandbox.', ['coagulation', 'thrombus', 'flow']),
  f('atheroma-time', 'Atherosclerosis Time-Lapse', 'simulation', 'Arterial wall changes progress through simplified educational stages over accelerated time.', ['artery', 'plaque', 'timeline']),
  f('stroke-territory', 'Stroke Territory Explorer', 'imaging', 'Toggle major vascular territories and project lesion patterns onto cortex and deep structures.', ['stroke', 'territory', 'brain']),
  f('tract-lesion', 'Neuro Tract Lesion Game', 'game', 'Users place lesions along motor and sensory tracts and predict resulting deficits.', ['localization', 'tracts', 'game']),
  f('dermatome-laser', 'Dermatome Sweep', 'education', 'A moving light band sweeps the body surface to reveal segmental sensory territories.', ['dermatome', 'surface', 'neuro']),
  f('myotome-motion', 'Myotome Motion Map', 'motion', 'Joint motions trigger highlighted spinal roots and muscle groups.', ['myotome', 'movement', 'roots']),
  f('gait-lab', 'Full-Body Gait Laboratory', 'simulation', 'Joint vectors, center of mass, ground reaction force, and muscle timing animate over a gait cycle.', ['biomechanics', 'gait', 'motion']),
  f('jump-lab', 'Jump Biomechanics Lab', 'simulation', 'Visualize loading, impulse, takeoff, landing, and joint energy transfer during jumping.', ['jump', 'force', 'biomechanics']),
  f('throw-lab', 'Throwing Kinetic Chain', 'simulation', 'Energy transfer from legs through trunk to shoulder, elbow, and wrist is visualized as a kinetic wave.', ['throw', 'sports', 'kinetic-chain']),
  f('running-economy', 'Running Economy Visualizer', 'simulation', 'Stride, cadence, contact time, vertical oscillation, and approximate energy cost share one timeline.', ['running', 'performance', 'biomechanics']),
  f('surgical-peel', 'Surgical Layer Peel', 'surgery', 'Tissue planes can be peeled sequentially with context-aware depth and adjacency cues.', ['surgery', 'layers', 'plane']),
  f('incision-planner', 'Incision Planning Sandbox', 'surgery', 'Place educational incision paths on a surface model and inspect deeper structures beneath.', ['incision', 'planning', 'surface']),
  f('instrument-trainer', 'Virtual Instrument Hand', 'surgery', 'A pointer transforms into forceps, scalpel, suction, camera, or retractor modes inside simulations.', ['instrument', 'interaction', 'simulator']),
  f('bleeding-response', 'Bleeding Response Drill', 'surgery', 'Scripted vascular injury creates visual blood-flow loss requiring identification and control steps.', ['bleeding', 'hemostasis', 'training']),
  f('laparoscopy-space', 'Laparoscopy Spatial Trainer', 'surgery', 'Camera pivot, trocar geometry, depth perception, and target acquisition are practiced in a synthetic abdominal space.', ['laparoscopy', 'camera', 'skills']),
  f('arthroscopy-space', 'Arthroscopy Joint Trainer', 'surgery', 'Explore a synthetic joint through portal-based camera navigation.', ['arthroscopy', 'joint', 'skills']),
  f('endoscopy-tunnel', 'Endoscopic Lumen Flight', 'imaging', 'Fly through airway, GI, or urinary lumens with branching waypoint guidance.', ['endoscopy', 'lumen', 'camera']),
  f('bronchoscopy-map', 'Bronchoscopy Branch Navigator', 'surgery', 'Interactive airway branching teaches segmental bronchial navigation.', ['bronchoscopy', 'airway', 'navigation']),
  f('ct-scroll', 'Volumetric CT Slice Scrubber', 'imaging', 'Scroll through synthetic axial slices while synchronizing a 3D locator plane.', ['ct', 'axial', 'slice']),
  f('mri-sequence', 'MRI Sequence Morph', 'imaging', 'Transition between educational T1, T2, FLAIR, DWI, and susceptibility-style visual treatments.', ['mri', 'sequence', 'contrast']),
  f('xray-projection', 'Live X-Ray Projection', 'imaging', 'Rotate a body model and generate a simplified projected skeletal silhouette.', ['xray', 'projection', 'skeleton']),
  f('ultrasound-beam', 'Ultrasound Beam Simulator', 'imaging', 'A virtual probe sweeps a beam plane through simplified tissues with orientation cues.', ['ultrasound', 'probe', 'beam']),
  f('echo-window', 'Echo Window Navigator', 'imaging', 'Move between standard cardiac windows while a 3D heart shows probe position and beam direction.', ['echo', 'cardiology', 'ultrasound']),
  f('dicom-portal', 'DICOM-to-Body Portal', 'imaging', 'A concept layer links volumetric medical imaging with the corresponding region in Body Exposure.', ['dicom', '3d', 'registration']),
  f('organ-disassemble', 'Organ Disassembly Mode', 'spatial', 'Selected organs separate into chambers, lobes, ducts, vessels, nerves, and tissue regions.', ['organ', 'explode', 'parts']),
  f('micro-zoom', 'Infinite Micro Zoom', 'micro', 'Camera transitions from organ to tissue to cell to organelle to molecular schematic.', ['micro', 'cell', 'zoom']),
  f('cell-city', 'Cell City', 'micro', 'Organelles behave as animated subsystems inside a stylized living-cell environment.', ['cell', 'organelle', 'motion']),
  f('mitochondria-engine', 'Mitochondrial Energy Engine', 'micro', 'Educational animation follows substrate entry, proton gradient, and ATP generation.', ['mitochondria', 'ATP', 'metabolism']),
  f('dna-helix-flight', 'DNA Helix Flight', 'cinematic', 'Fly along a stylized double helix into gene and variant annotation layers.', ['dna', 'gene', 'flight']),
  f('receptor-lock', 'Receptor-Ligand Docking Theatre', 'micro', 'Ligands approach receptors with animated affinity and downstream signaling branches.', ['receptor', 'ligand', 'signaling']),
  f('second-messenger', 'Second Messenger Cascade', 'micro', 'Signals branch through synthetic cAMP, calcium, kinase, and transcription animations.', ['signaling', 'cascade', 'cell']),
  f('muscle-sarcomere', 'Sarcomere Contraction Zoom', 'micro', 'Muscle contraction descends from whole muscle to fascicle, fiber, sarcomere, and sliding filament.', ['muscle', 'sarcomere', 'contraction']),
  f('bone-remodel', 'Bone Remodeling Timeline', 'micro', 'Osteoclast and osteoblast activity reshape a trabecular microenvironment over time.', ['bone', 'remodeling', 'cell']),
  f('wound-heal', 'Wound Healing Time-Lapse', 'simulation', 'Hemostasis, inflammation, proliferation, and remodeling appear as staged tissue transformations.', ['wound', 'healing', 'timeline']),
  f('tumor-ecosystem', 'Tumor Microenvironment Sandbox', 'simulation', 'A non-diagnostic educational scene shows growth, hypoxia, vessels, stromal cells, and immune interactions.', ['tumor', 'microenvironment', 'education']),
  f('infection-spread', 'Infection Spread Sandbox', 'simulation', 'Scripted infection expands through tissues while innate and adaptive responses activate.', ['infection', 'immune', 'spread']),
  f('fever-control', 'Thermoregulation Control Room', 'physiology', 'Hypothalamic set point, skin flow, sweating, shivering, and environment form an interactive control loop.', ['temperature', 'homeostasis', 'control']),
  f('renal-filter', 'Nephron Filtration Journey', 'education', 'Trace filtered water and solutes through glomerulus, tubules, loop, and collecting duct.', ['renal', 'nephron', 'journey']),
  f('acidbase-board', 'Acid-Base Control Board', 'game', 'Users manipulate ventilation, bicarbonate, chloride, lactate, and renal responses in a teaching sandbox.', ['acid-base', 'physiology', 'game']),
  f('endocrine-orbit', 'Endocrine Feedback Orbit', 'motion', 'Hormonal axes become animated orbital loops with negative-feedback arrows and pulsatile release.', ['endocrine', 'feedback', 'hormone']),
  f('menstrual-cycle-ring', 'Menstrual Cycle Ring', 'motion', 'Hormone curves, ovarian events, and endometrial state animate around a circular timeline.', ['reproductive', 'cycle', 'timeline']),
  f('pregnancy-growth', 'Pregnancy Growth Timeline', 'education', 'A gestational timeline links maternal adaptations with fetal developmental milestones.', ['pregnancy', 'timeline', 'development']),
  f('fetal-circulation', 'Fetal Circulation Flow Map', 'physiology', 'Animated flow illustrates placenta, ductus venosus, foramen ovale, and ductus arteriosus.', ['fetal', 'circulation', 'flow']),
  f('lymph-flow', 'Lymphatic Flow Network', 'motion', 'Directional pulses move from peripheral tissues through lymphatic vessels and nodal stations.', ['lymph', 'flow', 'immune']),
  f('skin-depth', 'Skin Depth Microscope', 'micro', 'Surface view descends through epidermis, dermis, adnexa, vessels, nerves, and subcutaneous tissue.', ['skin', 'histology', 'micro']),
  f('eye-raytrace', 'Eye Optical Ray Trace', 'physiology', 'Light rays refract through cornea and lens toward retina with accommodation controls.', ['eye', 'optics', 'raytrace']),
  f('pupil-reflex', 'Pupillary Reflex Circuit', 'motion', 'Afferent and efferent pathways illuminate during direct and consensual responses.', ['eye', 'neuro', 'reflex']),
  f('visual-path', 'Visual Pathway Flight', 'cinematic', 'Travel from retina through optic nerve, chiasm, tract, LGN, radiations, and visual cortex.', ['vision', 'pathway', 'flight']),
  f('cochlea-wave', 'Cochlear Traveling Wave', 'physiology', 'Frequency-coded basilar membrane motion travels from base toward apex.', ['ear', 'hearing', 'wave']),
  f('vestibular-motion', 'Vestibular Motion Lab', 'simulation', 'Head movement drives semicircular canal and otolith animations with eye movement response.', ['vestibular', 'balance', 'VOR']),
  f('voice-airflow', 'Voice Production Simulator', 'physiology', 'Airflow, vocal fold vibration, resonance, and articulation animate as one chain.', ['larynx', 'voice', 'airflow']),
  f('swallow-sequence', 'Swallowing Sequence Theatre', 'motion', 'Oral, pharyngeal, and esophageal phases play in synchronized slow motion.', ['swallow', 'ENT', 'GI']),
  f('joint-stress', 'Joint Stress Heatmap', 'simulation', 'Approximate stress overlays change with joint angle and external load in a teaching model.', ['joint', 'stress', 'biomechanics']),
  f('spine-load', 'Spine Loading Visualizer', 'simulation', 'Posture and external load alter simplified force vectors across spinal segments.', ['spine', 'load', 'biomechanics']),
  f('fracture-builder', 'Fracture Pattern Builder', 'game', 'Users assemble common fracture geometries and compare alignment concepts.', ['fracture', 'orthopedics', 'game']),
  f('fixation-planner', 'Fixation Concept Sandbox', 'surgery', 'Educational screws, plates, rods, and nails can be positioned on synthetic bone geometry.', ['orthopedics', 'fixation', 'planning']),
  f('rehab-motion', 'Rehabilitation Motion Coach', 'motion', 'Range-of-motion arcs and muscle recruitment overlays guide educational movement sequences.', ['rehab', 'ROM', 'movement']),
  f('pain-map', 'Pain Referral Atlas', 'education', 'Somatic, visceral, radicular, and referred patterns can be compared on layered body maps.', ['pain', 'referral', 'map']),
  f('vital-sign-world', 'Vital Signs World', 'game', 'A synthetic patient world responds visually to changes in heart rate, pressure, oxygenation, temperature, and consciousness.', ['vitals', 'simulation', 'game']),
  f('shock-room', 'Shock Room', 'game', 'Hemodynamic parameters, vessel tone, pump function, volume, and obstruction create distinct synthetic shock states.', ['shock', 'hemodynamics', 'game']),
  f('icu-digital-twin', 'Educational ICU Digital Twin', 'simulation', 'A non-patient-specific physiology sandbox links ventilator, circulation, renal output, and medications.', ['ICU', 'digital-twin', 'physiology']),
  f('code-blue', 'Code Blue Training Space', 'game', 'A scripted emergency scenario emphasizes sequencing, team roles, and physiologic response visualization.', ['resuscitation', 'training', 'scenario']),
  f('trauma-flight', 'Trauma CT Flythrough', 'imaging', 'Navigate a synthetic whole-body trauma scan with region checkpoints and injury overlays.', ['trauma', 'CT', 'flythrough']),
  f('anatomy-quiz', 'Spatial Anatomy Quiz', 'game', 'Structures hide labels until selected, scored by speed, accuracy, and depth.', ['quiz', 'anatomy', 'game']),
  f('boss-case', 'Clinical Boss Case', 'game', 'Multi-system cases unlock only after users integrate anatomy, physiology, imaging, and management reasoning.', ['case', 'game', 'integration']),
  f('timeline-disease', 'Disease Time Machine', 'cinematic', 'Selected disease models can scrub from risk state through early, established, and complicated stages.', ['timeline', 'disease', 'cinematic']),
  f('compare-normal', 'Normal vs Pathology Split Reality', 'spatial', 'Two synchronized bodies show normal and altered states side-by-side or as a draggable split view.', ['compare', 'normal', 'pathology']),
  f('ghost-body', 'Ghost Body Mode', 'spatial', 'Surface anatomy fades to a translucent shell while internal systems remain luminous.', ['ghost', 'translucent', 'whole-body']),
  f('spectral-mode', 'Spectral Tissue Mode', 'cinematic', 'Tissues receive wavelength-inspired edge lighting for a premium nonliteral teaching view.', ['spectral', 'visual', 'premium']),
  f('zero-gravity', 'Zero-Gravity Anatomy Gallery', 'spatial', 'Organs and structures float as selectable objects in a calm spatial gallery.', ['gallery', 'floating', 'spatial']),
  f('constellation-map', 'Body Constellation Map', 'spatial', 'Systems become a star-map of linked anatomical and physiologic concepts.', ['constellation', 'knowledge', 'map']),
  f('memory-palace', 'Anatomy Memory Palace', 'game', 'Structures are placed into a navigable spatial mnemonic environment.', ['memory', 'spatial', 'education']),
  f('gesture-scrub', 'Gesture Time Scrubber', 'motion', 'Horizontal drag scrubs heartbeat, breathing, gait, or disease timelines with inertial motion.', ['gesture', 'timeline', 'motion']),
  f('parallax-depth', 'Deep Parallax Workspace', 'motion', 'Foreground tools, anatomy, labels, and ambient particles move at distinct depth speeds.', ['parallax', 'depth', 'UI']),
  f('magnetic-cards', 'Magnetic Spatial Cards', 'motion', 'Cards subtly attract to pointer position and spring back into a disciplined grid.', ['cards', 'spring', 'interaction']),
  f('liquid-dock', 'Liquid Glass Mode Dock', 'motion', 'Mode selection behaves like a refractive floating control surface with animated focus.', ['dock', 'glass', 'navigation']),
  f('focus-tunnel', 'Focus Tunnel', 'cinematic', 'Selecting a structure temporarily dims unrelated systems and creates a tunnel of attention.', ['focus', 'cinematic', 'selection']),
  f('portal-transition', 'Organ Portal Transition', 'cinematic', 'Selected organs open like portals into internal tissue-scale worlds.', ['portal', 'organ', 'transition']),
  f('floating-windows', 'Floating Knowledge Windows', 'spatial', 'Clinical notes, histology, imaging, and physiology panels occupy movable depth layers around the anatomy.', ['windows', 'spatial', 'knowledge']),
  f('voice-guide', 'Narrated Spatial Guide', 'education', 'A guide layer can sequence camera position, highlights, and teaching prompts.', ['narration', 'tour', 'education']),
  f('cinematic-recap', 'Cinematic Learning Recap', 'cinematic', 'Session highlights replay as a short spatial montage of visited systems and concepts.', ['recap', 'cinematic', 'learning']),
  f('multi-user-orbit', 'Shared Orbit Classroom', 'game', 'A future collaborative mode lets multiple cursors explore one body scene together.', ['collaboration', 'classroom', 'multiplayer']),
] as const

export const BODY_INFINITY_GROUPS = [...new Set(BODY_INFINITY_FEATURES.map((feature) => feature.kind))]

export function bodyInfinityFeatureCounts() {
  return BODY_INFINITY_GROUPS.map((kind) => ({
    kind,
    count: BODY_INFINITY_FEATURES.filter((feature) => feature.kind === kind).length,
  }))
}

export function bodyInfinitySearch(query: string, kind?: ExperienceKind) {
  const normalized = query.trim().toLowerCase()
  return BODY_INFINITY_FEATURES.filter((feature) => {
    if (kind && feature.kind !== kind) return false
    if (!normalized) return true
    return [feature.title, feature.summary, ...feature.tags]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  })
}
