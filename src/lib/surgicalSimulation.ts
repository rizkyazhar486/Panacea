export type SurgicalProcedureId =
  | 'cabg' | 'cimino-avf' | 'laparotomy' | 'cesarean-section' | 'mastectomy'
  | 'excision' | 'laparoscopy' | 'vp-shunt' | 'craniectomy' | 'appendectomy'

export type SurgicalAction =
  | 'orient' | 'identify' | 'access' | 'expose' | 'prepare' | 'connect'
  | 'control' | 'divide' | 'deliver' | 'retrieve' | 'tunnel' | 'verify' | 'close'

export type SurgicalToolClass =
  | 'none' | 'scalpel' | 'forceps' | 'retractor' | 'needle-holder' | 'suction'
  | 'energy' | 'laparoscope' | 'vascular-clamp' | 'drill' | 'shunt-system'

export interface SurgicalSimulationPhase {
  id: string
  label: string
  objective: string
  action: SurgicalAction
  tool: SurgicalToolClass
  focus: string[]
  hazards: string[]
}

export interface SurgicalSimulationProcedure {
  id: SurgicalProcedureId
  label: string
  specialty: string
  region: string
  scene: string
  goal: string
  phases: SurgicalSimulationPhase[]
  evidenceBoundary: string
}

export interface SurgicalSimulationState {
  procedureId: SurgicalProcedureId
  phaseIndex: number
  attempts: number
  correctActions: number
  safetyScore: number
  accuracyScore: number
  efficiencyScore: number
  completed: boolean
  feedback: string
}

const boundary =
  'Educational simulation scaffold only. Not an operative manual, credential, patient-specific plan, or substitute for supervised surgical training. High-fidelity release requires validated geometry, provenance, physics validation, and qualified human review.'

function s(
  id: string, label: string, objective: string, action: SurgicalAction, tool: SurgicalToolClass,
  focus: string[], hazards: string[],
): SurgicalSimulationPhase {
  return { id, label, objective, action, tool, focus, hazards }
}

function p(
  id: SurgicalProcedureId, label: string, specialty: string, region: string, scene: string,
  goal: string, phases: SurgicalSimulationPhase[],
): SurgicalSimulationProcedure {
  return { id, label, specialty, region, scene, goal, phases, evidenceBoundary: boundary }
}

export const SURGICAL_SIMULATION_PROCEDURES: SurgicalSimulationProcedure[] = [
  p('cabg', 'CABG', 'Cardiothoracic surgery', 'Thorax / heart', 'cardiac theatre',
    'Train cardiac orientation, target recognition, graft-state sequencing, verification, and complication awareness.', [
      s('cabg-1', 'Theatre orientation', 'Orient the thorax, heart, great vessels, and simulated safety state.', 'orient', 'none', ['sternum', 'heart', 'ascending aorta'], ['phrenic nerve']),
      s('cabg-2', 'Conduit / target recognition', 'Identify conduit options and the simulated coronary target.', 'identify', 'forceps', ['internal thoracic artery', 'great saphenous vein', 'coronary arteries'], ['cardiac veins']),
      s('cabg-3', 'Cardiac exposure', 'Expose the simulated heart while preserving adjacent structures.', 'expose', 'retractor', ['pericardium', 'heart'], ['right ventricle', 'phrenic nerve']),
      s('cabg-4', 'Perfusion preparation', 'Confirm the selected simulated perfusion strategy and monitoring state.', 'prepare', 'vascular-clamp', ['ascending aorta', 'right atrium'], ['aortic wall']),
      s('cabg-5', 'Graft connection', 'Complete the abstract simulated graft-connection task on the confirmed target.', 'connect', 'needle-holder', ['coronary artery', 'graft'], ['myocardium']),
      s('cabg-6', 'Flow / hemostasis check', 'Verify simulated flow and field integrity before closure.', 'verify', 'suction', ['heart', 'graft'], ['bleeding', 'low-flow state']),
      s('cabg-7', 'Closure', 'Complete closure after verification gates pass.', 'close', 'needle-holder', ['sternum', 'soft-tissue layers'], ['retained bleeding']),
    ]),
  p('cimino-avf', 'Cimino AV fistula', 'Vascular surgery', 'Distal upper limb', 'vascular field',
    'Train artery-vein orientation, simulated anastomosis, and flow verification.', [
      s('avf-1', 'Limb orientation', 'Orient the distal upper limb and vascular territory.', 'orient', 'none', ['radial artery', 'cephalic vein'], ['superficial sensory nerves']),
      s('avf-2', 'Vessel identification', 'Differentiate artery and vein and confirm the simulated targets.', 'identify', 'forceps', ['radial artery', 'cephalic vein'], ['venous tributaries']),
      s('avf-3', 'Vessel preparation', 'Prepare the simulated targets while preserving adjacent structures.', 'prepare', 'vascular-clamp', ['radial artery', 'cephalic vein'], ['arterial spasm', 'venous injury']),
      s('avf-4', 'Anastomosis', 'Complete the abstract artery-to-vein connection.', 'connect', 'needle-holder', ['radial artery', 'cephalic vein'], ['narrowing', 'twist']),
      s('avf-5', 'Flow verification', 'Verify simulated patency and distal perfusion.', 'verify', 'none', ['fistula', 'hand circulation'], ['low flow', 'distal ischemia']),
      s('avf-6', 'Closure', 'Close the field without compromising the simulated connection.', 'close', 'needle-holder', ['skin', 'subcutaneous tissue'], ['fistula compression']),
    ]),
  p('laparotomy', 'Exploratory laparotomy', 'General surgery', 'Abdomen', 'open abdominal theatre',
    'Train abdominal entry orientation, systematic survey, target localization, field verification, and closure.', [
      s('lap-1', 'Abdominal orientation', 'Establish abdominal landmarks and the simulated access plan.', 'orient', 'none', ['linea alba', 'rectus sheath'], ['inferior epigastric vessels']),
      s('lap-2', 'Abdominal access', 'Enter the simulated abdominal cavity through the selected approach.', 'access', 'scalpel', ['abdominal wall layers', 'peritoneum'], ['bowel', 'epigastric vessels']),
      s('lap-3', 'Systematic exploration', 'Survey abdominal compartments and localize the scenario target.', 'identify', 'retractor', ['liver', 'stomach', 'small bowel', 'colon'], ['mesenteric vessels']),
      s('lap-4', 'Target task', 'Perform the abstract scenario-specific intervention on the confirmed target.', 'control', 'forceps', ['scenario target'], ['adjacent bowel', 'vascular structures']),
      s('lap-5', 'Field verification', 'Verify hemostasis and integrity before closure.', 'verify', 'suction', ['operative field'], ['bleeding', 'unrecognized injury']),
      s('lap-6', 'Closure', 'Complete simulated layered abdominal closure.', 'close', 'needle-holder', ['fascia', 'skin'], ['entrapped viscera']),
    ]),
  p('cesarean-section', 'Cesarean section', 'Obstetrics & gynecology', 'Pelvis / uterus', 'obstetric theatre',
    'Train maternal anatomy orientation, simulated delivery state, verification, and layered closure.', [
      s('cs-1', 'Maternal orientation', 'Orient abdominal wall, gravid uterus, bladder, and simulated presentation.', 'orient', 'none', ['uterus', 'bladder', 'lower uterine segment'], ['uterine vessels']),
      s('cs-2', 'Abdominal access', 'Open the simulated abdominal field with bladder awareness.', 'access', 'scalpel', ['abdominal wall layers', 'peritoneum'], ['bladder', 'inferior epigastric vessels']),
      s('cs-3', 'Uterine exposure', 'Identify the lower uterine segment and adjacent structures.', 'identify', 'retractor', ['lower uterine segment', 'bladder reflection'], ['uterine vessels']),
      s('cs-4', 'Simulated delivery', 'Complete the abstract delivery interaction.', 'deliver', 'forceps', ['uterus', 'fetal presentation'], ['uterine extension']),
      s('cs-5', 'Maternal verification', 'Verify simulated placental, uterine, and bleeding state.', 'verify', 'suction', ['uterus', 'placental bed'], ['hemorrhage', 'retained tissue']),
      s('cs-6', 'Repair / closure', 'Complete simulated uterine and abdominal closure states.', 'close', 'needle-holder', ['uterine incision', 'fascia', 'skin'], ['ongoing bleeding']),
    ]),
  p('mastectomy', 'Mastectomy', 'Breast / oncologic surgery', 'Breast / chest wall', 'breast surgery theatre',
    'Train breast/chest-wall orientation, plane recognition, specimen-state handling, and closure verification.', [
      s('mast-1', 'Surface orientation', 'Orient breast, skin envelope, chest wall, and axillary direction.', 'orient', 'none', ['breast', 'pectoralis major', 'axilla'], ['skin perfusion', 'long thoracic nerve']),
      s('mast-2', 'Exposure planes', 'Develop the simulated exposure plane while preserving the skin envelope.', 'expose', 'scalpel', ['breast tissue', 'pectoral fascia'], ['skin flap']),
      s('mast-3', 'Specimen task', 'Complete the abstract glandular resection task.', 'divide', 'energy', ['breast tissue', 'pectoral fascia'], ['intercostal structures']),
      s('mast-4', 'Axillary orientation', 'Identify axillary boundaries when the scenario includes an axillary stage.', 'identify', 'retractor', ['axillary vein', 'long thoracic nerve', 'thoracodorsal bundle'], ['brachial plexus']),
      s('mast-5', 'Field verification', 'Verify simulated hemostasis and specimen state.', 'verify', 'suction', ['operative field'], ['bleeding', 'skin compromise']),
      s('mast-6', 'Closure', 'Complete simulated drain/closure state.', 'close', 'needle-holder', ['skin', 'subcutaneous plane'], ['dead space']),
    ]),
  p('excision', 'Lesion excision', 'General / dermatologic / oncologic surgery', 'Surface / soft tissue', 'surface procedure room',
    'Train lesion localization, margin-state awareness, specimen handling, hemostasis, and closure.', [
      s('exc-1', 'Lesion orientation', 'Confirm the simulated lesion and nearby structures.', 'orient', 'none', ['skin lesion', 'subcutaneous tissue'], ['nearby neurovascular structures']),
      s('exc-2', 'Boundary recognition', 'Identify the abstract simulated resection boundary.', 'identify', 'none', ['lesion boundary'], ['adjacent structures']),
      s('exc-3', 'Resection task', 'Complete the simulated lesion-removal interaction.', 'divide', 'scalpel', ['lesion', 'soft-tissue plane'], ['deep structures']),
      s('exc-4', 'Specimen state', 'Confirm simulated specimen identity/orientation.', 'retrieve', 'forceps', ['specimen'], ['orientation loss']),
      s('exc-5', 'Field verification', 'Verify simulated hemostasis before closure.', 'verify', 'energy', ['wound bed'], ['bleeding']),
      s('exc-6', 'Closure', 'Complete the simulated closure task.', 'close', 'needle-holder', ['skin'], ['tension']),
    ]),
  p('laparoscopy', 'Laparoscopic surgery', 'Minimally invasive surgery', 'Abdomen / pelvis', 'laparoscopic theatre',
    'Train camera orientation, access-state recognition, instrument coordination, target verification, and end-of-case checks.', [
      s('scope-1', 'Camera orientation', 'Establish the simulated tower, camera horizon, and target quadrant.', 'orient', 'laparoscope', ['abdominal cavity'], ['access structures']),
      s('scope-2', 'Access state', 'Complete the abstract simulated access interaction.', 'access', 'laparoscope', ['abdominal wall', 'peritoneal cavity'], ['bowel', 'major vessels']),
      s('scope-3', 'Working geometry', 'Prepare valid simulated instrument geometry around the target.', 'prepare', 'laparoscope', ['target quadrant'], ['epigastric vessels']),
      s('scope-4', 'Diagnostic survey', 'Survey the simulated abdomen and identify target anatomy.', 'identify', 'laparoscope', ['liver', 'stomach', 'bowel', 'pelvis'], ['adhesions', 'vascular structures']),
      s('scope-5', 'Target task', 'Complete the abstract laparoscopic target interaction.', 'control', 'forceps', ['scenario target'], ['adjacent structures']),
      s('scope-6', 'Verification / closure', 'Verify the field and complete the simulated end-of-case state.', 'verify', 'suction', ['operative field', 'abdominal wall'], ['bleeding', 'port-site issue']),
    ]),
  p('vp-shunt', 'VP shunt', 'Neurosurgery', 'Cranium → abdomen', 'neurosurgical theatre',
    'Train ventricular-system orientation, device-path planning, connection state, and simulated flow verification.', [
      s('vps-1', 'Cranial orientation', 'Orient skull, ventricular target concept, and distal destination.', 'orient', 'none', ['skull', 'lateral ventricle', 'abdomen'], ['cortical vessels']),
      s('vps-2', 'Cranial access state', 'Complete the abstract cranial access interaction.', 'access', 'drill', ['skull', 'ventricular trajectory'], ['cortical structures']),
      s('vps-3', 'Proximal catheter state', 'Complete the simulated proximal-catheter interaction.', 'connect', 'shunt-system', ['lateral ventricle'], ['deep brain structures']),
      s('vps-4', 'Subcutaneous pathway', 'Complete the simulated tunneling state.', 'tunnel', 'shunt-system', ['subcutaneous pathway'], ['neck/chest structures']),
      s('vps-5', 'Distal connection', 'Complete the abstract distal-device placement state.', 'connect', 'shunt-system', ['peritoneal cavity'], ['abdominal viscera']),
      s('vps-6', 'System verification / closure', 'Verify simulated continuity and complete closure.', 'verify', 'shunt-system', ['shunt system', 'skin'], ['obstruction', 'disconnection']),
    ]),
  p('craniectomy', 'Craniectomy', 'Neurosurgery', 'Cranium', 'cranial theatre',
    'Train cranial orientation, exposure-state sequencing, structure-at-risk recognition, simulated decompression state, and closure.', [
      s('cran-1', 'Cranial orientation', 'Orient the skull, selected region, and superficial landmarks.', 'orient', 'none', ['skull', 'scalp'], ['superficial temporal artery']),
      s('cran-2', 'Soft-tissue exposure', 'Complete the simulated exposure interaction.', 'expose', 'scalpel', ['scalp', 'temporalis'], ['facial nerve branches']),
      s('cran-3', 'Bone-window task', 'Complete the abstract bone-removal interaction.', 'divide', 'drill', ['calvarium'], ['dural venous sinuses']),
      s('cran-4', 'Dural orientation', 'Identify the simulated dural boundary and adjacent structures.', 'identify', 'forceps', ['dura mater'], ['cortical vessels']),
      s('cran-5', 'Scenario target state', 'Complete the abstract decompression/access task.', 'control', 'suction', ['scenario target'], ['brain tissue', 'vascular structures']),
      s('cran-6', 'Verification / closure', 'Verify simulated field state and complete closure.', 'verify', 'suction', ['operative field', 'scalp'], ['bleeding', 'ongoing swelling']),
    ]),
  p('appendectomy', 'Appendectomy', 'General surgery', 'Right lower abdomen', 'abdominal theatre',
    'Train right-lower-quadrant orientation, appendix identification, simulated control/division, specimen verification, and closure.', [
      s('appy-1', 'Abdominal orientation', 'Orient cecum, terminal ileum, and expected appendix region.', 'orient', 'none', ['cecum', 'terminal ileum', 'appendix'], ['ureter', 'iliac vessels']),
      s('appy-2', 'Appendix identification', 'Confirm the simulated appendix and its relationship to the cecum.', 'identify', 'forceps', ['appendix', 'cecum'], ['small bowel']),
      s('appy-3', 'Mesenteric control state', 'Complete the abstract simulated mesenteric-control interaction.', 'control', 'energy', ['mesoappendix'], ['appendiceal vessels']),
      s('appy-4', 'Base division state', 'Complete the simulated appendix-base task after identity verification.', 'divide', 'forceps', ['appendix base', 'cecum'], ['cecal wall']),
      s('appy-5', 'Specimen / field check', 'Retrieve the simulated specimen and verify field integrity.', 'retrieve', 'forceps', ['appendix specimen'], ['contamination', 'bleeding']),
      s('appy-6', 'Closure', 'Complete the simulated closure state.', 'close', 'needle-holder', ['abdominal wall'], ['wound bleeding']),
    ]),
]

export function getSurgicalProcedure(id: SurgicalProcedureId): SurgicalSimulationProcedure {
  return SURGICAL_SIMULATION_PROCEDURES.find((item) => item.id === id) ?? SURGICAL_SIMULATION_PROCEDURES[0]
}

export function createSurgicalSimulationState(procedureId: SurgicalProcedureId): SurgicalSimulationState {
  return {
    procedureId, phaseIndex: 0, attempts: 0, correctActions: 0,
    safetyScore: 100, accuracyScore: 100, efficiencyScore: 100,
    completed: false, feedback: 'Simulation ready. Orient yourself to the scene before acting.',
  }
}

export function currentSurgicalPhase(state: SurgicalSimulationState): SurgicalSimulationPhase {
  const procedure = getSurgicalProcedure(state.procedureId)
  return procedure.phases[Math.min(state.phaseIndex, procedure.phases.length - 1)]
}

export function applySurgicalSimulationAction(
  state: SurgicalSimulationState, action: SurgicalAction, tool: SurgicalToolClass,
): SurgicalSimulationState {
  if (state.completed) return state
  const procedure = getSurgicalProcedure(state.procedureId)
  const phase = currentSurgicalPhase(state)
  const attempts = state.attempts + 1
  if (action !== phase.action) {
    return {
      ...state, attempts,
      safetyScore: Math.max(0, state.safetyScore - 6),
      accuracyScore: Math.max(0, state.accuracyScore - 8),
      efficiencyScore: Math.max(0, state.efficiencyScore - 5),
      feedback: 'Wrong action for the current objective. Re-orient to “' + phase.label + '”.',
    }
  }
  if (phase.tool !== 'none' && tool !== phase.tool) {
    return {
      ...state, attempts,
      safetyScore: Math.max(0, state.safetyScore - 3),
      accuracyScore: Math.max(0, state.accuracyScore - 5),
      efficiencyScore: Math.max(0, state.efficiencyScore - 4),
      feedback: 'Correct action concept, but this phase expects the ' + phase.tool + ' tool class.',
    }
  }
  const nextIndex = state.phaseIndex + 1
  const completed = nextIndex >= procedure.phases.length
  return {
    ...state, attempts, correctActions: state.correctActions + 1, completed,
    phaseIndex: completed ? state.phaseIndex : nextIndex,
    feedback: completed ? 'Simulation complete. Review telemetry and replay weak phases.' : 'Phase complete. Next: ' + procedure.phases[nextIndex].label + '.',
  }
}

export function surgicalSimulationProgress(state: SurgicalSimulationState): number {
  const total = getSurgicalProcedure(state.procedureId).phases.length
  return state.completed ? 100 : Math.round((state.phaseIndex / total) * 100)
}
