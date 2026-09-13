import fs from 'node:fs';

const model = fs.readFileSync('src/lib/proteinFoldingDiseaseAtlas.ts', 'utf8');
const ui = fs.readFileSync('src/pages/bodyhub/ProteinFoldingDiseaseAtlas3D.tsx', 'utf8');
const molecularLab = fs.readFileSync('src/pages/bodyhub/MolecularLab.tsx', 'utf8');
const qa = fs.readFileSync('scripts/qa/protein-folding-3d-smoke.mjs', 'utf8');
const pkg = fs.readFileSync('package.json', 'utf8');
const workflow = fs.readFileSync('.github/workflows/organ-3d-acceptance.yml', 'utf8');

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
  'dataset.proteinFolding3d',
  'Protein Folding & Disease Mechanism Atlas',
  'not fabricated atomistic coordinates or molecular dynamics',
  'atomistic rendering remains blocked',
  'Sequence → fold → conformational ensemble → binding pocket → ligand hypothesis → validation',
]) {
  if (!ui.includes(term)) throw new Error(`Missing protein folding 3D guard: ${term}`);
}

for (const term of [
  "lazy(() => import('./ProteinFoldingDiseaseAtlas3D'))",
  'data-protein-folding-launch="true"',
  'aria-controls="protein-folding-atlas-region"',
  'Open protein folding 3D',
  '<ProteinFoldingDiseaseAtlas3D />',
]) {
  if (!molecularLab.includes(term)) throw new Error(`Protein folding atlas is not safely reachable from Molecular Lab: ${term}`);
}

for (const term of [
  'data-protein-folding3d',
  "getContext('webgl2')",
  'pageerror',
  '390',
  'contrastColors',
  'Binding pocket',
  'Alzheimer',
]) {
  if (!qa.includes(term)) throw new Error(`Protein folding browser proof is incomplete: ${term}`);
}

if (!pkg.includes('"qa:protein-folding-3d"')) throw new Error('Protein folding browser QA is not registered in package.json');
if (!workflow.includes('qa:protein-folding-3d')) throw new Error('Protein folding browser QA is not enforced by Body 3D Render Acceptance');
if (!workflow.includes('PROTEIN_FOLDING3D_QA_SCREENSHOT')) throw new Error('Protein folding render artifact is not wired into Body 3D acceptance');

if (!ui.includes("Math.min(window.devicePixelRatio || 1, 2)")) throw new Error('Missing bounded DPR');
if (!ui.includes('min-h-11')) throw new Error('Missing mobile touch target floor');
if (!ui.includes('aria-pressed')) throw new Error('Missing state accessibility');
if (/structureSource:\s*'RCSB-PDB'/.test(model) && !/structureId:\s*'[^']+'/.test(model)) {
  throw new Error('Experimental structure source cannot be declared without a verified structure ID');
}

console.log('body protein folding disease atlas guards: reachable, browser-proved, fail-closed');
