import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const studio = readFileSync('src/pages/bodyhub/EcgAnatomyStudio.tsx', 'utf8')
const cardio = readFileSync('src/pages/bodyhub/CardioLab.tsx', 'utf8')

assert.match(cardio, /EcgAnatomyStudio/, 'Cardio Lab must expose the ECG anatomy studio')
assert.match(studio, /P wave/)
assert.match(studio, /QRS complex/)
assert.match(studio, /T wave/)
assert.match(studio, /RR = 60 \/ heart rate/, 'timing formula must stay visible')
assert.match(studio, /not recorded ECG data/i, 'synthetic trace must never look patient-derived')
assert.match(studio, /does not classify a patient rhythm/i, 'reference capability must not become autonomous diagnosis')
assert.match(studio, /repository-level reuse terms have not been verified/i, 'unverified external license must remain reference-only')
assert.match(studio, /min-h-11/, 'interactive controls must retain mobile touch size')
assert.match(studio, /aria-label="Synthetic ECG heart rate"/, 'heart-rate control must remain accessible')
assert.doesNotMatch(studio, /accuracy\s*[:=]\s*\d|sensitivity\s*[:=]\s*\d|specificity\s*[:=]\s*\d/i, 'do not invent classifier performance')

console.log('body-ecg-anatomy-studio: visible synthetic ECG ↔ anatomy teaching boundaries hold')
