import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const explorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const lab = await readFile(new URL('../../src/pages/bodyhub/BiomechanicsMotionLab.tsx', import.meta.url), 'utf8')

assert.match(explorer, /lazy\(\(\) => import\('\.\/bodyhub\/BiomechanicsMotionLab'\)\)/)
assert.match(explorer, /key: 'biomekanika', label: 'Motion biomechanics'/)
assert.match(explorer, /panelTab === 'biomekanika'/)
assert.match(explorer, /<BiomechanicsMotionLab \/>/)

assert.match(lab, /<video[\s\S]*playsInline/)
assert.match(lab, /<AtlasViewer3D[\s\S]*berkas="anatomy\/muscular\.glb"/)
assert.match(lab, /WORKOUT_MUSCLE_GROUPS/)
assert.match(lab, /data-biomechanics-motion-lab="v1"/)
assert.match(lab, /BLOCKED until validated per-frame landmark inference/)
assert.match(lab, /BLOCKED until subject scale, external load, segment kinematics and a validated inverse-dynamics model/)
assert.doesNotMatch(lab, /poseLandmarks|estimatedForce|patientSpecific/)

console.log('biomechanics motion lab: reachable local-video + source-backed WebGL surface with fail-closed pose and force boundaries')
