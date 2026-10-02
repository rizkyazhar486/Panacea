import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const studio = readFileSync('src/pages/bodyhub/EegScalpStudio.tsx', 'utf8')
const neuro = readFileSync('src/pages/bodyhub/LokalisasiLesiPanel.tsx', 'utf8')

assert.match(neuro, /LesiNeuro3D[\s\S]*EegScalpStudio/, 'neuro localization must expose source-backed 3D before EEG teaching context')
assert.match(studio, /Fp1/)
assert.match(studio, /Cz/)
assert.match(studio, /O2/)
assert.match(studio, /Delta/)
assert.match(studio, /Theta/)
assert.match(studio, /Alpha/)
assert.match(studio, /Beta/)
assert.match(studio, /P_band \/ P_total/, 'relative-power formula must stay visible')
assert.match(studio, /Nothing here reads a patient EEG/i, 'synthetic EEG must stay non-patient')
assert.match(studio, /repository-level reuse terms have not been verified/i, 'unverified external license must remain reference-only')
assert.match(studio, /No seizure detection, sleep staging, consciousness, mood, cognition or patient-state inference/i)
assert.match(studio, /min-h-11/, 'interactive controls must retain mobile touch size')
assert.doesNotMatch(studio, /accuracy\s*[:=]\s*\d|sensitivity\s*[:=]\s*\d|specificity\s*[:=]\s*\d/i, 'do not invent model performance')

console.log('body-eeg-scalp-studio: scalp context + synthetic signal boundaries hold')
