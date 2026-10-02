import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const studio = readFileSync('src/pages/bodyhub/SkinLesionUncertaintyStudio.tsx', 'utf8')
const specialty = readFileSync('src/pages/bodyhub/SpecialtyLab.tsx', 'utf8')

assert.match(specialty, /modul === 'kulit'[\s\S]*SkinLesionUncertaintyStudio/, 'skin module must expose the uncertainty studio')
assert.match(studio, /H_norm = −Σ pᵢ ln\(pᵢ\) \/ ln\(K\)/, 'uncertainty formula must remain visible')
assert.match(studio, /The image is never analysed/i, 'local image must not be passed off as model input')
assert.match(studio, /probabilities are teaching examples only/i, 'synthetic probabilities must stay explicit')
assert.match(studio, /repository-level reuse terms have not been verified/i, 'unverified external license must remain reference-only')
assert.match(studio, /does not classify the loaded image/i, 'experience must not become autonomous diagnosis')
assert.match(studio, /min-h-11/, 'interactive controls must retain mobile touch size')
assert.doesNotMatch(studio, /accuracy\s*[:=]\s*\d|sensitivity\s*[:=]\s*\d|specificity\s*[:=]\s*\d/i, 'do not invent classifier performance')

console.log('body-skin-uncertainty-studio: image + uncertainty teaching boundaries hold')
