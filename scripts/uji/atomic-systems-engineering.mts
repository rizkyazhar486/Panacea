import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const modelPath = path.join(root, 'src/lib/atomicSystemsEngineering.ts')
const labPath = path.join(root, 'src/pages/bodyhub/AtomicSystemsLab.tsx')

for (const file of [modelPath, labPath]) {
  if (!fs.existsSync(file)) throw new Error(`missing ${path.relative(root, file)}`)
}

const model = fs.readFileSync(modelPath, 'utf8')
const lab = fs.readFileSync(labPath, 'utf8')

const requiredChallenges = [
  'dna-origami', 'de-novo-protein', 'molecular-motors', 'precision-editing',
  'epigenetic-reprogramming', 'senescence-immunity', 'ecm-crosslinks', 'mitochondrial-genome',
]
for (const id of requiredChallenges) {
  if (!model.includes(`id: '${id}'`)) throw new Error(`missing challenge ${id}`)
}

for (const guard of ['not atomistic molecular-dynamics output', 'not a validated therapy', 'not proof that an unsolved biomedical problem has been solved']) {
  if (!model.includes(guard)) throw new Error(`missing scientific guard: ${guard}`)
}

for (const ui of ['Atomic Systems', 'Unsolved-problem visualisation sandbox', 'NOT CLINICAL', 'Translation gate simulator', 'BLOCKED']) {
  if (!lab.includes(ui)) throw new Error(`missing UI gate: ${ui}`)
}

if (!lab.includes('overflow-x-auto')) throw new Error('mobile scale navigation must remain horizontally reachable')
if (!lab.includes('aria-label="Atomic systems engineering research sandbox"')) throw new Error('missing accessible lab label')

console.log('Atomic systems engineering gate: PASS')
console.log(`Challenges: ${requiredChallenges.length}; scientific disclosure + mobile reachability present.`)
