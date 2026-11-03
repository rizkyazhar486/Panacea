// src/domains/body-exposure/engine/kaloLumenDicomEngine.ts
// KaloLumen 3-Layer Client-Side DICOM 3DCG Volumetric Raymarching & SSS Shading Engine
// Aligned with Hounsfield Unit standards (Goldman LW, J Med Imaging Radiat Sci 2007; 38(1):5-19)
// and ACR/RSNA standard diagnostic CT window definitions.

import { isValidIsoTimestamp } from '../../../shared/kernel/isoTimestamp.ts'

export type KaloLumenLayerId =
  | 'LAYER_1_SKIN_SUBCUTANEOUS'
  | 'LAYER_2_VISCERA_MYOCARDIUM'
  | 'LAYER_3_BONE_VASCULAR_TREE'

export type MultiPlanarViewMode =
  | 'AXIAL'
  | 'CORONAL'
  | 'SAGITTAL'
  | 'OBLIQUE_ARBITRARY'
  | 'VOLUMETRIC_3D'

export type DiagnosticCtWindowPresetId =
  | 'LUNG'
  | 'MEDIASTINUM_SOFT_TISSUE'
  | 'BONE'
  | 'BRAIN'
  | 'STROKE_ACUTE'
  | 'LIVER_PARENCHYMA'
  | 'VASCULAR_ANGIO'

export interface DiagnosticCtWindowPreset {
  id: DiagnosticCtWindowPresetId
  name: string
  windowCenterHU: number
  windowWidthHU: number
  huMin: number
  huMax: number
  clinicalIndication: string
  targetLayer: KaloLumenLayerId
}

export const DIAGNOSTIC_CT_PRESETS: readonly DiagnosticCtWindowPreset[] = [
  {
    id: 'LUNG',
    name: 'Pulmonary Parenchyma (Lung Window)',
    windowCenterHU: -600,
    windowWidthHU: 1500,
    huMin: -1350,
    huMax: 150,
    clinicalIndication: 'Evaluation of alveolar architecture, interstitial thickening, pneumothorax, and emphysema.',
    targetLayer: 'LAYER_1_SKIN_SUBCUTANEOUS',
  },
  {
    id: 'MEDIASTINUM_SOFT_TISSUE',
    name: 'Mediastinum & Soft Tissue Window',
    windowCenterHU: 50,
    windowWidthHU: 350,
    huMin: -125,
    huMax: 225,
    clinicalIndication: 'Chest wall, great vessels, cardiac silhouette, lymphadenopathy, and pleural effusions.',
    targetLayer: 'LAYER_2_VISCERA_MYOCARDIUM',
  },
  {
    id: 'BONE',
    name: 'Cortical & Trabecular Bone Window',
    windowCenterHU: 400,
    windowWidthHU: 1800,
    huMin: -500,
    huMax: 1300,
    clinicalIndication: 'Cortical margin disruption, skeletal metastases, osteolytic lesions, and acute fractures.',
    targetLayer: 'LAYER_3_BONE_VASCULAR_TREE',
  },
  {
    id: 'BRAIN',
    name: 'Brain Parenchyma Standard',
    windowCenterHU: 40,
    windowWidthHU: 80,
    huMin: 0,
    huMax: 80,
    clinicalIndication: 'Cerebral cortex, subcortical white matter demarcation, ventricular system, and mass effect.',
    targetLayer: 'LAYER_2_VISCERA_MYOCARDIUM',
  },
  {
    id: 'STROKE_ACUTE',
    name: 'Hyperacute Ischemic Stroke Window',
    windowCenterHU: 32,
    windowWidthHU: 30,
    huMin: 17,
    huMax: 47,
    clinicalIndication: 'Early parenchymal hypoattenuation, insular ribbon sign, and subtle cytotoxic ischemic edema.',
    targetLayer: 'LAYER_2_VISCERA_MYOCARDIUM',
  },
  {
    id: 'LIVER_PARENCHYMA',
    name: 'Hepatic Parenchyma Window',
    windowCenterHU: 30,
    windowWidthHU: 150,
    huMin: -45,
    huMax: 105,
    clinicalIndication: 'Hepatic steatosis, subtle focal hypodense liver lesions, hemangiomas, and abscesses.',
    targetLayer: 'LAYER_2_VISCERA_MYOCARDIUM',
  },
  {
    id: 'VASCULAR_ANGIO',
    name: 'Contrast-Enhanced CT Angiography',
    windowCenterHU: 200,
    windowWidthHU: 600,
    huMin: -100,
    huMax: 500,
    clinicalIndication: 'Arterial tree visualization, aneurysms, vascular dissections, and luminal patency.',
    targetLayer: 'LAYER_3_BONE_VASCULAR_TREE',
  },
]

export interface OpticalSubsurfaceScatteringProperties {
  absorptionCoefficient_mu_a_mm1: number
  reducedScatteringCoefficient_mu_s_prime_mm1: number
  effectivePenetrationDepth_mm: number
  diffuseReflectanceR_d: number
}

export interface KaloLumenDensityLayerConfig {
  layerId: KaloLumenLayerId
  name: string
  hounsfieldMinHU: number
  hounsfieldMaxHU: number
  opacityMultiplier: number
  surfaceRoughness: number
  opticalProperties: OpticalSubsurfaceScatteringProperties
  isVisible: boolean
}

export interface DirectionalLightSourceState {
  azimuthDegrees: number
  elevationDegrees: number
  intensityLux: number
  colorRgbHex: string
}

export interface MultiPlanarClippingPlane {
  mode: MultiPlanarViewMode
  normalVector: readonly [number, number, number]
  distanceOffsetMm: number
  enabled: boolean
}

export interface KaloLumenEngineState {
  viewportWidthPx: number
  viewportHeightPx: number
  viewMode: MultiPlanarViewMode
  selectedPresetId: DiagnosticCtWindowPresetId
  lightSource: DirectionalLightSourceState
  clippingPlane: MultiPlanarClippingPlane
  layers: Record<KaloLumenLayerId, KaloLumenDensityLayerConfig>
  reconstructionTimeMs: number
  truthClass: 'volumetric_imaging_optical_proxy'
  clinically_reviewed: false
  neverManufacturesBiomarkers: true
  evaluatedAtIso: string
}

export interface RayAabbIntersectionResult {
  hit: boolean
  tNear: number
  tFar: number
}

export interface MprSliceCoordinates {
  sliceIndex: number
  sliceMm: number
  planeName: string
  axisDimensionPx: number
}

/**
 * Computes optical penetration depth: d_pen = 1 / sqrt(3 * mu_a * (mu_a + mu_s_prime))
 */
export function computeSubsurfacePenetrationDepth(mu_a: number, mu_s_prime: number): number {
  if (mu_a <= 0 || !Number.isFinite(mu_a)) throw new RangeError(`Absorption coefficient mu_a must be > 0; got ${mu_a}`)
  if (mu_s_prime < 0 || !Number.isFinite(mu_s_prime)) throw new RangeError(`Scattering coefficient mu_s_prime must be >= 0; got ${mu_s_prime}`)

  const effectiveAttenuationCoeff = Math.sqrt(3 * mu_a * (mu_a + mu_s_prime))
  const d_pen = 1 / effectiveAttenuationCoeff
  return Math.round(d_pen * 100) / 100
}

/**
 * Computes optical diffuse transmittance: T_d = exp(-thickness / d_pen)
 */
export function computeTissueDiffuseTransmittance(thicknessMm: number, penetrationDepthMm: number): number {
  if (thicknessMm < 0 || !Number.isFinite(thicknessMm)) throw new RangeError('Thickness must be >= 0')
  if (penetrationDepthMm <= 0 || !Number.isFinite(penetrationDepthMm)) throw new RangeError('Penetration depth must be > 0')

  const transmittance = Math.exp(-thicknessMm / penetrationDepthMm)
  return Math.round(transmittance * 10000) / 10000
}

/**
 * Converts azimuth and elevation angles to a normalized 3D light vector [Lx, Ly, Lz].
 */
export function computeDirectionalLightVector(
  azimuthDeg: number,
  elevationDeg: number
): readonly [number, number, number] {
  if (azimuthDeg < 0 || azimuthDeg > 360) throw new RangeError(`Azimuth must be 0..360; got ${azimuthDeg}`)
  if (elevationDeg < -90 || elevationDeg > 90) throw new RangeError(`Elevation must be -90..90; got ${elevationDeg}`)

  const radAzimuth = (azimuthDeg * Math.PI) / 180
  const radElevation = (elevationDeg * Math.PI) / 180

  const lx = Math.cos(radElevation) * Math.sin(radAzimuth)
  const ly = Math.sin(radElevation)
  const lz = Math.cos(radElevation) * Math.cos(radAzimuth)

  return [
    Math.round(lx * 10000) / 10000,
    Math.round(ly * 10000) / 10000,
    Math.round(lz * 10000) / 10000,
  ]
}

export function classifyHounsfieldLayer(hu: number): KaloLumenLayerId | null {
  if (hu >= -300 && hu <= 20) return 'LAYER_1_SKIN_SUBCUTANEOUS'
  if (hu > 20 && hu <= 199) return 'LAYER_2_VISCERA_MYOCARDIUM'
  if (hu >= 200 && hu <= 3000) return 'LAYER_3_BONE_VASCULAR_TREE'
  return null
}

/**
 * Evaluates Hounsfield unit linear transfer function mapping to normalized intensity [0, 1].
 */
export function evaluateHounsfieldTransferFunction(
  hu: number,
  windowCenterHU: number,
  windowWidthHU: number
): { normalizedIntensity: number; opacity: number } {
  if (windowWidthHU <= 0) throw new RangeError('Window width must be > 0')

  const lowerBound = windowCenterHU - windowWidthHU / 2
  const upperBound = windowCenterHU + windowWidthHU / 2

  let normalized = (hu - lowerBound) / windowWidthHU
  if (normalized < 0) normalized = 0
  if (normalized > 1) normalized = 1

  return {
    normalizedIntensity: Math.round(normalized * 10000) / 10000,
    opacity: Math.round(Math.pow(normalized, 1.2) * 10000) / 10000,
  }
}

/**
 * Slab algorithm for ray - Axis-Aligned Bounding Box (AABB) intersection in normalized volume space.
 */
export function intersectRayAabb(
  rayOrigin: readonly [number, number, number],
  rayDir: readonly [number, number, number],
  boxMin: readonly [number, number, number] = [-0.5, -0.5, -0.5],
  boxMax: readonly [number, number, number] = [0.5, 0.5, 0.5]
): RayAabbIntersectionResult {
  let tNear = -Infinity
  let tFar = Infinity

  for (let i = 0; i < 3; i++) {
    const o = rayOrigin[i]
    const d = rayDir[i]
    const bMin = boxMin[i]
    const bMax = boxMax[i]

    if (Math.abs(d) < 1e-8) {
      if (o < bMin || o > bMax) {
        return { hit: false, tNear: 0, tFar: 0 }
      }
    } else {
      let t1 = (bMin - o) / d
      let t2 = (bMax - o) / d
      if (t1 > t2) {
        const tmp = t1
        t1 = t2
        t2 = tmp
      }
      if (t1 > tNear) tNear = t1
      if (t2 < tFar) tFar = t2

      if (tNear > tFar || tFar < 0) {
        return { hit: false, tNear: 0, tFar: 0 }
      }
    }
  }

  return {
    hit: tNear <= tFar && tFar >= 0,
    tNear: Math.max(0, Math.round(tNear * 10000) / 10000),
    tFar: Math.round(tFar * 10000) / 10000,
  }
}

/**
 * Computes Multi-Planar Reconstruction slice index and coordinate.
 */
export function computeMprSliceCoordinates(
  mode: MultiPlanarViewMode,
  sliceNormalizedOffset: number,
  volumeDimensions: readonly [number, number, number] = [512, 512, 256],
  voxelSpacingMm: readonly [number, number, number] = [0.75, 0.75, 1.25]
): MprSliceCoordinates {
  const norm = Math.max(0, Math.min(1, sliceNormalizedOffset))

  switch (mode) {
    case 'AXIAL': {
      const dim = volumeDimensions[2]
      const idx = Math.min(dim - 1, Math.floor(norm * dim))
      return { sliceIndex: idx, sliceMm: Math.round(idx * voxelSpacingMm[2] * 10) / 10, planeName: 'Transverse / Axial (XY)', axisDimensionPx: dim }
    }
    case 'CORONAL': {
      const dim = volumeDimensions[1]
      const idx = Math.min(dim - 1, Math.floor(norm * dim))
      return { sliceIndex: idx, sliceMm: Math.round(idx * voxelSpacingMm[1] * 10) / 10, planeName: 'Coronal (XZ)', axisDimensionPx: dim }
    }
    case 'SAGITTAL': {
      const dim = volumeDimensions[0]
      const idx = Math.min(dim - 1, Math.floor(norm * dim))
      return { sliceIndex: idx, sliceMm: Math.round(idx * voxelSpacingMm[0] * 10) / 10, planeName: 'Sagittal (YZ)', axisDimensionPx: dim }
    }
    default: {
      return { sliceIndex: 0, sliceMm: 0, planeName: 'Volumetric / Oblique 3D', axisDimensionPx: volumeDimensions[2] }
    }
  }
}

export function createDefaultKaloLumenState(
  evaluatedAtIso: string,
  viewportWidthPx = 1920,
  viewportHeightPx = 1080
): KaloLumenEngineState {
  if (!isValidIsoTimestamp(evaluatedAtIso)) throw new TypeError('Invalid evaluation ISO timestamp')
  if (viewportWidthPx < 320 || viewportHeightPx < 240) throw new RangeError('Viewport dimensions below minimum')

  const skinPen = computeSubsurfacePenetrationDepth(0.05, 1.2)
  const visceraPen = computeSubsurfacePenetrationDepth(0.15, 0.8)
  const bonePen = computeSubsurfacePenetrationDepth(0.40, 2.5)

  return {
    viewportWidthPx,
    viewportHeightPx,
    viewMode: 'VOLUMETRIC_3D',
    selectedPresetId: 'MEDIASTINUM_SOFT_TISSUE',
    lightSource: {
      azimuthDegrees: 45,
      elevationDegrees: 30,
      intensityLux: 1200,
      colorRgbHex: '#FFFFFF',
    },
    clippingPlane: {
      mode: 'VOLUMETRIC_3D',
      normalVector: [0, 1, 0],
      distanceOffsetMm: 0,
      enabled: false,
    },
    layers: {
      LAYER_1_SKIN_SUBCUTANEOUS: {
        layerId: 'LAYER_1_SKIN_SUBCUTANEOUS',
        name: 'Skin, Subcutaneous Fat & Soft Tissue',
        hounsfieldMinHU: -300,
        hounsfieldMaxHU: 50,
        opacityMultiplier: 0.35,
        surfaceRoughness: 0.45,
        opticalProperties: {
          absorptionCoefficient_mu_a_mm1: 0.05,
          reducedScatteringCoefficient_mu_s_prime_mm1: 1.2,
          effectivePenetrationDepth_mm: skinPen,
          diffuseReflectanceR_d: 0.58,
        },
        isVisible: true,
      },
      LAYER_2_VISCERA_MYOCARDIUM: {
        layerId: 'LAYER_2_VISCERA_MYOCARDIUM',
        name: 'Visceral Parenchyma & Myocardium',
        hounsfieldMinHU: 20,
        hounsfieldMaxHU: 150,
        opacityMultiplier: 0.75,
        surfaceRoughness: 0.30,
        opticalProperties: {
          absorptionCoefficient_mu_a_mm1: 0.15,
          reducedScatteringCoefficient_mu_s_prime_mm1: 0.8,
          effectivePenetrationDepth_mm: visceraPen,
          diffuseReflectanceR_d: 0.42,
        },
        isVisible: true,
      },
      LAYER_3_BONE_VASCULAR_TREE: {
        layerId: 'LAYER_3_BONE_VASCULAR_TREE',
        name: 'Cortical Bone & Contrast-Enhanced Vascular Tree',
        hounsfieldMinHU: 200,
        hounsfieldMaxHU: 3000,
        opacityMultiplier: 1.0,
        surfaceRoughness: 0.20,
        opticalProperties: {
          absorptionCoefficient_mu_a_mm1: 0.40,
          reducedScatteringCoefficient_mu_s_prime_mm1: 2.5,
          effectivePenetrationDepth_mm: bonePen,
          diffuseReflectanceR_d: 0.72,
        },
        isVisible: true,
      },
    },
    reconstructionTimeMs: 4200,
    truthClass: 'volumetric_imaging_optical_proxy',
    clinically_reviewed: false,
    neverManufacturesBiomarkers: true,
    evaluatedAtIso,
  }
}
