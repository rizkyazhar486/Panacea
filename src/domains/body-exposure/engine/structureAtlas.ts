/**
 * @file structureAtlas.ts
 * @description Descriptive English aliases for core body-exposure geometry, facts, and volumetric engines.
 * Conforms to the Panacea naming standard: zero cryptographic abbreviations or cryptic internal names,
 * providing grep-friendly, discoverable interfaces while maintaining 100% backward compatibility with legacy engines.
 */

import { selubungAtlas } from './selubungAtlas.ts'
import { faktaMilikOrgan, kunciMilikOrgan } from './faktaMilikOrgan.ts'
import { kalimatPertama } from './kalimatPertama.ts'
import { namaBagianAtlas } from './namaBagianAtlas.ts'
import { jenisDariNamaStruktur } from './jenisStruktur.ts'
import {
  DIAGNOSTIC_CT_PRESETS,
  classifyHounsfieldLayer,
  evaluateHounsfieldTransferFunction,
  computeMprSliceCoordinates,
  createDefaultKaloLumenState,
} from './kaloLumenDicomEngine.ts'

/**
 * Descriptive alias for selubungAtlas: returns the bounding envelope / metadata for an anatomical mesh layer.
 */
export const atlasEnvelope = selubungAtlas

/**
 * Descriptive alias for faktaMilikOrgan: retrieves clinical and anatomical facts for a named organ.
 */
export const organFactIndex = faktaMilikOrgan

/**
 * Descriptive alias for kunciMilikOrgan: retrieves canonical organ keys for a structure.
 */
export const organKeyIndex = kunciMilikOrgan

/**
 * Descriptive alias for kalimatPertama: extracts the first concise sentence from a narrative description.
 */
export const firstSentence = kalimatPertama

/**
 * Descriptive alias for namaBagianAtlas: resolves regional display names for an atlas structure.
 */
export const atlasRegionNames = namaBagianAtlas

/**
 * Descriptive alias for jenisDariNamaStruktur: infers anatomical structure type (bone, muscle, vessel, organ) from mesh name.
 */
export const structureTypeFromName = jenisDariNamaStruktur

/**
 * Descriptive alias for kaloLumenDicomEngine: diagnostic volumetric CT/MRI multi-planar reconstruction (MPR) raymarching.
 */
export const diagnosticImagingEngine = {
  presets: DIAGNOSTIC_CT_PRESETS,
  classifyLayer: classifyHounsfieldLayer,
  evaluateTransferFunction: evaluateHounsfieldTransferFunction,
  computeMprSlice: computeMprSliceCoordinates,
  createDefaultState: createDefaultKaloLumenState,
}
