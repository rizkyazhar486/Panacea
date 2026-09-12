import fs from 'node:fs';

const model = fs.readFileSync('src/lib/discoverySynapseMicro3D.ts', 'utf8');
const ui = fs.readFileSync('src/pages/discovery/SynapseMicro3DLab.tsx', 'utf8');

for (const term of ['glutamate', 'gaba', 'dopamine', 'serotonin', 'norepinephrine', 'acetylcholine', 'calcium-entry', 'vesicle-docking', 'receptor-binding', 'clearance', 'schematic encodings']) {
  if (!model.includes(term)) throw new Error(`Missing synapse model guard: ${term}`);
}

for (const term of ['MeshPhysicalMaterial', 'ACESFilmicToneMapping', 'OrbitControls', 'ResizeObserver', 'requestAnimationFrame', 'makeMembrane', 'SphereGeometry', 'TorusGeometry', 'IcosahedronGeometry', 'renderer.dispose()', 'Synapse microenvironment — animated mechanism studio', 'not microscopy or measured patient physiology']) {
  if (!ui.includes(term)) throw new Error(`Missing synapse visual-quality guard: ${term}`);
}

const particleCount = Number((ui.match(/for \(let i = 0; i < 42; i\+\+\)/) ?? []).length);
if (particleCount !== 1) throw new Error('Expected bounded transmitter particle pool');
if (!ui.includes('Math.min(window.devicePixelRatio, 2)')) throw new Error('Missing bounded device pixel ratio');
if (!ui.includes('min-h-11')) throw new Error('Missing mobile touch-target floor');
if (!ui.includes('aria-pressed')) throw new Error('Missing selectable mechanism-state accessibility');

console.log('discovery synapse micro 3D guards: ok');
