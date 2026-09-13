import fs from 'node:fs';

const requirement = fs.readFileSync('src/lib/bodyVolumetricImagingRequirement.ts', 'utf8');
const registry = fs.readFileSync('src/lib/bodyExposureMandatoryModules.ts', 'utf8');
const explorer = fs.readFileSync('src/pages/BodyExplorer.tsx', 'utf8');
const panel = fs.readFileSync('src/pages/bodyhub/PencitraanVolumetrikPanel.tsx', 'utf8');
const reference = fs.readFileSync('src/lib/rujukanKaloLumen.ts', 'utf8');

for (const marker of [
  "id: 'volumetric-imaging-digital-twin'",
  "surfaceKey: 'pencitraan-volumetrik'",
  "modalities: ['CT', 'MRI']",
  "id: 'dicom-series-ingestion'",
  "id: 'linked-mpr'",
  "id: 'ct-surface-rendering'",
  "id: 'volume-rendering'",
  "id: 'mri-relative-intensity'",
  "id: 'three-layer-composition'",
  "id: 'tissue-layer-presets'",
  "id: 'vessel-course-visibility'",
  "id: 'section-plane-linkage'",
  "id: 'performance-benchmark'",
  "id: 'spatial-display-output'",
  'axial · coronal · sagittal MPR',
  'Bone · vasculature · soft-tissue / organ layer presets',
  'patient anatomy may only come from an explicitly loaded source volume',
]) {
  if (!requirement.includes(marker)) throw new Error(`Missing volumetric-imaging obligation: ${marker}`);
}

if (!registry.includes('BODY_EXPOSURE_VOLUMETRIC_IMAGING_REQUIREMENT')) {
  throw new Error('Volumetric imaging requirement is not registered in Body Exposure mandatory modules');
}
if (!registry.includes("domain: 'imaging'")) throw new Error('Volumetric imaging mandatory domain is missing');
if (!registry.includes('real local CT/MRI DICOM-series ingestion with geometry validation')) {
  throw new Error('Mandatory DICOM ingestion contract is missing');
}
if (!registry.includes('linked axial-coronal-sagittal multiplanar reconstruction')) {
  throw new Error('Mandatory linked MPR contract is missing');
}
if (!registry.includes('measured reconstruction latency, memory/VRAM use and interaction performance by device class')) {
  throw new Error('Measured performance obligation is missing');
}
if (!registry.includes('no synthetic patient anatomy, diagnosis, or unmeasured performance claims')) {
  throw new Error('Fail-closed volumetric-imaging boundary is missing');
}

// A mandatory product target must be reachable, not merely present as a source file.
if (!explorer.includes("import('./bodyhub/PencitraanVolumetrikPanel')")) {
  throw new Error('DICOM-to-3D panel is not lazy-loaded by Body Explorer');
}
if (!explorer.includes("{ key: 'pencitraan-volumetrik', label: 'DICOM → 3D' }")) {
  throw new Error('DICOM-to-3D has no selectable Body Exposure tab');
}
if (!explorer.includes("panelTab === 'pencitraan-volumetrik'")) {
  throw new Error('DICOM-to-3D tab renders no panel');
}

// The currently shipped surface is still an educational foundation; the test
// must prevent the roadmap from silently claiming a pipeline that does not yet exist.
for (const marker of [
  'From a DICOM stack to a 3D body',
  'Lower threshold',
  'Upper threshold',
  'Two renderings, not two styles',
  'What Panacea does not do here',
  'MRI signal',
  'Hounsfield units',
]) {
  if (!panel.includes(marker)) throw new Error(`Current volumetric imaging surface lost boundary/teaching marker: ${marker}`);
}

for (const marker of [
  'Panacea does not read DICOM files',
  'Generates 3DCG automatically from DICOM CT and MRI data.',
  'Surface rendering can show three layers at once or switch between them.',
  "lisensi: 'unresolved'",
]) {
  if (!reference.includes(marker)) throw new Error(`KaloLumen reference boundary lost: ${marker}`);
}

if (requirement.includes("id: 'dicom-series-ingestion',\n      label: 'Real local DICOM series ingestion',\n      status: 'present'")) {
  throw new Error('Real DICOM ingestion must not be marked present before implementation');
}
if (requirement.includes("id: 'linked-mpr',\n      label: 'Linked axial · coronal · sagittal MPR',\n      status: 'present'")) {
  throw new Error('Linked MPR must not be marked present before implementation');
}

console.log('body volumetric imaging obligation: mandatory roadmap is registered, reachable and fail-closed');
