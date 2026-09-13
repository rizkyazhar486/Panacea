import fs from 'node:fs';

const model = fs.readFileSync('src/lib/alphaGenomeAtlas.ts', 'utf8');
const registry = fs.readFileSync('src/lib/bodyExposureMandatoryModules.ts', 'utf8');
const ui = fs.readFileSync('src/pages/bodyhub/AlphaGenomeAtlas.tsx', 'utf8');

for (const term of [
  'chromosome', 'locus', 'gene', 'transcript', 'variant', 'protein', 'pathway',
  'GRCh38 human reference genome', 'MANE Select / Plus Clinical', 'ClinVar', 'gnomAD',
  'Ensembl', 'RefSeq', 'UniProt', 'GTEx',
  'patientInferenceAllowed: false', 'syntheticVariantCoordinatesAllowed: false',
]) {
  if (!model.includes(term)) throw new Error(`Missing Alpha Genome Atlas model guard: ${term}`);
}

// Seed biological identities belong to the data/model layer, not as duplicated UI literals.
for (const symbol of ['TP53', 'BRCA1', 'APOE', 'SCN5A', 'CFTR', 'HTT']) {
  if (!model.includes(`symbol: '${symbol}'`)) throw new Error(`Missing Alpha Genome Atlas seed record: ${symbol}`);
}

if (!registry.includes("id: BODY_EXPOSURE_ALPHA_GENOME_REQUIREMENT.id")) throw new Error('Alpha Genome Atlas is not registered as mandatory Body Exposure module');
if (!registry.includes('required: true')) throw new Error('Mandatory genome requirement lost');
if (!registry.includes('no fabricated coordinates or patient inference')) throw new Error('Fail-closed genome safety contract missing');

for (const term of [
  "from 'three'", 'OrbitControls', 'WebGLRenderer', 'ACESFilmicToneMapping',
  'CapsuleGeometry', 'TubeGeometry', 'TorusKnotGeometry', 'CatmullRomCurve3',
  'ResizeObserver', 'requestAnimationFrame', 'renderer.dispose()',
  'Chromosome → locus → gene → transcript → variant → protein → pathway',
  'missing coordinates or evidence stay missing rather than being synthesized',
  'Search atlas', 'ALPHA_GENOME_SEED_RECORDS', 'selected.symbol', 'filtered.map',
]) {
  if (!ui.includes(term)) throw new Error(`Missing Alpha Genome Atlas UI guard: ${term}`);
}

if (!ui.includes('Math.min(window.devicePixelRatio || 1, 2)')) throw new Error('Device pixel ratio is not bounded');
if (!ui.includes('min-h-11')) throw new Error('Mobile touch target floor missing');
if (!ui.includes('aria-pressed')) throw new Error('Genome record selection accessibility missing');

console.log('body alpha genome atlas guards: ok');

// Modul wajib yang tidak terpasang di mana pun tetap nol bagi pengguna: seluruh
// berkasnya lengkap, tesnya hijau, dan tidak ada satu pun layar yang membukanya.
// Persis itu yang terjadi pada atlas ini sejak menit pertama ia digabungkan.
const explorer = fs.readFileSync('src/pages/BodyExplorer.tsx', 'utf8');
if (!explorer.includes("import('./bodyhub/AlphaGenomeAtlas')")) throw new Error('Alpha Genome Atlas is not loaded by Body Explorer');
if (!explorer.includes("{ key: 'genom-alfa', label: 'Genome atlas' }")) throw new Error('Alpha Genome Atlas has no tab a user can select');
if (!explorer.includes("panelTab === 'genom-alfa'")) throw new Error('Alpha Genome Atlas tab renders nothing');

const kelompok = fs.readFileSync('src/lib/bodyExplorerTabGroups.ts', 'utf8');
if (!kelompok.includes("'genom-alfa':")) throw new Error('Alpha Genome Atlas tab is unclassified, so it drifts to the trailing group');

console.log('body alpha genome atlas: mandatory module is reachable from Body Explorer');
