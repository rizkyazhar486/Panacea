import fs from 'node:fs';

const model = fs.readFileSync('src/lib/neuropsychiatryVisualModels.ts', 'utf8');
const ui = fs.readFileSync('src/pages/discovery/NeuropsychiatryCircuitStudio3D.tsx', 'utf8');

const modelTerms = [
  'Integrated cognition',
  'Alzheimer network failure',
  'Parkinson multisystem circuit',
  'Perception & belief updating',
  'Educational schematic',
  'not measured patient physiology',
  'Substantia nigra pars compacta',
  'Hippocampal circuit',
  'belief/percept formation',
];

for (const term of modelTerms) {
  if (!model.includes(term)) throw new Error(`Missing visual model contract: ${term}`);
}

const uiTerms = [
  "from 'three'",
  'OrbitControls',
  'WebGLRenderer',
  'MeshPhysicalMaterial',
  'TubeGeometry',
  'CatmullRomCurve3',
  'ACESFilmicToneMapping',
  'ResizeObserver',
  'Raycaster',
  'requestAnimationFrame',
  'Pause signal flow',
  'Auto-rotate',
  'Tap a 3D node',
  'not a screenshot or generated mockup',
  'renderer.dispose()',
];

for (const term of uiTerms) {
  if (!ui.includes(term)) throw new Error(`Missing web-3D quality guard: ${term}`);
}

if (!ui.includes('SphereGeometry') || !ui.includes('IcosahedronGeometry') || !ui.includes('TorusKnotGeometry')) {
  throw new Error('Expected multiple geometry classes; sphere-only prototype is not acceptable');
}

if (!ui.includes('movingSignals') || !ui.includes('curve.getPointAt')) {
  throw new Error('Expected real animated pathway propagation');
}

if (!ui.includes('pointerdown') || !ui.includes('intersectObjects')) {
  throw new Error('Expected selectable 3D structures');
}

console.log('discovery neuropsychiatry visual-quality guards: ok');
