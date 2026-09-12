import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const modelPath = path.join(root, 'src/lib/discoveryNeuropsychiatry3D.ts')
const labPath = path.join(root, 'src/pages/discovery/Neuropsychiatry3DLab.tsx')
for (const file of [modelPath, labPath]) {
  if (!fs.existsSync(file)) throw new Error(`missing ${path.relative(root, file)}`)
}

const model = fs.readFileSync(modelPath, 'utf8')
const lab = fs.readFileSync(labPath, 'utf8')

for (const id of ['sodium','potassium','calcium','chloride','glutamate','gaba','dopamine','serotonin','norepinephrine','acetylcholine']) {
  if (!model.includes(`id: '${id}'`)) throw new Error(`missing neurochemical ${id}`)
}

for (const guard of [
  'Geometry is schematic',
  'not microscopy-derived neuronal anatomy',
  'not proof that a psychiatric construct maps to one transmitter, receptor, neuron or brain region',
]) {
  if (!model.includes(guard)) throw new Error(`missing boundary guard: ${guard}`)
}

for (const ui of [
  'Discovery · Neuropsychiatry 3D',
  'Neuron → synapse → chemistry → circuit',
  'data-neuropsychiatry-webgl="schematic-v1"',
  'Pause mechanism',
  'No psychiatric symptom, identity, belief, decision, personality trait or diagnosis',
]) {
  if (!lab.includes(ui)) throw new Error(`missing UI contract: ${ui}`)
}

if (!lab.includes("from 'three'")) throw new Error('3D lab must use Three.js/WebGL, not prose-only representation')
if (!lab.includes('OrbitControls')) throw new Error('3D lab must support orbit interaction')
if (!lab.includes('ResizeObserver')) throw new Error('3D lab must resize responsively')
if (!lab.includes('renderer.dispose()')) throw new Error('3D lab must dispose WebGL renderer')
if (!lab.includes('overflow-x-auto')) throw new Error('neurochemical selector must remain reachable on mobile')

console.log('Discovery neuropsychiatry 3D gate: PASS')
console.log('10 neurochemical mechanisms + WebGL/orbit/mobile/disposal + scientific boundary present.')
