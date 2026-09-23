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
  'epigenetic-reprogramming', 'senescence-immunity', 'immune-tolerance', 'ecm-crosslinks', 'mitochondrial-genome',
]
for (const id of requiredChallenges) {
  if (!model.includes(`id: '${id}'`)) throw new Error(`missing challenge ${id}`)
}

for (const pmid of ['42276316', '42661942', '42677052']) {
  if (!model.includes(`pmid: '${pmid}'`)) throw new Error(`missing immune-tolerance evidence anchor PMID ${pmid}`)
}

for (const guard of ['not atomistic molecular-dynamics output', 'not a validated therapy', 'not proof that an unsolved biomedical problem has been solved']) {
  if (!model.includes(guard)) throw new Error(`missing scientific guard: ${guard}`)
}

for (const ui of ['Atomic Systems', 'Unsolved-problem visualisation sandbox', 'NOT CLINICAL', 'Translation gate simulator', 'Evidence anchors', 'BLOCKED']) {
  if (!lab.includes(ui)) throw new Error(`missing UI gate: ${ui}`)
}

if (!lab.includes('https://pubmed.ncbi.nlm.nih.gov/${anchor.pmid}/')) throw new Error('PubMed evidence anchors must remain user-reachable')
if (!lab.includes('do not validate the sandbox sliders')) throw new Error('literature anchors must not be presented as simulation validation')
if (!lab.includes('overflow-x-auto')) throw new Error('mobile scale navigation must remain horizontally reachable')
if (!lab.includes('aria-label="Atomic systems engineering research sandbox"')) throw new Error('missing accessible lab label')

console.log('Atomic systems engineering gate: PASS')
console.log(`Challenges: ${requiredChallenges.length}; immune tolerance provenance + scientific disclosure + mobile reachability present.`)
