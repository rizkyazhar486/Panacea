import {
  BODY_SYSTEM_SOURCE_WAVE,
  type BodySystemId,
} from './bodySystemSourceWave'
import {
  getBodySystemPhysiologyBridge,
} from './bodySystemPhysiologyBridge'
import {
  listBodyPathophysiologyScenariosForAtlasSystem,
  type BodyPathophysiologyScenarioId,
} from './bodyPathophysiologyNetwork'
import {
  listBodyPharmacologyForAtlasSystem,
  type PharmacologyMechanismId,
} from './bodyPharmacologyMechanismNetwork'

export type BodyOrganEvidenceKind =
  | 'source-registry'
  | 'reviewed-mapping'
  | 'shared-workbench'
  | 'evidence-gap'

export interface BodyOrganEvidenceDimension<Id extends string = string> {
  kind: BodyOrganEvidenceKind
  ids: readonly Id[]
  note: string
}

export interface BodyOrganEvidenceCoverage {
  systemId: BodySystemId
  label: string
  anatomy: BodyOrganEvidenceDimension
  physiology: BodyOrganEvidenceDimension
  pathophysiology: BodyOrganEvidenceDimension<BodyPathophysiologyScenarioId>
  pharmacology: BodyOrganEvidenceDimension<PharmacologyMechanismId>
  imaging: BodyOrganEvidenceDimension
  education: {
    boundary: string
  }
}

const EDUCATIONAL_BOUNDARY =
  'Reference education only. Coverage records describe repository-backed relationships, not patient-specific anatomy, diagnosis, lesion localization, treatment selection, procedure targeting, or completed human validation.'

function evidenceOrGap<Id extends string>(
  ids: readonly Id[],
  mappedNote: string,
  gapNote: string,
): BodyOrganEvidenceDimension<Id> {
  return ids.length > 0
    ? { kind: 'reviewed-mapping', ids, note: mappedNote }
    : { kind: 'evidence-gap', ids: [], note: gapNote }
}

/**
 * Equal-priority organ/system ledger.
 *
 * This is deliberately derived from existing reviewed registries rather than
 * hand-writing a "complete" claim for each organ. A missing pathophysiology or
 * pharmacology relationship remains visible as an evidence gap. Imaging stays
 * on the shared DICOM/volumetric workbench until an organ-specific,
 * provenance-preserving registration exists.
 */
export const BODY_ORGAN_EVIDENCE_COVERAGE: readonly BodyOrganEvidenceCoverage[] =
  BODY_SYSTEM_SOURCE_WAVE.map((system) => {
    const physiology = getBodySystemPhysiologyBridge(system.id)
    const pathophysiologyIds = listBodyPathophysiologyScenariosForAtlasSystem(system.id).map(
      (scenario) => scenario.id,
    )
    const pharmacologyIds = listBodyPharmacologyForAtlasSystem(system.id).map(
      (mechanism) => mechanism.id,
    )

    return {
      systemId: system.id,
      label: system.label,
      anatomy: {
        kind: 'source-registry',
        ids: system.targets.map((target) => target.id),
        note: 'Named gross-anatomy targets come from the canonical source-wave registry; runtime availability still depends on exact source-node resolution.',
      },
      physiology: {
        kind: 'reviewed-mapping',
        ids: physiology.physiologySystemIds,
        note: `Existing anatomy-to-physiology bridge; mapping fidelity: ${physiology.fidelity}.`,
      },
      pathophysiology: evidenceOrGap(
        pathophysiologyIds,
        'Existing literature-anchored pathophysiology scenarios explicitly map to this atlas system.',
        'No reviewed pathophysiology scenario currently maps to this atlas system; do not infer one from anatomy alone.',
      ),
      pharmacology: evidenceOrGap(
        pharmacologyIds,
        'Existing literature-anchored pharmacology mechanisms explicitly map to this atlas system.',
        'No reviewed pharmacology mechanism currently maps to this atlas system; do not infer one from anatomy alone.',
      ),
      imaging: {
        kind: 'shared-workbench',
        ids: ['dicom-volumetric-workbench'],
        note: 'The shared imaging workbench may preserve selected-structure context, but this ledger does not claim organ-specific image registration.',
      },
      education: {
        boundary: EDUCATIONAL_BOUNDARY,
      },
    }
  })

export function getBodyOrganEvidenceCoverage(systemId: BodySystemId): BodyOrganEvidenceCoverage {
  const row = BODY_ORGAN_EVIDENCE_COVERAGE.find((item) => item.systemId === systemId)
  if (!row) throw new Error(`Unknown body organ evidence coverage system: ${systemId}`)
  return row
}
