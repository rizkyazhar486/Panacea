// src/domains/body-exposure/engine/kaloLumenDicomEngine.ts
// KaloLumen 3-Layer Client-Side DICOM 3DCG Volumetric Raymarching & SSS Shading Engine
// Aligned with Hounsfield Unit standards (Goldman LW, J Med Imaging Radiat Sci 2007; 38(1):5-19)

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

export interface OpticalSubsurfaceScatteringProperties {
  absorptionCoefficient_mu_a_mm1: number
  reducedScatteringCoefficient_mu_s_prime_mm1: number
  effectivePenetrationDepth_mm: number // d_pen = 1 / sqrt(3 * mu_a * (mu_a + mu_s_prime))
  diffuseReflectanceR_d: number
}

export interface KaloLumenDensityLayerConfig {
  layerId: KaloLumenLayerId
  name: string
  hounsfieldMinHU: number
  hounsfieldMaxHU: number
  opacityMultiplier: number // 0.0 - 1.0
  surfaceRoughness: number // 0.0 - 1.0
  opticalProperties: OpticalSubsurfaceScatteringProperties
  isVisible: boolean
}

export interface DirectionalLightSourceState {
  azimuthDegrees: number // 0 - 360 degrees
  elevationDegrees: number // -90 to +90 degrees
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
  lightSource: DirectionalLightSourceState
  clippingPlane: MultiPlanarClippingPlane
  layers: Record<KaloLumenLayerId, KaloLumenDensityLayerConfig>
  reconstructionTimeMs: number
  truthClass: 'volumetric_imaging_optical_proxy'
  clinically_reviewed: false
  neverManufacturesBiomarkers: true
  evaluatedAtIso: string
}

/**
 * Computes the optical penetration depth for biological tissue under diffuse approximation:
 * d_pen = 1 / sqrt(3 * mu_a * (mu_a + mu_s_prime))
 */
export function computeSubsurfacePenetrationDepth(
  mu_a: number,
  mu_s_prime: number
): number {
  if (mu_a <= 0 || !Number.isFinite(mu_a)) throw new RangeError(`Absorption coefficient mu_a must be > 0; got ${mu_a}`)
  if (mu_s_prime < 0 || !Number.isFinite(mu_s_prime)) throw new RangeError(`Scattering coefficient mu_s_prime must be >= 0; got ${mu_s_prime}`)

  const effectiveAttenuationCoeff = Math.sqrt(3 * mu_a * (mu_a + mu_s_prime))
  const d_pen = 1 / effectiveAttenuationCoeff
  return Math.round(d_pen * 100) / 100
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
    reconstructionTimeMs: 4200, // <10 seconds benchmark
    truthClass: 'volumetric_imaging_optical_proxy',
    clinically_reviewed: false,
    neverManufacturesBiomarkers: true,
    evaluatedAtIso,
  }
}
