export type HeartGapId =
  | 'chordae'
  | 'interatrial-septum'
  | 'interventricular-septum'
  | 'pericardium'
  | 'endocardium'
  | 'epicardium'
  | 'sa-node'
  | 'av-node'
  | 'his-purkinje';

export type HeartGapDiscoveryStatus =
  | 'candidate-found'
  | 'candidate-not-found'
  | 'conceptual-only';

export interface HeartGapDiscoveryRule {
  id: HeartGapId;
  label: string;
  representation: 'gross-mesh' | 'reference-only';
  exactSourcePatterns: readonly RegExp[];
}

export interface HeartGapDiscoveryResult {
  id: HeartGapId;
  label: string;
  status: HeartGapDiscoveryStatus;
  candidateSourceNames: string[];
  candidateCount: number;
  ingestionAllowed: false;
  verifiedRenderAllowed: false;
}

/**
 * Heart Wave 3 candidate discovery is intentionally non-promoting.
 * It may identify exact source-name candidates from a full build-time atlas
 * manifest, but discovery alone never authorizes ingestion or verified render.
 * Asset-level provenance, license, stable-ID mapping, artifact verification,
 * performance review, visual QA and target trust remain separate gates.
 */
export const HEART_GAP_DISCOVERY_RULES: readonly HeartGapDiscoveryRule[] = [
  {
    id: 'chordae',
    label: 'Chordae tendineae',
    representation: 'gross-mesh',
    exactSourcePatterns: [/^chordae tendineae$/i, /^chorda tendinea$/i, /^chordae tendineae of (left|right) ventricle$/i],
  },
  {
    id: 'interatrial-septum',
    label: 'Interatrial septum',
    representation: 'gross-mesh',
    exactSourcePatterns: [/^interatrial septum$/i, /^atrial septum$/i],
  },
  {
    id: 'interventricular-septum',
    label: 'Interventricular septum',
    representation: 'gross-mesh',
    exactSourcePatterns: [/^interventricular septum$/i, /^ventricular septum$/i],
  },
  {
    id: 'pericardium',
    label: 'Pericardium',
    representation: 'gross-mesh',
    exactSourcePatterns: [/^pericardium$/i, /^fibrous pericardium$/i, /^serous pericardium$/i],
  },
  {
    id: 'endocardium',
    label: 'Endocardium',
    representation: 'gross-mesh',
    exactSourcePatterns: [/^endocardium$/i],
  },
  {
    id: 'epicardium',
    label: 'Epicardium',
    representation: 'gross-mesh',
    exactSourcePatterns: [/^epicardium$/i],
  },
  {
    id: 'sa-node',
    label: 'Sinoatrial node',
    representation: 'reference-only',
    exactSourcePatterns: [],
  },
  {
    id: 'av-node',
    label: 'Atrioventricular node',
    representation: 'reference-only',
    exactSourcePatterns: [],
  },
  {
    id: 'his-purkinje',
    label: 'His–Purkinje system',
    representation: 'reference-only',
    exactSourcePatterns: [],
  },
] as const;

const dedupe = (values: readonly string[]) => [...new Set(values)];

export function discoverHeartGapCandidates(
  fullSourceNames: readonly string[],
): HeartGapDiscoveryResult[] {
  const sourceNames = dedupe(fullSourceNames);

  return HEART_GAP_DISCOVERY_RULES.map((rule) => {
    if (rule.representation === 'reference-only') {
      return {
        id: rule.id,
        label: rule.label,
        status: 'conceptual-only' as const,
        candidateSourceNames: [],
        candidateCount: 0,
        ingestionAllowed: false as const,
        verifiedRenderAllowed: false as const,
      };
    }

    const candidateSourceNames = sourceNames.filter((name) =>
      rule.exactSourcePatterns.some((pattern) => pattern.test(name)),
    );

    return {
      id: rule.id,
      label: rule.label,
      status: candidateSourceNames.length > 0 ? 'candidate-found' as const : 'candidate-not-found' as const,
      candidateSourceNames,
      candidateCount: candidateSourceNames.length,
      ingestionAllowed: false as const,
      verifiedRenderAllowed: false as const,
    };
  });
}

export function summarizeHeartGapDiscovery(fullSourceNames: readonly string[]) {
  const results = discoverHeartGapCandidates(fullSourceNames);
  return {
    sourceNameCount: dedupe(fullSourceNames).length,
    candidateFoundIds: results.filter((item) => item.status === 'candidate-found').map((item) => item.id),
    candidateMissingIds: results.filter((item) => item.status === 'candidate-not-found').map((item) => item.id),
    conceptualOnlyIds: results.filter((item) => item.status === 'conceptual-only').map((item) => item.id),
    ingestionAllowed: false as const,
    verifiedRenderAllowed: false as const,
    results,
  };
}
