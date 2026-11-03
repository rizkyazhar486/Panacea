/**
 * @file structure-atlas-parity.test.mjs
 * @description Parity tests verifying that structureAtlas.ts aliases are strictly identical to their origins.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  atlasEnvelope,
  organFactIndex,
  organKeyIndex,
  firstSentence,
  atlasRegionNames,
  structureTypeFromName,
  diagnosticImagingEngine,
} from '../../src/domains/body-exposure/engine/structureAtlas.ts'
import { selubungAtlas } from '../../src/domains/body-exposure/engine/selubungAtlas.ts'
import { faktaMilikOrgan, kunciMilikOrgan } from '../../src/domains/body-exposure/engine/faktaMilikOrgan.ts'
import { kalimatPertama } from '../../src/domains/body-exposure/engine/kalimatPertama.ts'
import { namaBagianAtlas } from '../../src/domains/body-exposure/engine/namaBagianAtlas.ts'
import { jenisDariNamaStruktur } from '../../src/domains/body-exposure/engine/jenisStruktur.ts'
import {
  DIAGNOSTIC_CT_PRESETS,
  classifyHounsfieldLayer,
  evaluateHounsfieldTransferFunction,
  computeMprSliceCoordinates,
  createDefaultKaloLumenState,
} from '../../src/domains/body-exposure/engine/kaloLumenDicomEngine.ts'

test('structureAtlas: alias identity and execution parity', () => {
  // 1. selubungAtlas === atlasEnvelope
  assert.equal(atlasEnvelope, selubungAtlas, 'atlasEnvelope must be direct reference to selubungAtlas')

  // 2. faktaMilikOrgan === organFactIndex
  assert.equal(organFactIndex, faktaMilikOrgan, 'organFactIndex must be direct reference to faktaMilikOrgan')

  // 3. kunciMilikOrgan === organKeyIndex
  assert.equal(organKeyIndex, kunciMilikOrgan, 'organKeyIndex must be direct reference to kunciMilikOrgan')

  // 4. kalimatPertama === firstSentence
  assert.equal(firstSentence, kalimatPertama, 'firstSentence must be direct reference to kalimatPertama')
  const testText = 'Heart is the primary muscular organ of the circulatory system. It pumps blood continuously.'
  assert.equal(firstSentence(testText), kalimatPertama(testText), 'firstSentence execution must match kalimatPertama')

  // 5. namaBagianAtlas === atlasRegionNames
  assert.equal(atlasRegionNames, namaBagianAtlas, 'atlasRegionNames must be direct reference to namaBagianAtlas')

  // 6. jenisDariNamaStruktur === structureTypeFromName
  assert.equal(structureTypeFromName, jenisDariNamaStruktur, 'structureTypeFromName must be direct reference to jenisDariNamaStruktur')

  // 7. diagnosticImagingEngine wrapping
  assert.equal(diagnosticImagingEngine.presets, DIAGNOSTIC_CT_PRESETS)
  assert.equal(diagnosticImagingEngine.classifyLayer, classifyHounsfieldLayer)
  assert.equal(diagnosticImagingEngine.evaluateTransferFunction, evaluateHounsfieldTransferFunction)
  assert.equal(diagnosticImagingEngine.computeMprSlice, computeMprSliceCoordinates)
  assert.equal(diagnosticImagingEngine.createDefaultState, createDefaultKaloLumenState)
})
