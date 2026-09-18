import fs from 'node:fs';

const model = fs.readFileSync('src/lib/discoveryMentalStateCircuits.ts', 'utf8');
const ui = fs.readFileSync('src/pages/discovery/MentalStateCircuit3DLab.tsx', 'utf8');

const requiredModelTerms = [
  'Alzheimer disease: synapse-to-network failure',
  'Parkinson disease: basal-ganglia and multisystem circuit failure',
  'Grooming, posture and psychomotor state',
  'Mood, emotion and affect',
  'Illusions, hallucinations and delusion-like belief formation',
  'Anxiety, phobia, obsession and compulsion',
  '42148604',
  '42604981',
  '42614481',
  '42061779',
  '42349894',
  'many-to-many',
  'No single neurotransmitter',
];

for (const term of requiredModelTerms) {
  if (!model.includes(term)) throw new Error(`Missing mental-state model guard: ${term}`);
}

const requiredUiTerms = [
  "from 'three'",
  'OrbitControls',
  'ResizeObserver',
  'requestAnimationFrame',
  'renderer.dispose()',
  'Disease, thought, perception & mental-state circuits',
  'not connectomics, microscopy, receptor-density imaging or patient physiology',
  'Evidence anchors',
  'https://pubmed.ncbi.nlm.nih.gov/${anchor.pmid}/',
  'aria-selected',
];

for (const term of requiredUiTerms) {
  if (!ui.includes(term)) throw new Error(`Missing 3D mental-state UI guard: ${term}`);
}

const tabTargets = (model.match(/id: '/g) ?? []).length;
if (tabTargets < 6) throw new Error(`Expected at least 6 circuit models, found ${tabTargets}`);

console.log('discovery mental-state circuit guards: ok');
