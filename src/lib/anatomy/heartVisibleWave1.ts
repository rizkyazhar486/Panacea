import { CARDIO_PARTS, type CardioPart } from '../cardioAtlas.gen';

export type HeartCoverageStatus = 'present' | 'partial' | 'absent' | 'conceptual-only';
export type HeartCoverageDomain =
  | 'chambers'
  | 'valves'
  | 'subvalvular'
  | 'septa'
  | 'great-vessels'
  | 'coronary'
  | 'wall-layers'
  | 'conduction';

export interface HeartCoverageRequirement {
  id: string;
  label: string;
  domain: HeartCoverageDomain;
  exactSourcePatterns: readonly RegExp[];
  minimumMatches: number;
  representation: 'gross-mesh' | 'reference-only';
  note?: string;
}

export interface HeartCoverageResult extends Omit<HeartCoverageRequirement, 'exactSourcePatterns'> {
  status: HeartCoverageStatus;
  matchedSourceNames: string[];
  triangleCount: number;
}

/**
 * Heart Wave 1 is a source-truth audit over the already shipped cardio.glb.
 * It never creates or guesses geometry. Patterns are anchored to source names
 * emitted by scripts/atlasCardio.mjs from BodyParts3D 4.0.
 */
export const HEART_VISIBLE_REQUIREMENTS: readonly HeartCoverageRequirement[] = [
  { id: 'ra-cavity', label: 'Right atrial cavity', domain: 'chambers', exactSourcePatterns: [/^cavity of right atrium$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'la-cavity', label: 'Left atrial cavity', domain: 'chambers', exactSourcePatterns: [/^cavity of left atrium$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'rv-cavity', label: 'Right ventricular cavity', domain: 'chambers', exactSourcePatterns: [/^cavity of right ventricle$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'lv-cavity', label: 'Left ventricular cavity', domain: 'chambers', exactSourcePatterns: [/^cavity of left ventricle$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'atrial-walls', label: 'Atrial walls', domain: 'chambers', exactSourcePatterns: [/^wall of left atrium$/i, /^wall of right atrium$/i], minimumMatches: 2, representation: 'gross-mesh' },
  { id: 'ventricular-wall', label: 'Ventricular wall source', domain: 'chambers', exactSourcePatterns: [/^wall of ventricle$/i, /^wall of (left|right) ventricle$/i], minimumMatches: 1, representation: 'gross-mesh', note: 'Source granularity may not separate left and right ventricular wall.' },

  { id: 'mitral', label: 'Mitral valve leaflets', domain: 'valves', exactSourcePatterns: [/leaflet of mitral valve$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'tricuspid', label: 'Tricuspid valve leaflets', domain: 'valves', exactSourcePatterns: [/leaflet of tricuspid valve$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'aortic', label: 'Aortic valve cusps', domain: 'valves', exactSourcePatterns: [/cusp of aortic valve$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'pulmonary', label: 'Pulmonary valve cusps', domain: 'valves', exactSourcePatterns: [/cusp of pulmonary valve$/i], minimumMatches: 1, representation: 'gross-mesh' },

  { id: 'papillary', label: 'Papillary muscles', domain: 'subvalvular', exactSourcePatterns: [/papillary muscle of (left|right) ventricle$/i], minimumMatches: 2, representation: 'gross-mesh' },
  { id: 'chordae', label: 'Chordae tendineae', domain: 'subvalvular', exactSourcePatterns: [/^chordae? tendineae?/i], minimumMatches: 1, representation: 'gross-mesh', note: 'Not selected by the current cardio atlas generator unless source rules are expanded.' },

  { id: 'interatrial-septum', label: 'Interatrial septum', domain: 'septa', exactSourcePatterns: [/interatrial septum/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'interventricular-septum', label: 'Interventricular septum', domain: 'septa', exactSourcePatterns: [/interventricular septum/i], minimumMatches: 1, representation: 'gross-mesh' },

  { id: 'ascending-aorta', label: 'Ascending aorta', domain: 'great-vessels', exactSourcePatterns: [/^ascending aorta$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'aortic-arch', label: 'Aortic arch', domain: 'great-vessels', exactSourcePatterns: [/^arch of aorta$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'pulmonary-trunk', label: 'Pulmonary trunk', domain: 'great-vessels', exactSourcePatterns: [/^pulmonary trunk$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'pulmonary-arteries', label: 'Main pulmonary arteries', domain: 'great-vessels', exactSourcePatterns: [/^(left|right) pulmonary artery$/i], minimumMatches: 2, representation: 'gross-mesh' },
  { id: 'pulmonary-veins', label: 'Pulmonary veins', domain: 'great-vessels', exactSourcePatterns: [/^(left|right) (superior|inferior) pulmonary vein$/i], minimumMatches: 4, representation: 'gross-mesh' },
  { id: 'vena-cavae', label: 'Superior and inferior vena cava', domain: 'great-vessels', exactSourcePatterns: [/^(superior|inferior) vena cava$/i], minimumMatches: 2, representation: 'gross-mesh' },

  { id: 'coronary-trunks', label: 'Left and right coronary artery trunks', domain: 'coronary', exactSourcePatterns: [/^trunk of (left|right) coronary artery$/i], minimumMatches: 2, representation: 'gross-mesh' },
  { id: 'lad', label: 'Anterior interventricular branch (LAD source identity)', domain: 'coronary', exactSourcePatterns: [/^trunk of anterior interventricular branch of left coronary artery$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'lcx', label: 'Circumflex branch of left coronary artery', domain: 'coronary', exactSourcePatterns: [/^circumflex branch of left coronary artery$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'pda', label: 'Posterior interventricular branch of right coronary artery', domain: 'coronary', exactSourcePatterns: [/^posterior interventricular branch of right coronary artery$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'rca-marginal', label: 'Marginal branch of right coronary artery', domain: 'coronary', exactSourcePatterns: [/^marginal branch of right coronary artery$/i], minimumMatches: 1, representation: 'gross-mesh' },
  { id: 'coronary-sinus', label: 'Coronary sinus', domain: 'coronary', exactSourcePatterns: [/^coronary sinus$/i], minimumMatches: 1, representation: 'gross-mesh' },

  { id: 'pericardium', label: 'Pericardium', domain: 'wall-layers', exactSourcePatterns: [/pericard/i], minimumMatches: 1, representation: 'gross-mesh', note: 'Current cardio generator does not select a pericardial mesh.' },
  { id: 'endocardium', label: 'Endocardium', domain: 'wall-layers', exactSourcePatterns: [/endocard/i], minimumMatches: 1, representation: 'gross-mesh', note: 'Do not synthesize a microscopic layer from chamber-wall geometry.' },
  { id: 'epicardium', label: 'Epicardium', domain: 'wall-layers', exactSourcePatterns: [/epicard/i], minimumMatches: 1, representation: 'gross-mesh', note: 'Do not synthesize a microscopic layer from chamber-wall geometry.' },

  { id: 'sa-node', label: 'Sinoatrial node', domain: 'conduction', exactSourcePatterns: [], minimumMatches: 1, representation: 'reference-only', note: 'Conceptual/reference localization only until provenance-bearing source geometry exists.' },
  { id: 'av-node', label: 'Atrioventricular node', domain: 'conduction', exactSourcePatterns: [], minimumMatches: 1, representation: 'reference-only', note: 'Conceptual/reference localization only until provenance-bearing source geometry exists.' },
  { id: 'his-purkinje', label: 'His–Purkinje system', domain: 'conduction', exactSourcePatterns: [], minimumMatches: 1, representation: 'reference-only', note: 'Conceptual/reference localization only until provenance-bearing source geometry exists.' },
] as const;

const uniqueMatches = (parts: readonly CardioPart[], requirement: HeartCoverageRequirement): CardioPart[] => {
  if (requirement.exactSourcePatterns.length === 0) return [];
  return parts.filter((part) => requirement.exactSourcePatterns.some((pattern) => pattern.test(part.name)));
};

export function auditHeartVisibleCoverage(parts: readonly CardioPart[] = CARDIO_PARTS): HeartCoverageResult[] {
  return HEART_VISIBLE_REQUIREMENTS.map((requirement) => {
    const matched = uniqueMatches(parts, requirement);
    const status: HeartCoverageStatus = requirement.representation === 'reference-only'
      ? 'conceptual-only'
      : matched.length === 0
        ? 'absent'
        : matched.length < requirement.minimumMatches
          ? 'partial'
          : 'present';

    return {
      id: requirement.id,
      label: requirement.label,
      domain: requirement.domain,
      minimumMatches: requirement.minimumMatches,
      representation: requirement.representation,
      note: requirement.note,
      status,
      matchedSourceNames: matched.map((part) => part.name),
      triangleCount: matched.reduce((sum, part) => sum + part.triangles, 0),
    };
  });
}

export function summarizeHeartVisibleCoverage(parts: readonly CardioPart[] = CARDIO_PARTS) {
  const results = auditHeartVisibleCoverage(parts);
  const counts = results.reduce<Record<HeartCoverageStatus, number>>(
    (acc, item) => ({ ...acc, [item.status]: acc[item.status] + 1 }),
    { present: 0, partial: 0, absent: 0, 'conceptual-only': 0 },
  );
  const gross = results.filter((item) => item.representation === 'gross-mesh');
  const grossComplete = gross.every((item) => item.status === 'present');
  return {
    sourcePartCount: parts.length,
    requirements: results.length,
    counts,
    grossComplete,
    verifiedCompleteClaimAllowed: false as const,
    missingGrossStructureIds: gross.filter((item) => item.status !== 'present').map((item) => item.id),
    results,
  };
}
