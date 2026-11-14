/**
 * @file atlasStageDecks.ts
 * @description Pure domain logic for resolving contextual simulation decks and clinical tools
 * corresponding to an inspected anatomical structure in Body Exposure.
 *
 * Deterministic mapping with zero synthetic clinical claims:
 * - Cardiovascular structures -> Cardiopulmonary PV & Vascular Perfusion (AHA 17)
 * - Nervous structures -> Neuro Reflexes & Syndromic Deficit Localizer
 * - Visceral organs -> Soft Tissue Biomechanics & Referred Pain Dermatomes (C1–S5)
 * - Skeletal & Pulmonary structures -> Specialized Diagnostic Imaging (MPR CT/MRI presets)
 */

import type { SelectedStructureInfo } from './atlas-stage/structureInfo.ts'
import type { OrganMechanicalId } from './softTissueBiomechanicsEngine.ts'
import type { VisceralOrganKey } from './referredPainEngine.ts'
import type { DiagnosticCtWindowPresetId } from './kaloLumenDicomEngine.ts'

export type PhysiologySystem = 'cardiopulmonary' | 'soft_tissue' | 'neuro'
export type ClinicalTool = 'vascular' | 'referred_pain' | 'neuro_localizer' | 'diagnostic_imaging'

export interface StructureCouplingContext {
  physiology: PhysiologySystem
  clinical: ClinicalTool
  softTissueOrganId?: OrganMechanicalId
  softTissueTab?: 'palpation' | 'diaphragm_excursion' | 'peristalsis'
  neuroNerveId?: string
  referredPainOrgan?: VisceralOrganKey
  coronarySegment?: number
  imagingPresetId?: DiagnosticCtWindowPresetId
}

/**
 * Which simulation deck and clinical tool a structure opens first, and its specific targeted parameters.
 * Routing only; it claims nothing.
 */
export function decksFor(info: SelectedStructureInfo): StructureCouplingContext {
  const lower = `${info.cleanName} ${info.meshName}`.toLowerCase()

  // 1. Cardiovascular / Heart / Great Vessels / Coronaries
  if (info.layerId === 'cardiovascular' || /heart|cardio|ventric|atrium|myocard|aorta|coronar|arter|vein/.test(lower)) {
    const isInferior = /inferior|posterior/.test(lower)
    const isLateral = /lateral|circumflex|lcx/.test(lower)
    const isSeptal = /sept|lad|anterior/.test(lower)
    const coronarySegment = isInferior ? 4 : isLateral ? 5 : isSeptal ? 1 : 1
    return {
      physiology: 'cardiopulmonary',
      clinical: 'vascular',
      coronarySegment,
      imagingPresetId: 'VASCULAR_ANGIO',
    }
  }

  // 2. Nervous System / Brain / Cranial Nerves / Spine / Eyes
  if (info.layerId === 'nervous' || /brain|nerve|cord|pons|medulla|oculo|eye|optic|trigem/.test(lower)) {
    let neuroNerveId = 'cn-3'
    if (/optic|retina/.test(lower)) neuroNerveId = 'cn-2'
    else if (/trochlear/.test(lower)) neuroNerveId = 'cn-4'
    else if (/trigemin/.test(lower)) neuroNerveId = 'cn-5'
    else if (/abducen/.test(lower)) neuroNerveId = 'cn-6'
    else if (/facial/.test(lower)) neuroNerveId = 'cn-7'
    else if (/vestibul|cochlear|audit/.test(lower)) neuroNerveId = 'cn-8'
    else if (/glossopharyng/.test(lower)) neuroNerveId = 'cn-9'
    else if (/vagus/.test(lower)) neuroNerveId = 'cn-10'
    else if (/accessor/.test(lower)) neuroNerveId = 'cn-11'
    else if (/hypogloss/.test(lower)) neuroNerveId = 'cn-12'

    return {
      physiology: 'neuro',
      clinical: 'neuro_localizer',
      neuroNerveId,
      imagingPresetId: /stroke|ischemi/.test(lower) ? 'STROKE_ACUTE' : 'BRAIN',
    }
  }

  // 3. Respiratory / Lungs / Diaphragm
  if (/lung|pulmon|bronch|alveol/.test(lower)) {
    return {
      physiology: 'cardiopulmonary',
      clinical: 'diagnostic_imaging',
      softTissueTab: 'diaphragm_excursion',
      imagingPresetId: 'LUNG',
    }
  }

  if (/diaphragm/.test(lower)) {
    return {
      physiology: 'soft_tissue',
      clinical: 'diagnostic_imaging',
      softTissueTab: 'diaphragm_excursion',
      imagingPresetId: 'MEDIASTINUM_SOFT_TISSUE',
    }
  }

  // 4. Visceral Organs (Liver, Spleen, Kidney, Pancreas, Stomach, Intestine, Bladder, Gallbladder)
  if (/liver|hepat/.test(lower)) {
    return {
      physiology: 'soft_tissue',
      clinical: 'referred_pain',
      softTissueOrganId: 'liver_normal',
      referredPainOrgan: 'liver-glisson-capsule',
      imagingPresetId: 'LIVER_PARENCHYMA',
    }
  }

  if (/spleen|splen/.test(lower)) {
    return {
      physiology: 'soft_tissue',
      clinical: 'referred_pain',
      softTissueOrganId: 'spleen_normal',
      referredPainOrgan: 'spleen-parenchyma',
      imagingPresetId: 'MEDIASTINUM_SOFT_TISSUE',
    }
  }

  if (/kidney|renal|ureter/.test(lower)) {
    return {
      physiology: 'soft_tissue',
      clinical: 'referred_pain',
      softTissueOrganId: 'kidney_cortex',
      referredPainOrgan: 'ureter-renal-pelvis',
      imagingPresetId: 'MEDIASTINUM_SOFT_TISSUE',
    }
  }

  if (/stomach|gastr/.test(lower)) {
    return {
      physiology: 'soft_tissue',
      clinical: 'referred_pain',
      softTissueOrganId: 'stomach_wall',
      softTissueTab: 'peristalsis',
      referredPainOrgan: 'stomach-gastric-wall',
      imagingPresetId: 'MEDIASTINUM_SOFT_TISSUE',
    }
  }

  if (/gallbladder|biliary|cholecyst/.test(lower)) {
    return {
      physiology: 'soft_tissue',
      clinical: 'referred_pain',
      referredPainOrgan: 'gallbladder-biliary',
      imagingPresetId: 'LIVER_PARENCHYMA',
    }
  }

  if (/appendix|appendic/.test(lower)) {
    return {
      physiology: 'soft_tissue',
      clinical: 'referred_pain',
      softTissueTab: 'peristalsis',
      referredPainOrgan: 'appendix-visceral-early',
      imagingPresetId: 'MEDIASTINUM_SOFT_TISSUE',
    }
  }

  if (/pancreas|pancreat/.test(lower)) {
    return {
      physiology: 'soft_tissue',
      clinical: 'referred_pain',
      softTissueOrganId: 'pancreas',
      referredPainOrgan: 'pancreas-body',
      imagingPresetId: 'MEDIASTINUM_SOFT_TISSUE',
    }
  }

  if (/bladder|vesic/.test(lower)) {
    return {
      physiology: 'soft_tissue',
      clinical: 'referred_pain',
      softTissueOrganId: 'urinary_bladder',
      referredPainOrgan: 'urinary-bladder-wall',
      imagingPresetId: 'MEDIASTINUM_SOFT_TISSUE',
    }
  }

  if (/colon|sigmoid|bowel|intestin/.test(lower)) {
    return {
      physiology: 'soft_tissue',
      clinical: 'referred_pain',
      softTissueTab: 'peristalsis',
      referredPainOrgan: 'colon-distal-sigmoid',
      imagingPresetId: 'MEDIASTINUM_SOFT_TISSUE',
    }
  }

  // 5. Skeletal System / Bones / Joints / Spine
  if (info.layerId === 'skeletal' || /bone|femur|tibia|vertebra|skull|rib|clavicle|pelvis|scapula/.test(lower)) {
    return {
      physiology: 'soft_tissue',
      clinical: 'diagnostic_imaging',
      imagingPresetId: 'BONE',
    }
  }

  // Default fallback
  return {
    physiology: 'soft_tissue',
    clinical: 'referred_pain',
    referredPainOrgan: 'heart-myocardium',
  }
}
