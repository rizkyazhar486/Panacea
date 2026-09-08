import { readFileSync, writeFileSync } from 'node:fs'

function replaceOne(source, from, to, label) {
  const first = source.indexOf(from)
  if (first < 0) throw new Error(`Missing patch target: ${label}`)
  if (source.indexOf(from, first + from.length) >= 0) throw new Error(`Non-unique patch target: ${label}`)
  return source.slice(0, first) + to + source.slice(first + from.length)
}

const modelsPath = 'src/lib/organModels.ts'
let models = readFileSync(modelsPath, 'utf8')
models = replaceOne(
  models,
  "import { ORGAN_ATLAS } from './organAtlas.gen'\n",
  "import { ORGAN_ATLAS } from './organAtlas.gen'\nimport { REFERENCE_ATLAS_MODELS } from './referenceOrganModels'\n",
  'reference atlas import',
)
models = replaceOne(
  models,
  `/**\n * Model organ untuk satu sasaran. Potongan BodyParts3D DIDAHULUKAN atas model\n * bangkitan AI: keduanya sama-sama menampilkan organ dari dekat, tapi hanya\n * yang pertama merupakan geometri manusia rujukan, dan tiap bagiannya bernama.\n */\nexport function modelForFocus(focusKey: string): OrganModel | undefined {\n  return ORGAN_ATLAS.find((m) => m.focusKey === focusKey)\n    ?? ORGAN_MODELS.find((m) => m.focusKey === focusKey)\n}\n`,
  `/**\n * Resolve the strongest available geometry without hiding provenance.\n * 1) organ-specific BodyParts3D close-ups; 2) existing Z-Anatomy/HRA reference\n * atlases; 3) legacy AI shape approximation only when no reference exists.\n */\nexport function modelForFocus(focusKey: string): OrganModel | undefined {\n  return ORGAN_ATLAS.find((m) => m.focusKey === focusKey)\n    ?? REFERENCE_ATLAS_MODELS.find((m) => m.focusKey === focusKey)\n    ?? ORGAN_MODELS.find((m) => m.focusKey === focusKey)\n}\n`,
  'reference-first model resolver',
)
writeFileSync(modelsPath, models)

const viewerPath = 'src/components/OrganModel3D.tsx'
let viewer = readFileSync(viewerPath, 'utf8')
viewer = replaceOne(
  viewer,
  "import { folderModel, type OrganModel } from '../lib/organModels'\n",
  "import { modelAssetPath, type OrganModel } from '../lib/organModels'\n",
  'asset path helper import',
)
viewer = replaceOne(
  viewer,
  `// Penampil satu organ dari dekat. Model BodyParts3D membawa mesh anatomi\n// bernama dan karena itu boleh di-ray-pick tepat. Model AI tetap hanya memakai\n// hotspot yang dikurasi; jangan pernah menyulap satu mesh AI menjadi anatomi\n// sub-struktur yang tidak benar-benar ada di sumbernya.\n`,
  `// Penampil satu organ dari dekat. Reference geometry dari BodyParts3D,\n// Z-Anatomy, atau HuBMAP HRA membawa mesh bernama dan boleh di-ray-pick tepat.\n// Model AI tetap marker-only; jangan pernah menyulap satu permukaan generatif\n// menjadi sub-struktur yang tidak benar-benar ada pada sumbernya.\n`,
  'multi-source viewer provenance comment',
)
viewer = replaceOne(
  viewer,
  "      `${import.meta.env.BASE_URL}${folderModel(organ)}/${organ.id}.glb`,\n",
  "      `${import.meta.env.BASE_URL}${modelAssetPath(organ)}`,\n",
  'explicit reference asset path loading',
)
writeFileSync(viewerPath, viewer)

console.log('Applied guarded multi-source reference atlas routing patch.')
