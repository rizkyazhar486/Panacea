import fs from 'node:fs';

const model = fs.readFileSync('src/lib/proteinFoldingDiseaseAtlas.ts', 'utf8');
const ui = fs.readFileSync('src/pages/bodyhub/ProteinFoldingDiseaseAtlas3D.tsx', 'utf8');

for (const term of [
  'cancer', 'alzheimer', 'parkinson', 'schizophrenia',
  'RCSB Protein Data Bank', 'AlphaFold Protein Structure Database', 'UniProt', 'ChEMBL', 'PubChem',
  'Amino-acid sequence', 'Conformational ensemble', 'Binding pocket', 'Candidate ligand exploration', 'Validation',
  'TP53', 'APP', 'MAPT', 'SNCA', 'LRRK2', 'DRD2', 'GRIN2A',
  'Computational success alone cannot mark a disease mechanism or therapy as solved',
]) {
  if (!model.includes(term)) throw new Error(`Missing protein folding research contract: ${term}`);
}

for (const term of [
  "from 'three'", 'OrbitControls', 'WebGLRenderer', 'ACESFilmicToneMapping',
  'TubeGeometry', 'IcosahedronGeometry', 'TorusKnotGeometry', 'OctahedronGeometry',
  'ResizeObserver', 'requestAnimationFrame', 'renderer.dispose()',
  'Protein Folding & Disease Mechanism Atlas',
  'not fabricated atomistic coordinates or molecular dynamics',
  'atomistic rendering remains blocked',
  'Sequence → fold → conformational ensemble → binding pocket → ligand hypothesis → validation',
]) {
  if (!ui.includes(term)) throw new Error(`Missing protein folding 3D guard: ${term}`);
}

if (!ui.includes("Math.min(window.devicePixelRatio || 1, 2)")) throw new Error('Missing bounded DPR');
if (!ui.includes('min-h-11')) throw new Error('Missing mobile touch target floor');
if (!ui.includes('aria-pressed')) throw new Error('Missing state accessibility');
if (/structureSource:\s*'RCSB-PDB'/.test(model) && !/structureId:\s*'[^']+'/.test(model)) {
  throw new Error('Experimental structure source cannot be declared without a verified structure ID');
}

console.log('body protein folding disease atlas guards: ok');
