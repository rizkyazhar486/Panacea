export type FascialManifestEvidenceStatus = 'manifest-evidence-only'

export interface FascialLayerManifestRecord {
  layer: number
  upstreamPath: string
  upstreamBlobSha: string
  nodeNames: readonly string[]
}

/**
 * Pinned Z-Anatomy fascial layer sidecars discovered during the macro-system
 * source audit. These are text manifests only; they are not geometry receipts.
 *
 * The audit is intentionally separate from `fascialSourceCandidate.ts`: a text
 * sidecar can prove that an upstream layer vocabulary exists, but it cannot
 * prove that a named node survives in a specific FBX/GLB, shares Panacea's
 * reference frame, is licensed for the intended reuse, or has passed qualified
 * academic review.
 */
export const FASCIAL_LAYER_MANIFESTS: readonly FascialLayerManifestRecord[] = [
  {
    layer: 1,
    upstreamPath: 'Z-Anatomy PC/Assets/Models/Layers/Fasciae/Fasciae-1.txt',
    upstreamBlobSha: 'b0c80ad98cceffd95c07263c9e3361108598b53a',
    nodeNames: [
      'Middle layer of thoracolumbar fascia.r',
      'Anterior layer of thoracolumbar fascia.r',
      'Piriformis fascia.r',
      'Piriformis fascia.l',
      'Iliopectineal arch.r',
      'Iliopectineal arch.l',
      'Iliopsoas fascia.r',
      'Iliopsoas fascia.l',
      'Lateral femoral intermuscular septum.l',
      'Lateral femoral intermuscular septum.r',
    ],
  },
  {
    layer: 2,
    upstreamPath: 'Z-Anatomy PC/Assets/Models/Layers/Fasciae/Fasciae-2.txt',
    upstreamBlobSha: 'b4deeeefb2e1f7919c05dbe83a94783e2a8adc08',
    nodeNames: [
      'Inferior fibular retinaculum.r',
      'Superficial transverse metatarsal ligament.r',
      'Inferior fibular retinaculum.l',
      'Superficial transverse metatarsal ligament.l',
      'Superior fibular retinaculum.r',
      'Superior fibular retinaculum.l',
      'Extensor retinaculum of wrist.r',
      'Extensor retinaculum of wrist.l',
    ],
  },
  {
    layer: 3,
    upstreamPath: 'Z-Anatomy PC/Assets/Models/Layers/Fasciae/Fasciae-3.txt',
    upstreamBlobSha: '443131d36bd59b40772e7bfc9409302f83a2db62',
    nodeNames: [
      'Superficial transverse metacarpal ligament.r',
      'Superficial transverse metacarpal ligament.l',
      'Flexor retinaculum of wrist.r',
      'Flexor retinaculum of wrist.l',
      'Superior extensor retinaculum of ankle.r',
      'Inferior extensor retinaculum of ankle.r',
      'Superior extensor retinaculum of ankle.l',
      'Inferior extensor retinaculum of ankle.l',
    ],
  },
  {
    layer: 4,
    upstreamPath: 'Z-Anatomy PC/Assets/Models/Layers/Fasciae/Fasciae-4.txt',
    upstreamBlobSha: '1846f6157488170b4da1000f5fbf01aa84240e06',
    nodeNames: [
      'Posterior layer of thoracolumbar fascia.r',
      'Posterior layer of thoracolumbar fascia.l',
      'Medial intermuscular septum of arm.r',
      'Lateral intermuscular septum of arm.r',
      'Dorsal fascia of hand.r',
      'Medial intermuscular septum of arm.l',
      'Lateral intermuscular septum of arm.l',
      'Dorsal fascia of hand.l',
      'Popliteal fascia.r',
    ],
  },
  {
    layer: 5,
    upstreamPath: 'Z-Anatomy PC/Assets/Models/Layers/Fasciae/Fasciae-5.txt',
    upstreamBlobSha: '0bc55aa3942e9174471921d0b7ac300fdea59a80',
    nodeNames: [
      'Anterior intermuscular septum of leg.r',
      'Posterior intermuscular septum of leg.r',
      'Transverse intermuscular septum of leg.r',
      'Medial femoral intermuscular septum.l',
      'Popliteal fascia.l',
      'Anterior intermuscular septum of leg.l',
      'Posterior intermuscular septum of leg.l',
      'Transverse intermuscular septum of leg.l',
      'Medial femoral intermuscular septum.r',
    ],
  },
  {
    layer: 6,
    upstreamPath: 'Z-Anatomy PC/Assets/Models/Layers/Fasciae/Fasciae-6.txt',
    upstreamBlobSha: '63fbb1d907bcd8b96a1c58c2fc3eb17d2384ef0f',
    nodeNames: [
      'Clavipectoral fascia.r',
      'Clavipectoral fascia.l',
      'Transversalis fascia',
      'Diaphragmatic fascia',
      'Middle layer of thoracolumbar fascia.l',
      'Anterior layer of thoracolumbar fascia.l',
      'Plantar aponeurosis.r',
      'Plantar aponeurosis.l',
    ],
  },
  {
    layer: 7,
    upstreamPath: 'Z-Anatomy PC/Assets/Models/Layers/Fasciae/Fasciae-7.txt',
    upstreamBlobSha: 'a622236baad28d662033fe6bd3a2c4eaf0b3a371',
    nodeNames: [
      'Superficial layer of temporal fascia.r',
      'Masseteric fascia.r',
      'Superficial layer of temporal fascia.l',
      'Masseteric fascia.l',
      'Superficial investing cervical fascia.r',
      'Superficial investing cervical fascia.l',
    ],
  },
  {
    layer: 8,
    upstreamPath: 'Z-Anatomy PC/Assets/Models/Layers/Fasciae/Fasciae-8.txt',
    upstreamBlobSha: 'b5d1d1e6165fa7a92a88767a2a5d7a61749cd817',
    nodeNames: [
      'Pectoral fascia.r',
      'Pectoral fascia.l',
      'Investing abdominal fascia.r',
      'Investing abdominal fascia.l',
    ],
  },
  {
    layer: 9,
    upstreamPath: 'Z-Anatomy PC/Assets/Models/Layers/Fasciae/Fasciae-9.txt',
    upstreamBlobSha: '41fbd9cd881da6ac13aa141912007b002740cb29',
    nodeNames: [
      'Fascia lata.r',
      'Fascia lata.l',
      'Crural fascia.r',
      'Crural fascia.l',
      'Brachial fascia.l',
      'Flexor retinaculum of ankle.r',
      'Flexor retinaculum of ankle.l',
      'Brachial fascia.r',
    ],
  },
  {
    layer: 10,
    upstreamPath: 'Z-Anatomy PC/Assets/Models/Layers/Fasciae/Fasciae-10.txt',
    upstreamBlobSha: '712bb83be08f2a948f732f4406c87ba08b3d3432',
    nodeNames: [
      'Antebrachial fascia.r',
      'Palmar aponeurosis.r',
      'Deltoid fascia.l',
      'Antebrachial fascia.l',
      'Palmar aponeurosis.l',
      'Deltoid fascia.r',
    ],
  },
] as const

export const FASCIAL_LAYER_MANIFEST_PROVENANCE = {
  upstreamRepository: 'LluisV/Z-Anatomy',
  upstreamCommit: '6c7f9016bd5899ac8edafd31b9900c151df42ed6',
  evidenceKind: 'text-layer-manifest',
  currentStatus: 'manifest-evidence-only' as FascialManifestEvidenceStatus,
  geometryAdmitted: false,
  patientSpecific: false,
  clinicalInferenceAllowed: false,
} as const

export const EXPLICIT_SUPERFICIAL_FASCIAL_MANIFEST_NODES = FASCIAL_LAYER_MANIFESTS
  .flatMap((manifest) => manifest.nodeNames)
  .filter((name) => /\bsuperficial\b/i.test(name) && /\bfascia\b/i.test(name))

export function fascialLayerManifestNodeCount(): number {
  return FASCIAL_LAYER_MANIFESTS.reduce((sum, manifest) => sum + manifest.nodeNames.length, 0)
}

export function fascialLayerManifestHasDuplicateNodes(): boolean {
  const names = FASCIAL_LAYER_MANIFESTS.flatMap((manifest) => manifest.nodeNames)
  return new Set(names).size !== names.length
}

export function superficialFasciaManifestMayPromoteSystem(): boolean {
  return false
}

export const SUPERFICIAL_FASCIA_MANIFEST_DISCOVERY = {
  status: 'manifest-evidence-only' as FascialManifestEvidenceStatus,
  explicitNodeNames: EXPLICIT_SUPERFICIAL_FASCIAL_MANIFEST_NODES,
  dedicatedWholeBodyBundleFound: false,
  sourceBundleIdentityVerified: false,
  sourceNodeGeometryVerified: false,
  referenceFrameVerified: false,
  licenseScopeVerified: false,
  academicReviewComplete: false,
  mayPromoteSystem: false,
} as const

export const FASCIAL_LAYER_MANIFEST_BOUNDARY =
  'Pinned text layer manifests are source-discovery evidence only. They show that the upstream project names fascial structures, including explicit superficial fascial labels, but they do not establish that those names exist in a specific imported FBX/GLB, that geometry is whole-body superficial fascia, that the reference frame or per-asset license is compatible, or that qualified academic review is complete. system:fascial must remain blocked.' as const
